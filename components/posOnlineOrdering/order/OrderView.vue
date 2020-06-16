<template>
  <div class="pos-order">
      <template  v-if="store">
        <div class="pos-order__left">
          <div class="pos-order__left__header">
            <img :src="cdnStoreLogoImage"/>
            <div class="pos-order__left__header--info">
              <div>
                <div class="row-flex align-items-center justify-end">
                  <span class="phone-image">
                    <img alt src="/plugins/pos-plugin/assets/phone.svg"/>
                  </span>
                  <span class="sub-title">{{store.phone}}</span>
                </div>

                <div style="display: flex; align-items: center; justify-content: flex-end; white-space: nowrap;" @click="dialog.hour = true">
                  <g-menu v-model="menuHour" open-on-hover close-on-content-click nudge-left="100">
                    <template v-slot:activator="{on}">
                      <div @mouseenter="on.mouseenter" @mouseleave="on.mouseleave" :style="storeOpenStatusStyle" class="row-flex align-items-center mr-1">
                        {{ storeOpenStatus }}
                        <g-icon size="16" :style="storeOpenStatusStyle" class="ml-1">info</g-icon>
                      </div>
                    </template>
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
                  <template v-if="storeWorkingTime">
                    <span style="margin-right: 3px;">|</span>
                    <g-icon size="16">access_time</g-icon>
                    <span style="color: #424242; margin-left: 3px">{{ storeWorkingTime }}</span>
                  </template>
                  <span v-else>{{$t('store.today')}}</span>
                </div>
                
              </div>
              <div class="address">
                <span>{{store.address}}</span>
                <span class="ml-1">{{store.zipCode}} {{store.townCity}}</span>
              </div>
            </div>
          </div>
          <div class="pos-order__info" v-if="orderItems.length > 0">
            <g-badge :value="true" color="#4CAF50" overlay>
              <template v-slot:badge>
                {{totalItems}}
              </template>
              <div style="width: 40px; height: 40px; background-color: #ff5252; border-radius: 8px; display: flex; align-items: center; justify-content: center">
                <g-icon>icon-menu2</g-icon>
              </div>
            </g-badge>
            <div class="pos-order__info--total">{{ totalPrice | currency(storeCountryLocale) }}</div>
            <g-spacer/>
            <g-btn-bs background-color="#2979FF" rounded style="padding: 8px 24px; position: relative" @click="showOrder = true" width="150">
              <span class="mr-3">{{$t('store.order')}}</span>
              <div class="icon-payment">
                <g-icon size="16" color="white" class="ml-1">fas fa-chevron-right</g-icon>
              </div>
            </g-btn-bs>
          </div>
          <div class="pos-order__tab--wrapper">
            <div class="pos-order__tab">
              <div class="pos-order__tab--icon">
                <g-icon>icon-fork</g-icon>
              </div>
              <div class="pos-order__tab--category" id="tab">
                <div v-for="(category, index) in categoriesViewModel"
                     :key="`tab_${index}`"
                     :id="`tab_${category._id}`"
                     @click="chooseCategory(category._id)"
                     :style="getCategoryStyle(category)">
                  {{ category.name }}
                </div>
              </div>
            </div>
          </div>
          <div class="pos-order__tab--content" id="tab-content" ref="tab-content" @touchstart="touch">
            <div v-for="(category, i) in categoriesViewModel" :id="`category_content_${category._id}`" :key="`category_${i}`" :class="[i > 0 && 'mt-5']">
              <div v-if="category && category.image" class="category-header">
                <img alt :src="category.image"/>
                <div>{{ category.name }}</div>
              </div>
              <div v-else class="sub-title mb-2">{{ category && category.name }}</div>
              <div class="pos-order__tab--content-main">
                <menu-item
                    v-for="(item, index) in category.items" :key="index"
                    v-bind="item"
                    :is-opening="isStoreOpening"
                    :currency-unit="store.currency"
                    :quantity="getQuantityInOrder(item)"
                    :disabled="menuItemDisabled"
                    :collapse-text="store.collapseText"
                    :display-id="store.displayId"
                    :scrolling="scrolling"
                    :display-image="store.displayImage"
                    :store-country-locale="storeCountryLocale"
                    @menu-item-selected="openDialogAdd(item)"
                    @increase="increaseOrAddNewItems(item)"
                    @decrease="removeItemFromOrder(item)"/>
              </div>
            </div>
            <div class="pos-order__tab--content-footer"></div>
          </div>
          <order-table v-if="showOrder" :store="store" :order-items="orderItems" :total-price="totalPrice" :total-items="totalItems" :is-opening="isStoreOpening"
                       @back="showOrder = false" @increase="increaseOrAddNewItems" @decrease="decreaseOrRemoveItems" @clear="clearOrder"/>
        </div>
        <div class="pos-order__right">
          <order-table :store="store" :order-items="orderItems" :total-price="totalPrice" :total-items="totalItems" :is-opening="isStoreOpening" :merchant-message="merchantMessage"
                       @disable-menu="menuItemDisabled = $event" @increase="increaseOrAddNewItems" @decrease="decreaseOrRemoveItems" @clear="clearOrder"/>
        </div>

        <!-- Merchant dialog -->
        <g-dialog v-model="dialog.closed" persistent>
          <div class="dialog-closed">
            <div class="dialog-closed__title">{{$t('store.merchantClose')}}</div>
            <div class="dialog-closed__message">{{ merchantMessage }}</div>
            <g-btn-bs text-color="indigo accent-2" @click="dialog.closed = false">OK</g-btn-bs>
          </div>
        </g-dialog>

        <!-- Dialog Hour -->
        <g-dialog v-model="dialog.hour" width="400" eager>
          <div class="bg-white pa-5 r w-100 br-2">
            <g-icon style="position: absolute; top: 16px; right: 16px" @click="dialog.hour = false" size="16">icon-close</g-icon>
            <div class="fw-700 mb-2 fs-large">{{$t('store.openHours')}}:</div>
            <div class="row-flex align-items-center justify-between my-1 fs-small" v-for="day in storeWorkingDay">
              <div>{{day.wdayString}}</div>
              <div class="ta-right">{{day.open}} - {{day.close}}</div>
            </div>
            <template  v-if="deliveryInfo && deliveryInfo.length > 0">
              <div class="fw-700 mb-2 mt-3 fs-large">{{$t('store.delivery')}}:</div>
              <div class="row-flex align-items-center justify-between my-1 fs-small" v-for="info in deliveryInfo">
                <div class="mr-2">{{info.title}}</div>
                <div class="ta-right">{{info.value}}</div>
              </div>
            </template>
          </div>
        </g-dialog>

        <!-- Dialog Note -->
        <g-dialog v-model="dialog.note" width="400">
          <div class="dialog-closed">
            <div class="dialog-closed__title">{{$t('store.note')}}</div>
            <pre class="dialog-closed__message">{{ store.noteToCustomers }}</pre>
            <g-btn-bs text-color="indigo accent-2" @click="dialog.note = false">OK</g-btn-bs>
          </div>
        </g-dialog>

        <dialog-add-to-order
            v-bind="this.selectedProduct"
            v-model="dialog.add"
            @add="addItemToOrder"
            :store-country-locale="storeCountryLocale"/>
      </template>
      <div id="webshop-embed-btn" class="webshop-embed-btn" data-url="http://localhost:8888/franchise/5e955b043efd4747223fba89" data-width="120">
        <img style="pointer-events: none" src="https://pos.gigasource.io/cms-files/files/view/images/embed-icon.svg" alt="Online Ordering">
      </div>
    <script type="application/javascript" src="https://cdn.pos.gigasource.io/cms-files/files/view/js-scripts/webshop-embed.js"></script>
    </div>
