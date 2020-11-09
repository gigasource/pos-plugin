<template>
  <div class="store-item" @click="openStore">
    <div class="store-item__logo">
      <img v-if="store && store.logoImageSrc" alt :src="cdnStoreLogoImage"/>
      <div v-else></div>
    </div>
    <div class="store-item__detail">
      <div class="store-item__name">{{store.name || store.settingName}}</div>
      <div class="store-item__address">{{store.address}}</div>
      <g-spacer/>
      <div class="row-flex align-items-center">
        <g-btn-bs v-if="store && store.pickup" background-color="#EDF0F5" icon="icon-take-away@16" @click="openStore('pickup')">{{$t('setting.takeAway')}}</g-btn-bs>
        <g-btn-bs v-if="store && (store.delivery || (store.affiliateDelivery && store.affiliateDelivery.active))" background-color="#EDF0F5" icon="icon-delivery-scooter@16" @click="openStore('delivery')">{{$t('store.delivery')}}</g-btn-bs>
        <g-btn-bs v-if="store && store.reservationSetting && store.reservationSetting.activeReservation"
                  background-color="#EDF0F5" icon="icon-table-reservation@16" @click="openReservation">{{$t('setting.reservation')}}</g-btn-bs>
        <g-spacer/>
        <div class="store-item__time" :style="storeOpenStatusStyle">
          • {{ storeOpenStatus }}
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
    name: "StoreItem",
    props: {
      store: Object
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
        if(type === 'delivery' && !this.store.delivery) {
          if(this.store.affiliateDelivery && this.store.affiliateDelivery.active) {
            const { active, url, lastMonthCounter, currentMonthCounter, oldTimeCounter, lastSync } = this.store.affiliateDelivery
            const date = new Date()
            let tempCurrent, tempLast, tempOld
            if(!lastSync || dayjs(date).diff(dayjs(lastSync), 'month') === 1) {
              tempCurrent = 1
              tempLast = currentMonthCounter || 0
              tempOld = oldTimeCounter + lastMonthCounter
            } else {
              tempCurrent = currentMonthCounter + 1
              tempLast = lastMonthCounter || 0
              tempOld = oldTimeCounter || 0
            }
            cms.socket.emit('updateAffiliateDelivery', this.store._id, {
              active,
              url,
              lastMonthCounter: tempLast,
              currentMonthCounter: tempCurrent,
              oldTimeCounter: tempOld,
              lastSync: date
            })
            window.open(url)
            return
          }
        }
        window.open(`${location.origin}/store/${this.store.alias}/order/?type=${type}`)
      },
      openReservation() {
        window.open(`${location.origin}/store/${this.store.alias}/reservation`)
      },
    }
  }
</script>

<style scoped lang="scss">
  .store-item {
    display: flex;
    background: white;
    border: 0.5px solid #9E9E9E;
    padding: 8px;
    margin-bottom: 20px;
    border-radius: 4px;

    &__logo {
      margin-right: 24px;
      display: flex;
      align-items: center;
      cursor: pointer;
      height: 140px;

      & > img {
        max-width: 140px;
      }

      & > div {
        background-color: #c4c4c4;
        border-radius: 6px;
        width: 140px;
        height: 140px;
      }
    }

    &__detail {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    &__name {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 2px;
    }

    &__address {
      font-size: 14px;
      color: #737A9D;
    }

    .g-btn-bs {
      margin: 0 8px 0 0;
    }
  }

  .menu-hour {
    padding: 16px;
    background: white;
    border-radius: 2px;
    min-width: 280px;
  }

  @media screen and (max-width: 600px) {
    .store-item {
      padding: 4px;

      &__logo {
        display: none;
      }

      &__address {
        margin-bottom: 8px;
      }

      .g-btn-bs {
        padding: 4px;
        font-size: 12px;
        font-weight: bold;

        .g-icon {
          margin-right: 4px;
        }
      }

      &__time {
        font-size: 12px;
      }
    }
  }
</style>
