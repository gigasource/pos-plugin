<script>
  import _ from 'lodash'
  import { computed, withModifiers } from 'vue'
  import { _computedDatesInMonthCustom } from './computedDateInMonth';
  import { setBackgroundColor, setTextColor, GDatePickerUtil, GPicker } from 'pos-vue-framework';

  const MINIMUM_WIDTH = 300;
  const DEFAULT_COLOR = 'rgb(98, 0, 237)';
  const DEFAULT_RANGE_COLOR = '#ece0fd';

  export default {
    name: 'PosEndOfDayDatePicker',
    components: { GPicker },
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
      value: [Array, String],

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
    },
    setup(props, context) {
      const {
        titleModel,
        yearModel,
        headerModel,
        dateTableModel,
        monthTableModel,
        state,
      } = GDatePickerUtil(Object.assign(props, { _computedDatesInMonthCustom }), context)

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
              class={{ 'active': parseInt(yearModel.value.selectedYear) === year }}
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
      let throttleWheel = _.throttle(e => (e.deltaX < 0 ? goPrev : goNext)(), 1000, { leading: true, trailing: false })
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
                addDateItemClass(dateTableModel.value.dateRows).map(dateRow => <tr>
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

      function monthTableRenderFn() {
        return (<div class='g-date-picker-table g-date-picker-table--month' onWheel={onWheelHandler}>
          <table key={state.viewportDate}>
            <tbody>
            {
              addMonthRowsClass(monthTableModel.value.monthRows).map((monthRow, rowIndex) => {
                return <tr key={rowIndex}>
                  {
                    monthRow.map(monthItem =>
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
                    )
                  }
                </tr>
              })
            }
            </tbody>
          </table>
        </div>)
      }

      // date/month table render function
      const dateMonthTableRenderFn = () => state.activePicker === 'date' ? dateTableRenderFn() : monthTableRenderFn()
      const datePickerBodyRenderFn = () => state.activePicker === 'year' ? yearListRenderFn() : [headerRenderFn(), dateMonthTableRenderFn()]

      // datepicker render function
      function datePickerRenderFn() {
        return (
          <g-picker
            color={props.headerColor || props.color || DEFAULT_COLOR}
            fullWidth={props.fullWidth}
            landscape={props.landscape}
            width={props.width >= MINIMUM_WIDTH ? props.width : MINIMUM_WIDTH}
            noTitle={props.noTitle}
            disabled={props.disabled}>
            <template slot="title">
              {datePickerTitleRenderFn()}
            </template>
            {datePickerBodyRenderFn()}
            <template slot="actions">
              {context.slots.default && context.slots.default()}
            </template>
          </g-picker>
        )
      }

      return {
        datePickerRenderFn,
        titleModel,
        yearModel,
        headerModel,
        dateTableModel,
        monthTableModel,
        state,
      }
    },
    render() {
      return this.datePickerRenderFn()
    }
  }
</script>

