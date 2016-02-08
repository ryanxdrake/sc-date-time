/*
	@license ol-date-time
	@author SimeonC
	@license 2015 MIT
	@version 1.1.3

	See README.md for requirements and use.
*/angular.module('olDateTime', []).value('olDateTimeConfig', {
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

        unbinders.push(scope.$watch('time', function(time) {
          if (!time) {
            time = new Date();
          }
          scope.date.setHours(time.getHours());
          scope.date.setMinutes(time.getMinutes());
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

            if (scope.date != scope.time)
            {
              scope.time = date;
            }

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

'use strict';

angular.module('olDateTime').run(['$templateCache', function($templateCache) {

  $templateCache.put('olDateTime-material.tpl', '<div class="vertical time-date"><div class="display"><div class="title">{{display.title()}}</div><div class="content" layout="column"><div layout="row"><div class="small super-title" flex="30">{{display.super()}}</div><div class="title main-title" flex ng-bind-html="display.main()"></div><div class="small sub-title" flex="30">{{display.sub()}}</div></div><div class="time-control" layout="row" ng-show="showTime"><div flex="30"></div><div class="time-inputs" layout="row" flex><md-input-container><input ng-model="time" type="time" aria-label="Enter time" step="60"></md-input-container></div><div flex="30"></div></div></div></div><div class="control"><div class="full-title">{{display.fullTitle()}}</div><div class="date-control"><div class="title" layout="row"><md-button aria-label="{{:: translations.previousMonth}}" ng-class="{\'visuallyhidden\': calendar.isVisibleMonthButton(\'mindate\')}" ng-click="calendar._incMonth(-1)" flex class="left"><i class="material-icons">keyboard_arrow_left</i></md-button><div flex="70" layout="row" class="month-year"><div class="month-year-content"><span class="month-part">{{date | date:\'MMMM\'}}<select ng-change="calendar.monthChange()" ng-model="calendar._month" ng-options="calendar._allMonths.indexOf(month) as month for month in calendar._months"></select></span> <input class="year-part" max="{{restrictions.maxdate ? restrictions.maxdate.getFullYear() : NaN}}" min="{{restrictions.mindate ? restrictions.mindate.getFullYear() : 0}}" ng-model="calendar._year" type="number"></div></div><md-button aria-label="{{:: translations.nextMonth}}" ng-class="{\'visuallyhidden\': calendar.isVisibleMonthButton(\'maxdate\')}" ng-click="calendar._incMonth(1)" flex class="right"><i class="material-icons">keyboard_arrow_right</i></md-button></div><div class="headers"><div class="day-cell" ng-repeat="day in _weekdays track by $index">{{day}}</div></div><div class="days"><md-button aria-label="1" class="day-cell" ng-class="calendar.class(1)" ng-click="calendar.select(1)" ng-disabled="calendar.isDisabled(1)" ng-show="calendar.isVisible(1)" ng-style="{\'margin-left\': calendar.offsetMargin()}">1</md-button><md-button aria-label="2" class="day-cell" ng-class="calendar.class(2)" ng-click="calendar.select(2)" ng-disabled="calendar.isDisabled(2)" ng-show="calendar.isVisible(2)">2</md-button><md-button aria-label="3" class="day-cell" ng-class="calendar.class(3)" ng-click="calendar.select(3)" ng-disabled="calendar.isDisabled(3)" ng-show="calendar.isVisible(3)">3</md-button><md-button aria-label="4" class="day-cell" ng-class="calendar.class(4)" ng-click="calendar.select(4)" ng-disabled="calendar.isDisabled(4)" ng-show="calendar.isVisible(4)">4</md-button><md-button aria-label="5" class="day-cell" ng-class="calendar.class(5)" ng-click="calendar.select(5)" ng-disabled="calendar.isDisabled(5)" ng-show="calendar.isVisible(5)">5</md-button><md-button aria-label="6" class="day-cell" ng-class="calendar.class(6)" ng-click="calendar.select(6)" ng-disabled="calendar.isDisabled(6)" ng-show="calendar.isVisible(6)">6</md-button><md-button aria-label="7" class="day-cell" ng-class="calendar.class(7)" ng-click="calendar.select(7)" ng-disabled="calendar.isDisabled(7)" ng-show="calendar.isVisible(7)">7</md-button><md-button aria-label="8" class="day-cell" ng-class="calendar.class(8)" ng-click="calendar.select(8)" ng-disabled="calendar.isDisabled(8)" ng-show="calendar.isVisible(8)">8</md-button><md-button aria-label="9" class="day-cell" ng-class="calendar.class(9)" ng-click="calendar.select(9)" ng-disabled="calendar.isDisabled(9)" ng-show="calendar.isVisible(9)">9</md-button><md-button aria-label="10" class="day-cell" ng-class="calendar.class(10)" ng-click="calendar.select(10)" ng-disabled="calendar.isDisabled(10)" ng-show="calendar.isVisible(10)">10</md-button><md-button aria-label="11" class="day-cell" ng-class="calendar.class(11)" ng-click="calendar.select(11)" ng-disabled="calendar.isDisabled(11)" ng-show="calendar.isVisible(11)">11</md-button><md-button aria-label="12" class="day-cell" ng-class="calendar.class(12)" ng-click="calendar.select(12)" ng-disabled="calendar.isDisabled(12)" ng-show="calendar.isVisible(12)">12</md-button><md-button aria-label="13" class="day-cell" ng-class="calendar.class(13)" ng-click="calendar.select(13)" ng-disabled="calendar.isDisabled(13)" ng-show="calendar.isVisible(13)">13</md-button><md-button aria-label="14" class="day-cell" ng-class="calendar.class(14)" ng-click="calendar.select(14)" ng-disabled="calendar.isDisabled(14)" ng-show="calendar.isVisible(14)">14</md-button><md-button aria-label="15" class="day-cell" ng-class="calendar.class(15)" ng-click="calendar.select(15)" ng-disabled="calendar.isDisabled(15)" ng-show="calendar.isVisible(15)">15</md-button><md-button aria-label="16" class="day-cell" ng-class="calendar.class(16)" ng-click="calendar.select(16)" ng-disabled="calendar.isDisabled(16)" ng-show="calendar.isVisible(16)">16</md-button><md-button aria-label="17" class="day-cell" ng-class="calendar.class(17)" ng-click="calendar.select(17)" ng-disabled="calendar.isDisabled(17)" ng-show="calendar.isVisible(17)">17</md-button><md-button aria-label="18" class="day-cell" ng-class="calendar.class(18)" ng-click="calendar.select(18)" ng-disabled="calendar.isDisabled(18)" ng-show="calendar.isVisible(18)">18</md-button><md-button aria-label="19" class="day-cell" ng-class="calendar.class(19)" ng-click="calendar.select(19)" ng-disabled="calendar.isDisabled(19)" ng-show="calendar.isVisible(19)">19</md-button><md-button aria-label="20" class="day-cell" ng-class="calendar.class(20)" ng-click="calendar.select(20)" ng-disabled="calendar.isDisabled(20)" ng-show="calendar.isVisible(20)">20</md-button><md-button aria-label="21" class="day-cell" ng-class="calendar.class(21)" ng-click="calendar.select(21)" ng-disabled="calendar.isDisabled(21)" ng-show="calendar.isVisible(21)">21</md-button><md-button aria-label="22" class="day-cell" ng-class="calendar.class(22)" ng-click="calendar.select(22)" ng-disabled="calendar.isDisabled(22)" ng-show="calendar.isVisible(22)">22</md-button><md-button aria-label="23" class="day-cell" ng-class="calendar.class(23)" ng-click="calendar.select(23)" ng-disabled="calendar.isDisabled(23)" ng-show="calendar.isVisible(23)">23</md-button><md-button aria-label="24" class="day-cell" ng-class="calendar.class(24)" ng-click="calendar.select(24)" ng-disabled="calendar.isDisabled(24)" ng-show="calendar.isVisible(24)">24</md-button><md-button aria-label="25" class="day-cell" ng-class="calendar.class(25)" ng-click="calendar.select(25)" ng-disabled="calendar.isDisabled(25)" ng-show="calendar.isVisible(25)">25</md-button><md-button aria-label="26" class="day-cell" ng-class="calendar.class(26)" ng-click="calendar.select(26)" ng-disabled="calendar.isDisabled(26)" ng-show="calendar.isVisible(26)">26</md-button><md-button aria-label="27" class="day-cell" ng-class="calendar.class(27)" ng-click="calendar.select(27)" ng-disabled="calendar.isDisabled(27)" ng-show="calendar.isVisible(27)">27</md-button><md-button aria-label="28" class="day-cell" ng-class="calendar.class(28)" ng-click="calendar.select(28)" ng-disabled="calendar.isDisabled(28)" ng-show="calendar.isVisible(28)">28</md-button><md-button aria-label="29" class="day-cell" ng-class="calendar.class(29)" ng-click="calendar.select(29)" ng-disabled="calendar.isDisabled(29)" ng-show="calendar.isVisible(29)">29</md-button><md-button aria-label="30" class="day-cell" ng-class="calendar.class(30)" ng-click="calendar.select(30)" ng-disabled="calendar.isDisabled(30)" ng-show="calendar.isVisible(30)">30</md-button><md-button aria-label="31" class="day-cell" ng-class="calendar.class(31)" ng-click="calendar.select(31)" ng-disabled="calendar.isDisabled(31)" ng-show="calendar.isVisible(31)">31</md-button></div></div></div><div class="buttons"><md-button aria-label="{{:: translations.cancel}}" ng-click="cancel()" ng-if="!autosave">{{:: translations.cancel}}</md-button><md-button aria-label="{{:: translations.save}}" ng-click="save()" ng-if="!autosave">{{:: translations.save}}</md-button></div></div>');

}]);