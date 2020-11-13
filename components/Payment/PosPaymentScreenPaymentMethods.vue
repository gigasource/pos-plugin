<template>
  <div class="pos-payment-method column-flex flex-wrap align-items-start pl-4 pt-4">
    <div class="row-flex">
      <template v-for="item in listPayments">
        <g-btn elevation="3"
               :uppercase="false" x-large
               style="flex-basis: 20%"
               :class="['payment-method-btn', selectedPayment === item.type && 'payment-method-btn--selected']"
               :text-color="selectedPayment === item.type ? '#fff' : '#1D1D26'"
               @click.stop="addPaymentMethod(item)">
          <g-icon v-if="item.icon" size="20">{{item.icon}}</g-icon>
          <span class="ml-2" style="text-transform: capitalize">{{ item.type }}</span>
        </g-btn>
      </template>
      <g-btn elevation="3"
             :uppercase="false" x-large
             style="flex-basis: 20%"
             :class="['payment-method-btn', selectedPayment === 'multi' && 'payment-method-btn--selected']"
             :text-color="selectedPayment === 'multi' ? '#fff' : '#1D1D26'"
             @click.stop="addPaymentMethod({ type: 'multi' })">
        <g-icon size="20">icon-multi_payment</g-icon>
        <span class="ml-2" style="text-transform: capitalize">Multi</span>
      </g-btn>
    </div>

    <div class="row-flex">
      <template v-for="item in extraPaymentItems">
        <g-btn v-if="getBadgeCount(item)" elevation="3"
               :uppercase="false" x-large
               class="payment-method-btn"
               @click.stop="addFixedItem(item)">
          <g-icon v-if="item.icon" size="20">{{item.icon}}</g-icon>
          <span class="ml-2 mr-2" style="text-transform: capitalize">
            {{`${item.type}${item.value ? ` ${$t('common.currency', storeLocale)}${item.value}` : ''}`}}
          </span>
          <g-badge inline color="#FF4452">
            <template #badge>
              <div>{{getBadgeCount(item)}}</div>
            </template>
          </g-badge>
        </g-btn>

        <g-btn v-else elevation="3"
               :uppercase="false" x-large
               style="flex-basis: 20%"
               class="payment-method-btn"
               @click.stop="addFixedItem(item)">
          <g-icon v-if="item.icon" size="20">{{item.icon}}</g-icon>
          <span class="ml-2" style="text-transform: capitalize">
            {{`${item.type}${item.value ? ` ${$t('common.currency', storeLocale)}${item.value}` : ''}`}}
          </span>
        </g-btn>
      </template>
    </div>

    <dialog-multi-payment v-model="showMultiPaymentDialog"
                          :total="paymentTotal"
                          :store-locale="storeLocale"
                          :card-value="cardEditValue"
                          :cash-value="cashEditValue"
                          @submit="saveMulti"
    />

    <dialog-form-input width="40%" v-model="showAddTipDialog" keyboard-type="numeric" @submit="saveTip" keyboard-width="100%">
      <template #input>
        <pos-textfield-new ref="tip-textfield" label="Card Payment" v-model="tipEditValue" clearable/>
      </template>
    </dialog-form-input>
  </div>
</template>

