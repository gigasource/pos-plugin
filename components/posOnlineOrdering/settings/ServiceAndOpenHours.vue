<template>
  <div class="service-setting">
    <div class="service-setting__title">Service & Open hours</div>
    <div class="service-setting__content mb-2">
      <div style="display: flex">
        <div class="mb-3 fw-700">Open hours & Delivery hours</div>
        <g-spacer/>
        <g-btn-bs class="btn-add" @click="addNewOpenHour()">+ Add new</g-btn-bs>
      </div>
      <div v-for="(openHour, index) in openHoursData" :key="index"
           class="open-hour__row">
        <div class="row-flex flex-wrap">
          <g-checkbox
              v-for="(day, i) in days"
              :key="`day_${index}_${i}`"
              v-model="openHour.dayInWeeks[i]"
              :label="day"
              @change="checkServiceHourError"
              color="#536DFE"/>
        </div>
        <g-spacer/>
        <div :class="['open-hour__row--hour', 'left', errors[index] && errors[index].open && 'error']">
          <g-time-picker-input :use24Hours="country.name !== 'United States'"
                               :value="getTime(openHour, 'openTime')"
                               @input="updateHours($event, index, 'open-Time')"/>
        </div>
        <div :class="['open-hour__row--hour', 'right', errors[index] && errors[index].close && 'error']">
          <g-time-picker-input :use24Hours="country.name !== 'United States'"
                               :value="getTime(openHour, 'closeTime')"
                               @input="updateHours($event, index, 'close-Time')"/>
        </div>
        <g-spacer/>
        <div :class="['open-hour__row--hour', 'left', errors[index] && errors[index].delivery && 'error']">
          <g-time-picker-input :use24Hours="country.name !== 'United States'"
                               :value="getTime(openHour, 'deliveryStart')"
                               @input="updateHours($event, index, 'delivery-Start')"/>
        </div>
        <div :class="['open-hour__row--hour', 'right', errors[index] && errors[index].delivery && 'error']">
          <g-time-picker-input :use24Hours="country.name !== 'United States'"
                               :value="getTime(openHour, 'deliveryEnd')"
                               @input="updateHours($event, index, 'delivery-End')"/>
        </div>
        <g-spacer/>
        <div @click="removeOpenHour(index)" class="open-hour__row--btn">
          <g-icon size="16">icon-close</g-icon>
        </div>
        <div v-if="errors[index] && errors[index].message" class="error-message">{{errors[index].message}}</div>
      </div>
      <div class="row-flex">
        <p>Note: Delivery hours must be within open hours.</p>
        <g-spacer/>
        <g-btn-bs width="80" background-color="indigo accent-2" text-color="white" @click="updateOpenHours"
               :disabled="hasError || openHoursJson === lastSavedData">Save
        </g-btn-bs>
      </div>
    </div>
    <div class="row-flex">
      <div class="service-setting__content flex-grow-1 mr-2">
        <div class="mb-3 fw-700">Service</div>
        <div class="row-flex">
          <g-switch color="#536DFE" class="col-6" label="Delivery" v-model="computedDelivery"/>
          <g-switch color="#536DFE" class="col-6" label="Allow pick-up" v-model="computedPickup"/>
        </div>
        <div class="fw-700 mt-2">Note for customers</div>
        <div>
          <g-textarea outlined no-resize placeholder="Note..." :rows="3" v-model="computedNote">
            <template v-slot:append-inner v-if="isInDevice">
              <g-icon @click.stop="openDialogInput('note')" size="16" class="mt-2">icon-keyboard</g-icon>
            </template>
          </g-textarea>
        </div>
        <div class="row-flex align-items-center">
          <div class="col-lg-8 col-md-7 col-xs-6 pr-1">
            <g-switch color="#536DFE" :label="`Require minimum value ${$t('common.currency', storeCountryLocale)} for delivery orders`"
                      @change="toggleMinimumOrderValue" :input-value="computedMinimumOrderValue.active"/>
          </div>
          <div class="col-lg-4 col-md-5 col-xs-6 mt-2">
            <g-text-field-bs large type="number" :value="computedMinimumOrderValue.value" @input="setMinimumOrderValue">
              <template v-slot:append-inner v-if="isInDevice">
                <g-icon @click.stop="openDialogInput('minimumValue')" size="16" class="mb-1">icon-keyboard</g-icon>
              </template>
            </g-text-field-bs>
          </div>
        </div>
        <div class="row-flex align-items-center">
          <div class="col-lg-8 col-md-7 col-xs-6">Order timeout</div>
          <div class="col-lg-4 col-md-5 col-xs-6 mt-2">
            <g-select text-field-component="GTextFieldBs" v-model="computedOrderTimeOut"
                      :items="orderTimeOuts"/>
          </div>
        </div>
      </div>
      <div class="service-setting__content" style="max-width: 600px;">
        <div class="mb-3 fw-700">G-SMS Settings</div>
        <div class="row-flex">
          <g-switch color="#536DFE" class="col-6" label="Enabled" :input-value="computedGSms.enabled" @change="setGSmsValue('enabled', $event)"/>
        </div>
        <div class="fw-700 mt-2">Default time to complete order</div>
        <g-grid-select :items="[15, 30, 45, 60]" mandatory :grid="false" class="mb-3"
                       :value="computedGSms.timeToComplete" @input="setGSmsValue('timeToComplete', $event)"
        >
          <template #default="{item, toggleSelect}">
            <g-btn-bs style="margin: 16px 16px 0 0;" border-color="#E0E0E0" text-color="black" height="30" min-width="72" @click.stop="toggleSelect(item)">
              {{item}}
            </g-btn-bs>
          </template>
          <template #selected="{item}">
            <g-btn-bs style="margin: 16px 16px 0 0;" border-color="#90CAF9" background-color="#E3F2FD" text-color="black" height="30" width="72">{{item}}
            </g-btn-bs>
          </template>
        </g-grid-select>
        <div>
          <span style="font-weight: 700;">Note: </span>
          <span>We recommend leaving this setting off by default. For more information, please contact your service provider.</span>
        </div>
        <template v-if="smsDevices && smsDevices.length > 0">
          <div class="fw-700 mt-2">Device list</div>
          <div class="service-setting__sms-table">
            <div class="service-setting__sms-table--header">
              <div class="flex-equal pl-1">Name</div>
              <div class="flex-equal pl-1">Code</div>
              <div style="flex: 0 0 120px"/>
            </div>
            <div v-for="(device, i) in smsDevices" :key="`sms_${i}`" class="service-setting__sms-table--device">
              <div class="flex-equal pl-1">{{device.name}}</div>
              <div class="flex-equal pl-1">{{device.code}}</div>
              <div class="row-flex align-items-center justify-end pr-1">
                <g-btn-bs background-color="#f0f0f0" border-color="#d8d8d8" :disabled="device.registered" @click="changeDeviceStatus(device._id)">
                  <g-icon color="#4CAF50">check</g-icon>
                </g-btn-bs>
                <g-btn-bs background-color="#f0f0f0" border-color="#d8d8d8" @click="removeDevice(device)">
                  <g-icon color="#FF4452">close</g-icon>
                </g-btn-bs>
                <g-btn-bs background-color="#f0f0f0" border-color="#d8d8d8" @click="editSmsDevice(device)">
                  <g-icon color="yellow-darken 2">brush</g-icon>
                </g-btn-bs>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <dialog-number-filter label="Minimum Order Value" v-model="dialog.minimumValue" :default-value="computedMinimumOrderValue.value" @submit="setMinimumOrderValue"/>
    <dialog-text-filter label="Note for Customer" v-model="dialog.note" :default-value="computedNote" @submit="setNoteForCustomer"/>

    <g-dialog v-model="device.dialog" width="400">
      <g-card>
        <g-card-title>
          <div class="fs-large-2">Edit device name</div>
        </g-card-title>
        <div style="padding: 0 12px">
          <g-text-field-bs label="Name" v-model="device.name">
            <template v-slot:append-inner v-if="isInDevice">
              <g-icon @click.stop="openDialogInput('name')" size="16" class="mb-1">icon-keyboard</g-icon>
            </template>
          </g-text-field-bs>
        </div>
        <g-card-actions>
          <g-btn-bs text-color="#424242" @click="device.dialog = false">Cancel</g-btn-bs>
          <g-btn-bs width="80" background-color="indigo accent-2" text-color="white" @click="updateDeviceName">Save</g-btn-bs>
        </g-card-actions>
      </g-card>
    </g-dialog>
    <dialog-text-filter label="Device Name" v-model="dialog.name" :default-value="device.name" @submit="e => device.name = e"/>

    <dialog-delete-item type="sms device" v-model="device.delete" @confirm="deleteSmsDevice"/>
  </div>
