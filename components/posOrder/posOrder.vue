<template>
  <div class="order-detail" :style="getStyle()">
    <div class="order-detail__header">
      <g-spacer style="flex: 4 0 0" v-if="isMobile && showSplitBtn && actionMode === 'pay'"/>
      <g-btn-bs v-show="isMobile && showSplitBtn && actionMode === 'pay'" background-color="#FFF59D" border-color="#f0f0f0" width="75"
                  style="transition-delay: 0.6s; padding: 4px" @click="splitOrder">
        <g-icon>icon-split_check_2</g-icon>
      </g-btn-bs>
      <transition name="fade">
        <div class="row-flex align-items-center flex-grow-1" v-if="!(isMobile && showSplitBtn && actionMode === 'pay')">
          <g-menu v-if="isMobile" v-model="menu" close-on-content-click>
            <template v-slot:activator="{ on }">
              <div v-on="on" class="waves-effect br-100">
                <g-avatar size="36">
                  <img alt :src="avatar">
                </g-avatar>
              </div>
            </template>
            <g-expand-x-transition>
              <div class="order-detail__menu">
                <g-btn-bs icon="icon-split_check_2" @click="splitOrder">Split check</g-btn-bs>
                <g-btn-bs icon="icon-move-items" @click="moveItems">Move Items</g-btn-bs>
                <g-btn-bs icon="icon-dinner_2">Div. item</g-btn-bs>
                <g-btn-bs icon="icon-food_container" @click="quickCash(true)">Take away</g-btn-bs>
                <g-btn-bs v-if="actionList" :disabled="disablePrintBtn" icon="icon-print"
                          @click.stop="printOrder">
                  Print
                </g-btn-bs>
                <g-btn-bs icon="icon-wallet" @click="pay">Pay</g-btn-bs>
                <g-btn-bs icon="icon-cog" @click="edit = true">Edit Screen</g-btn-bs>
              </div>
            </g-expand-x-transition>
          </g-menu>
          <g-avatar v-else size="36">
            <img alt :src="avatar">
          </g-avatar>
          <div :style="{'display': isMobile ? 'block' : 'flex', 'flex': 2}" class="ml-1 align-items-baseline">
            <p class="order-detail__header-username">{{username}}</p>
            <p v-if="table" style="line-height: 19px">
              <span class="order-detail__header-title">Table</span>
              <span class="order-detail__header-value">{{table}}</span>
            </p>
          </div>
          <g-spacer v-if="isMobile"/>
          <g-btn-bs v-if="isMobile" class="elevation-1 btn-back" @click="back">
            <g-icon>icon-back</g-icon>
          </g-btn-bs>
        </div>
      </transition>
      <g-spacer/>
      <template v-if="showQuickBtn">
        <template v-if="smallSidebar">
          <g-btn-bs
              v-if="showPrint"
              :disabled="unprintedItemCount === 0"
              width="75"
              style="font-size: 14px; padding: 0; border: none"
              background-color="#1271FF"
              text-color="#FFF"
              @click.stop="printOrderToggle">
            <transition name="front">
              <div v-if="actionMode === 'none'" class="animation-wrapper">
                <span>{{ $t('common.currency', storeLocale) }} {{ total | convertMoney }}</span>
              </div>
            </transition>
            <transition name="back">
              <div v-if="actionMode === 'print'" class="animation-wrapper bg-light-green-accent-2">
                <g-icon>icon-print</g-icon>
              </div>
            </transition>
          </g-btn-bs>
          <g-btn-bs
              v-else
              :disabled="unprintedItemCount === 0"
              width="75"
              style="font-size: 14px; padding: 0; border: none"
              background-color="#1271FF"
              text-color="#FFF"
              @click.stop="payToggle">
            <transition name="front">
              <div v-if="actionMode === 'none'" class="animation-wrapper">
                <span>{{$t('common.currency', storeLocale)}} {{total | convertMoney}}</span>
              </div>
            </transition>
            <transition name="back">
              <div v-if="actionMode === 'pay'" class="animation-wrapper bg-pink-accent-2">
                <g-icon>icon-wallet</g-icon>
              </div>
            </transition>
          </g-btn-bs>
        </template>
        <template v-else>
          <g-btn-bs width="104" style="font-size: 14px; padding: 4px 0" icon="icon-print" background-color="#1271FF" v-if="showPrint" :disabled="disablePrintBtn" @click.stop="printOrder">
            <span>{{$t('common.currency', storeLocale)}} {{total | convertMoney}}</span>
          </g-btn-bs>
          <g-btn-bs width="104" style="font-size: 14px; padding: 4px 0" icon="icon-wallet" background-color="#1271FF" v-else @click.stop="pay">
            <span>{{$t('common.currency', storeLocale)}} {{total | convertMoney}}</span>
          </g-btn-bs>
        </template>
      </template>
      <template v-else>
        <span class="order-detail__header-value text-red">{{ $t('common.currency', storeLocale) }}{{ total | convertMoney }}</span>
      </template>
    </div>
    <div v-if="!editMode" class="order-detail__content">
      <div v-for="item in items" :key="item._id.toString()"
           v-if="item.quantity || (item.quantityModified && item.printed)"
           class="item"
           :style="[item.separate && {borderBottom: '2px solid red'}]"
           @click.stop="openConfigDialog(item)" v-touch="getTouchHandlers(item)">
        <div class="item-detail">
          <div :style="[item.printed && { opacity: 0.55 }]">
            <p class="item-detail__name">{{item.id}}. {{item.name}}</p>
            <p>
              <span :class="['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']">€{{item.originalPrice | convertMoney}}</span>
              <span class="item-detail__price--new" v-if="isItemDiscounted(item)">{{$t('common.currency', storeLocale)}} {{item.price | convertMoney }}</span>
              <span :class="['item-detail__option', item.takeout ? 'text-green-accent-3' : 'text-red-accent-2']">{{getItemSubtext(item)}}</span>
            </p>
          </div>
          <div class="item-action">
            <g-icon @click.stop="removeItem(item)" :color="item.printed ? '#FF4452' : '#000'">remove_circle_outline</g-icon>
            <span class="ml-1 mr-1">{{item.quantity}}</span>
            <g-icon @click.stop="addItem(item)" :style="[item.printed && { opacity: 0.5 }]">add_circle_outline</g-icon>
          </div>
        </div>
        <div v-if="item.modifiers">
          <g-chip v-for="(modifier, index) in item.modifiers" :key="`${item._id}_${index}`"
                  label small text-color="#616161" close @close="removeModifier(item, index)">
            {{modifier.name}} | {{$t('common.currency', storeLocale)}}{{modifier.price | convertMoney}}
          </g-chip>
        </div>
      </div>
    </div>
    <div class="blur-overlay" v-show="menu"/>
    <div v-if="editMode" class="order-detail__setting">
      <div class="row-flex align-items-center">
        <span class="mr-1">Product font size:</span>
        <g-icon @click="changeSize(-0.5)">remove_circle</g-icon>
        <span>{{fontSize}}</span>
        <g-icon @click="changeSize(0.5)">add_circle</g-icon>
      </div>
      <g-btn-bs small style="margin-left: 0" class="elevation-1" @click="changeCategory">Change category mode</g-btn-bs>
      <div style="text-transform: capitalize">Mode: {{category.type}}</div>
      <g-checkbox :disabled="category.type !== 'horizontal'" :input-value="category.singleRow" label="Single Row Category" @change="v => changeCategoryStyle('singleRow', v)"/>
      <g-checkbox :disabled="!((category.type === 'vertical') || (category.type === 'horizontal' && category.singleRow))" :input-value="category.differentSize"
                  :label="`Different ${category.type === 'vertical' ? 'Height' : 'Width'}`" @change="v => changeCategoryStyle('differentSize', v)"/>
      <div class="row-flex align-items-center">
        <span class="mr-1">Category size</span>
        <g-icon @click="changeCategorySize(-4)">remove_circle</g-icon>
        <span>{{category.size}}</span>
        <g-icon @click="changeCategorySize(4)">add_circle</g-icon>
      </div>
      <div class="row-flex align-items-center">
        <span class="mr-1">Category font size</span>
        <g-icon @click="changeCategoryFontSize(-0.5)">remove_circle</g-icon>
        <span>{{category.fontSize}}</span>
        <g-icon @click="changeCategoryFontSize(0.5)">add_circle</g-icon>
      </div>
      <g-checkbox :input-value="minimumTextRow" label="Minimize only text row" @change="changeTextRow"/>
      <g-checkbox :input-value="hideTextRow" label="Hide text row" @change="hideText"/>
      <g-checkbox :input-value="collapseBlankColumn" label="Narrow empty column" @change="changeBlankCol"/>
      <g-checkbox :input-value="hideBlankColumn" label="Hide empty column" @change="hideCol"/>
      <g-checkbox :input-value="collapseText" label="Shrink product title" @change="changeCollapseText"/>
      <g-checkbox :input-value="showOverlay" label="Show overlay in action" @change="toggleOverlay"/>
      <g-checkbox :input-value="showSplitBtn" label="Show split button in action" @change="toggleSplitBtn"/>
      <g-checkbox :input-value="smallSidebar" label="Small sidebar" @change="toggleSmallSidebar"/>
      <g-checkbox :input-value="scrollabeLayout" label="Scrollable layout" @change="toggleScrollabeLayout"/>
      <g-btn-bs width="100" small style="margin-left: calc(90% - 100px)" background-color="#1271FF" @click="saveSetting">Save</g-btn-bs>
    </div>
    <dialog-config-order-item v-model="dialogConfigOrderItem.value" :original-value="dialogConfigOrderItem.originalPrice"
                              :product="dialogConfigOrderItem.product"
                              @addModifier="addModifier" @changePrice="changePrice"/>
  </div>
