angular.module('olDateTime', []).value('olDateTimeConfig', {
  defaultTheme: 'material',
  autosave: false,
  defaultMode: 'date',
  defaultDate: void 0,
  displayMode: void 0,
  defaultOrientation: true,
  displayTwentyfour: false,
  compact: false
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
        _weekdays: '=?tdWeekdays'
      },
      require: 'ngModel',
      templateUrl: function(tElement, tAttrs) {
        if ((tAttrs.theme == null) || tAttrs.theme === '') {
          tAttrs.theme = olDateTimeConfig.defaultTheme;
        }
        return "olDateTime-" + tAttrs.theme + ".tpl";
      },
      link: function(scope, element, attrs, ngModel) {
        var cancelFn, saveFn;

        attrs.$observe('defaultMode', function(val) {
          if (val !== 'time' && val !== 'date') {
            val = olDateTimeConfig.defaultMode;
          }
          return scope._mode = val;
        });

        attrs.$observe('defaultDate', function(val) {
          return scope._defaultDate = (val != null) && Date.parse(val) ? Date.parse(val) : olDateTimeConfig.defaultDate;
        });

        attrs.$observe('displayMode', function(val) {
          if (val !== 'full' && val !== 'time' && val !== 'date') {
            val = olDateTimeConfig.displayMode;
          }
          return scope._displayMode = val;
        });

        attrs.$observe('orientation', function(val) {
          return scope._verticalMode = val != null ? val === 'true' : olDateTimeConfig.defaultOrientation;
        });

        attrs.$observe('compact', function(val) {
          return scope._compact = val != null ? val === 'true' : olDateTimeConfig.compact;
        });

        attrs.$observe('displayTwentyfour', function(val) {
          return scope._hours24 = val != null ? val : olDateTimeConfig.displayTwentyfour;
        });

        attrs.$observe('mindate', function(val) {
          if ((val != null) && Date.parse(val)) {
            scope.restrictions.mindate = new Date(val);
            return scope.restrictions.mindate.setHours(0, 0, 0, 0);
          }
        });

        attrs.$observe('maxdate', function(val) {
          if ((val != null) && Date.parse(val)) {
            scope.restrictions.maxdate = new Date(val);
            return scope.restrictions.maxdate.setHours(23, 59, 59, 999);
          }
        });

        scope._weekdays = scope._weekdays || olDateTimeI18n.weekdays;
        scope.$watch('_weekdays', function(value) {
          if ((value == null) || !angular.isArray(value)) {
            return scope._weekdays = olDateTimeI18n.weekdays;
          }
        });

        scope.$watch('_time', function(val) {
          if (!val) {
            val = new Date();
          }
          scope.date.setHours(val.getHours());
          scope.date.setMinutes(val.getMinutes());
        });

        ngModel.$render = function() {
          return scope.setDate(ngModel.$modelValue || scope._defaultDate);
        };

        scope.autosave = false;
        if ((attrs['autosave'] != null) || olDateTimeConfig.autosave) {
          scope.$watch('date', ngModel.$setViewValue);
          return scope.autosave = true;
        } else {
          saveFn = $parse(attrs.onSave);
          cancelFn = $parse(attrs.onCancel);
          scope.save = function() {
            ngModel.$setViewValue(new Date(scope.date));
            return saveFn(scope.$parent, {
              $value: new Date(scope.date)
            });
          };

          return scope.cancel = function() {
            cancelFn(scope.$parent, {});
            return ngModel.$render();
          };
        }
      },
      controller: [
        '$scope', 'olDateTimeI18n', function(scope, olDateTimeI18n) {
          var i;
          scope._defaultDate = olDateTimeConfig.defaultDate;
          scope._mode = olDateTimeConfig.defaultMode;
          scope._displayMode = olDateTimeConfig.displayMode;
          scope._verticalMode = olDateTimeConfig.defaultOrientation;
          scope._hours24 = olDateTimeConfig.displayTwentyfour;
          scope._compact = olDateTimeConfig.compact;
          scope.translations = olDateTimeI18n;
          scope.restrictions = {
            mindate: void 0,
            maxdate: void 0
          };

          scope.setDate = function(newVal) {
            scope.date = newVal ? new Date(newVal) : new Date();
            scope.calendar._year = scope.date.getFullYear();
            scope.calendar._month = scope.date.getMonth();
            scope._time = angular.copy(scope.date);
          };

          scope.display = {
            fullTitle: function() {
              if (scope._displayMode === 'full' && !scope._verticalMode) {
                return _dateFilter(scope.date, 'EEEE d MMMM yyyy, h:mm a');
              } else if (scope._displayMode === 'time') {
                return _dateFilter(scope.date, 'h:mm a');
              } else if (scope._displayMode === 'date') {
                return _dateFilter(scope.date, 'EEE d MMM yyyy');
              } else {
                return _dateFilter(scope.date, 'd MMM yyyy, h:mm a');
              }
            },
            title: function() {
              if (scope._mode === 'date') {
                return _dateFilter(scope.date, (scope._displayMode === 'date' ? 'EEEE' : 'EEEE h:mm a'));
              } else {
                return _dateFilter(scope.date, 'MMMM d yyyy');
              }
            },
            "super": function() {
              if (scope._mode === 'date') {
                return _dateFilter(scope.date, 'MMM');
              } else {
                return '';
              }
            },
            main: function() {
              return $sce.trustAsHtml(scope._mode === 'date' ? _dateFilter(scope.date, 'd') : (_dateFilter(scope.date, 'h:mm')) + "<small>" + (_dateFilter(scope.date, 'a')) + "</small>");
            },
            sub: function() {
              if (scope._mode === 'date') {
                return _dateFilter(scope.date, 'yyyy');
              } else {
                return '';
              }
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
              return ((mindate != null) && currentDate < mindate) || ((maxdate != null) && currentDate > maxdate);
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
              if ((this._year == null) || isNaN(this._year)) {
                this._year = new Date().getFullYear();
              }
              mindate = scope.restrictions.mindate;
              maxdate = scope.restrictions.maxdate;
              if ((mindate != null) && mindate.getFullYear() === this._year && mindate.getMonth() >= this._month) {
                this._month = Math.max(mindate.getMonth(), this._month);
              }
              if ((maxdate != null) && maxdate.getFullYear() === this._year && maxdate.getMonth() <= this._month) {
                this._month = Math.min(maxdate.getMonth(), this._month);
              }
              scope.date.setFullYear(this._year, this._month);
              if (scope.date.getMonth() !== this._month) {
                scope.date.setDate(0);
              }
              if ((mindate != null) && scope.date < mindate) {
                scope.date.setDate(mindate.getTime());
                scope.calendar.select(mindate.getDate());
              }
              if ((maxdate != null) && scope.date > maxdate) {
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
            if ((val == null) || val === '' || isNaN(val) || val < 0) {
              return;
            }

            mindate = scope.restrictions.mindate;
            maxdate = scope.restrictions.maxdate;
            i = (mindate != null) && mindate.getFullYear() === scope.calendar._year ? mindate.getMonth() : 0;
            len = (maxdate != null) && maxdate.getFullYear() === scope.calendar._year ? maxdate.getMonth() : 11;
            scope.calendar._months = scope.calendar._allMonths.slice(i, len + 1);

          });
          scope.setNow = function() {
            return scope.setDate();
          };
          scope.modeClass = function() {
            if (scope._displayMode != null) {
              scope._mode = scope._displayMode;
            }
            return "" + (scope._verticalMode ? 'vertical ' : '') + (scope._displayMode === 'full' ? 'full-mode' : scope._displayMode === 'time' ? 'time-only' : scope._displayMode === 'date' ? 'date-only' : scope._mode === 'date' ? 'date-mode' : 'time-mode') + " " + (scope._compact ? 'compact' : '');
          };
        }
      ]
    };
  }
]);
