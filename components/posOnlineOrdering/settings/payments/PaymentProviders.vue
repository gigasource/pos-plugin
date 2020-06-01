<template>
  <div class="payment-provider-view">
    <div class="payment-provider-view__title">Payment Setting</div>
    <div class="payment-provider-list">
      <component
          v-for="provider in providers"
          :is="provider.component"
          :store="store"
          @deactive="showDisableProviderDialog(provider.name)"
          @active="$emit('active', provider.name, $event)"/>
    </div>
    
    <disable-prompt-dialog
      v-if="dialog.disableProvider.show"
      @cancel="hideProviderDialog"
      @submit="$emit('disable', dialog.disableProvider.name)"/>
  </div>
</template>
<script>
  import PaypalProvider from './paypal/Provider';
  import AdyenProvider from './adyen/Provider';
  import DisablePromptDialog from './DisablePromptDialog';

  export default {
    name: 'PaymentProviders',
    components: {
      PaypalProvider,
      AdyenProvider,
      DisablePromptDialog
    },
    props: {
      store: Object,
    },
    data: function () {
      return {
        providers: [
          { name: 'paypal', component: PaypalProvider },
          { name: 'adyen', component: AdyenProvider }
        ],
        dialog: {
          disableProvider: {
            show: false,
            name: null,
          }
        }
      }
    },
    methods: {
      showDisableProviderDialog(name) {
        this.$set(this.dialog, 'disableProvider', {
          show: true,
          name,
        })
      },
      hideProviderDialog() {
        this.$set(this.dialog, 'disableProvider', {
          show: false,
          name: null,
        })
      }
    }
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
