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
    
    &__description {
      color: #757575;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    
    &__balance-info {
      
      &__kv {
        /*display: flex;*/
        /*justify-content: space-between;*/
      }
      
      &__key {
        font-weight: bold;
        font-size: 18px;
      }
      
      &__value {
        color: #536DFE;
        font-family: Muli;
        font-style: normal;
        font-weight: 600;
        font-size: 18px;
      }
    }
    
    &__notice {
      color: #616161;
      margin-top: 20px;
      &>ul {
        margin-block-start: 0 !important;
        font-style: italic;
        &>li {
          font-size: 14px;
        }
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
