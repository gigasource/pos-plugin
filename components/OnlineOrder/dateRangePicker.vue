<template>
  <div :class="['date-range-picker', showMenu && 'date-range-picker__active']">
    <div class="date-range-picker__nav left" @click="goPrev">
      <g-icon>chevron_left</g-icon>
    </div>
    <g-menu v-model="showMenu" :min-width="100" :max-width="333" nudge-bottom="10" nudge-left="70" :close-on-click="true" :close-on-item-click="true" :content-fill-width="false" content-class="aw-date-range-picker-content">
      <!-- activator - button which show date -->
      <template #activator="{on}">
        <div :class="['value', showMenu && 'value--active']" @click="on.click"> {{ formattedRange }}</div>
      </template>


      <div class="date-range-picker__container">
        <div class="arrow-top"></div>

        <!-- from/to date -->
        <div style="display: flex; margin-bottom: 10px;">
          <!-- from date -->
          <div style="width: 50%">
            <div class="date-range-picker__label">{{$t('onlineOrder.from')}}</div>
            <g-menu v-model="showFromDatePicker" nudge-bottom="10" content-class="date-picker-content">
              <template #activator="{on}">
                <div class="date-range-picker__input--from" @click="on.click">
                  <g-icon size="16">far fa-calendar-alt</g-icon>
                  <span class="date-range-picker__date">{{ formattedFromDate }}</span>
                </div>
              </template>
              <g-date-picker :max="toDate" type="date" no-title @input="onFromDateSelected"/>
            </g-menu>
          </div>

          <!-- to date -->
          <div style="width: 50%">
            <div class="date-range-picker__label">{{$t('onlineOrder.to')}}</div>
            <g-menu v-model="showToDatePicker" nudge-bottom="10" content-class="date-picker-content">
              <template #activator="{on}">
                <div class="date-range-picker__input--to" @click="on.click">
                  <g-icon size="16">far fa-calendar-alt</g-icon>
                  <span class="date-range-picker__date">{{ formattedToDate }}</span>
                </div>
              </template>
              <g-date-picker :min="fromDate" :max="today" type="date" no-title @input="onToDateSelected"/>
            </g-menu>
          </div>
        </div>

        <!-- confirm btn -->
        <g-btn-bs height="40" width="100%" background-color="#1976D2" text-color="#fff" @click="save">Confirm</g-btn-bs>

        <!-- horizontal separator line -->
        <g-divider style="margin: 8px 0" color="#e0e0e0"/>

        <!-- predefined range button -->
        <div class="row-flex flex-wrap w-100 justify-between">
          <g-btn-bs class="mb-2" height="40" background-color="#E0E0E0" @click="selectToday">{{$t('onlineOrder.today')}}</g-btn-bs>
          <g-btn-bs class="mb-2" height="40" background-color="#E0E0E0" @click="selectYesterday">{{$t('onlineOrder.yesterday')}}</g-btn-bs>
          <g-btn-bs class="mb-2" height="40" background-color="#E0E0E0" @click="selectCurrentWeek">{{$t('onlineOrder.thisWeek')}}</g-btn-bs>
          <g-btn-bs height="40" background-color="#E0E0E0" @click="selectCurrentMonth">{{$t('onlineOrder.thisMonth')}}</g-btn-bs>
        </div>
      </div>
    </g-menu>
    <div class="date-range-picker__nav right" @click="goNext">
      <g-icon>chevron_right</g-icon>
    </div>
  </div>
</template>
<script>
  import dayjs from 'dayjs';
  import customParseFormat from 'dayjs/plugin/customParseFormat'
  dayjs.extend(customParseFormat)
  // format used in current app
  const DATE_FORMAT = 'DD/MM/YYYY'
  // format used by date picker
  const DATE_PICKER_FORMAT = 'YYYY-MM-DD'
  export default {
    name: 'dateRangePicker',
    props: {
      from: String,
      to: String
    },
    data: function () {
      const today = dayjs().format(DATE_PICKER_FORMAT);
      return {
        // menu
        showMenu: false,
        showFromDatePicker: false,
        showToDatePicker: false,
        //
        today,
        // from date value ISO standard: YYYY/MM/DD
        fromDate: this.from || today,
        // to date value ISO standard: YYYY/MM/DD
        toDate: this.to || today,
      }
    },
    computed: {
      // custom date format - for display only
      formattedRange() {
        let from = dayjs(this.from || this.today, DATE_PICKER_FORMAT).format('MMM DD');
        let to = dayjs(this.to || this.today, DATE_PICKER_FORMAT).format('MMM DD');
        return from === to ? `${from}` : `${from} - ${to}`
      },
      formattedFromDate() {
        return dayjs(this.fromDate).format(DATE_FORMAT)
      },
      formattedToDate() {
        return dayjs(this.toDate).format(DATE_FORMAT)
      },
    },
    methods: {
      onFromDateSelected(dateValue) {
        this.fromDate = dateValue
        this.showFromDatePicker = false
      },
      onToDateSelected(dateValue) {
        this.toDate = dateValue
        this.showToDatePicker = false
      },
      selectToday() {
        const today = dayjs().format(DATE_PICKER_FORMAT)
        this.fromDate = today
        this.toDate = today
      },
      selectYesterday() {
        const yesterday = dayjs().subtract(1, 'day').format(DATE_PICKER_FORMAT)
        this.fromDate = yesterday
        this.toDate = yesterday
      },
      selectCurrentWeek() {
        this.fromDate = dayjs().startOf('week').format(DATE_PICKER_FORMAT)
        this.toDate = dayjs().format(DATE_PICKER_FORMAT)
      },
      selectCurrentMonth() {
        this.fromDate = dayjs(`${dayjs().format('YYYY-MM')}-01`, 'YYYY-MM-DD').format(DATE_PICKER_FORMAT)
        this.toDate = dayjs().format(DATE_PICKER_FORMAT)
      },
      goPrev() {
        let days = dayjs(this.toDate).diff(this.fromDate, 'day')
        if (days === 0) {
          days = 1
        }
        this.fromDate = dayjs(this.fromDate).subtract(days, 'day').format(DATE_PICKER_FORMAT)
        this.toDate = dayjs(this.toDate).subtract(days, 'day').format(DATE_PICKER_FORMAT)
        this.$emit('save', { fromDate: this.fromDate, toDate: this.toDate })
      },
      goNext() {
        let days = dayjs(this.toDate).diff(this.fromDate, 'day')
        if (days === 0) {
          days = 1
        }
        const nextFromDate = dayjs(this.fromDate).add(days, 'day')
        const nextToDate = dayjs(this.toDate).add(days, 'day')
        const today = dayjs()
        this.fromDate = (nextFromDate.isAfter(today) ? today : nextFromDate).format(DATE_PICKER_FORMAT)
        this.toDate = (nextToDate.isAfter(today) ? today : nextToDate).format(DATE_PICKER_FORMAT)
        this.$emit('save', { fromDate: this.fromDate, toDate: this.toDate })
      },
      save() {
        this.showMenu = false
        this.$emit('save', { fromDate: this.fromDate, toDate: this.toDate })
      }
    }
  }
