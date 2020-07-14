<template>
  <div class="digital-menu">
    <div class="digital-menu__logo">
      <img alt :src="cdnStoreLogoImage"/>
    </div>
    <div class="digital-menu__info" v-if="orderItems.length > 0">
      <g-badge :value="true" color="#4CAF50" overlay>
        <template v-slot:badge>
            {{totalItems}}
        </template>
        <div style="width: 40px; height: 40px; background-color: #ff5252; border-radius: 8px; display: flex; align-items: center; justify-content: center">
            <g-icon>icon-menu2</g-icon>
        </div>
      </g-badge>
      <div class="digital-menu__info--total">{{ totalPrice | currency(storeCountryLocale) }}</div>
      <g-spacer/>
      <g-btn-bs v-if="!viewOrder" background-color="#2979FF" rounded style="padding: 8px 24px; position: relative" @click="viewOrder = true" width="150">
        <span class="mr-3">View</span>
        <div class="icon-view">
          <g-icon size="16" color="white" class="ml-1">fas fa-chevron-right</g-icon>
        </div>
      </g-btn-bs>
    </div>
    <div class="digital-menu__tab">
      <div id="tab" class="digital-menu__tab--category">
        <div v-for="(category, i) in categories" :key="`category_${i}`" :id="`tab_${category._id}`" @click="chooseCategory(category._id)"
             class="digital-menu__category" :style="{backgroundColor: category._id === selectedCategoryId ? '#BBDEFB' : '#ECF0F5'}">
          {{category.name}}
        </div>
      </div>
      <div class="digital-menu__tab--content" @touchstart="touch">
        <div v-for="(category, i) in listItem" :id="`category_content_${category._id}`" :key="`category_${i}`" :class="[i > 0 && 'mt-4']">
          <div class="digital-menu__title">
            {{ category && category.name }}
          </div>
          <digital-menu-item
              v-for="(item, index) in category.items" :key="index"
              v-bind="item"
              class="mt-3"
              @add="openDialogAdd(item)"
              :display-id="store.displayId"
              :scrolling="scrolling"
              :display-image="store.displayImage"
              :store-country-locale="storeCountryLocale"/>
        </div>
      </div>
    </div>
    <template v-if="viewOrder">
      <div class="digital-menu__order">
        <div class="digital-menu__order-header">
          <g-icon color="black" @click="viewOrder = false">arrow_back</g-icon>
          <div class="w-100 ta-center pr-3">{{$t('store.orderList')}}</div>
        </div>
        <div class="digital-menu__order-content">
          <div v-for="(item, index) in orderItems" :key="index" class="digital-menu__item">
            <p>
              <g-icon @click.stop="decreaseOrRemoveItems(item)" color="#424242" size="24">remove_circle_outline</g-icon>
              <span class="digital-menu__item__name ta-center" style="display: inline-block; min-width: 20px">{{item.quantity}}</span>
              <g-icon @click.stop="increaseOrAddNewItems(item)" color="#424242" size="24">add_circle</g-icon>
              <span class="digital-menu__item__name ml-2">{{ item.name }}</span>
              <span v-if="item.modifiers && item.modifiers.length > 0" class="digital-menu__item__modifier ml-1">- {{getItemModifiers(item)}}</span>
            </p>
            <div class="digital-menu__item__note">
              <div class="digital-menu__item__price">{{ getItemPrice(item) | currency(storeCountryLocale) }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <dialog-add-to-order
        v-bind="this.selectedProduct"
        v-model="dialog.add"
        @add="addItemToOrder"
        no-note
        :store-country-locale="storeCountryLocale"/>
  </div>
</template>

<script>
  import { getCdnUrl } from '../../Store/utils';
  import { smoothScrolling } from 'pos-vue-framework';

  export default {
    name: "DigitalMenu",
    filters: {
      currency(val, locale) {
        if(val)
          return $t('common.currency', locale) + val.toFixed(2)
        return $t('common.currency', locale) + 0
      }
    },
    data() {
      return {
        store: {},
        categories: [],
        selectedCategoryId: null,
        products: [],
        throttle: null,
        choosing: 0,
        scrolling: 0,
        viewOrder: false,
        orderItems: [],
        selectedProduct: null,
        dialog: {
          add: false
        }
      }
    },
    async created() {
      const storeIdOrAlias = this.$route.params.storeIdOrAlias
      if (storeIdOrAlias) {
        this.store = await cms.getModel('Store').findOne({alias: storeIdOrAlias})
        await this.loadCategories()
        await this.loadProducts()
      }
    },
    mounted() {
      //scroll
      this.throttle = _.throttle(this.handleScroll, 100)
      this.$nextTick(() => {
        document.addEventListener('scroll', this.throttle)
        smoothScrolling && smoothScrolling()
      })
    },
    computed: {
      listItem() {
        const categories = _.cloneDeep(this.categories)
        const products = _.cloneDeep(this.products)
        _.each(categories, cate => {
          cate.items = _.orderBy(_.filter(products, p => p.category._id === cate._id), 'position', 'asc')
        })
        return categories
      },
      cdnStoreLogoImage() {
        return this.store.logoImageSrc && getCdnUrl(this.store.logoImageSrc || '/plugins/pos-plugin/assets/images/logo.png')
      },
      storeCountryLocale() {
        return (this.store && this.store.country && this.store.country.locale) || 'en'
      },
      totalPrice() {
        return _.sumBy(this.orderItems, item => (item.price + _.sumBy(item.modifiers, m => m.price * m.quantity)) * item.quantity )
      },
      totalItems() {
        return _.sumBy(this.orderItems, item => item.quantity)
      },
    },
    methods: {
      async loadCategories() {
        const categories = await cms.getModel('Category').find({ store: this.store._id }, { store: 0 })
        this.$set(this, 'categories', _.orderBy(categories, 'position', 'asc'))
      },
      async loadProducts() {
        this.$set(this, 'products', await cms.getModel('Product').find({ store: this.store._id }, { store: 0 }))
      },
      chooseCategory(id) {
        this.choosing++
        const wrapper = window
        const content = document.getElementById(`category_content_${id}`)
        if(wrapper && content) {
          wrapper.scroll({top: content.offsetTop - 108, left: 0, behavior: "smooth"})
          this.selectedCategoryId = id
          setTimeout(() => {
            this.choosing--
          }, 1000)
        }
      },
      handleScroll() {
        if(this.choosing > 0) return
        const categoryInViewPort = _.filter(this.categories, ({_id: id}) => {
          const el = document.getElementById(`category_content_${id}`);
          const {top, bottom} = el.getBoundingClientRect()
          return top >= 108 || bottom >= (window.innerHeight - 100);
        })
        this.selectedCategoryId = categoryInViewPort[0]._id
        const wrapper = document.documentElement
        if(!this.selectedCategoryId || (window.innerHeight + wrapper.scrollTop >= wrapper.scrollHeight)) {
          this.selectedCategoryId = _.last(this.categories)._id
        }

        document.querySelectorAll('.g-menu--content').forEach(menu => { menu.style.display = 'none' })
      },
      touch() {
        this.scrolling++
      },
      increaseOrAddNewItems(item) {
        const product = _.find(this.orderItems, i => i._id === item._id && _.xorWith(i.modifiers,item.modifiers, _.isEqual).length === 0)
        if (!product) {
          this.orderItems.push(item)
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
      getItemModifiers(item) {
        return item.modifiers.map(m => m.name).join(', ')
      },
      getItemPrice(item) {
        return item.price + _.sumBy(item.modifiers, modifier => modifier.price * modifier.quantity)
      },
    },
    watch: {
      selectedCategoryId(val) {
        const tab = document.getElementById(`tab_${val}`)
        const wrapper = document.getElementById('tab')
        if(tab) {
          const siblingWidth = tab.previousSibling ? tab.previousSibling.offsetWidth : 32
          wrapper.scroll({top: 0, left: (tab.offsetLeft - siblingWidth/2 - wrapper.offsetLeft), behavior: "smooth"})
        }
      },
      viewOrder(val) {
        const html = document.documentElement
        if(val) {
          html.style.overflow = 'hidden'
        } else {
          html.style.overflow = ''
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .digital-menu {
    width: 100%;

    &__logo {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px 0;

      & > img {
        max-width: 50%;
      }
    }

    &__tab {
      max-width: 100vw;
      background: #F2F2F2;

      &--category {
        overflow: auto;
        position: sticky;
        top: 0;
        background-color: white;
        padding: 8px 0 8px 14px;
        display: flex;
        z-index: 10;
        width: 100%;
        scrollbar-width: none; // firefox
        -ms-overflow-style: none; //edge

        &::-webkit-scrollbar {
          display: none;
        }
      }

      &--content {
        padding-bottom: 16px;
        padding-top: 8px;
      }
    }

    &__title {
      font-size: 14px;
      font-weight: 600;
      color: #424242;
      text-transform: uppercase;
      margin-left: 16px;
      margin-bottom: -8px;

    }

    &__category {
      border-radius: 16px;
      white-space: nowrap;
      margin: 2px;
      padding: 5px 8px;
      font-size: 14px;
      line-height: 22px;
    }

    &__info {
      display: flex;
      position: fixed;
      z-index: 20;
      bottom: 0;
      width: 100%;
      border-top-right-radius: 32px;
      background-color: white;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.25);
      padding: 16px 24px;

      &--total {
        font-size: 18px;
        font-weight: 700;
        align-self: center;
        margin-left: 16px;
      }

      & ~ .digital-menu__tab .digital-menu__tab--content {
        padding-bottom: 80px;
      }

      .icon-view {
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
    }

    &__order {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 15;
      background-color: #F2F2F2;

      &-header {
        display: flex;
        padding: 16px;
        font-size: 16px;
        font-weight: 700;
        background-color: white;
        box-shadow: 1px 0px 3px rgba(0, 0, 0, 0.2);
      }

      &-content {
        margin-top: 16px;
        margin-bottom: 0;
        background-color: white;
        padding: 0 16px 74px;
        height: calc(100% - 68px);
        overflow: auto;
        scrollbar-width: none; // firefox
        -ms-overflow-style: none; //edge

        &::-webkit-scrollbar {
          display: none;
        }
      }
    }

    &__item {
      align-items: center;
      width: 100%;
      min-height: 64px;
      border-bottom: 1px dashed #d8d8d8;
      padding: 10px 0;

      &__name {
        font-weight: bold;
        font-size: 15px;
        word-break: break-word;
      }

      &__modifier {
        font-size: 12px;
        font-weight: 600;
        color: #424242;
        text-transform: capitalize;
      }

      &__price {
        font-weight: bold;
        font-size: 15px;
        line-height: 19px;
        margin-right: 8px;
      }

      &__action {
        flex: 0 0 20%;
        display: flex;
        justify-content: space-between;
        align-items: center;

        & > span {
          min-width: 20px;
          text-align: center;
        }
      }
    }
  }
</style>
