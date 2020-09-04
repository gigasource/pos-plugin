<template>
 <div class="overview">
   <div class="overview-main">
     <img alt class="overview-main__banner" :src="cdnStoreBanner"/>
     <div class="overview-main__action">
       <p class="fw-700 mb-2">Please select an option</p>
       <div class="row-flex align-items-center">
         <g-btn-bs style="margin-right: 2%" v-if="store && store.pickup" icon="icon-take-away" @click="openStore('pickup')">Take away</g-btn-bs>
         <g-btn-bs style="margin-right: 2%" v-if="store && store.delivery" icon="icon-delivery-scooter" @click="openStore('delivery')">Delivery</g-btn-bs>
         <g-btn-bs v-if="store && store.reservationSetting && store.reservationSetting.activeReservation"
                   icon="icon-table-reservation" @click="openReservation">Reservation</g-btn-bs>
       </div>
     </div>
     <div class="overview-main__info">
       <div class="row-flex align-items-center mb-1">
         <g-icon size="18" class="mr-3">icon-call</g-icon>
         <span class="fs-small fw-700 mr-3">Phone</span>
         <span style="font-size: 14px; color: #1271FF; text-decoration: underline">{{store.phone}}</span>
       </div>
       <div class="row-flex align-items-center">
         <g-icon size="18" class="mr-3">icon-clock</g-icon>
         <span class="fs-small fw-700 mr-3">Open hours</span>
       </div>
       <div style="margin-left: 34px; font-size: 14px; margin-top: 4px" v-for="(day, i) in storeWorkingDay" :key="`day_${i}`">
         {{day.wdayString}}: {{day.open}} - {{day.close}}
       </div>
     </div>
     <div v-if="reviewAvailable" class="overview-main__review">
       <div class="overview-side__review--rating" @click="showReview = !showReview">
         <span class="fw-700 fs-small mr-2">Reviews</span>
         <rating color="#FFC700" icon-size="16" :value="googleMapInfo.rating"/>
         <span class="fs-small-2 text-grey">({{googleMapInfo.user_ratings_total}})</span>
         <g-icon color="#757575">{{showReview ? 'expand_less' : 'expand_more'}}</g-icon>
       </div>
       <review v-if="showReview" v-for="(item, i) in googleMapInfo.reviews.slice(0, 3)" v-bind="item" :index="`${i}--mobile`" :key="i"/>
     </div>
     <div class="overview-main__menu">
       <p class="fw-700 mb-2">Menu</p>
       <div class="tab-wrapper">
         <div class="overview-main__menu--category-icon">
           <g-icon>icon-fork</g-icon>
         </div>
         <div id="tab" class="overview-main__menu--category">
           <div v-for="(category, i) in categories" :key="`category_${i}`" :id="`tab_${category._id}`" @click="chooseCategory(category._id)"
                :class="['overview-main__menu--category-item', category._id === selectedCategoryId && 'overview-main__menu--category-item--selected']">
             {{category.name}}
           </div>
         </div>
       </div>
       <div class="overview-main__menu--content" @touchstart="touch">
         <div v-for="(category, i) in listItem" :id="`category_content_${category._id}`" :key="`category_${i}`" :class="[i > 0 && 'mt-4']">
           <div class="overview-main__menu--content-title">
             {{ category && category.name }} ({{category.items.length}})
           </div>
           <digital-menu-item
               v-for="(item, index) in category.items" :key="index"
               v-bind="item"
               readonly
               class="mt-3"
               :display-id="store.displayId"
               :scrolling="scrolling"
               :display-image="store.displayImage"
               :store-country-locale="storeCountryLocale"
               @image="openDialogImage"/>
         </div>
       </div>
     </div>
   </div>
   <div class="overview-side">
     <img alt class="overview-side__logo" :src="cdnStoreLogoImage"/>
     <div class="overview-side__info">
       <div class="overview-side__info--address">
         <p>{{store.address}}</p>
         <g-btn-bs min-width="130" style="align-self: flex-start; margin-right: 0"
                   @click="viewMap" small icon="icon-direction_white"
                   background-color="#2979FF" text-color="white">
           Get direcrtion
         </g-btn-bs>
       </div>
       <div class="overview-side__info--phone">
         <g-icon class="mr-2" size="18">icon-call</g-icon>
         <span class="fw-700 fs-small mr-3">Phone</span>
         <span style="font-size: 14px; color: #1271FF; text-decoration: underline">{{store.phone}}</span>
       </div>
       <div class="row-flex px-2 py-1">
         <g-icon class="mr-2" size="18">icon-clock</g-icon>
         <span class="fw-700 fs-small">Open hours</span>
       </div>
       <div class="overview-side__info--hour" v-for="(day, i) in storeWorkingDay" :key="`day_${i}`">
         {{day.wdayString}}: {{day.open}} - {{day.close}}
       </div>
     </div>
     <div v-if="reviewAvailable" class="overview-side__review">
       <div class="overview-side__review--rating" @click="showReview = !showReview">
         <span class="fw-700 fs-small mr-2">Reviews</span>
         <rating color="#FFC700" icon-size="16" :value="googleMapInfo.rating"/>
         <span class="fs-small-2 text-grey">({{googleMapInfo.user_ratings_total}})</span>
         <g-icon color="#757575">{{showReview ? 'expand_less' : 'expand_more'}}</g-icon>
       </div>
       <review v-if="showReview" v-for="(item, i) in googleMapInfo.reviews" v-bind="item" :index="i" :key="i"/>
     </div>
   </div>

   <g-dialog v-model="dialog.image.active" width="348">
     <div style="width: 100%; background: white; border-radius: 6px; display: flex; flex-direction: column; align-items: center; padding: 16px">
       <img alt :src="dialog.image.src" style="width: 300px; height: 300px; border-radius: 6px"/>
       <pre style="font-size: 13px; color: #757575; padding: 16px 16px 0; white-space: pre-wrap; word-break: break-word" v-html="dialog.image.desc"/>
       <g-divider color="#efefef" style="margin: 8px"/>
       <g-btn-bs text-color="#536DFE" @click="closeDialogImage">{{$t('store.close')}}</g-btn-bs>
     </div>
   </g-dialog>

   <div class="close-iframe-btn" @click="closeIframe">
     <g-icon>close</g-icon>
   </div>
 </div>
