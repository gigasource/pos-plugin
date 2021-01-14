<script>
import posOrderKeyboard from '../../components/posOrder/PosOrderKeyboard'
import dialogChoosePopupModifier from '../../components/posOrder/dialogChoosePopupModifier';
import dialogTextFilter from '../../components/pos-shared-components/dialogFilter/dialogTextFilter';
import dialogProductSearchResult from '../../components/Order/components/dialogProductSearchResult';
import {computed, onActivated, onBeforeMount, onBeforeUnmount, onDeactivated} from "vue";
import {useRoute} from "vue-router";
import {category, showOverlay,} from "./order-layout-setting-logic";
import {loadKeyboardConfig} from "./order-layout-keyboard";
import {editable, mode, orderLayout} from "./pos-ui-shared";
import {payPrintMode, showIcon} from "./pos-logic-be";
import {orderLayoutCategoriesFactory} from "./order-layout-categories";
import {orderLayoutProductFactory} from "./order-layout-products";

export default {
  name: 'PosOrderLayout2',
  components: {dialogChoosePopupModifier, dialogTextFilter, dialogProductSearchResult, posOrderKeyboard},
  props: {
    editable: {
      type: Boolean,
      default: false,
    },
    view: null,
    mode: String,
  },
  emits: ['update:selectedCategoryLayout', 'update:selectedProductLayout', 'update:view', 'update:orderLayout', 'update:keyboardConfig', 'update:productDblClicked', 'addModifierToProduct', 'addProductToOrder'],
  setup(props) {
    editable.value = props.editable;
    view.value = props.view;
    mode.value = props.mode;

    async function loadOrderLayout(type = 'default') {
      orderLayout.value = await cms.getModel('OrderLayout').findOne({type});
    }

    const route = useRoute();
    //todo: render keyboard in factory
    const created = async () => {
      await loadKeyboardConfig();
      let type = 'default'
      if (route.query && route.query.type) {
        type = route.query.type
      }
      await loadOrderLayout(type);
      cms.socket.on('updateProductProps', async () => {
        await loadOrderLayout(type);
      })
    }

    onBeforeMount(created)
    onActivated(created)

    onBeforeUnmount(() => cms.socket.off('updateOrderLayouts'))
    onDeactivated(() => cms.socket.off('updateProductProps'))

    const displayOverlay = computed(() => {
      return showOverlay.value && showIcon.value
    })
    //todo: portal-vue
    const renderOverlay = () => (
        <g-overlay value={displayOverlay.value} absolute={true} opacity="0.25" color="rgb(150, 150, 150)">
          <g-icon size="120">{payPrintMode.value === 'print' ? 'icon-print' : 'icon-wallet'}</g-icon>
        </g-overlay>
    )

    const {renderCategories} = orderLayoutCategoriesFactory();
    const {renderProducts} = orderLayoutProductFactory();

    return () => (<>
      {orderLayout &&
      <div class="pol" style={{
        'flex-direction': category.value && category.value.type === 'vertical' ? 'row' : 'column',
        'background': 'url(\'/plugins/pos-plugin/assets/out.png\')',
        'background-size': 'contain', 'overflow': displayOverlay ? 'hidden' : 'auto'
      }}>
        {renderCategories()}
        {renderProducts()}
        {renderOverlay()}
      </div>}
    </>)
  },
}
</script>
