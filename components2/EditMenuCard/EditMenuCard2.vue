<script>
  import PosOrderLayout2 from '../OrderView/PosOrderLayout2';
  import CategoryEditor2 from './CategoryEditor/CategoryEditor2';
  import ProductEditor2 from './ProductEditor/ProductEditor2';
  import OrderLayoutEditor2 from './OrderLayoutEditor2';
  import EditMenuCardToolbar from '../../components/EditMenuCard/EditMenuCardToolbar';
  import KeyboardEditor from './KeyboardEditor2';
  import IngredientEditor from '../../components/EditMenuCard/IngredientEditor';

  import { view } from '../OrderView/pos-ui-shared'
  import { genScopeId } from '../utils';

  export default {
    name: 'EditMenuCard',
    components: { OrderLayoutEditor2, PosOrderLayout2, CategoryEditor2, ProductEditor2, IngredientEditor, KeyboardEditor, EditMenuCardToolbar},
    props: {},
    setup() {
      function renderContextEditor() {
        switch (view.value.name) {
          case 'CategoryEditor':
            return <category-editor2/>
          case 'ProductEditor':
            return <product-editor2/>
          case 'IngredientEditor':
            return <ingredient-editor/>
          case 'KeyboardEditor':
            return <keyboard-editor/>
        }
      }

      function renderEditor() {
        if (!view.value)
          return null

        return <>
          <order-layout-editor2></order-layout-editor2>
          { renderContextEditor() }
        </>
      }

      return genScopeId(() => <>
        <div class="pos-emc">
          <pos-order-layout2 class="pos-emc__menu" editable/>
          <div class="pos-emc__editor">{ renderEditor() }</div>
          <edit-menu-card-toolbar className="pos-emc__toolbar"/>
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
