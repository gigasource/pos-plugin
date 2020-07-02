<template>
  <section class="pa-3 col-flex">
    <div style="font-weight: bold; font-size: 20px; line-height: 20px; margin-bottom: 10px">{{ store.name }}</div>
    <div style="display: flex; align-items: center; white-space: nowrap;" @click="dialog.hour = true">
      <!-- context menu -->
      <g-menu v-model="menuHour" open-on-hover close-on-content-click nudge-left="100">
        <!-- context menu activator -->
        <template v-slot:activator="{on}">
          <div @mouseenter="on.mouseenter"
               @mouseleave="on.mouseleave"
               :style="storeOpenStatusStyle"
               class="row-flex align-items-center mr-1">
            {{ storeOpenStatus }}
            <g-icon size="16" :style="storeOpenStatusStyle" class="ml-1">info</g-icon>
          </div>
        </template>
      
        <!-- context menu content -->
        <div class="menu-hour">
          <div class="fw-700 mb-2">{{$t('store.openHours')}}:</div>
          <div class="row-flex align-items-center justify-between my-1 fs-small" v-for="day in storeWorkingDay">
            <div class="mr-2">{{day.wdayString}}</div>
            <div class="ta-right">{{day.open}} - {{day.close}}</div>
          </div>
          <template v-if="deliveryInfo && deliveryInfo.length > 0">
            <div class="fw-700 my-2">{{$t('store.delivery')}}:</div>
            <div class="row-flex align-items-center justify-between my-1 fs-small" v-for="info in deliveryInfo">
              <div class="mr-2">{{info.title}}</div>
              <div class="ta-right">{{info.value}}</div>
            </div>
          </template>
        </div>
      </g-menu>
    </div>
    <p>{{ store.address }}</p>
    <p>Pickup service: {{ pickupServiceStatus }}</p>
    <p>Delivery service: {{ deliveryServiceStatus }}</p>
    <g-spacer/>
    <p class="mt-2" v-if="store.phone">TEL: {{ store.phone }} </p>
    <div class="mt-2 row-flex">
      <g-btn-bs background-color="#000" text-color="#FFF" border-radius="20px" width="128" class="ml-0 mr-0" @click="openStore">Order now</g-btn-bs>
      <g-btn-bs background-color="#FFF" text-color="#000" border-radius="20px" width="128" border-color="#000"  @click="openReservation">Reservation</g-btn-bs>
      <div v-if="viewMapAvailable" class="row-flex justify-center align-items-center br-100" style="border: 1px solid #000; height: 36px; width: 36px; cursor: pointer">
        <img src="/plugins/pos-plugin/assets/map.svg" draggable="false" @click="viewMap"/>
      </div>
    </div>
  </section>