</template>

<script>
  import _ from 'lodash';
  import {getCdnUrl} from "../../Store/utils";
  import {smoothScrolling} from "../../../../../backoffice/pos-vue-framework";
  import {get12HourValue, get24HourValue} from "../../logic/timeUtil";
  import Rating from "./Rating";
  import Review from "./Review";

  export default {
    name: "Overview",
    components: {Review, Rating},
    data() {
      return {
        store: {},
        categories: [],
        selectedCategoryId: null,
        products: [],
        throttle: null,
        choosing: 0,
        scrolling: 0,
        selectedProduct: null,
        dialog: {
          image: {
            active: false,
            src: '',
            desc: ''
          }
        },
        dayInWeeks: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        googleMapInfo: null,
        showReview: true
      }
    },
    async created() {
      const storeId = this.$route.params.id
      if (!storeId) {
        alert('Invalid store!')
        return
      }
      this.store = await cms.getModel('Store').findOne({
        $or: [ { alias: storeId }, { _id: storeId } ]
      })
      if(!_.isEmpty(this.store)) {
        await this.loadCategories()
        await this.loadProducts()
        root.$i18n.locale = (this.store && this.store.country && this.store.country.locale) || 'en'
        if (this.categories.length)
          this.selectedCategoryId = this.categories[0]._id

        // google api charging fee
        // if(this.store.googleMapPlaceId) {
        //   cms.socket.emit('getReviewInGoogleMap', this.store.googleMapPlaceId, info => {
        //     this.googleMapInfo = info
        //   })
        // }
      }
    },
    mounted() {
      this.throttle = _.throttle(this.handleScroll, 100)
      this.$nextTick(() => {
        document.addEventListener('scroll', this.throttle)
        smoothScrolling && smoothScrolling()
      })
    },
    computed: {
      cdnStoreBanner() {
        return this.store && this.store.orderHeaderImageSrc ? `${getCdnUrl(this.store.orderHeaderImageSrc)}` : '/plugins/pos-plugin/assets/images/header.png'
      },
      cdnStoreLogoImage() {
        return this.store && this.store.logoImageSrc ? getCdnUrl(this.store.logoImageSrc) : '/plugins/pos-plugin/assets/images/logo.png'
      },
      listItem() {
        const categories = _.cloneDeep(this.categories)
        const products = _.cloneDeep(this.products)
        _.each(categories, cate => {
          cate.items = _.orderBy(_.filter(products, p => p.category._id === cate._id), 'position', 'asc')
        })
        return categories
      },
      storeCountryLocale() {
        return (this.store && this.store.country && this.store.country.locale) || 'en'
      },
      storeWorkingDay() {
        let formatTime = (this.store.country && this.store.country.name === 'United States') ? get12HourValue : get24HourValue
        return this.store.openHours && this.store.openHours.map(oh => {
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
                  end: $t('common.weekday.' + this.dayInWeeks[i].toLowerCase())
                })
              } else {
                Object.assign(day, {
                  start: $t('common.weekday.' + this.dayInWeeks[i].toLowerCase())
                })
              }
            }
          }
          const wdayString = days.filter(d => !_.isEmpty(d)).map(d => d.start + (d.end ? ` - ${d.end}` : '')).join(', ')
          return { wdayString, open: formatTime(oh.openTime), close: formatTime(oh.closeTime) }
        })
      },
      reviewAvailable() {
        return this.googleMapInfo && this.googleMapInfo.rating && this.googleMapInfo['user_ratings_total']
      }
    },
    methods: {
      async loadCategories() {
        const categories = await cms.getModel('Category').find({ store: this.store._id }, { store: 0 })
        this.$set(this, 'categories', _.orderBy(categories, 'position', 'asc'))
      },
      async loadProducts() {
        this.$set(this, 'products', await cms.getModel('Product').find({ store: this.store._id }, { store: 0 }))
      },
      openStore(type) {
        location.href = `${location.origin}/store/${this.store.alias}/order/?type=${type}`
      },
      openReservation() {
        location.href = `${location.origin}/store/${this.store.alias}/reservation`
      },
      handleScroll() {
        if(this.choosing > 0) return
        const categoryInViewPort = _.filter(this.categories, ({_id: id}) => {
          const el = document.getElementById(`category_content_${id}`);
          const {top, bottom} = el.getBoundingClientRect()
          return top >= (window.innerWidth > 1140 ? 64 : 48) || bottom >= (window.innerHeight - 100);
        })
        this.selectedCategoryId = categoryInViewPort[0]._id
        const wrapper = document.documentElement
        if(!this.selectedCategoryId || (window.innerHeight + wrapper.scrollTop >= wrapper.scrollHeight)) {
          this.selectedCategoryId = _.last(this.categories)._id
        }

        document.querySelectorAll('.g-menu--content').forEach(menu => { menu.style.display = 'none' })
      },
      chooseCategory(id) {
        this.choosing++
        const wrapper = window
        const content = document.getElementById(`category_content_${id}`)
        if(wrapper && content) {
          wrapper.scroll({top: content.offsetTop - 64, left: 0, behavior: "smooth"})
          this.selectedCategoryId = id
          setTimeout(() => {
            this.choosing--
          }, 1000)
        }
      },
      touch() {
        this.scrolling++
      },
      openDialogImage(src, desc) {
        this.dialog.image.src = getCdnUrl(src)
        this.dialog.image.desc = desc
        this.dialog.image.active = true
      },
      closeDialogImage() {
        this.dialog.image.active = false
      },
      closeIframe() {
        window.parent.postMessage('close-iframe', '*')
      },
      viewMap() {
        if(this.store.coordinates) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${this.store.coordinates.lat},${this.store.coordinates.long}`, "_blank")
        } else if (this.store.googleMapPlaceId) {
          window.open(`https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${this.store.googleMapPlaceId}`)
        } else {}
      }
    },
    watch: {
      selectedCategoryId(val) {
        if(val) {
          const tab = document.getElementById(`tab_${val}`)
          const wrapper = document.getElementById('tab')
          if(tab) {
            const siblingWidth = tab.previousSibling ? tab.previousSibling.offsetWidth : 32
            wrapper.scroll({top: 0, left: (tab.offsetLeft - siblingWidth/2 - wrapper.offsetLeft), behavior: "smooth"})
          }
        }
      },
      'dialog.image.active': (val) => {
        if (val) return document.documentElement.style.overflow = 'hidden'
        document.documentElement.style.overflow = ''
      }
    }
  }
</script>

<style scoped lang="scss">
  .overview {
    display: flex;
    width: 100%;
    max-width: 1140px;
    min-height: 100vh;
    background-color: #FFF;
    box-shadow: 0 0 2px 2px #D5D5D5;
    align-self: center;

    &-main {
      padding: 0 16px;
      max-width: 800px;

      &__banner {
        width: 800px;
      }

      &__action {
        margin-top: 20px;

        .g-btn-bs {
          flex: 0 0 32%;
          margin: 0;
          background: #EDF0F5;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border: none;
          font-weight: 700;
        }
      }

      &__info {
        display: none;
        margin: 0 16px;
        padding: 8px 0;
        border-bottom: 1px solid #E0E0E0;
      }

      &__review {
        display: none;
        border-bottom: 1px solid #E0E0E0;
        padding: 8px 0;
        margin: 0 16px;
      }

      &__menu {
        margin-top: 24px;

        .tab-wrapper {
          position: sticky;
          top: -1px;
          z-index: 2;
          background: white;
          max-width: 800px;
          display: flex;
        }

        &--category {
          height: 64px;
          display: flex;
          background-color: #F8F8F8;
          border-top-right-radius: 24px;
          border-bottom-right-radius: 24px;
          overflow: auto;
          scrollbar-width: none; // firefox
          -ms-overflow-style: none; //edge

          &::-webkit-scrollbar {
            display: none;
          }

          &-icon {
            display: flex;
            align-items: center;
            background-color: #F8F8F8;
            padding: 4px 16px;
            margin-top: 12px;
            margin-bottom: 12px;
            border-right: 1px solid #000;
            position: sticky;
            left: 0;
            top: 0;
            box-shadow: 0 12px 0 #F8F8F8, 0 -12px 0 #F8F8F8;
          }

          &-item {
            display: flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
            padding-left: 20px;
            padding-right: 20px;

            &--selected {
              font-weight: 700;
              border-bottom: 2px solid black;
            }
          }
        }

        &--content {

          &-title {
            margin-top: 8px;
            font-weight: 600;
            font-size: 14px;
            color: #424242;
          }
        }
      }
    }

    &-side {
      background-color: #C4C4C410;
      flex: 1;
      padding: 8px;
      position: sticky;
      top: 0;
      align-self: flex-start;
      height: 100vh;
      overflow: auto;
      scrollbar-width: none; // firefox
      -ms-overflow-style: none; //edge

      &::-webkit-scrollbar {
        display: none;
      }

      &__logo {
        margin: 36px 0 36px 50%;
        max-width: 150px;
        transform: translateX(-50%);
      }

      &__info {

        &--address {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px;
          border-bottom: 1px solid #CDCDCD;
        }

        &--phone {
          padding: 8px;
        }

        &--hour {
          margin-left: 26px;
          padding: 2px 8px;
          font-size: 14px;
        }
      }

      &__review {
        padding: 8px 16px;

        &--rating {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
      }
    }
  }

  .close-iframe-btn {
    position: fixed;
    top: 20px;
    left: calc(50% + 600px);
    border: 2px solid #212121;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background-color: rgba(255, 255, 255, 0.4);
    }
  }

  @media screen and (max-width: 1139px) {
    .overview {
      &-main {
        padding: 0;
        width: 100%;
        max-width: 100%;

        &__banner {
          width: 100%;
        }

        &__action {
          margin: 0 16px;
          padding: 12px 0;
          border-bottom: 1px solid #E0E0E0;

          &  > p {
            display: none;
          }

          .g-btn-bs {
            font-size: 12px;
            padding: 4px;

            ::v-deep .g-icon {
              margin-right: 4px;
              width: 18px !important;
              height: 18px !important;
            }
          }
        }

        &__info,
        &__review {
          display: block;
        }

        &__menu {
          margin-top: 16px;

          & > p {
            margin-left: 16px;
          }

          &--category {
            background-color: white;
            border-radius: 0;
            padding-left: 16px;

            &-icon {
              display: none;
            }

            &-item {
              align-self: center;
              display: flex;
              align-items: center;
              justify-content: center;
              white-space: nowrap;
              padding: 8px 16px;
              margin-right: 8px;
              background: #ECF0F5;
              border-radius: 16px;

              &--selected {
                font-weight: 400;
                background: #BBDEFB;
                border: none;
              }
            }
          }

          &--content-title {
            margin-right: 16px;
            margin-left: 16px;
          }
        }
      }

      &-side {
        display: none;
      }
    }
  }
</style>
