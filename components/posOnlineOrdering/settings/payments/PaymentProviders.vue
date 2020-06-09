<template>
  <section>
    <header
        class="mb-3"
        style="font-family: Muli; font-weight: bold; font-size: 18px; line-height: 23px;">
      Payment Setting
    </header>
    
    <section class="row-flex flex-wrap justify-between">
      <component
          v-for="provider in providers"
          :is="provider.component"
          :store="store"
          @deactive="showDisableProviderDialog(provider.name)"
          @active="$emit('active', provider.name, $event)"/>
    </section>
    
    <disable-prompt-dialog
      v-if="dialog.disableProvider.show"
      v-model="dialog.disableProvider.show"
      :name="dialog.disableProvider.name"
      @cancel="hideProviderDialog"
      @submit="$emit('deactive', dialog.disableProvider.name)"/>
  </section>
</template>
<script>
  import PaypalProvider from './paypal/Provider';
  import DisablePromptDialog from './DisablePromptDialog';

  export default {
    name: 'PaymentProviders',
    components: {
      PaypalProvider,
      DisablePromptDialog
    },
    props: {
      store: Object,
    },
    data: function () {
      return {
        providers: [
          { name: 'paypal', component: PaypalProvider },
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

  }
</style>
