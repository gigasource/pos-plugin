<script>
import DialogSavedList from '../../../components/Order/components/dialogSavedList'
import DialogProductLookup from '../../../components/Order/components/dialogProductLookup';
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
import {isRefundMode, refundOrder, retailHook} from '../pos-retail-shared-logic'
import { prepareOrder, getCurrentOrder } from '../../OrderView/pos-logic-be'
import {addItem, makeRefundOrder} from "../../OrderView/pos-logic";

export default {
  name: 'PosOrderRetail',
  props: {},
  injectService: ['PosStore:updateNewPrice'],
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
  setup() {
    const showRefundSearch = ref(false)
    const dialogProductSearchResult = ref(false)
    const dialogChangePrice = ref(false)
    const dialogProductLookup = ref(false)

    retailHook.on('openRefundSearch', () => {
      showRefundSearch.value = true
    })

    function submit() {
      //todo: add this
    }

    const router = useRouter()
    onActivated(() => {
      prepareOrder(0)
      isRefundMode.value = router.currentRoute.value.path.includes('refund')
      if (isRefundMode.value) {
        const order = getCurrentOrder()
        makeRefundOrder(order)
        refundOrder.value.items.forEach(item => {
          if (item.option.nonRefundable) return
          addItem(order, item, 0)
        })
      }
    })

    onBeforeMount(async () => {
      await loadCategories()
      await loadProducts()
    })

    return genScopeId(() => (
        <div class="por">
          <pos-retail-category class="por__category"/>
          <div class="por__main">
            <pos-order-screen-scroll-window class="por__main__window"/>
            <pos-order-screen-number-keyboard class="por__main__keyboard"/>
            <pos-order-screen-button-group class="por__main__buttons"/>
          </div>
          <pos-retail-cart class="por__detail"/>

          <dialog-retail-refund-search v-model={showRefundSearch.value}/>
          <dialog-saved-list v-model={dialogProductSearchResult.value}/>
          <dialog-change-value v-model={dialogChangePrice.value} new-value-editable onSubmit={submit}/>
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
