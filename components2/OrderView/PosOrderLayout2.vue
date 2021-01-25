<script>
import posOrderKeyboard from '../../components/posOrder/PosOrderKeyboard'
import dialogChoosePopupModifier from '../../components/posOrder/dialogChoosePopupModifier';
import dialogTextFilter from '../../components/pos-shared-components/dialogFilter/dialogTextFilter';
import dialogProductSearchResult from '../../components/Order/components/dialogProductSearchResult';
import {
  computed,
  getCurrentInstance,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onDeactivated,
  withScopeId
} from "vue";
import {useRoute} from "vue-router";
import {category, showOverlay,} from "./order-layout-setting-logic";
import {loadKeyboardConfig} from "./order-layout-keyboard";
import { editable, orderLayout, loadOrderLayout } from './pos-ui-shared';
import {payPrintMode, showIcon} from "./pos-logic-be";
import {orderLayoutCategoriesFactory} from "./order-layout-categories";
import {orderLayoutProductFactory} from "./order-layout-products";
import cms from 'cms';
import {genScopeId} from "../utils";
import _ from 'lodash'

export default {
  name: 'PosOrderLayout2',
  components: {dialogChoosePopupModifier, dialogTextFilter, dialogProductSearchResult, posOrderKeyboard},
  props: {
    editable: {
      type: Boolean,
      default: false,
    }
  },
  emits: ['update:selectedCategoryLayout', 'update:selectedProductLayout', 'update:view', 'update:orderLayout', 'update:keyboardConfig', 'update:productDblClicked', 'addModifierToProduct', 'addProductToOrder'],
  setup(props) {
    editable.value = props.editable;

    const route = useRoute();
    //todo: render keyboard in factory
    const created = async () => {
      await loadKeyboardConfig();
      let type = 'default'
      if (route.query && route.query.type) {
        type = route.query.type
      }
      await loadOrderLayout(type);
      //todo: test use mock socket io
      cms.socket.on('updateProductProps', async () => {
        await loadOrderLayout(type);
      })
    }

    onBeforeMount(created)
    onActivated(created)

    onBeforeUnmount(() => cms.socket.off('updateOrderLayouts'))
    onDeactivated(() => cms.socket.off('updateProductProps'))

    const displayOverlay = computed(() => {
      console.log(showOverlay.value && showIcon.value);
      return showOverlay.value && showIcon.value
    })

    //todo: portal-vue
    const renderOverlay = () => (
        <g-overlay modelValue={displayOverlay.value} absolute={true} opacity="0.25" color="rgb(150, 150, 150)">
          <g-icon size="120">{payPrintMode.value === 'print' ? 'icon-print' : 'icon-wallet'}</g-icon>
        </g-overlay>
    )

    const {renderCategories} = orderLayoutCategoriesFactory();
    const {renderProducts} = orderLayoutProductFactory();

    return genScopeId(() => orderLayout && (
        <div class="pol" style={{
          'flex-direction': category.value && category.value.type === 'vertical' ? 'row' : 'column',
          'background': 'url(/plugins/pos-plugin/assets/out.png)',
          'background-size': 'contain', 'overflow': displayOverlay ? 'hidden' : 'auto',
        }}>
          {renderCategories()}
          {renderProducts()}
          {renderOverlay()}
        </div>
    ))
  },
}
</script>

<style scoped lang="scss">
.pol {
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
  overflow: auto;

  &__cate {
    border-radius: 4px;
    display: flex;
    justify-content: center;
    text-align: center;
    align-items: center;
    padding: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;
  }

  &__prod {
    display: flex;
    justify-content: center;
    text-align: center;
    align-items: center;
    font-size: 14px;
    line-height: 1.2;
    font-weight: 700;
    color: #1d1d26;
    padding: 0 8px;
    word-break: break-word;
    overflow: hidden;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    & > div {
      max-height: 100%;
    }

    &.collapsed div {
      word-break: break-word;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}
</style>
