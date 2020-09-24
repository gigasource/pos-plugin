<template>
  <div class="pos-payment-method column-flex flex-wrap align-items-start pl-4 pt-4">
    <div class="row-flex">
      <template v-for="item in listPayments">
        <g-btn elevation="3"
               :uppercase="false" x-large
               style="flex-basis: 20%"
               :class="['payment-method-btn', selectedPayment === item.name && 'payment-method-btn--selected']"
               :text-color="selectedPayment === item.name ? '#fff' : '#1D1D26'"
               @click.stop="addPaymentMethod(item)">
          <g-icon v-if="item.icon" size="20">{{item.icon}}</g-icon>
          <span class="ml-2" style="text-transform: capitalize">{{ item.name }}</span>
        </g-btn>
      </template>
      <g-btn elevation="3"
             :uppercase="false" x-large
             style="flex-basis: 20%"
             :class="['payment-method-btn', selectedPayment === 'multi' && 'payment-method-btn--selected']"
             :text-color="selectedPayment === 'multi' ? '#fff' : '#1D1D26'"
             @click.stop="addPaymentMethod({ name: 'multi' })">
        <g-icon size="20">icon-multi_payment</g-icon>
        <span class="ml-2" style="text-transform: capitalize">Multi</span>
      </g-btn>
    </div>

    <div class="row-flex">
      <template v-for="item in extraPaymentItems">
        <g-badge v-if="getBadgeCount(item)" overlay color="#FF4452" style="margin-right: 12px; flex-basis: 20%">
          <template #badge>
            <div>{{getBadgeCount(item)}}</div>
          </template>
          <g-btn elevation="3"
                 :uppercase="false" x-large
                 class="payment-method-btn"
                 style="width: 100%"
                 @click.stop="addFixedItem(item)">
            <g-icon v-if="item.icon" size="20">{{item.icon}}</g-icon>
            <span class="ml-2" style="text-transform: capitalize">
              {{`${item.name}${item.value ? ` ${$t('common.currency', storeLocale)}${item.value}` : ''}`}}
            </span>
          </g-btn>
        </g-badge>

        <g-btn v-else elevation="3"
               :uppercase="false" x-large
               style="flex-basis: 20%"
               class="payment-method-btn"
               @click.stop="addFixedItem(item)">
          <g-icon v-if="item.icon" size="20">{{item.icon}}</g-icon>
          <span class="ml-2" style="text-transform: capitalize">
            {{`${item.name}${item.value ? ` ${$t('common.currency', storeLocale)}${item.value}` : ''}`}}
          </span>
        </g-btn>
      </template>
    </div>

    <g-dialog v-model="showMultiPaymentDialog" width="50%">
      <g-card class="dialog col-flex pa-3">
        <div class="row-flex align-items-center">
          <span class="fw-700 mb-2" style="font-size: 20px">Multi Payment</span>
          <g-spacer/>
          <span class="mr-1">Total:</span>
          <span class="fw-700" style="font-size: 18px; color: #1271FF">{{$t('common.currency', storeLocale)}} {{paymentTotal}}</span>
        </div>
        <div>
          <template v-for="item in listPayments">
            <div class="mt-1 mb-2 row-flex align-items-center">
              <g-btn-bs background-color="#2979ff" text-color="#fff" border-radius="2px">
                <g-icon v-if="item.icon" size="20">{{item.icon}}</g-icon>
                <span class="ml-2" style="text-transform: capitalize">{{ item.name }}</span>
              </g-btn-bs>
              <pos-textfield-new clearable v-if="item.name === 'card'" ref="card-textfield"
                                 v-model="cardEditValue" @click.stop="getRemainingValue"/>
              <pos-textfield-new clearable v-else ref="cash-textfield"
                                 v-model="cashEditValue" @click.stop="getRemainingValue"/>
            </div>
          </template>
        </div>
        <div class="mb-3 mt-3">
          <pos-keyboard-full
              style="grid-area: 1 / 1 / 5 / 4"
              :template="keyboardTemplate"
              :items="keyboardItems"/>
        </div>
        <g-btn-bs background-color="#2979ff" text-color="#fff" class="w-100" :disabled="disableConfirmMulti"
                  @click.stop="saveMulti">
          Confirm
        </g-btn-bs>
      </g-card>
    </g-dialog>

    <dialog-form-input width="40%" v-model="showAddTipDialog" keyboard-type="numeric" @submit="saveTip">
      <template #input>
        <pos-textfield-new ref="tip-textfield" label="Tip" v-model="tipEditValue"/>
      </template>
    </dialog-form-input>
  </div>
</template>

