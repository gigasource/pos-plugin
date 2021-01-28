import _ from 'lodash';
import {computed, withModifiers} from 'vue';
import {_computedDatesInMonthCustom} from './computedDateInMonth';
import {GDatePickerUtil, GPicker, setBackgroundColor, setTextColor} from 'pos-vue-framework';
import {genScopeId} from "../utils";

const MINIMUM_WIDTH = 300;
const DEFAULT_COLOR = 'rgb(98, 0, 237)';
const DEFAULT_RANGE_COLOR = '#ece0fd';

export const PosEndOfDayDatePicker = {
  name: 'PosEndOfDayDatePicker',
  components: {GPicker},
  props: {
    //// Group: Values
    // A predicate function which validate date value and return true if input date is valid, otherwise false
    allowedDates: [Function, null],
    // Date value in ISO format 'YYYY-MM-dd' indicate the maximum selectable date boundary
    max: String,
    // Date value in ISO format 'YYYY-MM-dd' indicate the minimum selectable date boundary
    min: String,
    events: {
      type: [Array, Function, Object],
      default: () => null,
    },
    // Default value of date-picker
    modelValue: [Array, String],

    //// Groups: Color
    color: {
      type: String,
      default: DEFAULT_COLOR
    },
    rangeColor: {
      type: String,
      default: DEFAULT_RANGE_COLOR
    },
    eventColor: {
      type: [Array, Function, Object, String],
      default: () => 'warning',
    },
    headerColor: String,

    //// Groups: Size
    fullWidth: Boolean,
    width: {
      type: [Number, String],
      default: 290,
    },

    //// Groups: Format functions for customize date picker content
    dayFormat: [Function, null],
    monthFormat: Function,
    weekdayFormat: Function,
    headerDateFormat: Function,
    titleDateFormat: Function,


    //// Groups: Visibility
    noTitle: Boolean,
    landscape: Boolean,
    firstDayOfWeek: {
      type: [String, Number],
      default: 0,
    },
    showWeek: Boolean,
    showCurrent: [Boolean, String],
    type: {
      type: String,
      default: 'date',
      validator: (type) => ['date', 'month'].includes(type),
    },


    //// Groups: Behavior
    disabled: Boolean,
    readonly: Boolean,
    scrollable: Boolean,
    range: Boolean,
    multiple: Boolean,
    monthSelectDisabled: Boolean,
    //End of day dates
    eventDates: {
      type: [Array],
      default: () => ([]),
    },
    _computedDatesInMonthCustom: {
      type: null,
      default: () => _computedDatesInMonthCustom
    }
  },
  emits: ['update:modelValue'],
  setup(props, context) {
    const {
      titleModel,
      yearModel,
      headerModel,
      dateTableModel,
      monthTableModel,
      state,
    } = GDatePickerUtil(props, context)

    // Title render function
    const cptDatePickerTitleClass = computed(() => ({
      'g-date-picker-title': true,
      'g-date-picker-title--disabled': props.disabled
    }))

    function datePickerTitleRenderFn() {
      return (
        <div class={cptDatePickerTitleClass.value}>
          <div class='g-picker__title__btn g-date-picker-title__year'
               onClick={withModifiers(e => titleModel.value.on.yearClicked(titleModel.value.year), ['stop'])}>
            {titleModel.value.year}
          </div>
          <div class='g-picker__title__btn g-date-picker-title__date'>
            <div key={titleModel.value.date}
                 domPropsInnerHTML={titleModel.value.date}/>
          </div>
        </div>)
    }

    // year list
    function yearListRenderFn() {
      return <ul class='g-date-picker-years' ref='years'>{
        yearModel.value.years.map(year => (
          <li
            key={year}
            class={{'active': parseInt(yearModel.value.selectedYear) === year}}
            onClick={withModifiers(() => yearModel.value.on.yearClicked(year), ['stop'])}>
            {year}
          </li>
        ))
      }</ul>
    }

    // GDatePicker -> Body -> Header render function
    const goPrev = () => {
      if (headerModel.value.canGoPrev) {
        headerModel.value.on.prevClicked()
        context.emit('click:prev', state.viewportDate)
      }
    }
    const goNext = () => {
      if (headerModel.value.canGoNext) {
        headerModel.value.on.nextClicked()
        context.emit('click:next', state.viewportDate)
      }
    }
    const cptHeaderValueClass = computed(() => ({
      'g-date-picker-header__value': true,
      'g-date-picker-header__value--disabled': props.disabled,
    }))

    function headerRenderFn() {
      return (
        <div class='g-date-picker-header'>
          <div class='g-date-picker-header-container'>
            <button class="g-date-picker-header__prev-button"
                    disabled={!headerModel.value.canGoPrev}
                    onClick={withModifiers(goPrev, ['stop'])}></button>
            <div class={cptHeaderValueClass.value}>
              <div key={headerModel.value.content}>
                <button style="width: 208px"
                        disabled={props.monthSelectDisabled}
                        onClick={withModifiers(headerModel.value.on.headerClicked, ['stop'])}
                >
                  {headerModel.value.content}
                </button>
              </div>
            </div>

            <button class="g-date-picker-header__next-button"
                    disabled={!headerModel.value.canGoNext}
                    onClick={withModifiers(goNext, ['stop'])}></button>
          </div>
        </div>
      )
    }

    // GDatePicker -> Body -> Date/Months Table

    // 1> wheel event
    let throttleWheel = _.throttle(e => (e.deltaX < 0 ? goPrev : goNext)(), 1000, {leading: true, trailing: false})
    const onWheelHandler = (e) => {
      e.preventDefault()
      if (!props.scrollable) {
        return
      }
      throttleWheel(e)
    }

    // 2> GDatePicker / Body / DateTable render function
    function addDateItemClass(dateRows) {
      _.forEach(dateRows, dateRow => {
        _.forEach(dateRow, date => {
          if (!date.isWeek && !date.isBlank) {
            date.class = {
              'g-table-item--active': date.isSelected,
              'g-table-item--start-range': date.isRangeStart,
              'g-table-item--in-range': date.isInRange,
              'g-table-item--end-range': date.isRangeEnd,
              'g-table-item--readonly': props.readonly,
              'g-table-item--outlined': date.isCurrent && !date.isSelected,
              'g-table-item--disabled': !date.isAllowed || props.disabled
            }

            // range
            date.background = {
              class: {
                'g-table-item__background--start-range': date.isRangeStart && !date.isRangeEnd,
                'g-table-item__background--end-range': date.isRangeEnd && !date.isRangeStart,
                'g-table-item__background--in-range': date.isInRange
              },
              style: {}
            }

            // selected
            const color = props.color || DEFAULT_COLOR

            if (!props.range) {
              if (date.isSelected) {
                setBackgroundColor(color, date)
              }

              //Render date item color
              const endOfDayDates = props.eventDates;
              let item = endOfDayDates.find(item => item.date === date.value);

              if (item && date.isAllowed) {
                setBackgroundColor(item.color, date);
                setTextColor(['#FFFFFF', 'white'].includes(item.color) ? '#000000' : '#FFFFFF', date);
              }

            } else {
              // set start/end range color
              if (date.isSelected && !date.isInRange) {
                setBackgroundColor(color, date)
              }

              // start, end, in
              // it's similar to date.isSelected, except when selected range contain only 1 value (user just select start point)
              if (date.isRangeStart || date.isRangeEnd || date.isInRange) {
                setBackgroundColor(props.rangeColor || DEFAULT_RANGE_COLOR, date.background)
              }
            }
          }
        })
      })

      return dateRows
    }

    const dateTable = computed(() => {
      const dateRows = _.cloneDeep(dateTableModel.value.dateRows);
      return addDateItemClass(dateRows);
    })


    function dateButtonRenderFn(dateItem) {
      return ([<button
        type="button"
        class={['g-table-item', dateItem.class]}
        style={[dateItem.style]}
        disabled={!dateItem.isAllowed}
        onClick={withModifiers(() => dateTableModel.value.on.onDateClicked(dateItem), ['stop'])}
        onDblclick={withModifiers(() => dateTableModel.value.on.onDateDoubleClicked(dateItem), ['stop'])}>
        <div class="g-table-item__content">{dateItem.formattedValue}</div>
        <div class="g-date-picker-table__events">
          {
            (dateItem.events || []).map(event => <div class={event.class} style={event.style}></div>)
          }
        </div>
      </button>,
        <div class={['g-table-item__background', dateItem.background.class]}
             style={dateItem.background.style}
        >
        </div>])
    }

    function weekRenderFn(week) {
      return (<small class="g-date-picker-table--date__week">
        {String(week).padStart(2, '0')}
      </small>)
    }

    function dateTableDataRenderFn(date) {
      return <td>{date.isWeek ? weekRenderFn(date.value) : (date.isBlank ? '' : dateButtonRenderFn(date))}</td>
    }

    function dateTableRenderFn() {
      return (
        <div class='g-date-picker-table g-date-picker-table--date' onWheel={withModifiers(onWheelHandler, ['stop'])}>
          <table key={state.viewportDate}>
            <thead>
            <tr>{dateTableModel.value.dayNames.map(dayName => <th>{dayName}</th>)}</tr>
            </thead>
            <tbody>
            {
              dateTable.value.map(dateRow => <tr>
                {dateRow.map(date => dateTableDataRenderFn(date))}
              </tr>)
            }
            </tbody>
          </table>
        </div>)
    }

    // 3> GDatePicker / Body / MonthTable
    const addMonthRowsClass = (monthRows) => {
      _.each(monthRows, monthRow => {
        _.each(monthRow, monthItem => {
          monthItem.class = {
            'g-table-item--active': monthItem.isSelected,
            'g-table-item--disabled': !monthItem.isAllowed || props.disabled,
            'g-table-item--readonly': props.type === 'month' && props.readonly,
            'g-table-item--outlined': monthItem.isCurrent && !monthItem.isSelected
          }
          const color = props.color || DEFAULT_COLOR
          if (monthItem.isSelected) {
            setBackgroundColor(color, monthItem)
          }
        })
      })
      return monthRows
    }

    const monthTable = computed(() => {
      const result = _.cloneDeep(monthTableModel.value.monthRows);
      return addMonthRowsClass(result);
    })


    function monthTableRenderFn() {
      return (<div class='g-date-picker-table g-date-picker-table--month' onWheel={onWheelHandler}>
        <table key={state.viewportDate}>
          <tbody>{
            monthTable.value.map((monthRow, rowIndex) =>
              <tr key={rowIndex}>
                {monthRow.map(monthItem =>
                  <td key={monthItem.month}>
                    <button
                      type="button"
                      class={['g-table-item', monthItem.class]}
                      style={monthItem.style}
                      disabled={!monthItem.isAllowed}
                      onClick={withModifiers(() => monthTableModel.value.on.monthClicked(monthItem), ['stop'])}
                      onDblclick={withModifiers(() => monthTableModel.value.on.monthDoubleClicked(monthItem), ['stop'])}
                    >
                      <div class="g-table-item__content">
                        {monthItem.formattedValue}
                      </div>
                    </button>
                  </td>
                )}
              </tr>)
          }</tbody>
        </table>
      </div>)
    }

    // date/month table render function
    const dateMonthTableRenderFn = () => state.activePicker === 'date' ? dateTableRenderFn() : monthTableRenderFn()
    const datePickerBodyRenderFn = () => state.activePicker === 'year' ? yearListRenderFn() : [headerRenderFn(), dateMonthTableRenderFn()]

    // datepicker render function
    const datePickerRenderFn = genScopeId(() => {
      const slots = {
        default: () => datePickerBodyRenderFn(),
        title: () => datePickerTitleRenderFn(),
        actions: () => context.slots.default && context.slots.default()
      }
      return (
        <g-picker
          color={props.headerColor || props.color || DEFAULT_COLOR}
          fullWidth={props.fullWidth}
          landscape={props.landscape}
          width={props.width >= MINIMUM_WIDTH ? props.width : MINIMUM_WIDTH}
          noTitle={props.noTitle}
          disabled={props.disabled}
          vSlots={slots}>
        </g-picker>
      )
    });

    return datePickerRenderFn;
  }
}
