<script>
import PosOrderScreenNumberKeyboard from './Keyboard/PosOrderScreenNumberKeyboard';
import PosOrderScreenButtonGroup from './FnBtns/PosOrderScreenButtonGroup';
import PosOrderScreenScrollWindow from './PosOrderScreenScrollWindow';
import PosRetailCart from './PosRetailCart';
import PosRetailCategory from './PosRetailCategory';
import { onBeforeMount, ref, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { loadCategories, loadProducts } from '../../Product/product-logic-be'
import { execGenScopeId, genScopeId } from '../../utils';
import { refundOrder } from '../pos-retail-shared-logic'
import { makeRefundOrder, prepareOrder } from '../../OrderView/pos-logic-be'
import { loadRetailLayoutSetting } from './retail-layout-setting-logic';

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

    const inEditScreenMode = ref(false)

    onBeforeMount(async () => {
      await loadCategories()
      await loadProducts()
    })

    function renderTopRightToolbar() {
      return <div>Top Right Toolbar</div>
    }

    function goBack() {
      router.go(-1)
    }

    const showMoreSettingCtxMenu = ref(false)
    return genScopeId(() => (
        <div class="por">
          <div class="por__category col-flex" style="background-color: #E3F2FD">
            <pos-retail-category class="flex-1"/>
            <g-spacer style="min-height: 15px"/>
            <div style="margin: 5px;" class="row-flex">
              <g-btn-bs style="margin: 0; background-color: #FFF" icon="icon-back" onClick={goBack}>Back</g-btn-bs>
              <g-menu v-model={showMoreSettingCtxMenu.value} close-on-content-click top nudge-top={5} v-slots={{
                default: () => (
                    <g-expand-x-transition>{execGenScopeId(() =>
                        <div style="background-color: #FFF;" class="col-flex">
                          <g-btn-bs icon="icon-blue-cog" onClick={() => {
                            loadRetailLayoutSetting()
                            inEditScreenMode.vale = true
                          }}>Edit Screen</g-btn-bs>
                        </div>
                    )}</g-expand-x-transition>
                ),
                activator: ({ on }) => (
                    <g-btn-bs onClick={on.click} style="text-align: center; margin-right: 0; background-color: #FFF">
                      <g-icon>more_horiz</g-icon>
                    </g-btn-bs>
                )
              }}/>
            </div>
          </div>

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