</template>

<script>
  import {Touch} from 'pos-vue-framework';

  export default {
    name: "posOrder",
    directives: {
      Touch
    },
    injectService:['PosStore:isMobile'],
    props: {
      total: Number,
      items: Array,
      printedOrder: Object,
      user: Object,
      storeLocale: String,
      actionList: Array,
      fontSize: String,
      category: Object,
      minimumTextRow: Boolean,
      collapseBlankColumn: Boolean,
      collapseText: Boolean,
      hideTextRow: Boolean,
      hideBlankColumn: Boolean,
      actionMode: String,
      showOverlay: Boolean,
      scrollabeLayout: Boolean,
    },
    filters: {
      convertMoney(value) {
        return !isNaN(value) ? value.toFixed(2) : value
      }
    },
    data() {
      return {
        table: '',
        dialogConfigOrderItem: {
          value: false,
          product: null,
          originalPrice: 0,
          price: 0,
        },
        menu: false,
        showQuickBtn: false,
        quickBtnAction: 'pay',
        edit: false,
        actionTimeout: null,
        showSplitBtn: true,
        smallSidebar: true,
      }
    },
    computed: {
      username() {
        return this.user ? this.user.name : ''
      },
      avatar() {
        return this.user ? this.user.avatar : ''
      },
      itemsWithQty() {
        if (this.items) return this.items.filter(i => i.quantity > 0)
        return []
      },
      disablePrintBtn() {
        return this.items.filter(i => i.quantity > 0 && !i.printed).length === 0
      },
      showPrint() {
        // return this.items.filter(i => !i.sent).length > 0
        if (!this.table) return false
        return !this.printedOrder || this.orderHasChanges;
      },
      editMode() {
        if(!this.isMobile) {
          return false
        }
        return this.edit
      },
      unprintedItemCount() {
        if (!this.items || !this.items.length) return 0;

        return this.items.reduce((acc, item) => acc + item.quantity, 0);
      },
      orderHasChanges() {
        const printedOrderItems = (this.printedOrder && this.printedOrder.items) || [];

        // 1. Filter out unprinted items with quantity = 0
        const currentItems = this.items.filter(e => e.quantity || e.printed);

        // 2. Check if items & printedOrderItems have different lengths
        if (currentItems.length !== printedOrderItems.length) return true;

        // 3. Check if quantity of items has changed
        return currentItems.reduce((acc, item) => {
          const printedItem = printedOrderItems.find(e => e._id === item._id);

          if (!printedItem) return true;
          else if (item.quantity !== printedItem.quantity) return true;
          else return acc;
        }, false);
      }
    },
    methods: {
      isItemDiscounted(item) {
        return item.originalPrice !== item.price
      },
      addItem(item) {
        if (item.printed) return

        item.quantityModified = true;
        this.$emit('addItemQuantity', item)
      },
      removeItem(item) {
        item.quantityModified = true;
        this.$emit('removeItemQuantity', item)
      },
      removeModifier(item, index) {
        this.$emit('removeProductModifier', item, index)
      },
      openConfigDialog(item) {
        if (item.printed) return
        this.dialogConfigOrderItem = Object.assign({} , this.dialogConfigOrderItem, {
          product: item,
          value: true,
          originalPrice: item.originalPrice,
          price: 0
        })
      },
      addModifier(modifier) {
        this.$emit('addModifierToProduct', {...modifier, quantity: 1}, this.dialogConfigOrderItem.product)
      },
      changePrice(price) {
        this.$emit('changePrice', price, this.dialogConfigOrderItem.product)
      },
      getTouchHandlers(item) {
        return {
          left: () => {
            // console.log(`RTL ${item.name}`)

            if (!item.course) this.$set(item, 'course', 1)

            if (item.course === 1) {
              if (item.takeout) {
                this.$set(item, 'takeout', false)
                this.$set(item, 'separate', true)
              }
              else this.$set(item, 'takeout', true)
            } else {
              this.$set(item, 'course', item.course - 1)
            }
          },
          right: () => {
            // console.log(`LTR ${item.name}`)

            if (!item.course) this.$set(item, 'course', 1)

            if (item.separate) {
              return this.$set(item, 'separate', false)
            }

            if (item.takeout) this.$set(item, 'takeout', false)
            else this.$set(item, 'course', item.course + 1)
          }
        }
      },
      getItemSubtext({ course, takeout, separate }) {
        if (separate) return
        if (takeout) return 'Take-away'
        if (course && course > 1) return `Course: ${course}`
      },
      back() {
        this.$emit('resetOrderData')
        this.$emit('updateOrderTable', null)
        this.saveSetting()
        this.$router.push({path: '/pos-dashboard'})
      },
      pay() {
        this.$router.push({path: '/pos-payment'})
      },
      payToggle() {
        if (this.actionMode === 'none') {
          this.$emit('update:actionMode', 'pay');
          this.actionTimeout = setTimeout(() => {
            this.$emit('update:actionMode', 'none');
          }, 5000)
          return
        }

        if (this.quickBtnAction === 'receipt') {
          this.showOrderReceipt();
        } else {
          this.pay();
        }

        this.$emit('update:actionMode', 'none');
        if (this.actionTimeout) clearTimeout(this.actionTimeout);
      },
      quickCash(isTakeout = false) {
        this.currentOrder.takeOut = isTakeout
        this.$emit('quickCash')
      },
      splitOrder() {
        this.$getService('PosOrderSplitOrder:setActive')(true)
      },
      moveItems() {
        this.$getService('PosOrderMoveItems:setActive')(true)
      },
      showOrderReceipt() {
        this.$getService('OrderStore:updateCurrentOrder')('payment', [{ type: 'cash', value: this.total }])
        this.$getService('PosOrderReceipt:setActive')(true)
      },
      printOrder() {
        this.menu = false
        this.$emit('saveTableOrder')
        this.$router.go(-1)
      },
      printOrderToggle() {
        if(this.actionMode === 'none') {
          this.$emit('update:actionMode', 'print');
          this.actionTimeout = setTimeout(() => {
            this.$emit('update:actionMode', 'none');
          }, 5000)
          return
        }
        this.printOrder()
        this.$emit('update:actionMode', 'none');
        if(this.actionTimeout) clearTimeout(this.actionTimeout)
      },
      getStyle() {
        const style = {
          height: '100%',
          maxHeight: '100%'
        }
        if(this.isMobile) {
          Object.assign(style, { height: '100vh', maxHeight: '100vh', padding: '0 4px', width: '256px' })

          if(this.smallSidebar) {
            Object.assign(style, { width: '225px' })
          }
        }
        return style
      },
      changeSize(num) {
        const size = +this.fontSize.slice(0, this.fontSize.length - 2)
        if (size + num > 0) {
          this.$emit('update:fontSize', `${size+num}px`)
        }
      },
      changeCategory() {
        if(this.category.type === 'horizontal')
          this.$emit('update:category', Object.assign({}, this.category, { type: 'vertical'}))
        else
          this.$emit('update:category', Object.assign({}, this.category, { type: 'horizontal'}))
      },
      changeCategorySize(change) {
        const size = +this.category.size.slice(0, this.category.size.length - 2)
        if(size + change > 0) {
          this.$emit('update:category', Object.assign({}, this.category, { size: `${size + change}px`}))
        }
      },
      changeCategoryFontSize(change) {
        const size = +this.category.fontSize.slice(0, this.category.fontSize.length - 2)
        if(size + change > 0) {
          this.$emit('update:category', Object.assign({}, this.category, { fontSize: `${size + change}px`}))
        }
      },
      changeTextRow(value) {
        this.$emit('update:minimumTextRow', !!value)
      },
      changeBlankCol(value) {
        this.$emit('update:collapseBlankColumn', !!value)
      },
      hideText(value) {
        this.$emit('update:hideTextRow', !!value)
      },
      hideCol(value) {
        this.$emit('update:hideBlankColumn', !!value)
      },
      changeCollapseText(value) {
        this.$emit('update:collapseText', !!value)
      },
      toggleOverlay(value) {
        this.$emit('update:showOverlay', !!value)
      },
      toggleSplitBtn(value) {
        this.$set(this, 'showSplitBtn', !!value)
      },
      toggleSmallSidebar(value) {
        this.$set(this, 'smallSidebar', !!value)
      },
      toggleScrollabeLayout(value) {
        this.$emit('update:scrollabeLayout', !!value)
      },
      changeCategoryStyle(key, value) {
        let change = {}
        change[key] = value
        this.$emit('update:category', Object.assign({}, this.category, change))
      },
      saveSetting() {
        const setting = {
          fontSize: this.fontSize,
          category: this.category,
          minimumTextRow: this.minimumTextRow,
          collapseBlankColumn: this.collapseBlankColumn,
          collapseText: this.collapseText,
          showOverlay: this.showOverlay,
          showSplitBtn: this.showSplitBtn,
          smallSidebar: this.smallSidebar,
          scrollabeLayout: this.scrollabeLayout
        }
        localStorage.setItem('OrderScreenSetting', JSON.stringify(setting))
        this.edit = false
      },
      loadSetting() {
        const setting = localStorage.getItem('OrderScreenSetting')
        if(setting) {
          const {fontSize, category, minimumTextRow, collapseBlankColumn, collapseText, showOverlay, showSplitBtn, smallSidebar, scrollabeLayout} = JSON.parse(setting)
          if(!category.fontSize) category.fontSize = '13px'
          this.$emit('update:fontSize', fontSize)
          this.$emit('update:category', category)
          this.$emit('update:minimumTextRow', minimumTextRow)
          this.$emit('update:collapseBlankColumn', collapseBlankColumn)
          this.$emit('update:collapseText', collapseText)
          this.$emit('update:showOverlay', showOverlay)
          this.$emit('update:scrollabeLayout', scrollabeLayout)
          this.$set(this, 'showSplitBtn', showSplitBtn)
          this.$set(this, 'smallSidebar', smallSidebar)
        }
      }
    },
    created() {
      this.loadSetting()
    },
    mounted() {
      const orderStore = this.$getService('OrderStore')

      orderStore.$watch('currentOrder.items', (items, oldItems) => {
        if (this.$el) {
          if (!items) return
          const tableEl = this.$el.querySelector('.order-detail__content')
          if (items.filter(i => i.quantity).length > oldItems.filter(i => i.quantity).length) {
            tableEl.scrollTop = tableEl.scrollHeight
          }
        }
      }, { deep: true })
    },
    async activated() {
      if (this.$router.currentRoute.params && this.$router.currentRoute.params.name) {
        this.table = this.$route.params.name
        this.$emit('updateOrderTable', this.table)

        const { tseMethod, numberOfCustomers } = this.$route.query
        if (tseMethod !== undefined)
          this.$getService('OrderStore:updateCurrentOrder')('tseMethod', tseMethod)
        if (numberOfCustomers !== undefined)
          this.$getService('OrderStore:updateCurrentOrder')('numberOfCustomers', numberOfCustomers ? +numberOfCustomers : null)
      } else this.table = ''

      const posSettings = await cms.getModel('PosSetting').findOne()

      if (posSettings) {
        this.showQuickBtn = posSettings.generalSetting && posSettings.generalSetting.quickBtn;
        this.quickBtnAction = (posSettings.generalSetting && posSettings.generalSetting.quickBtnAction) || 'pay';
      }

      this.loadSetting()
    },
  }