</script>
<style scoped lang="scss">
  .date-range-picker {
    display: flex;
    align-items: center;
    border: 1px solid #E0E0E0;
    border-radius: 4px;
    cursor: pointer;
    height: 32px;

    &__nav {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #EEEEEE;
      height: 30px;

      &.left {
        border-radius: 4px 0 0 4px
      }

      &.right {
        border-radius: 0 4px 4px 0;
      }
    }

    .value {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      border-left: 1px solid #E0E0E0;
      border-right: 1px solid #E0E0E0;
      padding-left: 12px;
      padding-right: 12px;
      background: white;
      font-size: 15px;
      color: #616161;

      &--active {
        background: #E3F2FD;
      }
    }

    &__active {
      border-color: #1976D2;
    }

    &__container {
      padding: 28px 16px;
      background-color: #FFF;
      border-radius: 2px;
      border: 1px solid #E0E0E0;
      position: relative;

      .g-btn-bs {
        margin: 0;
      }
    }

    &__label {
      font-size: 12px;
      color: #9E9E9E;
      margin-bottom: 8px
    }

    &__input {
      &--from, &--to {
        height: 40px;
        display: flex;
        align-items: center;
        border: 1px solid #9E9E9E;
        padding-left: 8px;
        cursor: pointer
      }

      &--from {
        border-radius: 4px 0 0 4px
      }

      &--to {
        border-left: none;
        border-radius: 0 4px 4px 0;
      }
    }

    &__date {
      font-size: 15px;
      line-height: 15px;
      margin-left: 4px;
    }
  }
  .arrow-top {
    position: absolute;
    top: 0;
    left: 50%;
    width: 8px;
    height: 8px;
    transform: translate(-50%, -50%) rotate(45deg);
    background-color: white;
    box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);
    z-index: -1;
  }
</style>

<style lang="scss">
  .g-menu--content.aw-date-range-picker-content {
    contain: layout;
    overflow: visible;
  }

  .date-picker-content {
    .g-picker__body {
      padding: 0 16px;
      .g-date-picker-table {
        height: auto;
        table {
          margin-bottom: 16px;
          th {
            font-size: 15px;
          }
          td {
            border: 1px solid #e4e7e7;
            height: 42px;
            button {
              cursor: pointer;
            }
            .g-table-item__content {
              font-size: 14px;
              cursor: pointer;
            }
            .g-table-item--active {
              background: #1976D2 !important;
              border-color: transparent;
              cursor: pointer;
            }
          }
        }
      }
      .g-date-picker-header {
        padding: 16px 12px 4px;
        align-items: start;
        .g-date-picker-header__prev-button {
          order: 1;
          margin: 0;
          position: relative;
          cursor: pointer;
          &::after {
            content: '\F04D';
            position: absolute;
            top: 0;
            left: 0;
            font-size: 32px;
            color: #a5a9aa;
            border: 1px solid #eaeded;
            border-radius: 2px;
          }
        }
        .g-date-picker-header__value {
          order: 2;
          & > div {
            display: flex;
            justify-content: center;
            button {
              font-size: 22px;
              color: #484848;
              padding: 0;
              line-height: 34px;
            }
          }
        }
        .g-date-picker-header__next-button {
          order: 3;
          margin: 0;
          position: relative;
          cursor: pointer;
          &::after {
            content: '\F054';
            position: absolute;
            top: 0;
            right: 0;
            font-size: 32px;
            color: #a5a9aa;
            border: 1px solid #eaeded;
            border-radius: 2px;
          }
        }
      }
    }
  }
</style>
