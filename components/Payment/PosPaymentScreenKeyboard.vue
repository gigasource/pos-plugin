<template>
  <div class="pos-payment-keyboard">
    <pos-keyboard-full
        type="numeric"
        width="100%"
        style="grid-area: 1 / 1 / 5 / 4"
        :template="keyboardTemplate"
        :items="keyboardItems"/>
    <div class="col-flex" style="grid-area: 1 / 4 / 5 / 6">
      <g-table class="payment-table flex-grow-1" striped>
        <thead>
          <tr>
            <th class="payment-table__row">
              <span>Total</span>
              <g-spacer />
              <span class="total-value">{{paymentTotal}}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(payment, index) in paymentList">
            <div class="payment-table__row" style="padding: 0 16px">
              <span style="text-transform: capitalize">{{ payment.name }}</span>
              <g-btn class="ml-2" flat text-color="red" @click="removePaymentItem(index)">x</g-btn>
              <g-spacer/>
              <div class="value-input">
                <pos-textfield-new v-model="payment.value" @click.stop="changeKeyboardFocus(payment.value)"/>
              </div>
            </div>
          </tr>

          <tr>
            <div class="payment-change" style="padding: 0 16px">
              <div class="payment-change__description mb-2">Please enter tendered cash</div>
              <g-divider class="mb-2"/>
              <div class="row-flex payment-change__value">
                <div class="flex-grow-1">Change</div>
                <g-spacer/>
                <div v-if="!isNaN(change)" class="payment-change__value__number">{{ (+change || 0).toFixed(2)}}</div>
                <div v-else class="payment-change__value__number">{{(0).toFixed(2)}}</div>
              </div>
            </div>
          </tr>
        </tbody>
      </g-table>
    </div>
  </div>
</template>

