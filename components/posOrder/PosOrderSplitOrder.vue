<template>
  <div>
    <g-dialog v-model="internalValue" :transition="false" content-class="split-order-dialog">
      <div class="row-flex justify-end w-100">
        <div class="splitter" :style="isMobile ? {height: 'calc(100% - 20px)'} : {height: 'calc(100% - 84px)'}">
          <div class="splitter__header row-flex align-items-center" v-if="isMobile">
            <div class="blur-overlay" v-if="showPaymentMethodsMenu"/>
            <g-btn-bs :uppercase="false" background-color="#1271ff" :disabled="!splitOrders.length" @click.stop="showReceipt = true">
              <g-icon size="20" class="mr-2">icon-receipt3</g-icon>
              <span>{{ $t('restaurant.viewReceipt') }}</span>
            </g-btn-bs>
            <g-spacer v-if="splitOrders.length"/>
            <div v-if="splitOrders.length">
              <span style="font-weight: 700; font-size: 15px">Split: </span>
              <span style="font-weight: 600; color: #ff4452">{{ splitOrders.length }}</span>
            </div>
            <g-spacer/>
            <div style="font-weight: 600; color: #ff4452">
              {{ $t('common.currency', storeLocale) }} {{ $filters.formatCurrency(totalCurrent) }}
            </div>
          </div>
          <div class="splitter__header" v-else>
            <div class="blur-overlay" v-if="showPaymentMethodsMenu"/>
            <p>
              Total:
              <span style="font-size: 18px; color: #ff4452"> {{ $filters.formatCurrency(totalCurrent) }}</span>
            </p>
          </div>
          <div class="splitter__content">
            <div class="blur-overlay" v-if="showPaymentMethodsMenu"/>
            <div v-for="item in currentSplitOrder" :key="item._id.toString()" class="item">
              <div class="item-detail" @click.stop="returnItem(item)">
                <div>
                  <p class="item-detail__name" :style="[item.printed && { opacity: 0.55 }]">
                    {{ item.id && `${item.id}. ` }} {{ item.name }}</p>
                  <p>
                    <span :class="['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']">
                      {{ $t('common.currency', storeLocale) }} {{ $filters.formatCurrency(item.originalPrice) }}
                    </span>
                    <span class="item-detail__price--new" v-if="isItemDiscounted(item)">
                      {{ $t('common.currency', storeLocale) }} {{ $filters.formatCurrency(item.price) }}
                    </span>
                    <span :class="['item-detail__option', 'text-red-accent-2']">
                      {{ getItemSubtext(item) }}
                    </span>
                  </p>
                </div>
                <div class="mr-2 fw-700 row-flex align-items-center" style="font-size: 18px">{{ item.quantity }}</div>
              </div>
              <div v-if="item.modifiers">
                <g-chip v-for="(modifier, index) in item.modifiers" :key="`${item._id}_${index}`"
                        label small text-color="#616161">
                  {{ modifier.name }} |
                  {{ $t('common.currency', storeLocale) }}{{ $filters.formatCurrency(modifier.price) }}
                </g-chip>
              </div>
            </div>
          </div>
          <div class="splitter__actions">
            <g-btn-bs class="splitter__actions-btn" background-color="#046EFF" :disabled="disablePayment"
                      style="border-radius: 0 0 0 6px"
                      @click.stop="createOrder([{ type: 'cash', value: totalCurrent }])">
              <g-icon size="36">icon-cash</g-icon>
            </g-btn-bs>
            <g-btn-bs class="splitter__actions-btn" background-color="#0EA76F" :disabled="disablePayment"
                      @click.stop="createOrder([{ type: 'card', value: totalCurrent }])">
              <g-icon size="36">icon-credit_card</g-icon>
            </g-btn-bs>
            <g-btn-bs class="splitter__actions-btn" background-color="#795548" :disabled="disablePayment"
                      style="border-radius: 0 0 6px 0"
                      @click.stop="showMultiPaymentdialog = true">
              <g-icon size="36">icon-multi_payment</g-icon>
            </g-btn-bs>
          </div>
        </div>

        <g-icon class="mr-4 ml-4" size="40" color="#fff" style="height: calc(100% - 64px)">keyboard_backspace</g-icon>

        <div class="order-detail" :style="isMobile ? {height: '100%'} : { height: 'calc(100% - 64px)' } ">
          <div class="blur-overlay" v-if="showPaymentMethodsMenu"/>
          <div class="order-detail__header row-flex align-items-center">
            <div>
              <g-avatar size="36">
                <img alt :src="avatar">
              </g-avatar>
              <span class="ml-1 fw-700" style="font-size: 13px">{{ username }}</span>
            </div>
            <g-spacer v-if="isMobile"/>
            <g-btn-bs v-if="isMobile" class="elevation-1 btn-back" @click="back">
              <g-icon>icon-back</g-icon>
            </g-btn-bs>
            <g-spacer/>
            <div style="font-size: 18px; color: #ff4452">
              {{ $t('common.currency', storeLocale) }} {{ $filters.formatCurrency(totalLeft) }}
            </div>
          </div>
          <div class="order-detail__content">
            <div v-for="(item, i) in itemsWithQty" :key="i" class="item"
                 @click.stop="addToSplitOrder(item)">
              <div class="item-detail">
                <div>
                  <p class="item-detail__name" :style="[item.printed && { opacity: 0.55 }]">
                    {{ item.id && `${item.id}. ` }} {{ item.name }}</p>
                  <p>
                    <span :class="['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']">
                      €{{ $filters.formatCurrency(item.originalPrice) }}
                    </span>
                    <span class="item-detail__price--new" v-if="isItemDiscounted(item)">
                      {{ $t('common.currency', storeLocale) }} {{ $filters.formatCurrency(item.price) }}
                    </span>
                    <span :class="['item-detail__option', 'text-red-accent-2']">
                      {{ getItemSubtext(item) }}
                    </span>
                  </p>
                </div>
                <div class="mr-2 fw-700 row-flex align-items-center" style="font-size: 18px">{{ item.quantity }}</div>
              </div>
              <div v-if="item.modifiers">
                <g-chip v-for="(modifier, index) in item.modifiers" :key="`${item._id}_${index}`"
                        label small text-color="#616161" close @close="removeModifier(item, index)">
                  {{ modifier.name }} |
                  {{ $t('common.currency', storeLocale) }}{{ $filters.formatCurrency(modifier.price) }}
                </g-chip>
              </div>
            </div>
          </div>
        </div>
      </div>

      <g-toolbar elevation="0" color="#eee" class="toolbar" v-if="!isMobile">
        <g-btn-bs icon="icon-back" @click.stop="back">{{ $t('ui.back') }}</g-btn-bs>
        <g-spacer/>
        <span class="ml-2 mr-2" v-if="splitOrders.length">Split: {{ splitOrders.length }}</span>
        <g-btn-bs :uppercase="false" background-color="#1271ff" :disabled="!splitOrders.length" @click.stop="showReceipt = true">
          View receipt
        </g-btn-bs>
      </g-toolbar>
    </g-dialog>

    <dialog-multi-payment v-model="showMultiPaymentdialog"
                          :total="totalCurrent"
                          :store-locale="storeLocale"
                          @submit="saveMultiPayment"
    />

    <pos-order-receipt v-model="showReceipt" :order="orderWithSplits" :store-locale="storeLocale" split
                       @updatePayment="updateSplitPayment"
                       @complete="complete"
                       @print="printReceipt"/>
  </div>
