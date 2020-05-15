<template>
  <div class="service-setting">
    <div class="service-setting__title">Service & Open hours</div>
    <div class="service-setting__content mb-2">
      <div style="display: flex">
        <div class="mb-3 fw-700">Open hours</div>
        <g-spacer/>
        <g-btn-bs class="btn-add" @click="addNewOpenHour()">+ Add new</g-btn-bs>
      </div>
      <div v-for="(openHour, index) in openHoursData" :key="index"
           class="open-hour__row">
        <g-checkbox
            v-for="(day, i) in days"
            :key="`day_${index}_${i}`"
            v-model="openHour.dayInWeeks[i]"
            :label="day"
            @change="checkServiceHourError"
            color="#536DFE"/>
        <g-spacer/>
        <div :class="['open-hour__row--hour', 'left', errors[index] && errors[index].open && 'error']">
          <g-time-picker-input :use24Hours="country.name !== 'United State'"
                               :value="getTime(openHour, 'open')"
                               @input="updateHours($event, index, true)"/>
        </div>
        <div :class="['open-hour__row--hour', 'right', errors[index] && errors[index].close && 'error']">
          <g-time-picker-input :use24Hours="country.name !== 'United State'"
                               :value="getTime(openHour, 'close')"
                               @input="updateHours($event, index, false)"/>
        </div>
        <g-spacer/>
        <div @click="removeOpenHour(openHour)" class="open-hour__row--btn">
          <g-icon size="16">icon-close</g-icon>
        </div>
        <div v-if="errors[index] && errors[index].message" class="error-message">{{errors[index].message}}</div>
      </div>
      <div class="display-flex">
        <g-spacer/>
        <g-btn-bs background-color="indigo accent-2" text-color="white" @click="updateOpenHours"
               :disabled="hasError || openHoursJson === lastSavedData">Save
        </g-btn-bs>
      </div>
    </div>
    <div class="service-setting__content w-50">
      <div class="mb-3 fw-700">Service</div>
      <div class="row-flex">
        <div class="col-6">
          <div class="mb-2">Delivery</div>
          <g-radio-group v-model="computedDelivery" row>
            <g-radio small color="#536DFE" label="Yes" value="1" :class="[delivery === '1' && 'selected']"/>
            <g-radio small color="#536DFE" label="No" value="0" :class="[delivery === '0' && 'selected']"/>
          </g-radio-group>
        </div>
        <div class="col-6">
          <div class="mb-2">Allow pick-up</div>
          <g-radio-group v-model="computedPickup" row>
            <g-radio small color="#536DFE" label="Yes" value="1" :class="[pickup === '1' && 'selected']"/>
            <g-radio small color="#536DFE" label="No" value="0" :class="[pickup === '0' && 'selected']"/>
          </g-radio-group>
        </div>
      </div>
      <div class="row-flex align-items-center">
        <div class="col-8">
          <g-switch :label="`Require minimum value ${$t('common.currency')} for delivery orders`"
                    @change="toggleMinimumOrderValue" :input-value="computedMinimumOrderValue.active"/>
        </div>
        <div class="col-4">
          <g-text-field-bs large type="number" :value="computedMinimumOrderValue.value" @input="setMinimumOrderValue"/>
        </div>
      </div>
      <div class="row-flex align-items-center">
        <div class="col-8">Order timeout</div>
        <div class="col-4">
          <g-select text-field-component="GTextFieldBs" v-model="computedOrderTimeOut"
                    :items="orderTimeOuts"/>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  import {get24HourValue, get12HourValue, _12HourTimeRegex, _24HourTimeRegex} from "../../logic/timeUtil";
  import _ from 'lodash'
  // TODO: Debounce update openHours open, close time
  export default {
    name: 'ServiceAndOpenHours',
    props: {
      delivery: Boolean,
      pickup: Boolean,
      openHours: Array,
      country: {
        type: Object,
        default: () => ({
          name: '',
          locale: ''
        })
      },
      minimumOrderValue: {
        type: Object,
        default: () => ({
          active: false,
          value: 0
        })
      },
      deliveryTimeInterval: {
        type: Number,
        default: 15,
      },
      orderTimeOut: Number,
    },
    data: function () {
      return {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        orderTimeOuts: _.map([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], v => ({ value: v, text: `${v} minutes` })),
        errors: [],
        timeout: this.orderTimeOut || '',
        openHoursData: [],
        lastSavedData: null,
        deliveryTimeIntervalData: null,
        deliveryTimeOptions: [
          {value: 15, text: '15 minutes'},
          {value: 20, text: '20 minutes'},
          {value: 30, text: '30 minutes'},
        ]
      }
    },
    computed: {
      computedDelivery: {
        get() {
          return this.delivery ? "1" : "0"
        },
        set(value) {
          this.$emit('update', { delivery: value === "1" })
        }
      },
      computedPickup: {
        get() {
          return this.pickup ? "1" : "0"
        },
        set(value) {
          this.$emit('update', { pickup: value === "1" })
        }
      },
      computedMinimumOrderValue: {
        get() {
          return this.minimumOrderValue
        },
        set(value) {
          this.$emit('update', { minimumOrderValue: value })
        }
      },
      computedOrderTimeOut: {
        get() {
          return this.timeout
        },
        set(value) {
          this.$emit('update', { orderTimeOut: value })
          this.timeout = value
        }
      },
      openHoursMap() {
        const obj = {}

        this.openHoursData.forEach(({dayInWeeks, openTime, closeTime}, row) => {
          dayInWeeks.forEach((value, index) => {
            if (!value) return

            const key = this.indexToDayInWeek(index)
            obj[key] = obj[key] || []
            obj[key].push({openTime, closeTime, row})
          })
        })

        return obj
      },
      hasError() {
        let result = false

        this.errors.forEach(({message, open, close}) => {
          if ((message && message.length > 0) || open || close) result = true
        })

        return result
      },
      openHoursJson() {
        return JSON.stringify(this.openHoursData)
      },
    },
    created() {
      this.deliveryTimeIntervalData = this.deliveryTimeInterval
    },
    mounted() {
      this.openHoursData = this.openHours
      this.lastSavedData = JSON.stringify(this.openHoursData)
      this.errors = this.openHoursData.map(() => ({
        open: false,
        close: false,
        message: ''
      }))
    },
    methods: {
      addNewOpenHour() {
        const newOpenHour = {
          dayInWeeks: [false, false, false, false, false, false, false],
          openTime: '06:30',
          closeTime: '23:30'
        }
        this.openHoursData = [...this.openHoursData, newOpenHour]

        this.errors.push({
          open: false,
          close: false,
          message: ''
        })

        this.checkServiceHourError()
      },
      removeOpenHour(openHour) {
        const i = _.findIndex(this.openHoursData, oh => oh._id === openHour._id)
        this.openHoursData.splice(i, 1)
        this.errors.splice(i, 1)

        this.checkServiceHourError()
      },
      updateOpenHours() {
        this.lastSavedData = JSON.stringify(this.openHoursData)
        this.$emit('update', {openHours: this.openHoursData})
      },
      getTime(openHour, type) {
        if(type === 'open') {
          return this.country.name === 'United State' ? get12HourValue(openHour.openTime) : openHour.openTime
        }
        if(type === 'close') {
          return this.country.name === 'United State' ? get12HourValue(openHour.closeTime) : openHour.closeTime
        }
      },
      updateHours(time, index, isOpenTime) {
        time = get24HourValue(time)

        const openHour = this.openHoursData[index]
        this.$set(this.errors[index], 'message', '')
        if (!_24HourTimeRegex.exec(time) && !_12HourTimeRegex.exec(time)) {
          this.$set(this.errors[index], `${isOpenTime ? 'open' : 'close'}`, true)
          this.$set(this.errors[index], 'message', `${isOpenTime ? 'Open' : 'Close'} time is invalid!`)
          return
        }
        if (isOpenTime) {
          this.$set(this.errors[index], 'open', false)
          if (get24HourValue(time) < get24HourValue(openHour.closeTime)) {
            this.$set(openHour, `openTime`, time)
            this.$set(this.errors[index], 'close', false)
          } else {
            this.$set(this.errors[index], 'open', true)
            this.$set(this.errors[index], 'message', 'Open time must be before close time!')
          }
        } else {
          this.$set(this.errors[index], 'close', false)
          if (get24HourValue(time) > get24HourValue(openHour.openTime)) {
            this.$set(openHour, `closeTime`, time)
            this.$set(this.errors[index], 'open', false)
          } else {
            this.$set(this.errors[index], 'close', true)
            this.$set(this.errors[index], 'message', 'Close time must be after open time!')
          }
        }

        this.checkServiceHourError()
      },
      toggleMinimumOrderValue(active) {
        this.computedMinimumOrderValue = Object.assign({}, this.computedMinimumOrderValue, { active })
      },
      setMinimumOrderValue(value) {
        this.computedMinimumOrderValue = Object.assign({}, this.computedMinimumOrderValue, {value})
      },
      checkServiceHourError() {
        this.openHoursData.forEach(({dayInWeeks, openTime, closeTime}, index) => {
          for (let i = 0; i < dayInWeeks.length; i++) {
            if (!dayInWeeks[i]) continue

            const dayInWeek = this.indexToDayInWeek(i)
            const openHoursInDay = this.openHoursMap[dayInWeek]

            for (const {openTime: ot, closeTime: ct, row} of openHoursInDay) {
              if (row === index) continue

              if (openTime > ot && openTime < ct) return this.$set(this.errors[index], 'open', true)
              if (closeTime > ot && closeTime < ct) return this.$set(this.errors[index], 'close', true)
              if (openTime === ot && closeTime) {
                this.$set(this.errors[index], 'close', true)
                this.$set(this.errors[index], 'open', true)
                return
              }
            }
          }

          this.$set(this.errors[index], 'open', false)
          this.$set(this.errors[index], 'close', false)
        })
      },
      updateDeliveryTimeInterval() {
        this.$emit('update:deliveryTimeInterval', this.deliveryTimeIntervalData)
      },
      indexToDayInWeek(index) {
        switch (index) {
          case 0:
            return 'monday'
          case 1:
            return 'tuesday'
          case 2:
            return 'wednesday'
          case 3:
            return 'thursday'
          case 4:
            return 'friday'
          case 5:
            return 'saturday'
          case 6:
            return 'sunday'
          default:
            return null
        }
      },
    },
  }