<script>
  const keyboardFunction = {
    number: (value, number) => value.charAt(value.length - 3) === '.' ? value : (value + number), //cant input > 2 digits after fixed-point
    dot: value => value.includes('.') ? value : (value + '.'), // only 1 fixed-point
    delete:(value) => (value && value.substring(0, value.length - 1))
  }

  export default {
    name: 'PosPaymentScreenKeyboard',
    injectService: [
      'OrderStore:(paymentAmountTendered,savePaidOrder,selectedPayment,paymentTotal,currentOrder)',
      'SettingsStore:getPosSetting'
    ],
    data() {
      return {
        keyboardTemplate: 'grid-template-areas: " key7 key7 key8 key8 key9 key9" ' +
            '"key4 key4 key5 key5 key6 key6" ' +
            '"key1 key1 key2 key2 key3 key3" ' +
            '"keyDot keyDot key0 key0 del del";' +
            'grid-auto-columns: 1fr; grid-gap: 10px',
        keyboardItems: [
          ...Object.values({
            key7: {content: ['7'], style: 'grid-area: key7'},
            key8: {content: ['8'], style: 'grid-area: key8'},
            key9: {content: ['9'], style: 'grid-area: key9'},
            key4: {content: ['4'], style: 'grid-area: key4'},
            key5: {content: ['5'], style: 'grid-area: key5'},
            key6: {content: ['6'], style: 'grid-area: key6'},
            key1: {content: ['1'], style: 'grid-area: key1'},
            key2: {content: ['2'], style: 'grid-area: key2'},
            key3: {content: ['3'], style: 'grid-area: key3'},
            key0: {content: ['0'], style: 'grid-area: key0'},
            keyDot: {content: ['.'], style: 'grid-area: keyDot'},
          }),
          {
            content: [''],
            img: 'delivery/key_delete',
            style: 'grid-area: del; background-color: #e0e0e0',
            action: 'delete'
          },
        ],
        listBtn: [],
        paymentList: [],
        keyboardValue: null,
        change: null
      }
    },
    computed: {
      // keyboardValue: {
      //   get() {
      //     return this.paymentAmountTendered
      //   },
      //   set(value) {
      //     this.paymentAmountTendered = value.includes('.') ? value : parseFloat('0' + value).toString()
      //   }
      // },
    },
    methods: {
      changeKeyboardFocus(item) {
        this.keyboardValue = item
      },
      isActiveBtn(btn) {
        if (btn.buttonFunction === 'pay') {
          return this.paymentAmountTendered >= this.paymentTotal
        }
        return !!btn.text;
      },
      onClickBtn(btn) {
        if(btn.buttonFunction)
          this[btn.buttonFunction](btn.buttonFunctionValue);
      },
      async pay() {
        await this.$router.push({ path: '/pos-order' })
        await this.savePaidOrder()
        this.selectedPayment = null
      },
      cashDrawer() {

      },
      banknote(value) {
        this.paymentAmountTendered = (+value + parseFloat('0' + this.paymentAmountTendered)).toString();
      },
      discount() {
        if(this.currentOrder.items.find(i => i.vDiscount > 0) && !this.currentOrder.isDiscountInTotal) {
          this.$getService('alertDiscount:setActive')(true);
        } else {
          const originalTotal = this.currentOrder.items.reduce((acc, item) => (acc + (item.discountResistance ? 0 : item.quantity * item.originalPrice)), 0);
          this.$getService('dialogDiscount:open')('percentage', originalTotal);
        }
      },
      async generateTemplate() {
        const setting = await this.getPosSetting();
        this.listBtn = [];
        const paymentBtns = setting.paymentFunctionButtons;
        const containedBtns = paymentBtns.reduce((acc, btn) => ([...acc, ...btn.containedButtons]), []);
        for(const btn of paymentBtns) {
          if(!containedBtns.includes(btn._id)) {
            this.listBtn.push(btn);
          }
        }
      },
      removePaymentItem(index) {
        this.currentOrder.payment.splice(index, 1)
      }
    },
    async mounted() {
      await this.generateTemplate();
    },
    async activated() {
      await this.generateTemplate();
    },
    created() {
      const orderStore = this.$getService('OrderStore')
      orderStore.$watch('currentOrder.payment', val => {
        if (val && val.length) {
          this.paymentList = val

          const paid = _.sumBy(val, i => {
            if (i.name === 'WC' || i.name === 'Tip') {
              return (+i.value || 0) * -1
            }

            return +i.value || 0
          })

          const change = paid - this.paymentTotal
          this.$set(this.currentOrder, 'customerPaidEnough', change >= 0)

          this.change = change >= 0 ? change : 0
        }
      }, { deep: true, immediate: true })

      // this.$watch('paymentList', val => {
      //   if (val && val.length) {
      //     this.$nextTick(() => {
      //       const latestItem = _.last(val)
      //       this.$refs[latestItem.name] && console.log(this.$refs[latestItem.name])
      //     })
      //   }
      // }, { deep: true })
    }
  }
</script>

<style scoped lang="scss">
  .controller {
    padding: 4px;

    .keyboard {
      ::v-deep .key {
        background: #FFFFFF;
        border: 1px solid #979797;
        box-sizing: border-box;
        border-radius: 2px;
        box-shadow: none;
        font-size: 20px;
        font-weight: 700;
        font-family: "Muli", sans-serif;
      }
    }
  }

  .pos-payment-keyboard {
    background-image: url('../../assets/pos-payment-method-screen-bg.png');
    background-repeat: repeat;
    padding: 8px !important;
  }

  ::v-deep .payment-table {
    .g-table__wrapper {
      position: relative;
    }
  }

  .payment-table {
    thead {
      font-weight: bold;
    }

    &__row {
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      font-size: 16px !important;

      ::v-deep .value-input {
        height: calc(100% - 16px);

        .bs-tf-wrapper {
          width: 100%;
          margin: 8px 0;
        }

        .bs-tf-inner-input-group, .bs-tf-input {
          background-color: white;
        }
      }
    }
  }

  .total-value {
    font-size: 18px;
  }

  .payment-change {
    position: absolute;
    bottom: 0;
    font-weight: bold;
    width: 100%;
    font-size: 16px !important;

    &__description {
      font-size: 13px;
      color: #1D1D26;
      font-weight: normal;
    }

    &__value {
      height: initial;

      &__number {
        font-size: 20px !important;
        color: #1271ff;
      }
    }
  }
</style>