</script>

<style scoped lang="scss">
  .blur-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.7);
  }

  .order-detail {
    padding: 0 8px;
    background: white;
    color: #1d1d26;
    box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    position: relative;

    &__header {
      display: flex;
      align-items: center;
      padding: 8px 0;

      &-username {
        font-weight: 700;
        font-size: 13px;
        flex-grow: 1;
        line-height: 16px;
      }

      &-title {
        opacity: 0.5;
        font-size: 11px;
        font-weight: 600;
        margin-right: 4px;
      }

      &-value {
        font-size: 16px;
        font-weight: 600;
        margin-left: 2px;
      }

      .g-btn-bs {
        margin: 0;
      }

      .btn-back {
        width: 37px;
        height: 37px;
        border-radius: 50%;

        & > .g-icon {
          min-width: 24px;
        }
      }
    }

    &__content {
      border-radius: 8px;
      border: 1px solid #e8e8e8;
      overflow: scroll;
      margin-bottom: 3px;
      flex: 1;

      .item {
        padding: 8px;

        &:nth-child(even) {
          background-color: #f8f8f8;
        }

        &-detail {
          display: flex;
          justify-content: space-between;

          &__name {
            font-weight: 700;
            font-size: 14px;
          }

          &__price {
            font-size: 12px;
            color: #616161;
            margin-right: 4px;

            &--new {
              font-size: 14px;
              color: #ff5252;
              margin-right: 4px;
            }
          }

          &__discount {
            text-decoration: line-through;
          }

          &__option {
            font-size: 12px;
            font-style: italic;
            font-weight: 700;
          }
        }

        &-action {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-basis: 25%;

          .g-icon {
            cursor: pointer;
            color: #1d1d26;
            -webkit-tap-highlight-color: transparent;
          }
        }
      }
    }

    &__menu {
      background-color: white;
      display: flex;
      flex-direction: column;

      .g-btn-bs {
        justify-content: flex-start;
      }
    }

    &__setting {
      flex: 1;
      overflow: auto;
      font-size: 14px;

      ::v-deep .g-checkbox-wrapper {
        margin: 4px 0;

        .g-checkbox-label {
          font-size: 14px
        }
      }
    }

    .animation-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      perspective: 1000px;
      backface-visibility: hidden;
      width: 100%;
      height: 100%;
      padding: 4px;
    }

    .front {
      &-enter-active,
      &-leave-active {
        transition-property: opacity, transform;
        transition-duration: 0.6s;
      }

      &-leave-active {
        position: absolute;
      }

      &-enter, &-leave-to {
        transform: rotateY(180deg);
        opacity: 0;
      }
    }

    .back {
      &-enter-active,
      &-leave-active {
        transition-property: opacity, transform;
        transition-duration: 0.6s;
      }

      &-leave-active {
        position: absolute;
      }

      &-enter, &-leave-to {
        transform: rotateY(-180deg);
        opacity: 0;
      }
    }

    .fade {
      &-enter-active,
      &-leave-active {
        transition-property: opacity;
        transition-duration: 0.36s;
      }

      &-leave-active {
        position: absolute;
      }

      &-enter, &-leave-to {
        opacity: 0;
      }

    }
  }

  @media screen and (max-width: 700px) {
    .order-detail__header {
      padding: 4px 0;

      .g-avatar {
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
      }

      &-username {
        font-size: 11px;
      }

      .btn-back {
        width: 28px;
        height: 28px;

        & > .g-icon {
          width: 16px !important;
          height: 16px !important;
          min-width: 16px !important;
        }
      }

      &-title {
        font-size: 9px;
      }

      &-value {
        font-size: 14px;
      }
    }
  }
</style>
