<script>
  import PosOrderLayout from '../OrderView/PosOrderLayout';
  import CategoryEditor from './CategoryEditor/CategoryEditor';
  import OrderLayoutEditor from './OrderLayoutEditor';
  import EditMenuCardToolbar from './EditMenuCardToolbar/EditMenuCardToolbar';
  import KeyboardEditor from './KeyboardEditor';
  // product
  import ProductEditor from './ProductEditor/ProductEditor';
  import IngredientEditor from './ProductEditor/IngredientEditor';
  import ProductEditorToolbarButtons from './ProductEditor/ProductEditorToolbarButtons';

  import { view } from '../OrderView/pos-ui-shared'
  import { genScopeId } from '../utils';

  export default {
    name: 'EditMenuCard',
    components: {
      OrderLayoutEditor,
      PosOrderLayout,
      CategoryEditor,
      KeyboardEditor,
      EditMenuCardToolbar,
      ProductEditor, IngredientEditor, ProductEditorToolbarButtons,
    },
    props: {},
    setup() {
      function renderContextEditor() {
        switch (view.value.name) {
          case 'CategoryEditor':
            return <category-editor/>
          case 'ProductEditor':
            return (view.value.mode === 'ingredient')
                ? [ <ingredient-editor/>, <product-editor-toolbar-buttons/> ]
                : [ <product-editor/>, <product-editor-toolbar-buttons/> ]
          case 'KeyboardEditor':
            return <keyboard-editor/>
        }
      }

      function renderEditor() {
        return [ <order-layout-editor/>, view.value && renderContextEditor()]
      }

      return genScopeId(() =>
        <div class="pos-emc">
          <pos-order-layout class="pos-emc__menu" editable/>
          <div class="pos-emc__editor">{ renderEditor() }</div>
          <edit-menu-card-toolbar class="pos-emc__toolbar"/>
        </div>
      )
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
