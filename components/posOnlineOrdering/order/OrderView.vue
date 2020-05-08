<template>
  <div class="pos-order">
      <template  v-if="store">
        <div class="pos-order__left">
          <div class="pos-order__left__header">
            <img :src="store.logoImageSrc || '/plugins/pos-plugin/assets/images/logo.png'"/>
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
                      <div class="fw-700 mb-2">Open hours:</div>
                      <div class="row-flex align-items-center justify-between my-1 fs-small" v-for="day in storeWorkingDay">
                        <div>{{day.wdayString}}</div>
                        <div class="ta-right">{{day.open}} - {{day.close}}</div>
                      </div>
                    </div>
                  </g-menu>
                  <template v-if="storeWorkingTime">
                    <span style="margin-right: 3px;">|</span>
                    <g-icon size="16">access_time</g-icon>
                    <span style="color: #424242; margin-left: 3px">{{ storeWorkingTime }}</span>
                  </template>
                  <span v-else>today</span>
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
            <div class="pos-order__info--total">{{ totalPrice | currency }}</div>
            <g-spacer/>
            <g-btn-bs background-color="#2979FF" rounded style="padding: 8px 24px; position: relative; justify-content: flex-start" @click="showOrder = true" width="150">
              {{$t('store.payment')}}
              <div class="icon-payment">
                <g-icon size="16" color="white" class="ml-1">fas fa-chevron-right</g-icon>
              </div>
            </g-btn-bs>
          </div>
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
          <div class="pos-order__tab--content" id="tab-content" ref="tab-content">
            <div v-for="(category, i) in categoriesViewModel" :id="`category_content_${category._id}`" :key="`category_${i}`" :class="[i > 0 && 'mt-5']">
              <div class="sub-title mb-2">{{ category && category.name }}</div>
              <div class="pos-order__tab--content-main">
                <menu-item
                    v-for="(item, index) in category.items" :key="index"
                    v-bind="item"
                    :is-opening="isStoreOpening"
                    :currency-unit="store.currency"
                    :quantity="getQuantityInOrder(item)"
                    :disabled="menuItemDisabled"
                    :collapse-text="store.collapseText"
                    @menu-item-selected="addItemToOrder(item)"
                    @increase="addItemToOrder(item)"
                    @decrease="removeItemFromOrder(item)"/>
              </div>
            </div>
            <div class="pos-order__tab--content-footer"></div>
          </div>
          <order-table v-if="showOrder" :store="store" :order-items="orderItems" :total-price="totalPrice" :total-items="totalItems" :is-opening="isStoreOpening"
                       @back="showOrder = false" @increase="increaseOrAddNewItems" @decrease="decreaseOrRemoveItems" @clear="clearOrder"/>
        </div>
        <div class="pos-order__right">
          <order-table :store="store" :order-items="orderItems" :total-price="totalPrice" :total-items="totalItems"  :is-opening="isStoreOpening" :merchant-message="merchantMessage"
                       @confirm-view="menuItemDisabled = $event" @increase="increaseOrAddNewItems" @decrease="decreaseOrRemoveItems" @clear="clearOrder"/>
        </div>
      
        <!-- Merchant dialog -->
        <g-dialog v-model="dialog.closed" persistent>
          <div class="dialog-closed">
            <div class="dialog-closed__title">Merchant is temporarily closed</div>
            <div class="dialog-closed__message">{{ merchantMessage }}</div>
            <g-btn-bs text-color="indigo accent-2" @click="dialog.closed = false">OK</g-btn-bs>
          </div>
        </g-dialog>

        <!-- Dialog Hour -->
        <g-dialog v-model="dialog.hour" width="400" eager>
          <div class="bg-white pa-5 r w-100 br-2">
            <g-icon style="position: absolute; top: 16px; right: 16px" @click="dialog.hour = false" size="16">icon-close</g-icon>
            <div class="fw-700 mb-2 fs-large-3">Open Hours</div>
            <div class="row-flex align-items-center justify-between my-1 fs-small" v-for="day in storeWorkingDay">
              <div>{{day.wdayString}}</div>
              <div class="ta-right">{{day.open}} - {{day.close}}</div>
            </div>
          </div>
        </g-dialog>
      </template>
    </div>