</script>

<style scoped lang="scss">
  .display-flex {
    display: flex;
  }

  .service-setting {
    &__title {
      font-weight: 700;
      font-size: 18px;
      margin-bottom: 12px;
    }

    &__content {
      background-color: #FFF;
      border-radius: 5px;
      padding: 25px 25px 20px 25px;

      .btn-add {
        color: #536DFE;
        cursor: pointer;
        font-weight: 700;
      }

      .open-hour__row {
        display: flex;
        align-items: center;
        background: #FAFAFA;
        border: 1px solid #EFEFEF;
        border-radius: 6px;
        height: 43px;
        margin-top: 8px;
        margin-bottom: 20px;
        position: relative;

        &--hour {
          background: #E0E0E0;
          font-weight: 700;
          font-size: 15px;
          line-height: 1.9;
          border: 2px solid #E0E0E0;

          &.left {
            border-top-left-radius: 37px;
            border-bottom-left-radius: 37px;
            margin-right: 2px;
          }

          &.right {
            border-top-right-radius: 37px;
            border-bottom-right-radius: 37px;
          }

          &.error {
            border-color: #ff4452;

            ::v-deep .g-tf-input {
              color: #ff4452;
            }
          }
        }

        &--btn {
          background: #EFEFEF;
          width: 43px;
          height: 43px;
          line-height: 43px;
          text-align: center;
          border-top-right-radius: inherit;
          border-bottom-right-radius: inherit;
          cursor: pointer;
        }

        ::v-deep .g-tf-wrapper {
          margin: 0;

          &:before, &:after {
            display: none;
          }

          .g-tf-input {
            width: 80px;
            font-weight: 700;
            text-align: center;
          }
        }

        .error-message {
          color: red;
          font-size: 12px;
          font-style: italic;
          position: absolute;
          bottom: -18px;
          right: 0;
        }
      }

      .g-radio-wrapper {
        margin-right: 40px;
        margin-left: 0;

        &.selected ::v-deep .g-radio-label {
          font-weight: 600;
        }
      }

      .g-switch-wrapper {
        margin: 16px 0;
      }
    }

    .bs-tf-wrapper ::v-deep .bs-tf-input {
      width: 100%;
    }
  }
</style>
