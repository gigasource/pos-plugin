<template>
  <div class="service-setting">
    <div class="service-setting__title">Service & Open hours</div>
    <div class="service-setting__content mb-2">
      <div style="display: flex">
        <div class="mb-3 fw-700">Open hours</div>
        <g-spacer/>
        <g-btn-bs class="btn-add" @click="addNewOpenHour()">+ Add new</g-btn-bs>
      </div>
      <div v-for="(openHour, index) in computedOpenHours" :key="index"
           class="open-hour__row">
        <g-checkbox
            v-for="(day, i) in days"
            :key="`day_${index}_${i}`"
            v-model="openHour.dayInWeeks[i]"
            :disabled="!openHour.dayInWeeks[i] && !availableDays[i]"
            :label="day"
            @change="updateOpenHours"
            color="#536DFE"/>
        <g-spacer/>
        <div :class="['open-hour__row--hour', 'left', errors[index] && errors[index].open && 'error']">
          <g-time-picker-input :use24Hours="country.name !== 'United State'" :disabled="errors[index] && errors[index].close" :value="openHour.openTime"  @input="updateHours($event, index, true)"/>
        </div>
        <div :class="['open-hour__row--hour', 'right', errors[index] && errors[index].close && 'error']">
          <g-time-picker-input :use24Hours="country.name !== 'United State'" :disabled="errors[index] && errors[index].open" :value="openHour.closeTime"  @input="updateHours($event, index, false)"/>
        </div>
        <g-spacer/>
        <div @click="removeOpenHour(openHour)" class="open-hour__row--btn">
          <g-icon size="16">icon-close</g-icon>
        </div>
        <div v-if="errors[index] && errors[index].message" class="error-message">{{errors[index].message}}</div>
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
        <div class="col-10">
          <g-switch :label="`Require minimum value ${$t('common.currency')} for delivery orders`"
                    @change="toggleMinimumOrderValue" :input-value="computedMinimumOrderValue.active"/>
        </div>
        <div class="col-2">
          <g-text-field-bs type="number" :value="computedMinimumOrderValue.value" @input="setMinimumOrderValue"/>
        </div>
      </div>
      <div class="row-flex align-items-center">
        <span style="margin-right: 10px;">Order timeout (min)</span>
        <g-select style="width: 80px" text-field-component="GTextFieldBs" v-model="computedOrderTimeOut" :items="orderTimeOuts"/>
      </div>
    </div>
  </div>
</template>
<script>
  const _12HourTimeRegex = /^(?<hours>1[0-2]|0?[0-9]):(?<minutes>[0-5][0-9])(:(?<seconds>[0-5][0-9]))? ?(?<meridiems>[AaPp][Mm])$/i
  const _24HourTimeRegex = /^(?<hours>2[0-3]|[0-1]?[0-9]):(?<minutes>[0-5][0-9])(:(?<seconds>[0-5][0-9]))?$/i

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
      orderTimeOut: Number,
    },
    data: function () {
      return {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        orderTimeOuts: _.map([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], v => ({ value: v, text: v })),
        errors: [],
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
          return this.orderTimeOut
        },
        set(value) {
          this.$emit('update', { orderTimeOut: value })
        }
      },
      computedOpenHours() {
        return this.openHours
      },
      availableDays() {
        const availableDays = [true, true, true, true, true, true, true]
        _.each(this.openHours, openHour => {
          _.each(openHour.dayInWeeks, (checked, index) => {
            if (checked)
              availableDays[index] = false
          })
        })
        return availableDays
      }
    },
    created() {
      this.errors = this.openHours.map(() => ({
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
        const newOpenHours = [...this.openHours, newOpenHour]
        this.$emit('update', { openHours: newOpenHours })
        this.errors.push({
          open: false,
          close: false,
          message: ''
        })
      },
      removeOpenHour(openHour) {
        const openHours = _.cloneDeep(this.openHours)
        const i = _.findIndex(openHours, oh => oh._id === openHour._id)
        openHours.splice(i, 1)
        this.$emit('update', {openHours})
        this.errors.splice(i, 1)
      },
      updateOpenHours() {
        this.$emit('update', { openHours: this.openHours })
      },
      get24HourValue(time) {
        time = _.toLower(time)
        return _.includes(time, 'm') ? dayjs(time, 'hh:mma').format('HH:mm') : time
      },
      updateHours(time, index, isOpenTime) {
        const openHour = this.openHours[index]
        this.$set(this.errors[index], 'message', '')
        if(!_24HourTimeRegex.exec(time) && !_12HourTimeRegex.exec(time)) {
          this.$set(this.errors[index], `${isOpenTime ? 'open' : 'close'}`, true)
          this.$set(this.errors[index], 'message', `${isOpenTime ? 'Open' : 'Close'} time is invalid!`)
          return
        }
        if(isOpenTime) {
          this.$set(this.errors[index], 'open', false)
          if(this.get24HourValue(time) < this.get24HourValue(openHour.closeTime)) {
            this.$set(openHour, `openTime`, time)
            this.$set(this.errors[index], 'close', false)
          }
          else {
            this.$set(this.errors[index], 'open', true)
            this.$set(this.errors[index], 'message', 'Open time must be before close time!')
          }
        } else {
          this.$set(this.errors[index], 'close', false)
          if(this.get24HourValue(time) > this.get24HourValue(openHour.openTime)) {
            this.$set(openHour, `closeTime`, time)
            this.$set(this.errors[index], 'open', false)
          }
          else{
            this.$set(this.errors[index], 'close', true)
            this.$set(this.errors[index], 'message', 'Close time must be after open time!')
          }
        }
        this.$emit('update', {openHours: this.openHours})
      },
      toggleMinimumOrderValue(active) {
        this.computedMinimumOrderValue = Object.assign({}, this.computedMinimumOrderValue, { active })
      },
      setMinimumOrderValue(value) {
        this.computedMinimumOrderValue = Object.assign({}, this.computedMinimumOrderValue, { value })}
    }
  }
</script>

<style scoped lang="scss">
  .service-setting {

    &__title {
      font-weight: 700;
      font-size: 18px;
      margin-bottom: 12px;
    }

    &__content {
      background-color: #FFF;
      border-radius: 5px;
      padding: 25px 25px 50px 25px;

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
