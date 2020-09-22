<template>
  <div class="pos-payment-method column-flex flex-wrap align-items-start pl-4 pt-4">
    <div class="row-flex">
      <template v-for="item in listPayments">
        <g-btn elevation="3"
               :uppercase="false" x-large
               class="payment-method-btn"
               :class="selectedPayments.includes(item.name) ? 'payment-method-btn--selected' : ''"
               :text-color="selectedPayments.includes(item.name) ? '#fff' : '#1D1D26'"
               @click.stop="addPaymentMethod(item)">
          <img v-if="item.icon" :src="item.icon" style="width: 20px; height: 20px"/>
          <span class="ml-2" style="text-transform: capitalize">{{ item.name }}</span>
        </g-btn>
      </template>
    </div>

    <div class="row-flex">
      <template v-for="item in extraPaymentItems">
        <g-btn elevation="3"
               :uppercase="false" x-large
               class="payment-method-btn"
               :class="selectedPayments.includes(item.name) ? 'payment-method-btn--selected' : ''"
               :text-color="selectedPayments.includes(item.name) ? '#fff' : '#1D1D26'"
               @click.stop="addPaymentMethod(item)">
          <g-icon v-if="item.icon" size="20">{{item.icon}}</g-icon>
          <span class="ml-2" style="text-transform: capitalize">
            {{`${item.name}${item.value ? ` ${$t('common.currency', storeLocale)}${item.value}` : ''}`}}
          </span>
        </g-btn>
      </template>
    </div>
  </div>
</template>

<script>
  import isNil from 'lodash/isNil';

  export default {
    name: 'PosPaymentScreenPaymentMethods',
    injectService: [
      'OrderStore:currentOrder',
      'OrderStore:paymentTotal',
      'SettingsStore:listPayments',
      'SettingsStore:getListPayments',
      'SettingsStore:selectedPayment',
      'PosStore:storeLocale',
    ],
    data() {
      return {
        extraPaymentItems: [
          { name: 'Tip', value: 0, icon: 'icon-tip' },
          { name: 'WC', value: 0.5 },
          { name: 'Sodexo', value: 6 },
        ],
      }
    },
    computed: {
      paidValue() {
        return _.sumBy(this.currentOrder.payment, i => i.value || 0) || 0
      },
      selectedPayments() {
        return (this.currentOrder.payment || []).map(e => e.name)
      },
    },
    async created() {
      await this.getListPayments();
    },
    async activated(){
      await this.getListPayments();
    },
    methods: {
      addPaymentMethod(item) {
        let payments = this.currentOrder.payment
        const newItem = {name: item.name, value: isNil(item.value) ? this.getRemainingValue() : item.value}
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

  .payment-method-btn {
    flex-basis: 15% !important;
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
