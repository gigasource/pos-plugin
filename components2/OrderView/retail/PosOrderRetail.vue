<template>
  <div>
    <g-grid-layout :layout="layout">
      <template #keyboard>
        <pos-order-screen-number-keyboard/>
      </template>
      <template #menu>
        <pos-order-screen-product-category-menu/>
      </template>
      <template #table>
        <pos-order-screen-detail/>
      </template>
      <template #layout_left>
      </template>
      <template #toolbar>
        <pos-order-screen-toolbar/>
      </template>
      <template #detail>
        <pos-order-screen-detail/>
      </template>
    </g-grid-layout>

    <dialog-saved-list v-model="dialogProductSearchResult"/>
    <dialog-change-value v-model="dialogChangePrice" new-value-editable @submit="submit"/>
    <dialog-product-lookup v-model="dialogProductLookup"/>
  </div>
<!--  <div class="por" style="height: 100%">-->
<!--    <div class="layout__left">-->
<!--      <div class="menu"></div>-->
<!--      <div class="main_row2">-->
<!--        <div class="keyboard"></div>-->
<!--      </div>-->
<!--      <div class="main_row1"></div>-->
<!--    </div>-->
<!--    <div class="toolbar"></div>-->
<!--    <div class="detail"></div>-->
<!--  </div>-->
</template>
<script>
import layout from '../../../json/ComponentBuilder/posOrderRetail.ComponentBuilder.json'
import PosOrderScreenNumberKeyboard from '../../../components/Order/PosOrderScreenNumberKeyboard';
import PosOrderScreenProductCategoryMenu from '../../../components/Order/PosOrderScreenProductCategoryMenu';
import PosOrderScreenDetail from '../../../components/Order/PosOrderScreenDetail'
import PosOrderScreenToolbar from '../../../components/Order/PosOrderScreenToolbar'
import DialogSavedList from '../../../components/Order/components/dialogSavedList';
import DialogChangeValue from '../../../components/pos-shared-components/dialogChangeValue';
import DialogProductLookup from '../../../components/Order/components/dialogProductLookup';

export default {
  name: 'PosOrderRetail',
  props: {},
  injectService: ['PosStore:updateNewPrice'],
  components: {
    DialogProductLookup,
    DialogChangeValue,
    DialogSavedList,
    PosOrderScreenNumberKeyboard,
    PosOrderScreenProductCategoryMenu,
    PosOrderScreenDetail,
    PosOrderScreenToolbar
  },
  data: function () {
    return {
      layout: layout,
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
  display: grid;
  grid-template-rows: 1fr 64px;
  grid-template-columns: 1fr 30%;
}
</style>
