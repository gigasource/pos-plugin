<template>
  <div class="payment-provider-view">
    <div class="payment-provider-view__title">Payment Setting</div>
    <div class="payment-provider-list">
      <component
          v-for="provider in providers"
          :is="provider.component"
          :store="store"
          @deactive="provider.dialog.show = true"
          @active="$emit('active', provider.name, $event)"/>
    </div>
  
    <!-- disabled dialog -->
    <component
        v-for="provider in providers"
        :is="provider.dialog.component"
        v-model="provider.dialog.show"
        @close="provider.dialog.show = false"
        @submit="$emit('deactive', provider.name)"/>
  </div>
</template>
<script>
  // paypal
  import PaypalProvider from './paypal/Provider';
  import DisablePaypalPromptDialog from './paypal/DisablePromptDialog';
  // adyen
  import AdyenProvider from './adyen/Provider';
  import DisableAdyenPromptDialog from './adyen/DisablePromptDialog'

  export default {
    name: 'PaymentProviders',
    components: {
      // pp
      PaypalProvider,
      DisablePaypalPromptDialog,
      // adyen
      AdyenProvider,
      DisableAdyenPromptDialog
    },
    props: {
      store: Object,
    },
    data: function () {
      return {
        providers: [
          { name: 'paypal', component: PaypalProvider, dialog: { show: false, component: DisablePaypalPromptDialog } },
          { name: 'adyen', component: AdyenProvider, dialog: { show: false, component: DisableAdyenPromptDialog } }
        ],
      }
    },
  }
</script>
<style scoped lang="scss">
  .payment-provider-view {
    &__title {
      font-family: Muli;
      font-style: normal;
      font-weight: bold;
      font-size: 18px;
      line-height: 23px;
      margin-bottom: 15px;
    }
  }
  
  .payment-provider-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }
</style>