</template>
<script>
  import {get12HourValue, _12HourTimeRegex, _24HourTimeRegex} from "../../logic/timeUtil";
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
      noteToCustomers: String,
      gSms: null,
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
        ],
        dialog: {
          minimumValue: false,
          note: false,
          name: false
        },
        device: {
          dialog: false,
          selected: null,
          name: '',
          delete: false
        }
      }
    },
    computed: {
      isInDevice() {
        return this.$route.query.device
      },
      storeCountryLocale() {
        return (this.store && this.store.country && this.store.country.locale) || 'en'
      },
      computedDelivery: {
        get() {
          return this.delivery
        },
        set(value) {
          this.$emit('update', { delivery: value })
        }
      },
      computedPickup: {
        get() {
          return this.pickup
        },
        set(value) {
          this.$emit('update', { pickup: value })
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

        this.errors.forEach(({message, open, close, delivery}) => {
          if ((message && message.length > 0) || open || close || delivery) result = true
        })

        this.openHoursData.forEach(({dayInWeeks}) => {
          if(dayInWeeks.filter(d => !!d).length === 0) result = true
        })

        return result
      },
      openHoursJson() {
        return JSON.stringify(this.openHoursData)
      },
      computedNote: {
        get() {
          return this.noteToCustomers
        },
        set(val) {
          this.updateNoteDebounce(val)
        }
      },
      computedGSms: {
        get() {
          return this.gSms || {
            enabled: false,
            timeToComplete: 30,
            devices: []
          }
        },
        set(value) {
          this.$emit('update', { gSms: value })
        }
      },
      smsDevices() {
        return this.gSms && this.gSms.devices
      }
    },
    created() {
      this.deliveryTimeIntervalData = this.deliveryTimeInterval
      this.updateNoteDebounce = _.debounce(this.updateNote, 1000)
    },
    mounted() {
      this.openHoursData = _.cloneDeep(this.openHours)
      this.lastSavedData = JSON.stringify(this.openHoursData)
      this.errors = this.openHoursData.map(() => ({
        open: false,
        close: false,
        delivery: false,
        message: ''
      }))
    },
    methods: {
      addNewOpenHour() {
        const newOpenHour = {
          dayInWeeks: [false, false, false, false, false, false, false],
          openTime: '06:30',
          closeTime: '23:30',
          deliveryStart: '06:30',
          deliveryEnd: '23:30'
        }
        this.openHoursData = [...this.openHoursData, newOpenHour]

        this.errors.push({
          open: false,
          close: false,
          message: '',
          delivery: false
        })

        this.checkServiceHourError()
      },
      removeOpenHour(i) {
        this.openHoursData.splice(i, 1)
        this.errors.splice(i, 1)

        this.checkServiceHourError()
      },
      updateOpenHours() {
        this.lastSavedData = JSON.stringify(this.openHoursData)
        this.$emit('update', {openHours: this.openHoursData})
      },
      getTime(openHour, type) {
        return this.country.name === 'United States' ? get12HourValue(openHour[type]) : openHour[type]
      },
      updateHours(time, index, typeStr) {
        if (!_24HourTimeRegex.exec(time) && !_12HourTimeRegex.exec(time)) {
          this.$set(this.errors[index], typeStr.split('-')[0], true)
          this.$set(this.errors[index], 'message', `Invalid time format!`)
          return
        }
        this.$set(this.openHoursData[index], typeStr.replace('-', ''), time)
        this.checkServiceHourError()
      },
      toggleMinimumOrderValue(active) {
        this.computedMinimumOrderValue = Object.assign({}, this.computedMinimumOrderValue, { active })
      },
      setMinimumOrderValue(value) {
        this.computedMinimumOrderValue = Object.assign({}, this.computedMinimumOrderValue, {value})
      },
      checkServiceHourError() {
        this.openHoursData.forEach(({dayInWeeks, openTime, closeTime, deliveryStart, deliveryEnd}, index) => {

          if(openTime > closeTime) {
            this.$set(this.errors[index], 'close', true)
            this.$set(this.errors[index], 'open', true)
            this.$set(this.errors[index], 'message', `Open time must be before close time!`)
            return
          }

          if(deliveryStart < openTime || deliveryStart > closeTime || deliveryEnd < openTime || deliveryEnd > closeTime || deliveryStart > deliveryEnd) {
            this.$set(this.errors[index], 'delivery', true)
            this.$set(this.errors[index], 'message', `Delivery time is invalid!`)
          } else {
            this.$set(this.errors[index], 'delivery', false)
            this.$set(this.errors[index], 'message', '')
          }

          for (let i = 0; i < dayInWeeks.length; i++) {
            if (!dayInWeeks[i]) continue

            const dayInWeek = this.indexToDayInWeek(i)
            const openHoursInDay = this.openHoursMap[dayInWeek]

            for (const {openTime: ot, closeTime: ct, row} of openHoursInDay) {
              if (row === index) continue

              if (openTime > ot && openTime < ct) {
                this.$set(this.errors[index], 'open', true)
                this.$set(this.errors[index], 'message', 'Overlapping open hours!')
                return
              }
              if (closeTime > ot && closeTime < ct) {
                this.$set(this.errors[index], 'close', true)
                this.$set(this.errors[index], 'message', 'Overlapping open hours!')
                return
              }
              if (openTime === ot && closeTime) {
                this.$set(this.errors[index], 'close', true)
                this.$set(this.errors[index], 'open', true)
                this.$set(this.errors[index], 'message', 'Overlapping open hours!')
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
      openDialogInput(type) {
        if (!this.$route.query.device) return
        this.dialog[type] = true
      },
      updateNote(noteToCustomers) {
        this.$emit('update', {noteToCustomers})
      },
      setGSmsValue(key, value) {
        this.computedGSms = Object.assign({}, this.computedGSms, {[key]: value})
      },
      setNoteForCustomer(value) {
        this.computedNote = value
      },
      changeDeviceStatus(deviceId, status = true) {
        const devices = _.cloneDeep(this.smsDevices)
        const device = devices.find(d => d._id === deviceId)
        if(device.registered === status) return
        device.registered = status
        this.setGSmsValue('devices', devices)
      },
      editSmsDevice(device) {
        this.device.selected = device
        this.device.name = device.name
        this.device.dialog = true
      },
      updateDeviceName() {
        const devices = _.cloneDeep(this.smsDevices)
        const device = devices.find(d => d._id === this.device.selected._id)
        device.name = this.device.name
        this.setGSmsValue('devices', devices)
        this.device.dialog = false
      },
      removeDevice(device) {
        this.device.selected = device
        this.device.delete = true
      },
      deleteSmsDevice() {
        const devices = _.cloneDeep(this.smsDevices).filter(d => d._id !== this.device.selected._id)
        this.setGSmsValue('devices', devices)
      }
    },
  }
</script>

<style scoped lang="scss">
  .service-setting {
    max-height: 100%;
    overflow-y: auto;

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
            margin-left: 16px;
          }

          &.right {
            border-top-right-radius: 37px;
            border-bottom-right-radius: 37px;
            margin-right: 16px;
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
          min-width: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: stretch;
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

    .g-textarea {
      margin: 8px 0;
      width: calc(100% - 10px);

      ::v-deep .g-tf {
        &:before, &:after {
          display: none;
        }
      }

      ::v-deep fieldset {
        border-width: 1px !important;
        border-color: #ced4da;

        &:focus-within {
          border-color: #80bdff !important;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
          z-index: 2;
        }

        .g-tf-input {
          padding: 12px;
          font-size: 15px;
        }

        textarea {
          user-select: text !important;
        }
      }
    }

    &__sms-table {
      background: #FFFFFF;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1398);
      border-radius: 2px;
      margin-top: 8px;

      &--header {
        background: #EFEFEF;
        height: 38px;
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
        color: #757575;
      }

      &--device {
        display: flex;
        align-items: center;
        padding-top: 4px;
        padding-bottom: 4px;

        .g-btn-bs {
          margin: 0 0 0 4px;
          padding: 4px;
        }
      }
    }
  }
</style>
