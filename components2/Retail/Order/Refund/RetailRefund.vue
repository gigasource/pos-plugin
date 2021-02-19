<template>
  <div class="por">
    <pos-retail-category class="por__category"/>
    <div class="por__main">
      <pos-order-screen-scroll-window class="por__main__window"/>
      <pos-order-screen-number-keyboard class="por__main__keyboard"/>
      <pos-order-screen-button-group class="por__main__buttons"/>
    </div>
    <pos-retail-cart class="por__detail"/>
    <!--    <dialog-saved-list v-model="dialogProductSearchResult"/>-->
    <!--    <dialog-change-value v-model="dialogChangePrice" new-value-editable @submit="submit"/>-->
    <!--    <dialog-product-lookup v-model="dialogProductLookup"/>-->
  </div>
</template>
<script>
// TODO: The code in this file similart too the code in ../PosOrderRetail
// find a way to re-use

import DialogSavedList from '../../../../components/Order/components/dialogSavedList';
import DialogProductLookup from '../../../../components/Order/components/dialogProductLookup';
import DialogChangeValue from '../../../../components/pos-shared-components/dialogChangeValue';
import PosOrderScreenNumberKeyboard from '../PosOrderScreenNumberKeyboard';
import PosOrderScreenButtonGroup from '../PosOrderScreenButtonGroup';
import PosOrderScreenScrollWindow from '../PosOrderScreenScrollWindow';
import PosRetailCart from '../PosRetailCart';
import PosRetailCategory from '../PosRetailCategory';
import { onBeforeMount } from 'vue'
import { loadCategories, loadProducts } from '../../../Product/product-logic-be'
import DialogRetailRefundSearch from '../Refund/dialogRetailRefundSearch';

export default {
  name: 'RetailRefund',
  props: {},
  components: {
    DialogRetailRefundSearch,
    PosOrderScreenScrollWindow,
    PosOrderScreenButtonGroup,
    PosRetailCategory,
    PosRetailCart,
    DialogProductLookup,
    DialogChangeValue,
    DialogSavedList,
    PosOrderScreenNumberKeyboard,
  },
  data: function () {
    return {
      showRefundSearch: true,
      dialogProductSearchResult: false,
      dialogChangePrice: false,
      dialogProductLookup: false,
    }
  },
  computed: {},
  methods: {
    submit() {
      this.$getService('PosStore:updateNewPrice')(val);
    },
    updateNewPrice() {
      console.log('PosStore:updateNewPrice was not injected!')
    }
  },
  setup() {
    onBeforeMount(async () => {
      await loadCategories()
      await loadProducts()
    })
  }
}
</script>
<style scoped lang="scss">
.por {
  height: 100%;
  display: grid;
  grid-template-rows: 100%;
  grid-template-columns: 20% 55% 25%;

  &__category {
    grid-area: 0/0/1/1;
  }

  &__main {
    grid-area: 1/2/2/3;
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 50% 50%;

    &__window {
      grid-area: 1/1/2/3;
    }

    &__keyboard {
      grid-area: 2/1/3/2;
      padding: 8px 4px 8px 8px;
    }

    &__buttons {
      grid-area: 2/2/3/3;
    }
  }

  &__detail {
    grid-area: 1/3/2/4;
  }
}
</style>