<style lang="scss" scoped>
  /*@import "../../style/variables";*/
  /*@import "../../style/colors";*/
  .g-picker {
    background-color: #eee;
  }

  button {
    outline: none;
  }

  table {
    border-collapse: collapse;
  }

  $textDisabled: #9e9e9e;
  $primary-transition: 0.5s cubic-bezier(0.25, 0.8, 0.5, 1) !default;

  /*TITLE*/
  .g-date-picker-title {
    display: flex;
    flex-direction: column;
    line-height: 1;

    &__year {
      display: inline-flex;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
      cursor: pointer;
    }

    &__date {
      font-size: 24px;
      text-align: left;
      font-weight: 500;
      position: relative;
      overflow: hidden;
      padding-bottom: 8px;
      margin-bottom: -8px;
    }

    &--disabled {
      color: $textDisabled;
    }
  }

  /*YEAR PICKER*/
  .g-date-picker-years {
    font-size: 16px;
    font-weight: 400;
    height: 50vh;
    list-style-type: none;
    overflow: auto;
    text-align: center;
    padding: 0;
    margin-top: 0;
    margin-bottom: 0;

    li {
      cursor: pointer;
      padding: 8px 0;
      transition: none;
      width: 100%;
      display: inline-block;

      &.active {
        font-size: 26px;
        font-weight: 500;
        padding: 10px 0;
      }

      &:hover {
        background: rgba(0, 0, 0, 0.12);
      }
    }
  }

  /*HEADER*/
  .g-date-picker-header {
    padding: 8px 0 8px 0;
    margin-left: 12px;
    margin-right: 12px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    background-color: transparent;

    .g-date-picker-header-container {
      width: 27%;
      margin-right: auto;
      margin-left: auto;
      display: flex;

      .g-date-picker-header__value {
        flex: 1;
        position: relative;

        div {
          transition: $primary-transition;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        button {
          font-size: 18px;
          font-style: normal;
          cursor: pointer;
          font-weight: bold;
          outline: none;
          padding: 0.5rem;
          transition: $primary-transition;
          background-color: transparent;
          border-style: none;
          color: #212B35;
        }

        .g-date-picker-header--disabled {
          button {
            color: $textDisabled;
          }
        }
      }

      %navigate_button {
        width: 24px;
        padding: 0;
        border: none;
        font-size: 25px;
        background-color: transparent;
      }

      .g-date-picker-header__prev-button {
        @extend %navigate_button;

        &::after {
          content: '\F141';
          font-family: "Material Design Icons";
        }
      }

      .g-date-picker-header__next-button {
        @extend %navigate_button;

        &::after {
          content: '\F142';
          font-family: "Material Design Icons";
        }
      }
    }
  }

  /*TABLE*/
  .g-date-picker-table {
    position: relative;
    padding: 0 16px;
    height: 100%;
    background-color: #eeeeee;

    table {
      transition: $primary-transition;
      table-layout: fixed;
      width: 100%;

      thead {
        tr:first-child {
          border-left: 1px solid #E0E0E0;
        }

        tr:last-child {
          border-right: 1px solid #E0E0E0;
        }
      }
    }

    tr {
      height: 32px;
    }

    td, th {
      text-align: center;
      position: relative;
    }

    th {
      background-color: #FFFFFF;
      font-size: 13px;
      font-weight: normal;
      line-height: 17px;
      color: #6e6e6e;
      border-top: 1px solid #E0E0E0;
    }

    td {
      height: 13.4vh;
      border: 1px solid #E0E0E0;
      position: relative;
      color: #9E9E9E;

      button .g-table-item__content {
        font-family: Muli;
        font-size: 20px;
        font-weight: bold;
      }
    }

    button {
      background-color: transparent;
      border-style: none;
      color: inherit;
      box-shadow: none;
    }

    &--date .g-table-item {
      height: 32px;
      width: auto;
    }

    .g-table-item {
      margin: 0;
      z-index: auto;
      font-size: 12px;
      background-color: #ffffff;
      border-style: none;
      color: inherit;
      width: 100%;
      height: 100%;

      &--active {
        color: #9E9E9E;
        border: 2px solid #1271FF !important;
      }

      &--start-range, &--end-range {
        color: #fff;
        text-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
      }

      &--in-range {
        color: #232323;
      }

      &--outlined {
        border: thin solid #232323;
      }

      &--readonly {
        pointer-events: none;
      }

      &--disabled {
        color: #E0E0E0;
        border-color: $textDisabled;
      }

      &__background {
        width: 0;
        top: 2px;
        height: 32px;
        position: absolute;
        z-index: -1;

        &--start-range {
          width: 50%;
          right: 0;
        }

        &--in-range {
          width: 100%;
          right: 0;
        }

        &--end-range {
          width: 50%;
          left: 0;
        }
      }
    }
  }

  .g-date-picker-table--date {
    th {
      padding: 8px 0;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.38);
    }

    td {
      width: 32px;
      padding: 0;
    }

    & .g-date-picker-table__events {
      bottom: 6px;
      height: 8px;
      left: 0;
      position: absolute;
      text-align: center;
      white-space: pre;
      width: 100%;

      > div {
        border-radius: 50%;
        display: inline-block;
        height: 8px;
        margin: 0 1px;
        width: 8px;
      }
    }
  }

  .g-date-picker-table--month {
    td {
      width: 33.333333%;
      height: 15vh;

      .g-table-item {
        width: 100%;
        height: 100%;
      }
    }
  }
</style>
