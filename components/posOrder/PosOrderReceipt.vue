<template>
  <g-dialog fullscreen v-model="internalValue">
    <div class="receipt">
      <g-toolbar color="#EFEFEF">
        <g-btn-bs width="120" icon="icon-back" class="elevation-2" @click="back">
          Back
        </g-btn-bs>
        <g-btn-bs width="120" icon="icon-printer" class="elevation-2" @click.stop="print(null)">
          Print
        </g-btn-bs>
        <g-btn-bs width="120" icon="icon-receipt2" style="white-space: unset" class="elevation-2">
          <div style="line-height: 0.9">
            <p>Company</p>
            <p>Receipt</p>
          </div>
        </g-btn-bs>
        <g-menu v-model="paymentMethodMenu" v-if="!split" content-class="menu-payment-option">
          <template #activator="{on}">
            <g-btn-bs class="elevation-2" :icon="activeOrderPaymentItem.icon" v-on="on" :disabled="printed">
              <div>{{activeOrderPaymentItem.text}}</div>
            </g-btn-bs>
          </template>
          <div class="col-flex">
            <g-btn-bs
                class="ml-0 mr-0"
                v-for="(item, index) in paymentMethodMenuItems"
                :icon="item.icon"
                :key="`paymentMethodMenuItems-${index}`"
                @click.stop="setOrderPaymentMethod(item)">
              <div>{{ item.text }}</div>
            </g-btn-bs>
          </div>
        </g-menu>
        <g-spacer/>
        <g-btn-bs width="120" background-color="#0EA76F" icon="icon-complete" class="elevation-2"
                  @click.stop="complete">
          Complete
        </g-btn-bs>
      </g-toolbar>
      <div class="receipt-main">
        <div class="receipt-main__header">
          <div class="receipt-main__header-title">{{store.name}}</div>
          <div class="receipt-main__header-subtitle">{{store.address}}</div>
          <div class="receipt-main__header-subtitle">
            <span class="mr-3">Tel: {{store.phone}}</span>
            <span>VAT Reg No: {{store.vat}}</span>
          </div>
        </div>
        <div class="receipt-main__title">Table: {{order.table}}</div>
        <template v-if="split">
          <div class="receipt-main__item" v-for="(split, i) in order.splits" :key="split._id">
            <div class="row-flex align-items-center">
              <g-menu v-model="menu[i]" open-on-hover nudge-bottom="10" content-class="menu-receipt-action">
                <template v-slot:activator="{ on }">
                  <div v-on="on" :class="['receipt-main__item-seat', menu[i] && 'receipt-main__item-seat--selected']">Seat {{i + 1}}</div>
                </template>
                <div class="row-flex pa-2 bg-white align-items-start">
                  <g-btn-bs icon="icon-printer" class="elevation-2" @click.stop="print(split)">
                    Print
                  </g-btn-bs>
                  <g-btn-bs class="elevation-2">
                    Bewirtung
                  </g-btn-bs>
                  <div>
                    <g-btn-bs width="90" block icon="icon-credit_card"
                              :background-color="getPaymentColor(split.payment, 'card')"
                              class="elevation-2" @click.stop="savePayment(split, 'card')">
                      Card
                    </g-btn-bs>
                    <g-btn-bs width="90" block icon="icon-cash"
                              :background-color="getPaymentColor(split.payment, 'cash')"
                              class="elevation-2 my-2" @click.stop="savePayment(split, 'cash')">
                      Cash
                    </g-btn-bs>
                    <g-btn-bs width="90" block icon="icon-multi_payment" :background-color="getPaymentColor(split.payment, 'multi')"
                              class="elevation-2" @click.stop="openMultiDialog(split)">
                      Multi
                    </g-btn-bs>
                  </div>
                  <g-btn-bs width="90" block icon="icon-email" class="elevation-2">
                    Email
                  </g-btn-bs>
                  <g-btn-bs block icon="icon-coin-box" class="elevation-2" @click.stop="showTipDialog(split)">
                    Trinkgeld
                  </g-btn-bs>
                </div>
              </g-menu>

              <g-spacer/>

              <div class="receipt-main__item-total" v-for="(p, iP) in split.payment" :key="`payment_${i}_${iP}`">
                <span v-if="iP > 0"> | </span>
                <g-icon class="mr-1">{{getIcon(p.type)}}</g-icon>
                <span>{{$t('common.currency', storeLocale)}} {{p.value}}</span>
              </div>

              <div v-if="split.tip" class="receipt-main__item-total">
                <g-icon class="mr-1">{{getIcon('tip')}}</g-icon>
                <span>{{$t('common.currency', storeLocale)}} {{split.tip}}</span>
              </div>
            </div>
            <div class="receipt-main__item-header">
              <div class="col-1">Q.ty</div>
              <div class="col-9">Item name</div>
              <div class="col-2 ta-right">Total</div>
            </div>
            <div class="receipt-main__item-row" v-for="(item, j) in split.items" :key="`item_${i}_${j}`">
              <div class="col-1">{{item.quantity}}</div>
              <div class="col-9">
                <div>{{item.name}}</div>
                <div v-if="item.modifiers && item.modifiers.length" class="receipt-main__item-row__modifier">
                  {{formatModifiers(item)}}
                </div>
              </div>
              <div class="col-2 ta-right">{{getProductTotal(item) | formatMoney}}</div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="receipt-main__item">
            <div class="row-flex align-items-center">
              <g-spacer/>
              <div class="receipt-main__item-total" v-for="(p, iP) in order.payment" :key="`payment_${iP}`">
                <g-icon class="mr-1">{{getIcon(p.type)}}</g-icon>
                <span>{{$t('common.currency', storeLocale)}} {{p.value}}</span>
              </div>
            </div>
            <div class="receipt-main__item-header">
              <div class="col-1">Q.ty</div>
              <div class="col-9">Item name</div>
              <div class="col-2 ta-right">Total</div>
            </div>
            <div class="receipt-main__item-row" v-for="item in orderItems" :key="item._id.toString()">
              <div class="col-1">{{item.quantity}}</div>
              <div class="col-9">
                <div>{{item.name}}</div>
                <div v-if="item.modifiers && item.modifiers.length" class="receipt-main__item-row__modifier">
                  {{formatModifiers(item)}}
                </div>
              </div>
              <div class="col-2 ta-right">{{getProductTotal(item) | formatMoney}}</div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div class="blur-overlay" v-show="blurReceipt"/>

    <dialog-multi-payment
        rotate
        v-model="dialog.multi"
        :store-locale="storeLocale"
        :total="split ? tempSplit.vSum : total"
        @submit="saveMultiPayment"/>

    <dialog-form-input
        width="40%"
        v-model="dialog.tip"
        keyboard-type="numeric"
        @submit="saveTip"
        keyboard-width="100%"
        rotate>
      <template #input>
        <pos-textfield-new
            ref="tip-textfield"
            label="Card Payment"
            v-model="tipEditValue"
            clearable/>
      </template>
    </dialog-form-input>
  </g-dialog>
