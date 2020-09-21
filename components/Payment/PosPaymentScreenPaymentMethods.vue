<template>
  <div class="row-flex flex-wrap align-items-center">
    <template v-for="item in listPayments">
      <g-btn :uppercase="false" x-large outlined text-color="#1271ff"
             @click.stop="addPaymentMethod(item)"
             style="flex-basis: 30%; margin: 0 0 12px 12px">
        <img :src="item.icon" style="width: 20px; height: 20px"/>
        <span class="ml-2 text-black" style="text-transform: capitalize">{{item.name}}</span>
      </g-btn>
    </template>
    <template v-for="item in extraPaymentItems">
      <g-btn :uppercase="false" x-large outlined text-color="#1271ff"
             @click.stop="addPaymentMethod(item)"
             style="flex-basis: 30%; margin: 0 0 12px 12px">
        <span class="ml-2 text-black" style="text-transform: capitalize">{{item.name}}</span>
      </g-btn>
    </template>
  </div>
</template>

<script>
  export default {
    name: 'PosPaymentScreenPaymentMethods',
    injectService: [
      'OrderStore:currentOrder',
      'OrderStore:paymentTotal',
      'SettingsStore:listPayments',
      'SettingsStore:getListPayments',
      'SettingsStore:selectedPayment',
    ],
    data() {
      return {
        extraPaymentItems: [
          //todo add TIP
          { name: 'WC', value: -0.5 },
          { name: 'Sodexo', value: 6 },
        ]
      }
    },
    computed: {
      paidValue() {
        return _.sumBy(this.currentOrder.payment, i => i.value || 0) || 0
      }
    },
    async created() {
      await this.getListPayments();
    },
    async activated(){
      await this.getListPayments();
    },
    methods: {
      addPaymentMethod(item) {
        const payments = this.currentOrder.payment
        const newItem = {name: item.name, value: item.value || this.getRemainingValue()}
        if (payments && payments.some(i => i.name === item.name)) return
        if (!payments) return this.$set(this.currentOrder, 'payment', [newItem])
        payments.push(newItem)
      },
      getRemainingValue() {
        return this.paymentTotal - this.paidValue
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
</style>

<style lang="scss">
  .payment {
    .layout__right {
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
    }
  }
</style>