<script>
  import isNil from 'lodash/isNil';

  export default {
    name: 'PosPaymentScreenPaymentMethods',
    injectService: [
      'OrderStore:currentOrder',
      'OrderStore:paymentTotal',
      'PosStore:storeLocale',
    ],
    props: {
      currentOrder: null,
      paymentTotal: Number,
      storeLocale: null
    },
    data() {
      return {
        keyboardTemplate: 'grid-template-areas: " key7 key7 key8 key8 key9 key9" ' +
          '"key4 key4 key5 key5 key6 key6" ' +
          '"key1 key1 key2 key2 key3 key3" ' +
          '"keyDot keyDot key0 key0 del del";' +
          'grid-auto-columns: 1fr; grid-gap: 10px',
        keyboardItems: [
          ...Object.values({
            key7: { content: ['7'], style: 'grid-area: key7' },
            key8: { content: ['8'], style: 'grid-area: key8' },
            key9: { content: ['9'], style: 'grid-area: key9' },
            key4: { content: ['4'], style: 'grid-area: key4' },
            key5: { content: ['5'], style: 'grid-area: key5' },
            key6: { content: ['6'], style: 'grid-area: key6' },
            key1: { content: ['1'], style: 'grid-area: key1' },
            key2: { content: ['2'], style: 'grid-area: key2' },
            key3: { content: ['3'], style: 'grid-area: key3' },
            key0: { content: ['0'], style: 'grid-area: key0' },
            keyDot: { content: ['.'], style: 'grid-area: keyDot' },
          }),
          {
            content: [''],
            img: 'delivery/key_delete',
            style: 'grid-area: del; background-color: #e0e0e0',
            action: 'delete'
          },
        ],
        extraPaymentItems: [
          { name: 'tip', value: 0, icon: 'icon-tip' },
          { name: 'WC', value: 0.5 },
          { name: 'sodexo', value: 6 },
        ],
        showMultiPaymentDialog: false,
        selectedPayment: null,
        listPayments: [
          { name: 'cash', icon: 'icon-cash' },
          { name: 'card', icon: 'icon-credit_card' },
        ],
        showAddTipDialog: false,
        tipEditValue: '',
        cashEditValue: '',
        cardEditValue: '',
      }
    },
    computed: {
      paidValue() {
        return _.sumBy(this.currentOrder.payment, i => i.value || 0) || 0
      },
      disableConfirmMulti() {
        const number = (+this.cashEditValue) + (+this.cardEditValue);
        return isNaN(+this.cashEditValue) ||
          isNaN(+this.cardEditValue) ||
          number < this.paymentTotal
      }
    },
    deactivated() {
      this.tipEditValue = ''
      this.cashEditValue = ''
      this.cardEditValue = ''
      this.selectedPayment = null
    },
    methods: {
      addPaymentMethod(item) {
        this.selectedPayment = item.name
        this.$emit('updateCurrentOrder', 'tip', 0)
        this.$emit('updateCurrentOrder', 'change', 0)
        this.$emit('updateCurrentOrder', 'payment', [])

        if (item.name === 'multi') {
          this.openMultiPaymentDialog((payments) => {
            this.$emit('updateCurrentOrder', 'payment', payments)
          })
          return
        }

        this.$emit('updateCurrentOrder', 'payment', [])
        const newItem = {
          name: item.name,
          value: isNil(item.value)
            ? (this.paymentTotal - this.paidValue)
            : item.value,

          // replaceMode is used for overwriting instead of appending to payment value
          // after the first character is entered, replaceMode will be set to false
          replaceMode: item.name === 'cash',
        }
        this.$emit('updateCurrentOrder', 'payment', [newItem])
      },
      addFixedItem(item) {
        if (item.name === 'tip') {
          return this.openTipDialog()
        }

        const payment = this.currentOrder.payment;
        if (payment) {
          const cardPayment = payment.find(i => i.name === 'card')
          const cashPayment = payment.find(i => i.name === 'cash')
          if (cardPayment && !cashPayment) {
            const filtered = payment.filter(i => i.name !== 'card')
            return this.$emit('updateCurrentOrder', 'payment',
              [{ name: 'card', value: cardPayment.value - item.value }, ...filtered, item])
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
          ? this.currentOrder.payment.filter(i => i.name !== 'cash' && i.name !== 'card')
          : []

        this.$emit('updateCurrentOrder', 'tip', +this.tipEditValue)
        this.$emit('updateCurrentOrder', 'payment',
          [{ name: 'card', value: this.paymentTotal + (+this.tipEditValue) - _.sumBy(filtered, i => i.value) }, ...filtered,])

        this.showAddTipDialog = false
        this.tipEditValue = ''
        this.selectedPayment = 'card'
      },
      saveMulti() {
        this.$emit('updateCurrentOrder', 'payment', [
          { name: 'card', value: +this.cardEditValue, replaceMode: false },

          // replaceMode is used for overwriting instead of appending to payment value
          // after the first character is entered, replaceMode will be set to false
          { name: 'cash', value: +this.cashEditValue, replaceMode: true },
        ])
        this.showMultiPaymentDialog = false
      },
      getBadgeCount(item) {
        if (item.name === 'tip') return 0
        if (!this.currentOrder.payment) return 0
        return this.currentOrder.payment.filter(i => i.name === item.name).length
      }
    },
    watch: {
      showAddTipDialog(val) {
        if (val) {
          setTimeout(() => {
            if (!this.currentOrder.tip) this.tipEditValue = ''
            this.$nextTick(() => this.$refs['tip-textfield'] && this.$refs['tip-textfield'].$el.click())
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
</style>

<style lang="scss">
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
  }
</style>