</template>

<script>
  import * as orderUtil from '../logic/orderUtil';

  export default {
    name: 'PosOrderReceipt',
    props: {
      value: Boolean,
      order: null,
      storeLocale: String,
      split: Boolean,
      total: Number
    },
    filters: {
      formatMoney(value) {
        return !isNaN(value) ? value.toFixed(2) : value
      }
    },
    data() {
      return {
        store: {
          name: 'Lotteria Nguyen Khanh Toan',
          address: '103 DN11, Nguyen Khanh Toan, Quan Hoa, Cau Giay, Ha Noi',
          phone: '0462.813.977',
          vat: '123456789'
        },
        menu: [],
        dialog: {
          multi: false,
          tip: false
        },
        tempSplit: {},
        tipEditValue: '',
        paymentMethodMenu: false,
        paymentMethods: [
          { text: 'Cash', type: 'cash', icon: 'icon-cash' },
          { text: 'Card', type: 'card', icon: 'icon-credit_card' },
          { text: 'Multi', type: 'multi', icon: 'icon-multi_payment' },
        ],
        printed: null
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        }
      },
      blurReceipt() {
        return this.menu.some(i => i === true)
      },
      activeOrderPaymentItem() {
        if (!this.order.payment) return this.paymentMethods.find(i => i.type === 'cash')
        if (this.order.payment.length > 1) return this.paymentMethods.find(i => i.type === 'multi')
        return this.paymentMethods.find(i => i.type === this.order.payment[0].type)
      },
      paymentMethodMenuItems() {
        return this.paymentMethods.filter(i => i.type !== this.activeOrderPaymentItem.type)
      },
      orderItems() {
        if (!this.split && this.order && this.order.items) {
          return orderUtil.compactOrder(this.order.items.filter(i => i.quantity > 0))
        }
        return []
      },
    },
    created() {
      this.menu = (this.order.splits && this.order.splits.map(() => false)) || [];
    },
    watch: {
      ['dialog.tip'](val) {
        if (val) {
          setTimeout(() => {
            if (!this.tipEditValue) this.tipEditValue = '' + this.tempSplit.vSum
            this.$nextTick(() => this.$refs['tip-textfield'] && this.$refs['tip-textfield'].$el.click())
          }, 500)
        }
      },
    },
    methods: {
      getIcon(type) {
        if (!this.order) return
        if (type === 'card') return 'icon-credit_card'
        if (type === 'cash') return 'icon-cash'
        if (type === 'tip') return 'icon-coin-box'
        return 'icon-multi_payment'
      },
      getOrderPaymentIcon() {
        if (!this.order.payment) return this.getIcon('cash')
        if (this.order.payment.length > 1) return this.getIcon()
        return this.getIcon(this.order.payment[0].type)
      },
      getPaymentColor(payment, type) {
        if (!this.order) return
        if (payment.length > 1 && type === 'multi') return '#1271ff'
        if (payment.length === 1 && type === payment[0].type) return '#1271ff'
        return '#fff'
      },
      openMultiDialog(seat) {
        this.tempSplit = seat
        this.dialog.multi = true
      },
      formatModifiers(product) {
        return `(${product.modifiers.map(i => i.name).join(', ')})`
      },
      getProductTotal(product) {
        return orderUtil.calItemTotal(product) + orderUtil.calItemModifier(product)
      },
      saveMultiPayment(payment) {
        const formattedPayment = _.map(payment, (value, type) => ({ type, value }))
        this.dialog.multi = false

        if (this.split) {
          this.$emit('updatePayment', this.tempSplit._id, formattedPayment)
          this.tempSplit = {}
        } else {
          this.$emit('updateCurrentOrder', 'payment', formattedPayment)
        }
      },
      savePayment(split, payment) {
        this.$emit('updatePayment', split._id, [{ type: payment, value: split.vSum }])
      },
      async print(order) {
        this.$emit('print', order)
        if (!this.split) {
          if (this.printed) {
            const order = await cms.getModel('Order').findById(this.order._id)
            this.$emit('printOrderReport', order)
          } else {
            this.$emit('saveRestaurantOrder', null, false, true, () => this.printed = true)
          }
        }
      },
      back() {
        const isComplete = this.printed || !this.order.items || this.order.items.length === 0
        this.internalValue = false
        this.printed = false
        if (isComplete) this.complete()
      },
      complete() {
        this.$emit('complete')
        if (!this.split) {
          this.$emit('saveRestaurantOrder', null, true, false)
          this.internalValue = false
          this.printed = false
          this.$router.go(-1)
        }
      },
      setOrderPaymentMethod(item) {
        if (item.type === 'multi') {
          return this.openMultiDialog()
        }
        this.$emit('updateCurrentOrder', 'payment', [{ type: item.type, value: this.total }])
      },
      showTipDialog(split) {
        if (split) this.tempSplit = split
        this.dialog.tip = true
      },
      saveTip() {
        const tip = this.split ? (+this.tipEditValue) - this.tempSplit.vSum : (+this.tipEditValue) - this.total

        if (tip <= 0) {
          return
        }

        if (this.split) {
          this.tipEditValue = ''
          this.$emit('updatePayment', this.tempSplit._id, [{ type: 'card', value: this.tempSplit.vSum }], tip)
          this.tempSplit = {}
        } else {
          this.$emit('updateCurrentOrder', 'tip', tip)
          this.$emit('updateCurrentOrder', 'payment', [{ name: 'card', value: +this.tipEditValue }])
        }

        this.dialog.tip = false
      }
    }
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

  .receipt {
    transform: rotate(-90deg);
    transform-origin: left top;
    width: 100vh;
    height: 100vw !important;
    position: absolute;
    top: 100%;
    left: 0;
    display: flex;
    flex-direction: column;

    .g-toolbar {
      flex: 0 0 64px !important;
    }

    &-main {
      padding: 32px;
      background-color: white;
      flex: 1;
      overflow: scroll;

      &__header {
        margin-bottom: 32px;
        text-align: center;

        &-title {
          font-size: 20px;
          font-weight: 700;
        }

        &-subtitle {
          font-size: 12px;
          line-height: 14px;
        }
      }

      &__title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 16px;
      }

      &__item {
        margin-bottom: 36px;

        &-seat {
          width: 100px;
          height: 36px;
          line-height: 36px;
          font-weight: 700;
          background: #FFFFFF;
          border: 1px solid #D0D0D0;
          border-radius: 2px;
          text-align: center;

          &--selected {
            border-color: #1271FF;
            background: #E3F2FD;
          }
        }

        &-total {
          font-weight: 700;
          margin-left: 4px;
          padding: 0 4px;

          & + .receipt-main__item-total {
            border-left: 1px solid black;
          }
        }

        &-header {
          display: flex;
          align-items: center;
          border-top: 1px dashed black;
          border-bottom: 1px dashed black;
          margin: 12px 0 4px;
          padding: 4px 0;
          font-weight: 700;
        }

        &-row {
          display: flex;
          align-items: center;
          padding: 4px 0;

          &__modifier {
            font-style: italic;
            font-size: 12px;
          }
        }
      }
    }
  }

  .g-btn-bs {
    font-size: 14px;
    background-color: white;
  }
</style>

<style lang="scss">
  .menu-receipt-action {
    transform: rotate(-90deg) translateX(calc(-100% + 16px)) translateY(40px);
    transform-origin: left top;
  }

  .menu-payment-option {
    transform: rotate(-90deg) translateY(40px);
    transform-origin: left top;
  }
</style>
