<template>
  <g-dialog v-model="internalValue" width="475" eager>
    <div class="dialog">
      <div class="dialog-title">Add days-off</div>
      <g-icon class="dialog-icon--close" size="20" @click="internalValue = false">icon-close</g-icon>
      <div class="dialog-content">
        <div class="col-6">
          <div class="date-range-picker__label">FROM</div>
          <g-menu v-model="showFromDatePicker" nudge-bottom="10" content-class="date-picker-content">
            <template #activator="{on}">
              <div class="date-range-picker__input--from" @click="on.click">
                <g-icon>far fa-calendar-alt</g-icon>
                <div class="date-range-picker__date">{{ formattedFromDate }}</div>
              </div>
            </template>
            <g-date-picker :max="toDate" type="date" no-title @input="onFromDateSelected"/>
          </g-menu>
        </div>

        <div class="col-6">
          <div class="date-range-picker__label">TO</div>
          <g-menu v-model="showToDatePicker" nudge-bottom="10" content-class="date-picker-content">
            <template #activator="{on}">
              <div class="date-range-picker__input--to" @click="on.click">
                <g-icon>far fa-calendar-alt</g-icon>
                <div class="date-range-picker__date">{{ formattedToDate }}</div>
              </div>
            </template>
            <g-date-picker :min="fromDate" type="date" no-title @input="onToDateSelected"/>
          </g-menu>
        </div>
      </div>
      <div class="dialog-message">
        <span class="fw-700 i">Note:</span>
        For a 1-day period, please leave either field empty.
      </div>
      <div class="dialog-action">
        <g-btn-bs width="110" height="44" background-color="indigo accent-2" text-color="white" :disabled="invalidDate" @click="submit">Generate</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogAddDayOff",
    props: {
      value: Boolean,
    },
    data() {
      return {
        showFromDatePicker: false,
        fromDate: '',
        showToDatePicker: false,
        toDate: '',
        today: ''
      }
    },
    created() {
      this.today = dayjs().format('YYYY/MM/DD')
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
          //reset
          this.showFromDatePicker = false
          this.fromDate = ''
          this.showToDatePicker = false
          this.toDate = ''
        }
      },
      formattedFromDate() {
        if(this.fromDate)
          return dayjs(this.fromDate, 'YYYY/MM/DD').format('MMMM DD')
        return ''
      },
      formattedToDate() {
        if(this.toDate)
          return dayjs(this.toDate, 'YYYY/MM/DD').format('MMMM DD')
        return ''
      },
      invalidDate() {
        return !this.fromDate && !this.toDate;
      }
    },
    methods: {
      onFromDateSelected(date) {
        this.fromDate = date
        this.showFromDatePicker = false
      },
      onToDateSelected(date) {
        this.toDate = date
        this.showToDatePicker = false
      },
      submit() {
        if(this.invalidDate) return
        let start = this.fromDate, end = this.toDate
        if(!start) start = this.toDate
        if(!end) end = this.fromDate
        const period = {
          startDate: dayjs(start, 'YYYY/MM/DD').startOf('day').toDate(),
          endDate: dayjs(end, 'YYYY/MM/DD').endOf('day').toDate()
        }
        this.$emit('submit', period)
        this.internalValue = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    background: white;
    padding: 24px;
    border-radius: 4px;
    width: 100%;
    position: relative;

    &-title {
      font-size: 24px;
      font-weight: 600;
      color: #212121;
      margin-top: 16px;
    }

    &-icon--close {
      position: absolute;
      top: 24px;
      right: 24px;
    }

    &-content {
      display: flex;
      margin-top: 24px;

      .date-range-picker {
        &__label {
          font-size: 15px;
          margin-bottom: 8px;
        }

        &__input {
          &--from {
            display: flex;
            align-items: center;
            padding: 12px;
            border: 1px solid #9e9e9e;
            border-radius: 4px 0 0 4px;
            cursor: pointer;
          }

          &--to {
            display: flex;
            align-items: center;
            padding: 12px;
            border: 1px solid #9e9e9e;
            border-radius: 0 4px 4px 0;
            border-left: none;
            cursor: pointer;
          }
        }

        &__date {
          flex: 1;
          text-align: center;
          font-weight: 700;
        }
      }
    }

    &-message {
      margin-top: 16px;
      color: #424242;
    }

    &-action {
      display: flex;
      justify-content: flex-end;
      margin-right: -8px;
      margin-top: 24px;
    }
  }
</style>