</template>
<script>
  import { get12HourValue, get24HourValue } from '../../logic/timeUtil';
  import _ from 'lodash';

  export default {
    name: 'StoreCard',
    props: {
      store: Object,
    },
    data: function () {
      let weekday = new Date().getUTCDay() - 1
      if (weekday === -1)
        weekday = 6
      
      return {
        weekday,
        now: dayjs().format('HH:mm'),
        dayInWeeks: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        menuHour: false,
        dialog: {
          hour: false
        }
      }
    },
    computed: {
      storeCountryLocale() {
        return (this.store && this.store.country && this.store.country.locale) || 'en'
      },
      todayOpenHour() {
        return this.getOpenHour(this.weekday)
      },
      isStoreOpening() {
        if (this.todayOpenHour) {
          for (const {openTime, closeTime} of this.todayOpenHour) {
            if (this.now >= get24HourValue(openTime) && this.now <= get24HourValue(closeTime)) return true
          }
        }

        return false
      },
      storeOpenStatus() {
        return this.isStoreOpening ? this.$t('store.open') : this.$t('store.closed')
      },
      storeOpenStatusStyle() {
        return {
          color: this.isStoreOpening ? '#4CAF50' : "#FF4452",
        }
      },
      storeWorkingTime() {
        let formatTime = (this.store.country && this.store.country.name === 'United States') ? get12HourValue : get24HourValue
        if (this.todayOpenHour) {
          for (const {openTime, closeTime} of this.todayOpenHour) {
            if (this.now >= get24HourValue(openTime) && this.now <= get24HourValue(closeTime)) {
              return `${formatTime(openTime)} - ${formatTime(closeTime)}`
            }
          }
        }
        return null
      },
      storeWorkingDay() {
        let formatTime = (this.store.country && this.store.country.name === 'United States') ? get12HourValue : get24HourValue
        return this.store.openHours.map(oh => {
          let days = []
          for(let i = 0; i < oh.dayInWeeks.length; i++) {
            const weekday = oh.dayInWeeks[i]
            if(!weekday)
              days.push({})
            else {
              if (days.length === 0) days.push({})
              let day = _.last(days)
              if(day.start) {
                Object.assign(day, {
                  end: $t('common.weekday.' + this.dayInWeeks[i].toLowerCase()).substr(0, 3)
                })
              } else {
                Object.assign(day, {
                  start: $t('common.weekday.' + this.dayInWeeks[i].toLowerCase()).substr(0, 3)
                })
              }
            }
          }
          const wdayString = days.filter(d => !_.isEmpty(d)).map(d => d.start + (d.end ? ` - ${d.end}` : '')).join(', ')
          return { wdayString, open: formatTime(oh.openTime), close: formatTime(oh.closeTime) }
        })
      },
      deliveryServiceStatus() {
        return this.store.delivery ? 'Available': 'Not-available'
      },
      pickupServiceStatus() {
        return this.store.pickup ? 'Available': 'Not-available'
      },
      deliveryInfo() {
        let info = []
        if (!this.store.delivery) return [{title: 'Not Available'}]
        if (this.store.minimumOrderValue && this.store.minimumOrderValue.active) {
          info.push({
            title: $t('store.minimumOrder'),
            value: `${$t('common.currency', this.storeCountryLocale)}${this.store.minimumOrderValue.value}`
          })
        }
        if (this.store.deliveryFee) {
          const type = this.store.deliveryFee.type
          let min = _.minBy(this.store.deliveryFee[`${type}Fees`], 'fee')
              ? (_.minBy(this.store.deliveryFee[`${type}Fees`], 'fee')).fee
              : 0,
              max = _.maxBy(this.store.deliveryFee[`${type}Fees`], 'fee')
                  ? (_.maxBy(this.store.deliveryFee[`${type}Fees`], 'fee')).fee
                  : 0

          if (this.store.deliveryFee.acceptOrderInOtherZipCodes && type === 'zipCode') {
            if (min > this.store.deliveryFee.defaultFee)
              min = this.store.deliveryFee.defaultFee
            if (max < this.store.deliveryFee.defaultFee)
              max = this.store.deliveryFee.defaultFee
          }

          if (max !== 0)
            info.push({
              title: $t('store.deliveryFee'),
              value: max > min
                  ? `${$t('common.currency', this.storeCountryLocale)}${min} - ${$t('common.currency', this.storeCountryLocale)}${max}`
                  : `${$t('common.currency', this.storeCountryLocale)}${max}`
            })

          if(this.store.openHours) {
            let formatTime = (this.store.country && this.store.country.name === 'United States') ? get12HourValue : get24HourValue
            this.store.openHours.forEach(oh => {
              let days = []
              for(let i = 0; i < oh.dayInWeeks.length; i++) {
                const weekday = oh.dayInWeeks[i]
                if(!weekday)
                  days.push({})
                else {
                  if (days.length === 0) days.push({})
                  let day = _.last(days)
                  if(day.start) {
                    Object.assign(day, {
                      end: $t('common.weekday.' + this.dayInWeeks[i].toLowerCase()).substr(0, 3)
                    })
                  } else {
                    Object.assign(day, {
                      start: $t('common.weekday.' + this.dayInWeeks[i].toLowerCase()).substr(0, 3)
                    })
                  }
                }
              }
              info.push({
                title: days.filter(d => !_.isEmpty(d)).map(d => d.start + (d.end ? ` - ${d.end}` : '')).join(', '),
                value: oh.deliveryStart && oh.deliveryEnd ? `${formatTime(oh.deliveryStart)} - ${formatTime(oh.deliveryEnd)}` : `${formatTime(oh.openTime)} - ${formatTime(oh.closeTime)}`
              })
            })
          }
        }
        return info
      },
      viewMapAvailable() {
        return this.store.coordinates && this.store.coordinates.lat && this.store.coordinates.long
      }
    },
    methods: {
      getOpenHour(weekday) {
        const openHours = []

        this.store.openHours.forEach(({dayInWeeks, openTime, closeTime}) => {
          if (dayInWeeks[weekday]) {
            openHours.push({openTime, closeTime})
          }
        })
        return openHours
      },
      openStore() {
        location.href = `${location.origin}/store/${this.store.alias}`
      },
      openReservation() {
        location.href = `${location.origin}/reservation/${this.store.alias}`
      },
      viewMap() {
        window.open(`https://www.google.com/maps/search/?api=1&query=${this.store.coordinates.lat},${this.store.coordinates.long}`, "_blank")
      }
    }
  }
</script>
<style lang="scss" scoped>
  .menu-hour {
    padding: 16px;
    background: white;
    border-radius: 2px;
    min-width: 280px;
  }
</style>