</template>

<script>
  import orderUtil from '../logic/orderUtil';
  import { v4 as uuidv4 } from 'uuid';

  export default {
    name: 'PosOrderSplitOrder',
    props: {
      modelValue: Boolean,
      currentOrder: null,
      user: null,
      storeLocale: String,
      isMobile: Boolean
    },
    data() {
      return {
        remainingItems: [],
        splitOrders: [],
        currentSplitOrder: [],
        showPaymentMethodsMenu: false,
        showMultiPaymentdialog: false,
        showReceipt: false,
        splitId: null,
        paying: false,
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(val) {
          this.$emit('update:modelValue', val)
        }
      },
      username() {
        return this.user ? this.user.name : ''
      },
      avatar() {
        return this.user ? this.user.avatar : ''
      },
      itemsWithQty() {
        if (this.remainingItems) return this.remainingItems.filter(i => i.quantity > 0)
        return []
      },
      totalLeft() {
        return this.getTotal(this.remainingItems)
      },
      totalCurrent() {
        return this.getTotal(this.currentSplitOrder)
      },
      orderWithSplits() {
        return Object.assign({}, this.currentOrder, { splits: this.splitOrders })
      },
      disablePayment() {
        return this.paying || !this.totalCurrent
      }
    },
    methods: {
      back() {
        this.internalValue = false
      },
      isItemDiscounted(item) {
        return item.originalPrice > item.price
      },
      getItemSubtext({ course, takeout, separate }) {
        if (separate) return
        if (takeout) return 'Take-away'
        if (course && course > 1) return `Course: ${course}`
      },
      addToSplitOrder(item) {
        if (item.quantity > 1) {
          const existingItem = this.currentSplitOrder.find(i => i._id === item._id)
          if (existingItem) {
            existingItem.quantity++
          } else {
            this.currentSplitOrder.push({ ...item, quantity: 1 })
          }
          item.quantity--
          return
        }
        const existingItem = this.currentSplitOrder.find(i => i._id === item._id)
        if (existingItem) {
          existingItem.quantity++
        } else {
          this.currentSplitOrder.push({ ...item, quantity: 1 })
        }
        this.remainingItems.splice(this.remainingItems.indexOf(item), 1)
      },
      returnItem(item) {
        if (item.quantity > 1) {
          const existingItem = this.remainingItems.find(i => i._id === item._id)
          if (existingItem) {
            existingItem.quantity++
          } else {
            this.remainingItems.push({ ...item, quantity: 1 })
          }
          item.quantity--
          return
        }
        const existingItem = this.remainingItems.find(i => i._id === item._id)
        if (existingItem) {
          existingItem.quantity++
        } else {
          this.remainingItems.push({ ...item, quantity: 1 })
        }
        this.currentSplitOrder.splice(this.currentSplitOrder.indexOf(item), 1)
      },
      getTotal(items) {
        if (!items) return 0
        return orderUtil.calOrderTotal(items) + orderUtil.calOrderModifier(items)
      },
      saveMultiPayment(payment) {
        const paymentMethod = _.map(payment, (value, key) => {
          return {
            type: key,
            value
          }
        });

        this.createOrder(paymentMethod)
        this.showMultiPaymentdialog = false
      },
      createOrder(paymentMethod) {
        this.showPaymentMethodsMenu = false
        const isLastSplit = this.remainingItems.length === 0;
        this.$emit('saveSplitOrder', this.currentSplitOrder, paymentMethod, isLastSplit,
          order => {
            this.paying = false
            this.currentSplitOrder = []

            if (order) {
              this.splitOrders.push(order)
              const newItems = _.cloneDeep(this.remainingItems)
              const printedItems = newItems.filter(i => i.printed);
              this.$emit('updateCurrentOrder', 'items', newItems)
              this.$emit('updatePrintedOrder', 'items', printedItems)
              if (this.currentOrder._id) this.$emit('createOrderCommit', { key: 'items', value: printedItems })
            }

            if (isLastSplit) this.showReceipt = true
          })
        this.paying = true
      },
      updateSplitPayment(_id, payment, tip) {
        cms.socket.emit('update-split-payment', _id, payment, ({ order, error }) => {
          if (error) return console.log(error)
          const split = this.splitOrders.find(i => i._id === _id)
          split.payment = payment

          // TODO: tip is not saved on backend yet
          this.$set(split, 'tip', tip)
        })
      },
      complete() {
        this.showReceipt = false
        this.internalValue = false
        if (this.remainingItems.length > 0) return

        this.$emit('resetOrderData')
        this.$emit('updateCurrentOrder', 'table', null)
        this.$router.push({ path: '/pos-dashboard' })
      },
      printReceipt(order) {
        if (order) return this.$emit('printOrderReport', order)
        this.splitOrders.forEach(order => this.$emit('printOrderReport', order))
      }
    },
    watch: {
      modelValue(val) {
        this.currentSplitOrder = []
        this.splitOrders = []
        this.remainingItems = _.cloneDeep(this.currentOrder.items)
        this.paying = false

        if (val) {
          if (this.currentOrder.splitId) {
            this.splitId = this.currentOrder.splitId
          } else {
            this.splitId = uuidv4()
            this.$emit('updateCurrentOrder', 'splitId', this.splitId)
            if (this.currentOrder._id) {
              this.$emit('createOrderCommit', { key: 'splitId', value: this.splitId })
            }
          }

          if (this.currentOrder.items) {
            this.remainingItems = _.cloneDeep(this.currentOrder.items)
          }
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .splitter {
    background: #fff;
    flex-basis: 40%;
    padding-top: 8px;
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    margin: 10px 0;

    &__header {
      padding: 0 8px;
      position: relative;

      .g-btn-bs {
        margin: 0;
      }
    }

    &__content {
      border-radius: 8px;
      border: 1px solid #e8e8e8;
      overflow: scroll;
      flex-grow: 1;
      margin: 8px;
      position: relative;
    }

    &__actions {
      display: flex;
      flex-direction: row;
      align-items: center;

      &-btn {
        flex: 1;
        margin: 0;
        border-radius: 0;
      }
    }
  }

  .order-detail {
    background: #fff;
    flex-basis: 30%;
    padding: 0 8px;
    position: relative;

    &__header {
      padding: 8px 0;
      display: flex;
      align-items: center;

      .btn-back {
        width: 37px;
        height: 37px;
        border-radius: 50%;
        margin: 0;

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
    }
  }

  .item {
    padding: 8px;

    &:nth-child(even) {
      background-color: #f8f8f8;
    }

    &-detail {
      display: flex;
      justify-content: space-between;
      cursor: pointer;

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
  }

  .toolbar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 64px;
  }

  .g-btn-bs {
    background-color: white;
    font-size: 14px;
  }

  .blur-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(107, 111, 130, 0.7);
    z-index: 2;
  }
</style>

<style lang="scss">
  .split-order-dialog {
    height: 100% !important;
    max-height: 100% !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .splitter__actions-menu {
    display: flex;
    flex-direction: column;
    transform: translateX(25%);

    .g-btn-bs {
      margin: 0;
      font-weight: 700;
      font-size: 16px;
    }
  }
</style>
