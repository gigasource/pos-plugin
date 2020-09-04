<template>
  <div class="store-card">
    <div class="store-card--logo">
      <img v-if="store && store.logoImageSrc" alt :src="cdnStoreLogoImage"/>
      <div v-else></div>
    </div>
    <div class="store-card--detail">
      <div class="store-card--name">
        <p>{{ store.name }}</p>
        <g-spacer/>
        <div v-if="viewMapAvailable" class="store-card--map">
          <g-icon @click="viewMap" size="18">icon-place_color</g-icon>
        </div>
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
      </div>
      <div class="store-card--address">
        <g-icon size="16" class="mr-2">icon-flat</g-icon>
        {{ store.address }}
      </div>
      <div class="store-card--phone">
        <g-icon size="16" class="mr-2">icon-call</g-icon>
        {{ store.phone }}
      </div>
      <div class="store-card--action">
        <g-btn-bs v-if="store && store.pickup" background-color="#EDF0F5" icon="icon-take-away@16" @click="openStore('pickup')">Take away</g-btn-bs>
        <g-btn-bs v-if="store && store.delivery" background-color="#EDF0F5" icon="icon-delivery-scooter@16" @click="openStore('delivery')">Delivery</g-btn-bs>
        <g-btn-bs v-if="store && store.reservationSetting && store.reservationSetting.activeReservation"
                  background-color="#EDF0F5" icon="icon-table-reservation@16" @click="openReservation">Reservation</g-btn-bs>
        <g-spacer/>
        <div v-if="viewMapAvailable" class="store-card--action__map">
          <g-icon @click="viewMap" size="18">icon-place_color</g-icon>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  import { get12HourValue, get24HourValue } from '../../logic/timeUtil';
  import _ from 'lodash';
  import {getCdnUrl} from "../../Store/utils";

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
        return this.store.googleMapPlaceId || (this.store.coordinates && this.store.coordinates.lat && this.store.coordinates.long)
      },
      cdnStoreLogoImage() {
        return this.store.logoImageSrc && getCdnUrl(this.store.logoImageSrc || '/plugins/pos-plugin/assets/images/logo.png')
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
      openStore(type) {
        location.href = `${location.origin}/store/${this.store.alias}/order/?type=${type}`
      },
      openReservation() {
        location.href = `${location.origin}/store/${this.store.alias}/reservation`
      },
      viewMap() {
        if (this.store.googleMapPlaceId) {
          window.open(`https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${this.store.googleMapPlaceId}`)
        } else {
          window.open(`https://www.google.com/maps/search/?api=1&query=${this.store.coordinates.lat},${this.store.coordinates.long}`, "_blank")
        }
      }
    }
  }
</script>
<style lang="scss" scoped>
  .store-card {
    background: white;
    border: 0.5px solid #EFEFEF;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    border-radius: 16px;
    margin-bottom: 16px;
    padding: 12px;
    display: flex;

    &--detail {
      flex: 1;
    }

    &--logo {
      margin-right: 24px;
      display: flex;
      align-items: center;

      & > img {
        border-radius: 4px;
        max-width: 100px;
      }

      & > div {
        background-color: #c4c4c4;
        width: 100px;
        height: 100px;
      }
    }

    &--name {
      display: flex;
      align-items: center;
      margin-bottom: 4px;

      & > p {
        font-weight: bold;
        font-size: 16px;
      }
    }

    &--address,
    &--phone {
      display: flex;
      align-items: center;
      margin: 2px 0;
      font-size: 14px;
      color: #757575;
    }

    &--action {
      display: flex;
      align-items: center;
      margin-top: 8px;

      .g-btn-bs {
        font-weight: bold;
        margin: 0 4px 0 0;
        padding: 6px;
        font-size: 12px;
        line-height: 16px;
        border-radius: 8px;
      }

      &__map {
        background-color: #EDF0F5;
        border-radius: 50%;
        height: 30px;
        width: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &--map {
      display: none;
      background-color: #EDF0F5;
      border-radius: 50%;
      height: 30px;
      width: 30px;
      align-items: center;
      justify-content: center;
    }
  }

  .menu-hour {
    padding: 16px;
    background: white;
    border-radius: 2px;
    min-width: 280px;
  }

  @media screen and (max-width: 640px) {
    .store-card {
      padding: 8px;
      border-radius: 8px;

      &--logo {
        display: none;
      }
    }
  }

  @media screen and (max-width: 374px) {
    .store-card {
      padding: 4px;
      margin-bottom: 8px;

      &--map {
        display: flex;
        margin-right: 8px;
      }

      &--action {

        .g-btn-bs {
          padding: 4px;

          .g-icon {
            margin-right: 4px;
          }
        }

        &__map {
          display: none;
        }
      }
    }
  }

</style>
