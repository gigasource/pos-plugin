<script>
  import PosOrderLayout2 from '../OrderView/PosOrderLayout2';
  import CategoryEditor2 from './CategoryEditor/CategoryEditor2';
  import ProductEditor2 from './ProductEditor/ProductEditor2';
  import OrderLayoutEditor2 from './OrderLayoutEditor2';
  import EditMenuCardToolbar2 from './EditMenuCardToolbar/EditMenuCardToolbar2';
  import KeyboardEditor2 from './KeyboardEditor2';
  import IngredientEditor2 from './IngredientEditor2';

  import { view } from '../OrderView/pos-ui-shared'
  import { genScopeId } from '../utils';

  export default {
    name: 'EditMenuCard',
    components: { OrderLayoutEditor2, PosOrderLayout2, CategoryEditor2, ProductEditor2, IngredientEditor2, KeyboardEditor2, EditMenuCardToolbar2},
    props: {},
    setup() {
      function renderContextEditor() {
        switch (view.value.name) {
          case 'CategoryEditor':
            return <category-editor2/>
          case 'ProductEditor':
            if (view.value.mode === 'ingredient')
              return <ingredient-editor2/>
            else
              return <product-editor2/>
          case 'KeyboardEditor':
            return <keyboard-editor2/>
        }
      }

      function renderEditor() {
        if (!view.value)
          return <order-layout-editor2/>

        return <>
          <order-layout-editor2/>
          { renderContextEditor() }
        </>
      }

      return genScopeId(() => <>
        <div class="pos-emc">
          <pos-order-layout2 class="pos-emc__menu" editable/>
          <div class="pos-emc__editor">{ renderEditor() }</div>
          <edit-menu-card-toolbar2 class="pos-emc__toolbar"/>
        </div>
      </>)
    },
    data: function () {
      return {
        view: null,
        orderLayout: null,
        selectedCategoryLayout: null,
        selectedProductLayout: null,
        productDblClicked: null,
        keyboardConfig: null,
        mode: 'basic',
        isMobile: null,
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
