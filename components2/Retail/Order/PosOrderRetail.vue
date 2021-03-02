<script>
import PosOrderScreenNumberKeyboard from './Keyboard/PosOrderScreenNumberKeyboard';
import PosOrderScreenButtonGroup from './FnBtns/PosOrderScreenButtonGroup';
import PosOrderScreenScrollWindow from './PosOrderScreenScrollWindow';
import PosRetailCart from './PosRetailCart';
import PosRetailCategory from './PosRetailCategory';
import { onBeforeMount, ref, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { loadCategories, loadProducts } from '../../Product/product-logic-be'
import { genScopeId } from '../../utils';
import { refundOrder } from '../pos-retail-shared-logic'
import { makeRefundOrder, prepareOrder } from '../../OrderView/pos-logic-be'

export default {
  name: 'PosOrderRetail',
  props: {},
  components: {
    PosRetailCategory,
    PosOrderScreenScrollWindow,
    PosOrderScreenNumberKeyboard,
    PosOrderScreenButtonGroup,
    PosRetailCart,
  },
  setup() {
    const isRefundMode = ref(false)
    const router = useRouter()
    isRefundMode.value = router.currentRoute.value.path.includes('refund')
    onActivated(() => {
      !isRefundMode.value ? prepareOrder(0) : prepareOrder(makeRefundOrder(refundOrder.value))
    })

    const inEditScreenMode = ref(true)

    onBeforeMount(async () => {
      await loadCategories()
      await loadProducts()
    })

    function renderTopRightToolbar() {
      return <div>Top Right Toolbar</div>
    }

    return genScopeId(() => (
        <div class="por">
          <pos-retail-category class="por__category"/>
          <div class="por__main">
            <pos-order-screen-scroll-window is-refund-mode={isRefundMode.value} class="por__main__window"/>
            <pos-order-screen-number-keyboard class="por__main__keyboard"/>
            <pos-order-screen-button-group
                class="por__main__buttons"
                in-refund-mode={isRefundMode.value}
                in-edit-mode={inEditScreenMode.value}/>
          </div>
          <div class="por__detail">
            { renderTopRightToolbar() }
            <pos-retail-cart is-refund-mode={isRefundMode.value}/>
          </div>
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
      padding: 4px 2px 4px 4px;
    }

    &__buttons {
      grid-area: 2/2/3/3;
    }
  }

  &__detail {
    grid-area: 1/3/2/4;
    padding: 4px 4px 4px 0;
  }
}
</style>