</template>
<script>
  import _ from 'lodash';
  import OrderTable from './OrderTable';
  import MenuItem from './MenuItem';
  import {smoothScrolling} from 'pos-vue-framework'
  import {get12HourValue, get24HourValue} from "../../logic/timeUtil";
  import {autoResizeTextarea} from "../../logic/commonUtils";
  import { getCdnUrl } from '../../Store/utils';
  import DialogAddToOrder from "./dialogAddToOrder";

  export default {
    name: 'OrderView',
    components: {DialogAddToOrder, MenuItem, OrderTable},
    data: function () {
      // sunday in dayjs is 0 -> move to 6
      let weekday = new Date().getUTCDay() - 1
      if (weekday === -1)
        weekday = 6

      return {
        selectedCategoryId: null,
        selectedMenuItemId: null,
        showOrder: false,
        store: null,
        categories: null,
        products: null,
        weekday: weekday,
        now: dayjs().format('HH:mm'),
        dialog: {
          closed: false,
          hour: false,
          add: false,
          note: false,
        },
        throttle: null,
        choosing: 0,
        menuHour: false,
        menuItemDisabled: false,
        orderItems: [],
        selectedProduct: null,
        dayInWeeks: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        scrolling: 0
      }
    },
    filters: {
      currency(value, locale) {
        if (value) return $t('common.currency', locale) + value.toFixed(2)

        return 0
      }
    },
    async created() {
      const storeIdOrAlias = this.$route.params.storeIdOrAlias
      if (storeIdOrAlias) {
        const store = await cms.getModel('Store').findOne({alias: storeIdOrAlias})
        this.$set(this, 'store', store)
        root.$i18n.locale = (this.store && this.store.country && this.store.country.locale) || 'en'
        await this.loadCategories()
        await this.loadProducts()
        // focus on the first category
        if (this.categories.length)
          this.selectedCategoryId = this.categories[0]._id
        //change store favicon
        if(store.faviconImageSrc) {
          const favicons = document.querySelectorAll('link[rel=icon]')
          for (const favicon of favicons) {
            const sizes = favicon.sizes && favicon.sizes.value && favicon.sizes.value.split('x')
            if(sizes.length === 2)
              favicon.href = `${getCdnUrl(store.faviconImageSrc)}?w=${sizes[0]}&h=${sizes[1]}`
            else
              favicon.href = getCdnUrl(store.faviconImageSrc)
          }
        }
        if(store.noteToCustomers) this.dialog.note = true
      } else {
        // TODO: show 404 not found
        alert('Store is not exist');
      }

      this.now = dayjs().format('HH:mm')
      this.dayInterval = setInterval(() => {
        this.now = dayjs().format('HH:mm')
      }, 1000)
      this.dialog.closed = !this.isStoreOpening
    },
    mounted() {
      //scroll
      this.throttle = _.throttle(this.handleScroll, 100)
      this.$nextTick(() => {
          // const interval = setInterval(() => {
          //   if(document.documentElement) {
          //     document.documentElement.addEventListener('scroll', this.throttle)
          //     clearInterval(interval)
          //   }
          // }, 500)
        document.addEventListener('scroll', this.throttle)
        smoothScrolling && smoothScrolling()
      })
    },
    beforeDestroy() {
      clearInterval(this.dayInterval)
      this.$refs['tab-content'] && this.$refs['tab-content'].removeEventListener('scroll', this.throttle)
    },
    computed: {
      storeCountryLocale() {
        return (this.store && this.store.country && this.store.country.locale) || 'en'
      },
      shippingFee() {
        return this.$refs['order-table'].shippingFee
      },
      selectedCategory() {
        return _.find(this.categoriesViewModel, c => c._id === this.selectedCategoryId)
      },
      selectedMenuItem() {
        return _.find(this.selectedCategory.items, item => item._id === this.selectedMenuItem)
      },
      totalPrice() {
        return _.sumBy(this.orderItems, item => (item.price + _.sumBy(item.modifiers, m => m.price * m.quantity)) * item.quantity )
      },
      totalItems() {
        return _.sumBy(this.orderItems, item => item.quantity)
      },
      categoriesViewModel() {
        const categories = _.cloneDeep(this.categories)
        const products = _.cloneDeep(this.products)
        _.each(categories, cate => {
          cate.items = _.orderBy(_.filter(products, p => p.category._id === cate._id), 'position', 'asc')
        })
        return categories
      },
      todayOpenHour() {
        return this.getOpenHour(this.weekday)
      },
      nextOpenHour() {
        if (this.todayOpenHour) {
          for (const {openTime} of this.todayOpenHour) {
            if (this.now < openTime)
              return {
                day: $t('store.today'),
                hour: openTime
              }
          }
        }
        let dayIndex = this.weekday
        do {
          dayIndex++
          if (dayIndex > 6)
            dayIndex = 0
          let openHour = this.getOpenHour(dayIndex)
          if (openHour && openHour.length > 0) {
            return {
              hour: openHour[0].openTime,
              day: this.dayInWeeks[dayIndex]
            }
          }
        } while (dayIndex !== this.weekday)
      },
      merchantMessage() {
        if (this.nextOpenHour)
          return `${this.$t('store.merchantClose1', {
            0: this.nextOpenHour.day,
            1: this.nextOpenHour.hour
          })} `

        return  `${this.$t('store.merchantClose2')}`
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
        return this.isStoreOpening ? `• ${this.$t('store.open')}` : `• ${this.$t('store.closed')}`
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
      cdnStoreLogoImage() {
        return this.store.logoImageSrc && getCdnUrl(this.store.logoImageSrc || '/plugins/pos-plugin/assets/images/logo.png')
      }
    },
    methods: {
      increaseOrAddNewItems(item) {
        const product = _.find(this.orderItems, i => i._id === item._id && _.xorWith(i.modifiers,item.modifiers, _.isEqual).length === 0)
        if (!product) {
          this.orderItems.push(item)
          this.$nextTick(() => {
            autoResizeTextarea('#item_note_'+(this.orderItems.length-1))
          })
        } else {
          product.quantity += item.quantity
        }
      },
      decreaseOrRemoveItems(item) {
        const indexOfItem = _.findIndex(this.orderItems, i => i._id === item._id && _.xorWith(i.modifiers,item.modifiers, _.isEqual).length === 0)
        if (indexOfItem < 0)
          return;
        if (this.orderItems[indexOfItem].quantity > 1) {
          const item = Object.assign({}, this.orderItems[indexOfItem], {quantity: this.orderItems[indexOfItem].quantity - 1})
          this.orderItems.splice(indexOfItem, 1, item)
        } else {
          this.orderItems.splice(indexOfItem, 1)
        }
      },
      clearOrder() {
        this.orderItems.splice(0, this.orderItems.length)
      },
      getOpenHour(weekday) {
        const openHours = []

        this.store.openHours.forEach(({dayInWeeks, openTime, closeTime}) => {
          if (dayInWeeks[weekday]) {
            openHours.push({openTime, closeTime})
          }
        })

        return openHours
      },
      async loadStore() {
        this.$set(this, 'store', await cms.getModel('Store').findOne({_id: this.store._id}))
      },
      async loadCategories() {
        const categories = await cms.getModel('Category').find({ store: this.store._id }, { store: 0 })
        this.$set(this, 'categories', _.orderBy(categories, 'position', 'asc'))
      },
      async loadProducts() {
        this.$set(this, 'products', await cms.getModel('Product').find({ store: this.store._id }, { store: 0 }))
      },
      getCategoryStyle(cate) {
        return cate._id === this.selectedCategoryId ? {
          fontWeight: 'bold',
          borderBottom: '2px solid #000',
          color: '#000000',
        } : {borderBottom: '2px solid transparent', color: '#424242'}
      },
      openDialogAdd(item) {
        if(!item.choices || item.choices.length === 0) { //item without choice instancely add
          this.increaseOrAddNewItems(Object.assign({}, item, {quantity: 1, modifiers: []}))
          return
        }
        this.selectedProduct = item
        this.dialog.add = true
      },
      addItemToOrder(item) {
        const product = Object.assign({}, this.selectedProduct, item)
        this.increaseOrAddNewItems(product)
      },
      removeItemFromOrder(item) {
        this.decreaseOrRemoveItems(item)
      },
      getQuantityInOrder(item) {
        const indexOfItem = _.findIndex(this.orderItems, i => i._id === item._id)
        if (indexOfItem > -1)
          return this.orderItems[indexOfItem].quantity
        return 0
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
        const wrapper = document.documentElement
        const content = document.getElementById(`category_content_${id}`)
        if(wrapper && content) {
          wrapper.scroll({top: content.offsetTop - wrapper.offsetTop, left: 0, behavior: "smooth"})
          this.selectedCategoryId = id
          setTimeout(() => {
            this.choosing--
          }, 1000)
        }
      },
      touch() {
        this.scrolling++
      }
    },
    watch: {
      selectedCategoryId(val) {
        const tab = document.getElementById(`tab_${val}`)
        const wrapper = document.getElementById('tab')
        if(tab) {
          const siblingWidth = tab.previousSibling ? tab.previousSibling.offsetWidth : 0
          wrapper.scroll({top: 0, left: (tab.offsetLeft - siblingWidth/2 - wrapper.offsetLeft), behavior: "smooth"})
        }
      },
      showOrder(val) {
        if(val) {
          this.$nextTick(() => {
            autoResizeTextarea('.po-order-table__item__note textarea');
          })
        }
      }
    }
  }
</script>
<style scoped lang="scss">
  .pos-order {
    display: flex;
    width: 100%;
    max-width: 1140px;
    min-height: 100vh;
    background-color: #FFF;
    box-shadow: 0 0 2px 2px #D5D5D5;
    align-self: center;

    &__left {
      flex: 1;
      padding: 24px 60px 0;

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        & > img {
          max-width: 250px;
          max-height: 100px;
        }

        &--info {
          text-align: right;
          font-size: 15px;
          color: #424242;
          font-weight: 300;
          padding-top: 8px;

          .phone-image {
            width: 24px;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background-color: #000;
            border-radius: 100%;
            margin-right: 10px;

            & > img {
              width: 16px;
              height: 16px;
            }

            & + .sub-title {
              font-size: 15px;
            }
          }

          & > div:first-child {
            display: flex;
            flex-flow: row-reverse;

            .phone-image {
              margin-left: 16px;
            }
          }

          .address {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
        }
      }

      .title {
        font-size: 30px;
        font-weight: 700;
        margin-bottom: 24px;
      }

      .sub-title {
        font-size: 20px;
        font-weight: 700;
      }

      .pos-order__info {
        display: none;
      }

      ::v-deep .po-order-table {
        display: none;
      }
    }

    &__tab {
      display: flex;
      background-color: #F8F8F8;
      align-items: stretch;
      border-top-right-radius: 24px;
      border-bottom-right-radius: 24px;
      border-right: 16px solid #F8F8F8;
      font-size: 15px;

      &--wrapper {
        position: sticky;
        top: 0;
        z-index: 2;
        background: white;
        max-width: 680px;
        padding-bottom: 16px;
        padding-top: 16px;
      }

      &--icon {
        display: flex;
        align-items: center;
        background-color: #F8F8F8;
        padding: 4px 16px;
        margin-top: 12px;
        margin-bottom: 12px;
        border-right: 1px solid #000;
      }

      &--category {
        height: 64px;
        display: flex;
        overflow: auto;
        scrollbar-width: none; // firefox
        -ms-overflow-style: none; //edge

        &::-webkit-scrollbar {
          display: none;
        }

        div {
          cursor: pointer;
          display : flex;
          align-items: center;
          justify-content: center;
          padding: 0 24px;
          white-space: nowrap;
          -webkit-tap-highlight-color: transparent;
        }
      }

      &--content {
        position: sticky;
        top: 80px;

        &-main {
          .po-menu-item:not(:last-child) {
            border-bottom: 1px solid rgba(204, 204, 204, 0.4);
          }
        }

        .category-header {
          margin-bottom: 16px;

          img {
            max-height: 167px;
            width: 100%;
            border-radius: 20px 20px 0 0;
          }

          & > div {
            background: #E8EAF6;
            border-radius: 0px 0px 20px 20px;
            font-size: 18px;
            font-weight: 700;
            padding: 12px 16px;
          }
        }
      }
    }

    &__right > div {
      position: sticky;
      top: 0;
    }
  }

  @media screen and (max-width: 1139px) {
    .pos-order__left {
      padding: 0;

      &__header {
        & > img {
          max-width: 130px;
          max-height: 65px;
          margin-left: 8px;
          margin-top: 8px;
        }

        &--info {
          font-size: 12px;
          margin-right: 15px;

          & > div:first-child {
            display: block;

            .phone-image {
              margin-left: 0;
              width: 16px;
              height: 16px;

              & > img {
                width: 10px;
                height: 10px;
              }
            }

            .sub-title {
              font-size: 12px;
            }
          }

          .address {
            display: block;
          }
        }
      }

      .title {
        font-size: 20px;
        margin: 4px 8px 8px;
      }

      .pos-order__tab {
        border-radius: 0;

        &--wrapper {
          max-width: 100vw;
          padding-bottom: 8px;
          padding-top: 8px;
        }

        &--icon {
          padding: 6px;
          margin-top: 6px;
          margin-bottom: 6px;

          img {
            width: 24px;
            height: 24px;
            max-width: 24px;
          }
        }

        &--category {
          height: 48px
        }

        &--content {
          padding-left: 16px;
          padding-right: 16px;
          margin-top: 4px;
          top: 64px;

          .sub-title {
            font-size: 18px;
          }

          .category-header {
            margin-bottom: 8px;

            img {
              max-height: 75px;
              width: 100%;
              border-radius: 10px 10px 0 0;
            }

            & > div {
              background: #E8EAF6;
              border-radius: 0px 0px 10px 10px;
              font-size: 18px;
              font-weight: 700;
              padding: 6px 16px;
            }
          }
        }
      }

      .pos-order__info {
        display: flex;
        position: fixed;
        z-index: 5;
        bottom: 0;
        width: 100%;
        border-top-right-radius: 32px;
        background-color: white;
        box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
        padding: 16px 24px;

        &--total {
          font-size: 18px;
          font-weight: 700;
          align-self: center;
          margin-left: 16px;
        }

        & ~ .pos-order__tab--content .pos-order__tab--content-footer {
          height: 80px;
        }
      }

      ::v-deep .po-order-table {
        display: block;
        width: 100%;
        z-index: 10;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        height: 100%;
      }
    }

    .pos-order__right {
      ::v-deep .po-order-table {
        display: none
      }
    }
  }

  @media screen and (max-width: 350px) {
    .pos-order__left .pos-order__left__header {
      img {
        max-height: 50px;
        max-width: 90px;
        margin-top: 4px;
        margin-left: 4px;
      }

      .pos-order__left__header--info {
        font-size: 12px;
        margin-right: 4px;
      }
    }
  }

  .dialog-closed {
    width: 464px;
    background: #FFFFFF;
    box-shadow: 0 0 28px rgba(58, 56, 56, 0.15);
    border-radius: 4px;
    padding: 30px 16px 8px;
    margin: 0 auto;
    text-align: center;

    &__title {
      font-style: normal;
      font-weight: bold;
      font-size: 18px;
      margin-bottom: 16px;
    }

    &__message {
      font-size: 15px;
      color: #424242;
      padding-bottom: 36px;
      border-bottom: 1px solid #EFEFEF;
      white-space: pre-wrap;
    }
  }

  .menu-hour {
    padding: 16px;
    background: white;
    border-radius: 2px;
    min-width: 280px;
  }

  .icon-payment {
    position: absolute;
    width: 33px;
    height: 33px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    right: 4px;
    top: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media screen and (max-width: 1139px) {
    .menu-hour {
      display: none;
    }
  }
</style>