</template>
<script>
  import _ from 'lodash';
  import OrderTable from './OrderTable';
  import MenuItem from './MenuItem';
  import {smoothScrolling, disableBodyScroll, enableBodyScroll} from 'pos-vue-framework'
  import CreatedOrder from './CreatedOrder';

  export default {
    name: 'OrderView',
    components: { CreatedOrder, MenuItem, OrderTable},
    data: function () {
      return {
        selectedCategoryId: null,
        selectedMenuItemId: null,
        showOrder: false,
        store: null,
        categories: null,
        products: null,
        dayInWeeks: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        today: dayjs().format("dddd"),
        now: dayjs().format('HH:mm'),
        dialog: {
          closed: false,
          hour: false
        },
        throttle: null,
        choosing: 0,
        menuHour: false,
        menuItemDisabled: false,
        orderItems: [],
      }
    },
    filters: {
      currency(value) {
        if (value)
          return $t('common.currency') + value.toFixed(2)
        return 0
      }
    },
    async created() {
      const storeIdOrAlias = this.$route.params.storeIdOrAlias
      if (storeIdOrAlias) {
        const store = await cms.getModel('Store').findOne({alias: storeIdOrAlias})
        this.$set(this, 'store', store)
        await this.loadCategories()
        await this.loadProducts()
        // focus on the first category
        if (this.categories.length)
          this.selectedCategoryId = this.categories[0]._id
      } else {
        // TODO
        alert('Store is not exist');
      }
      this.dayInterval = setInterval(() => {
        this.today = dayjs().format('dddd')
        this.now = dayjs().format('HH:mm')
      }, 1000)
      this.dialog.closed = !this.isStoreOpening
    },
    mounted() {
      //scroll
      this.throttle = _.throttle(this.handleScroll, 100)
      this.$nextTick(() => {
        if(this.$refs) {
          if(!this.$refs.keys) {
            setTimeout(() => {
              const contentRef = this.$refs['tab-content']
              contentRef && contentRef.addEventListener('scroll', this.throttle)
              // contentRef && disableBodyScroll(contentRef)
            }, 500)
          } else {
            const contentRef = this.$refs['tab-content']
            contentRef && contentRef.addEventListener('scroll', this.throttle)
          }
        }
        smoothScrolling && smoothScrolling()
      })
    },
    beforeDestroy() {
      clearInterval(this.dayInterval)
      this.$refs['tab-content'] && this.$refs['tab-content'].removeEventListener('scroll', this.throttle)
      // enableBodyScroll(this.$refs['tab-content'])
    },
    computed: {
      shippingFee() {
        return this.$refs['order-table'].shippingFee
      },
      selectedCategory() {
        return _.find(this.categoriesViewModel, c => c._id === this.selectedCategoryId)
      },
      selectedMenuItem() {
        return _.find(this.selectedCategory.items, item => item._id === this.selectedMenuItem)
      },
      categoryItems() {
        if (this.selectedCategory) {
          return this.selectedCategory.items
        }
      },
      totalPrice() {
        return _.sumBy(this.orderItems, item => item.price * item.quantity)
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
      dayInWeekIndex() {
        return this.dayInWeeks.indexOf(this.today)
      },
      todayOpenHour() {
        return this.getOpenHour(this.dayInWeekIndex)
      },
      nextOpenHour() {
        if (this.todayOpenHour) {
          if (this.get24HourValue(this.todayOpenHour.openTime) > this.now)
            return {
              day: this.dayInWeeks[this.dayInWeekIndex],
              hour: this.todayOpenHour.openTime
          }
        }
        
        let dayInWeekIndex = this.dayInWeekIndex
        do {
          dayInWeekIndex++
          if (dayInWeekIndex >= this.dayInWeeks.length - 1)
            dayInWeekIndex = 0
          let openHour = this.getOpenHour(dayInWeekIndex)
          if (openHour) {
            return {
              hour: openHour.openTime,
              day: dayInWeekIndex === this.dayInWeekIndex + 1 ? 'tomorrow' : this.dayInWeeks[dayInWeekIndex]
            }
          }
        } while (dayInWeekIndex !== this.dayInWeekIndex)
      },
      merchantMessage() {
        if (this.nextOpenHour)
          return `The merchant is temporarily closed and will not accept orders until ${this.nextOpenHour.hour } ${ this.nextOpenHour.day }. Please come back after that. We apologize for any inconvenience caused.`
        return  'The merchant is temporarily closed. We apologize for any inconvenience caused.'
      },
      isStoreOpening() {
        if (this.todayOpenHour) {
          return this.get24HourValue(this.todayOpenHour.openTime) <= this.now && this.now <= this.get24HourValue(this.todayOpenHour.closeTime)
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
        return this.todayOpenHour ? `${this.todayOpenHour.openTime} - ${this.todayOpenHour.closeTime}` : null
      },
      storeWorkingDay() {
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
                Object.assign(day, {end: this.dayInWeeks[i].slice(0, 3)})
              } else {
                Object.assign(day, {start: this.dayInWeeks[i].slice(0, 3)})
              }
            }
          }
          const wdayString = days.filter(d => !_.isEmpty(d)).map(d => d.start + (d.end ? ` - ${d.end}` : '')).join(', ')
          return { wdayString, open: oh.openTime, close: oh.closeTime }
        })
      }
    },
    methods: {
      increaseOrAddNewItems(item) {
        const indexOfItem = _.findIndex(this.orderItems, i => i._id === item._id)
        if (indexOfItem < 0) {
          this.orderItems.push({ ..._.cloneDeep(item), quantity: 1 })
        } else {
          const item = Object.assign({}, this.orderItems[indexOfItem], {quantity: this.orderItems[indexOfItem].quantity + 1})
          this.orderItems.splice(indexOfItem, 1, item)
        }
      },
      decreaseOrRemoveItems(item) {
        const indexOfItem = _.findIndex(this.orderItems, i => i._id === item._id)
        if (indexOfItem < 0)
          return;
        if (this.orderItems[indexOfItem].quantity > 1) {
          const item = Object.assign({}, this.orderItems[indexOfItem], {quantity: this.orderItems[indexOfItem].quantity - 1})
          this.orderItems.splice(indexOfItem, 1, item)
        } else
          this.orderItems.splice(indexOfItem, 1)

      },
      clearOrder() {
        this.orderItems.splice(0, this.orderItems.length)
      },
      getOpenHour(dayInWeekIndex) {
        for (let openHour of this.store.openHours) {
          if (openHour.dayInWeeks[dayInWeekIndex])
            return _.pick(openHour, 'openTime', 'closeTime')
        }
      },
      get24HourValue(time) {
        time = _.toLower(time)
        return _.includes(time, 'm') ? dayjs(time, 'hh:mma').format('HH:mm') : time
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
      addItemToOrder(item) {
        this.increaseOrAddNewItems(item)
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
      elementInWrapper(el) {
        const {top, bottom} = el.getBoundingClientRect()

        const wrapper = document.getElementById('tab-content').getBoundingClientRect()

        return top >= wrapper.top || bottom >= wrapper.bottom - 100;
      },
      handleScroll() {
        if(this.choosing > 0) return
        const categoryInViewPort = this.categories.map(c => c._id).map(id => {
          const el = document.getElementById(`category_content_${id}`);
          if(this.elementInWrapper(el)) {
            return id
          }
        })
        this.selectedCategoryId = categoryInViewPort.filter(c => !!c)[0]
        const wrapper = document.getElementById('tab-content')
        if(!this.selectedCategoryId || (wrapper.offsetHeight + wrapper.scrollTop >= wrapper.scrollHeight)) {
          this.selectedCategoryId = _.last(this.categories)._id
        }
      },
      chooseCategory(id) {
        this.choosing++
        const wrapper = document.getElementById('tab-content')
        const content = document.getElementById(`category_content_${id}`)
        if(wrapper && content) {
          wrapper.scroll({top: content.offsetTop - wrapper.offsetTop, left: 0, behavior: "smooth"})
          this.selectedCategoryId = id
          setTimeout(() => {
            this.choosing--
          }, 1000)
        }
      },
    },
    watch: {
      selectedCategoryId(val) {
        const tab = document.getElementById(`tab_${val}`)
        const wrapper = document.getElementById('tab')
        if(tab) {
          const siblingWidth = tab.previousSibling ? tab.previousSibling.offsetWidth : 0
          wrapper.scroll({top: 0, left: (tab.offsetLeft - siblingWidth/2 - wrapper.offsetLeft), behavior: "smooth"})
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
    height: 100%;
    max-height: 100%;
    background-color: #FFF;
    box-shadow: 0 0 2px 2px #D5D5D5;
    overflow: hidden;
    align-self: center;

    &__left {
      flex: 1;
      padding: 24px 60px 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;

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
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
      flex: 0 0 64px;
      margin-top: 16px;
      align-items: stretch;
      border-top-right-radius: 24px;
      border-bottom-right-radius: 24px;
      overflow: hidden;
      position: relative;
      border-right: 16px solid #F8F8F8;
      font-size: 15px;
      /*scroll-behavior: smooth;*/

      &--icon {
        display: flex;
        align-items: center;
        background-color: #F8F8F8;
        margin-top: 8px;
        margin-bottom: 8px;
        padding: 8px 16px;
        border-right: 1px solid #000;
      }

      &--category {
        height: 100%;
        display: flex;
        overflow: auto;
        scrollbar-width: none; // firefox

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
        flex: 1;
        margin-top: 30px;
        overflow: auto;
        /*scroll-behavior: smooth;*/
        scrollbar-width: none; // firefox

        &::-webkit-scrollbar {
          display: none;
        }

        &-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden auto;
          margin-bottom: 5px;


          & .po-menu-item:not(:last-child) {
            border-bottom: 1px solid rgba(204, 204, 204, 0.4);
          }
        }
      }
    }
  }

  @media screen and (max-width: 1139px) {
    .pos-order__left {
      padding: 0;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;

      .pos-order__left__header {
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
        overflow: hidden;
        position: relative;
        flex-basis: 48px;
        margin-top: 8px;

        &--icon {
          img {
            width: 24px;
            height: 24px;
            max-width: 24px;
          }
        }

        &--content {
          padding-left: 16px;
          padding-right: 16px;
          margin-top: 4px;

          .sub-title {
            font-size: 18px;
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
        max-width: 100px;
      }

      .pos-order__left__header--info {
        font-size: 12px;
        margin-right: 8px;
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
