<script>
import DialogSavedList from '../../../components/Order/components/dialogSavedList'
import DialogProductLookup from './dialogProductLookup2';
import DialogChangeValue from "../../pos-shared-components/dialogChangeValue";
import PosOrderScreenNumberKeyboard from './PosOrderScreenNumberKeyboard';
import PosOrderScreenButtonGroup from './PosOrderScreenButtonGroup';
import PosOrderScreenScrollWindow from './PosOrderScreenScrollWindow';
import PosRetailCart from './PosRetailCart';
import PosRetailCategory from './PosRetailCategory';
import { onBeforeMount, ref, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { loadCategories, loadProducts } from '../../Product/product-logic-be'
import DialogRetailRefundSearch from './Refund/dialogRetailRefundSearch';
import { genScopeId } from '../../utils';
import { refundOrder, retailHook} from '../pos-retail-shared-logic'
import {makeRefundOrder, prepareOrder} from '../../OrderView/pos-logic-be'
import DialogProductSearchResult from '../../../components/Order/components/dialogProductSearchResult';

export default {
  name: 'PosOrderRetail',
  props: {},
  components: {
    DialogProductSearchResult,
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
  setup() {
    const showRefundSearch = ref(false)
    const dialogProductSearchResult = ref(false)
    const dialogSavedList = ref(false)
    const dialogChangePrice = ref(false)
    const dialogProductLookup = ref(false)
    const isRefundMode = ref(false)

    retailHook.on('openRefundSearch', () => {
      showRefundSearch.value = true
    })

    function submit() {
      //todo: add this
    }

    const router = useRouter()
    isRefundMode.value = router.currentRoute.value.path.includes('refund')
    onActivated(() => {
      !isRefundMode.value ? prepareOrder(0) : prepareOrder(makeRefundOrder(refundOrder.value))
    })

    onBeforeMount(async () => {
      await loadCategories()
      await loadProducts()
    })

    return genScopeId(() => (
        <div class="por">
          <pos-retail-category class="por__category"/>
          <div class="por__main">
            <pos-order-screen-scroll-window is-refund-mode={isRefundMode.value} class="por__main__window"/>
            <pos-order-screen-number-keyboard class="por__main__keyboard"/>
            <pos-order-screen-button-group is-refund-mode={isRefundMode.value} class="por__main__buttons"/>
          </div>
          <pos-retail-cart is-refund-mode={isRefundMode.value} class="por__detail"/>
          {
            !isRefundMode.value && <dialog-retail-refund-search v-model={showRefundSearch.value}/>
          }
          <dialog-product-search-result v-model={dialogProductSearchResult.value}></dialog-product-search-result>
          <dialog-saved-list v-model={dialogSavedList.value}/>
          <dialog-change-value v-model={dialogChangePrice.value} new-value-editable onSubmit={updateNewPrice}/>
          <dialog-product-lookup v-model={dialogProductLookup.value}/>
        </div>
    ))
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
