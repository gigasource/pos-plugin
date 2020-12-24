<template>
  <div class="pos-emc">
    <pos-order-layout
        class="pos-emc__menu"
        editable
        v-model:view="view"
        v-model:order-layout="orderLayout"
        v-model:selected-category-layout="selectedCategoryLayout"
        v-model:selected-product-layout="selectedProductLayout"
        v-model:product-dbl-clicked="productDblClicked"
        v-model:keyboard-config="keyboardConfig"
        v-model:mode="mode"
    />
    <edit-menu-card-toolbar
        class="pos-emc__toolbar"
        v-model:view="view"
        v-model:selected-category-layout="selectedCategoryLayout"
        v-model:selected-product-layout="selectedProductLayout"
        v-model:order-layout="orderLayout"
        v-model:product-dbl-clicked="productDblClicked"
    />
    <content-render
        class="pos-emc__editor"
        v-model:view="view">
      <template v-slot:CategoryEditor>
        <category-editor
            v-model:order-layout="orderLayout"
            v-model:selected-category-layout="selectedProductLayout"
        />
      </template>
      <template v-slot:ProductEditor>
        <product-editor
            v-model:order-layout="orderLayout"
            v-model:selected-product-layout="selectedProductLayout"
            v-model:selected-category-layout="selectedCategoryLayout"
        />
      </template>
      <template v-slot:KeyboardEditor>
        <keyboard-editor
          v-model:keyboard-config="keyboardConfig"
          v-model:selected-category-layout="selectedCategoryLayout"
        />
      </template>
    </content-render>
  </div>
</template>
<script>
  import PosOrderLayout from '../posOrder/PosOrderLayout';
  import EditMenuCardToolbar from '../EditMenuCard/EditMenuCardToolbar';
  import ContentRender from '../common/ContentRender';
  import CategoryEditor from '../EditMenuCard/CategoryEditor';
  import ProductEditor from '../EditMenuCard/ProductEditor';
  import KeyboardEditor from '../EditMenuCard/KeyboardEditor';
  
  export default {
    name: 'EditMenuCard',
    components: { KeyboardEditor, ProductEditor, CategoryEditor, ContentRender, EditMenuCardToolbar, PosOrderLayout },
    props: {},
    data: function () {
      return {
        view: null,
        orderLayout: null,
        selectedCategoryLayout: null,
        selectedProductLayout: null,
        productDblClicked: null,
        keyboardConfig: null,
        mode: 'basic'
      }
    }
  }
</script>
<style scoped lang="scss">
  .pos-emc {
    display: grid;
    grid-template-columns: 70% 30%;
    grid-template-rows: 1fr 60px;
    grid-gap: 0 0;
    height: 100%;
    
    &__menu {
      grid-area: 1 / 1 / 2 / 2;
    }
    
    &__toolbar {
      grid-area: 2 / 1 / 3 / 2;
    }
    
    
    &__editor {
      grid-area: 1 / 2 / 3 / 3;
    }
  }
  
</style>
