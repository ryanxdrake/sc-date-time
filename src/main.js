angular.module('olDateTime', []).value('olDateTimeConfig', {
  defaultTheme: 'material',
  autosave: false,
  defaultDate: void 0,
  displayTwentyfour: false
}).value('olDateTimeI18n', {
  previousMonth: "Previous Month",
  nextMonth: "Next Month",
  incrementHours: "Increment Hours",
  decrementHours: "Decrement Hours",
  incrementMinutes: "Increment Minutes",
  decrementMinutes: "Decrement Minutes",
  switchAmPm: "Switch AM/PM",
  now: "Now",
  cancel: "Cancel",
  save: "Save",
  weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  switchTo: 'Switch to',
  clock: 'Clock',
  calendar: 'Calendar'
}).directive('timeDatePicker', [
  '$filter', '$sce', '$rootScope', '$parse', 'olDateTimeI18n', 'olDateTimeConfig', function($filter, $sce, $rootScope, $parse, olDateTimeI18n, olDateTimeConfig) {
    var _dateFilter;
    _dateFilter = $filter('date');
    return {
      restrict: 'AE',
      replace: true,
      scope: {
        _weekdays: '=?tdWeekdays',
        showTime: '='
      },
      require: 'ngModel',
      templateUrl: function(tElement, tAttrs) {
        return "olDateTime-material.tpl";
      },
      link: function(scope, element, attrs, ngModel) {
        var cancelFn, saveFn;
        var unbinders = [];

        String.prototype.replaceAll = function (find, replace) {
            var str = this;
            return str.replace(new RegExp(find, 'g'), replace);
        };

        unbinders.push(attrs.$observe('defaultDate', function(val) {
          return scope._defaultDate = (val !== null) && Date.parse(val) ? Date.parse(val) : olDateTimeConfig.defaultDate;
        }));

        unbinders.push(attrs.$observe('displayTwentyfour', function(val) {
          return scope._hours24 = (val !== null ? val : olDateTimeConfig.displayTwentyfour);
        }));

        unbinders.push(attrs.$observe('mindate', function(val) {
          if (val !== null) {
              val = val.replaceAll('"', '');
              if (Date.parse(val)) {
                scope.restrictions.mindate = new Date(val);
                return scope.restrictions.mindate.setHours(0, 0, 0, 0);
              }
          }
        }));

        unbinders.push(attrs.$observe('maxdate', function(val) {
          if (val !== null) {
              val = val.replaceAll('"', '');
              if (Date.parse(val)) {
                scope.restrictions.maxdate = new Date(val);
                return scope.restrictions.maxdate.setHours(23, 59, 59, 999);
              }
          }
        }));

        scope._weekdays = scope._weekdays || olDateTimeI18n.weekdays;
        unbinders.push(scope.$watch('_weekdays', function(value) {
          if ((value === null) || !angular.isArray(value)) {
            return scope._weekdays = olDateTimeI18n.weekdays;
          }
        }));

        unbinders.push(scope.$watch('date', function(date) {
          if (!date) {
            date = new Date();
          }
          ngModel.$setViewValue;
        }));

        // Run through al watch/observes and call unbind
        var cleanUp = function() {
          for (var i = 0; i < unbinders.length; i++) {
            unbinders[i]();
          }
        }

        // Save and cancel
        saveFn = $parse(attrs.onSave);
        cancelFn = $parse(attrs.onCancel);

        ngModel.$render = function() {
          return scope.setDate(ngModel.$modelValue || scope._defaultDate);
        };

        scope.save = function() {
          ngModel.$setViewValue(new Date(scope.date));
          saveFn(scope.$parent, {
            $value: new Date(scope.date)
          });
          cleanUp();
        };

        scope.cancel = function() {
          cancelFn(scope.$parent, {});
          cleanUp();
          return ngModel.$render();
        };

        element.on(
            "$destroy",
            function() {
                cleanUp();
            }
        );
      },
      controller: [
        '$scope', 'olDateTimeI18n', function(scope, olDateTimeI18n) {
          var i;
          scope._defaultDate = olDateTimeConfig.defaultDate;
          scope._hours24 = olDateTimeConfig.displayTwentyfour;
          scope.translations = olDateTimeI18n;
          scope.restrictions = {
            mindate: void 0,
            maxdate: void 0
          };

          scope.setDate = function(newVal) {
            var date = newVal ? new Date(newVal) : new Date();
            date.setMilliseconds(0);
            date.setSeconds(0);
            scope.date = date;
            scope.calendar._year = scope.date.getFullYear();
            scope.calendar._month = scope.date.getMonth();
          };

          scope.display = {
            fullTitle: function() {
              return _dateFilter(scope.date, 'EEE d MMM yyyy');
            },
            title: function() {
              return _dateFilter(scope.date, 'EEEE');
            },
            "super": function() {
              return _dateFilter(scope.date, 'MMM');
            },
            main: function() {
              return $sce.trustAsHtml(_dateFilter(scope.date, 'd'));
            },
            sub: function() {
              return _dateFilter(scope.date, 'yyyy');
            }
          };
          scope.calendar = {
            _month: 0,
            _year: 0,
            _months: [],
            _allMonths: (function() {
              var j, results;
              results = [];
              for (i = j = 0; j <= 11; i = ++j) {
                results.push(_dateFilter(new Date(0, i), 'MMMM'));
              }
              return results;
            })(),
            offsetMargin: function() {
              return (new Date(this._year, this._month).getDay() * 2.2) + "rem";
            },
            isVisible: function(d) {
              return new Date(this._year, this._month, d).getMonth() === this._month;
            },
            isDisabled: function(d) {
              var currentDate, maxdate, mindate;
              currentDate = new Date(this._year, this._month, d);
              mindate = scope.restrictions.mindate;
              maxdate = scope.restrictions.maxdate;
              return (mindate && currentDate < mindate) || (maxdate && currentDate > maxdate);
            },
            isVisibleMonthButton: function(minOrMax) {
              var date;
              date = scope.restrictions[minOrMax];
              return (date != null) && this._month <= date.getMonth() && this._year <= date.getFullYear();
            },
            "class": function(d) {
              var classString;
              classString = '';
              if ((scope.date != null) && new Date(this._year, this._month, d).getTime() === new Date(scope.date.getTime()).setHours(0, 0, 0, 0)) {
                classString += "selected";
              }
              if (new Date(this._year, this._month, d).getTime() === new Date().setHours(0, 0, 0, 0)) {
                classString += " today";
              }
              return classString;
            },
            select: function(d) {
              return scope.date.setFullYear(this._year, this._month, d);
            },
            monthChange: function() {
              var maxdate, mindate;
              if ((this._year === null) || isNaN(this._year)) {
                this._year = new Date().getFullYear();
              }
              mindate = scope.restrictions.mindate;
              maxdate = scope.restrictions.maxdate;
              if (mindate && mindate.getFullYear() === this._year && mindate.getMonth() >= this._month) {
                this._month = Math.max(mindate.getMonth(), this._month);
              }
              if (maxdate && maxdate.getFullYear() === this._year && maxdate.getMonth() <= this._month) {
                this._month = Math.min(maxdate.getMonth(), this._month);
              }
              scope.date.setFullYear(this._year, this._month);
              if (scope.date.getMonth() !== this._month) {
                scope.date.setDate(0);
              }
              if (mindate && scope.date < mindate) {
                scope.date.setDate(mindate.getTime());
                scope.calendar.select(mindate.getDate());
              }
              if (maxdate && scope.date > maxdate) {
                scope.date.setDate(maxdate.getTime());
                return scope.calendar.select(maxdate.getDate());
              }
            },
            _incMonth: function(months) {
              this._month += months;
              while (this._month < 0 || this._month > 11) {
                if (this._month < 0) {
                  this._month += 12;
                  this._year--;
                } else {
                  this._month -= 12;
                  this._year++;
                }
              }
              return this.monthChange();
            }
          };
          scope.$watch('calendar._year', function(val) {
            var len, maxdate, mindate;
            if ((val === null) || val === '' || isNaN(val) || val < 0) {
              return;
            }

            mindate = scope.restrictions.mindate;
            maxdate = scope.restrictions.maxdate;
            i = mindate && mindate.getFullYear() === scope.calendar._year ? mindate.getMonth() : 0;
            len = maxdate && maxdate.getFullYear() === scope.calendar._year ? maxdate.getMonth() : 11;
            scope.calendar._months = scope.calendar._allMonths.slice(i, len + 1);

          });
          scope.setNow = function() {
            return scope.setDate();
          };
        }
      ]
    };
  }
]);
