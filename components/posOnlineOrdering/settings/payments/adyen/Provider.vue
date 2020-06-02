<template>
  <div class="provider col-flex">
    <div class="provider__logo">
      <img draggable="false" src="/plugins/pos-plugin/assets/adyen.svg"/>
    </div>
    <balance v-if="isActivated" :store="store" @deactive="$emit('deactive', $event)"/>
    <register-process v-else :store="store" @active="$emit('active', $event)"/>
  </div>
</template>
<script>
  import RegisterProcess from './RegisterProcess';
  import Balance from './Balance';

  export default {
    name: 'AdyenProvider',
    components: { Balance, RegisterProcess },
    props: {
      store: Object
    },
    data: function () {
      return {
      
      }
    },
    computed: {
      isActivated() {
        return (this.store.paymentProviders.adyen
             && this.store.paymentProviders.adyen.enable
             && this.store.paymentProviders.adyen.accountHolder)
      },
    },
    methods: {
    
    }
  }
</script>
<style scoped lang="scss">
  .provider {
    width: 49%;
    background: #FFF;
    border-radius: 4px;
    padding: 30px;
    
    &__logo {
      margin-bottom: 10px;
      
      & > img {
        height: 53px;
      }
    }
  }
  
  ::v-deep {
    .bs-tf-input-prepend > *:first-child {
      width: 180px;
    }
    
    .g-select {
      .bs-tf-wrapper {
        margin-left: 5px;
        margin-bottom: 8px;
      }
      
      .bs-tf-inner-input-group {
        height: 38px;
      }
    }
  }
</style>