<script>
  import isNil from 'lodash/isNil';

  export default {
    name: 'PosPaymentScreenPaymentMethods',
    props: {
      currentOrder: null,
      paymentTotal: Number,
      storeLocale: null
    },
    data() {
      return {
        extraPaymentItems: [
          { type: 'tip', value: 0, icon: 'icon-tip' },
          { type: 'WC', value: 0.5 },
          { type: 'sodexo', value: 6 },
        ],
        showMultiPaymentDialog: false,
        selectedPayment: null,
        listPayments: [
          { type: 'cash', icon: 'icon-cash' },
          { type: 'card', icon: 'icon-credit_card' },
        ],
        showAddTipDialog: false,
        tipEditValue: '',
        cashEditValue: '',
        cardEditValue: '',
      }
    },
    computed: {
      paidValue() {
        return _.sumBy(this.currentOrder.payment, i => +i.value || 0) || 0
      },
      disableConfirmMulti() {
        const number = (+this.cashEditValue) + (+this.cardEditValue);
        return isNaN(+this.cashEditValue) ||
          isNaN(+this.cardEditValue) ||
          number < this.paymentTotal
      }
    },
    activated() {
      this.addPaymentMethod({ type: 'cash' })
    },
    deactivated() {
      this.tipEditValue = ''
      this.cashEditValue = ''
      this.cardEditValue = ''
      this.selectedPayment = null
    },
    methods: {
      addPaymentMethod(item) {
        this.selectedPayment = item.type
        this.$emit('updateCurrentOrder', 'tip', 0)
        this.$emit('updateCurrentOrder', 'change', 0)
        this.$emit('updateCurrentOrder', 'payment', [])

        if (item.type === 'multi') {
          this.openMultiPaymentDialog((payments) => {
            this.$emit('updateCurrentOrder', 'payment', payments)
          })
          return
        }

        this.$emit('updateCurrentOrder', 'payment', [])
        const newItem = {
          type: item.type,
          value: isNil(item.value)
            ? (this.paymentTotal - this.paidValue)
            : +item.value,
        }
        this.$emit('updateCurrentOrder', 'payment', [newItem])
      },
      addFixedItem(item) {
        if (item.type === 'tip') {
          return this.openTipDialog()
        }

        const payment = this.currentOrder.payment;
        if (payment) {
          const cardPayment = payment.find(i => i.type === 'card')
          const cashPayment = payment.find(i => i.type === 'cash')
          if (cardPayment || cashPayment) {
            const filtered = cashPayment ? payment.filter(i => i.type !== 'cash') : payment.filter(i => i.type !== 'card')
            return this.$emit('updateCurrentOrder', 'payment',
              [
                {
                  type: cashPayment ? 'cash' : 'card',
                  value: (cashPayment ? cashPayment.value : cardPayment.value) - item.value
                },
                ...filtered, item
              ])
          }
          return this.$emit('updateCurrentOrder', 'payment', [...payment, item])
        }
        this.$emit('updateCurrentOrder', 'payment', [item])
      },
      getRemainingValue() {
        if (this.cashEditValue && this.cardEditValue) return 0
        if (+this.cashEditValue > this.paymentTotal || +this.cardEditValue > this.paymentTotal) return 0
        if (this.cashEditValue && !isNaN(+this.cashEditValue)) return this.cardEditValue = this.paymentTotal - (+this.cashEditValue)
        if (this.cardEditValue && !isNaN(+this.cardEditValue)) this.cashEditValue = this.paymentTotal - (+this.cardEditValue)
      },
      openMultiPaymentDialog() {
        this.showMultiPaymentDialog = true
        this.selectedPayment = 'multi'
      },
      openTipDialog() {
        this.showAddTipDialog = true
      },
      saveTip() {
        const filtered = this.currentOrder.payment
          ? this.currentOrder.payment.filter(i => i.type !== 'cash' && i.type !== 'card')
          : []

        const tip = (+this.tipEditValue) - _.sumBy(filtered, i => i.value) - this.paymentTotal;

        if (tip <= 0) {
          return
        }

        this.$emit('updateCurrentOrder', 'tip', tip)
        this.$emit('updateCurrentOrder', 'payment',
          [{ type: 'card', value: +this.tipEditValue }, ...filtered,])

        this.showAddTipDialog = false
        this.tipEditValue = ''
        this.selectedPayment = 'card'
      },
      saveMulti({ card, cash }) {
        this.cardEditValue = card
        this.cashEditValue = cash
        this.$emit('updateCurrentOrder', 'payment', [
          { type: 'card', value: +this.cardEditValue },
          { type: 'cash', value: +this.cashEditValue },
        ])
        this.showMultiPaymentDialog = false
      },
      getBadgeCount(item) {
        if (item.type === 'tip') return 0
        if (!this.currentOrder.payment) return 0
        return this.currentOrder.payment.filter(i => i.type === item.type).length
      }
    },
    watch: {
      showAddTipDialog(val) {
        if (val) {
          if (!this.currentOrder.tip) this.tipEditValue = '' + this.paymentTotal
          setTimeout(() => {
            this.$nextTick(() => {
              const tipTfRef = this.$refs['tip-textfield'];
              if (tipTfRef) {
                tipTfRef.$el.click();
                const input = tipTfRef.$el.querySelector('input')
                input && input.select()
              }
            })
          }, 500)
        }
      },
      showMultiPaymentDialog(val) {
        if (val) {
          if (this.selectedPayment !== 'multi') {
            this.cardEditValue = ''
            this.cashEditValue = ''
          }

          setTimeout(() => {
            this.$nextTick(() => {
              this.$refs['cash-textfield'] && this.$refs['cash-textfield'][0].$el.click()
            })
          }, 500)
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .main {
    display: flex;
    flex-grow: 1;
    flex-basis: 0;
    padding: 12px 0;

    .g-row {
      align-content: flex-start;
    }
  }

  ::v-deep .key {
    border: 1px solid #BDBDBD;
    border-radius: 2px;
    font-size: 24px;
    font-weight: 700;
    box-shadow: unset;
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .payment {
    .layout__right {
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
    }
  }

  .payment-method-btn {
    margin: 0 0 12px 12px !important;
    height: 64px !important;
    background-color: white !important;

    &--selected {
      background-color: #297aff !important;
    }
  }

  .pos-payment-method {
    background-image: url('../../assets/pos-payment-method-screen-bg.png');
    background-repeat: repeat;
  }

  .dialog {
    .g-btn-bs {
      margin: 0;
      flex-basis: 40%;
      height: 50px;
    }

    .bs-tf-wrapper {
      margin-bottom: 0;
      margin-top: 0;
      margin-right: 0;

      .bs-tf-inner-input-group {
        border-radius: 2px;
      }
    }

    .g-tf-wrapper {
      margin-bottom: 0;
      margin-top: 0;
      margin-right: 0;
    }
  }

  @media screen and (max-height: 600px){
    .payment-method-btn {
      height: 36px !important;
    }
  }
</style>
