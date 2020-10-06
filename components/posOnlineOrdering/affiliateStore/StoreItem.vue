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
      <div :style="storeOpenStatusStyle">
        • {{ storeOpenStatus }}
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
      openStore() {
        let url = `https://restaurantplus.net/store/${this.store.alias}`
        if(this.store.affiliateDelivery && this.store.affiliateDelivery.active) {
          url = this.store.affiliateDelivery.url
        }
        window.open(url, '_blank')
      }
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
  }

  .menu-hour {
    padding: 16px;
    background: white;
    border-radius: 2px;
    min-width: 280px;
  }
</style>
