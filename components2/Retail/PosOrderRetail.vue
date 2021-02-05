<template>
  <div class="por">
    <pos-retail-category class="por__category"/>
    <div class="por__main">
      <pos-order-screen-scroll-window class="por__main__window"/>
      <pos-order-screen-number-keyboard class="por__main__keyboard"/>
      <pos-order-screen-button-group class="por__main__buttons"/>
    </div>
    <pos-retail-order class="por__detail"/>
<!--    <dialog-saved-list v-model="dialogProductSearchResult"/>-->
<!--    <dialog-change-value v-model="dialogChangePrice" new-value-editable @submit="submit"/>-->
<!--    <dialog-product-lookup v-model="dialogProductLookup"/>-->
  </div>
</template>
<script>
import DialogSavedList from '../../components/Order/components/dialogSavedList';
import DialogProductLookup from '../../components/Order/components/dialogProductLookup';
import DialogChangeValue from '../../components/pos-shared-components/dialogChangeValue';
import PosOrderScreenNumberKeyboard from './Order/PosOrderScreenNumberKeyboard';
import PosOrderScreenButtonGroup from './Order/PosOrderScreenButtonGroup';
import PosOrderScreenScrollWindow from './Order/PosOrderScreenScrollWindow';
import PosRetailOrder from './Order/PosRetailOrder';
import PosRetailCategory from './Order/PosRetailCategory';

export default {
  name: 'PosOrderRetail',
  props: {},
  injectService: ['PosStore:updateNewPrice'],
  components: {
    PosOrderScreenScrollWindow,
    PosOrderScreenButtonGroup,
    PosRetailCategory,
    PosRetailOrder,
    DialogProductLookup,
    DialogChangeValue,
    DialogSavedList,
    PosOrderScreenNumberKeyboard,
  },
  data: function () {
    return {
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
  }
}
</script>
<style scoped lang="scss">
.por {
  height: 100%;
  display: grid;
  grid-template-rows: 100%;
  grid-template-columns: 20% 50% 30%;

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
