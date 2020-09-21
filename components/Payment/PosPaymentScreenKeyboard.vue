<template>
  <div>
    <g-number-keyboard area="keyboard" :items="keyboard" :template="template" v-model="keyboardValue">
      <template v-slot:screen>
        <div></div>
      </template>
    </g-number-keyboard>
    <div class="col-flex" style="grid-area: 1 / 4 / 5 / 6">
      <g-table striped class="flex-grow-1">
        <thead>
          <tr>
            <th>Total</th>
            <th>{{paymentTotal}}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(payment, index) in paymentList">
            <td style="text-transform: capitalize">{{payment.name}}</td>
            <td>
              <pos-textfield-new v-model="payment.value" @click.stop="changeKeyboardFocus(payment.value)"/>
            </td>
            <td>
              <g-btn flat text-color="red" @click="removePaymentItem(index)">x</g-btn>
            </td>
          </tr>
        </tbody>
      </g-table>
      <div class="row-flex">
        <div class="flex-grow-1">Change</div>
        <div v-if="!isNaN(change)">{{change}}</div>
        <div v-else>0</div>
      </div>
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
        keyboard: [
          { content: ['7'], style: 'grid-area: key7', action: keyboardFunction.number },
          { content: ['8'], style: 'grid-area: key8', action: keyboardFunction.number },
          { content: ['9'], style: 'grid-area: key9', action: keyboardFunction.number },
          { content: ['4'], style: 'grid-area: key4', action: keyboardFunction.number },
          { content: ['5'], style: 'grid-area: key5', action: keyboardFunction.number },
          { content: ['6'], style: 'grid-area: key6', action: keyboardFunction.number },
          { content: ['1'], style: 'grid-area: key1', action: keyboardFunction.number },
          { content: ['2'], style: 'grid-area: key2', action: keyboardFunction.number },
          { content: ['3'], style: 'grid-area: key3', action: keyboardFunction.number },
          { content: ['0'], style: 'grid-area: key0', action: keyboardFunction.number },
          { content: [','], style: 'grid-area: keyC', action: keyboardFunction.dot },
          { img: 'delivery/key_delete', style: 'grid-area: keyD', action: keyboardFunction.delete },
        ],
        template: 'grid-template-areas: "key7 key8 key9" "key4 key5 key6" "key1 key2 key3" "key0 keyC keyD"; grid-auto-rows: 1fr; grid-auto-columns: 1fr; grid-gap: 6px',
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

          const paid = _.sumBy(val, i => +i.value || 0)
          this.change = paid - this.paymentTotal
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
    padding: 12px;

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
</style>
