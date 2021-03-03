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
import {
  changeValue,
  loadRetailLayoutSetting,
  retailLayoutSetting,
  saveRetailLayoutSetting
} from './retail-layout-setting-logic';
import { savedOrders } from './temp-logic';

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
    const router = useRouter()
    const isRefundMode = ref(false)
    const inEditScreenMode = ref(false)
    isRefundMode.value = router.currentRoute.value.path.includes('refund')
    onBeforeMount(async () => {
      await loadCategories()
      await loadProducts()
    })
    onActivated(() => {
      !isRefundMode.value ? prepareOrder(0) : prepareOrder(makeRefundOrder(refundOrder.value))
    })

    const showScreenSettingPanel = ref(false)
    const showMoreSettingCtxMenu = ref(false)
    function goBack() {
      router.go(-1)
    }
    function renderScreenSettingPanel() {
      function renderNumericPropSetting(title, prop) {
        const valueStyle = { width: '50px', fontSize: '12px', fontWeight: 'bold' }
        const propStyle = { fontSize: '12px' }
        return (
            <div class="row-flex align-items-center">
              <span style={propStyle}>{title}</span>
              <g-spacer/>
              <g-icon onClick={() => changeValue(prop, retailLayoutSetting[prop] - 1)}>remove_circle</g-icon>
              <span style={valueStyle}>{retailLayoutSetting[prop]}</span>
              <g-icon onClick={() => changeValue(prop, retailLayoutSetting[prop] + 1)}>add_circle</g-icon>
            </div>
        )
      }

      function renderBooleanPropSetting(title, prop) {
        const propStyle = { fontSize: '12px' }
        return (
            <div class="row-flex align-items-center">
              <span style={propStyle}>{title}</span>
              <g-spacer/>
              <g-switch v-model={retailLayoutSetting[prop]}></g-switch>
            </div>
        )
      }

      const sectionStyle = { marginTop: '10px', position: 'relative', border: '1px solid #444', paddingBottom: '10px' }
      const sectionTitleStyle = { paddingLeft: '5px', backgroundColor: '#ddd', marginBottom: '8px' }
      const propSectionStyle = { marginLeft: '5px' }

      return <>
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Product</div>
          <div style={propSectionStyle}>
            {renderNumericPropSetting('Rows', 'productRow')}
            {renderNumericPropSetting('Columns', 'productColumn')}
            {renderNumericPropSetting('Font size', 'productFontSize')}
            {renderBooleanPropSetting('Show full name', 'showFullProductName')}
          </div>
        </div>

        <div class="row-flex justify-end">
          <g-btn-bs width="100" small style="margin-top: 10px; margin-right:0" background-color="#1271FF"
                    onClick={() => {
                      saveRetailLayoutSetting()
                      showScreenSettingPanel.value = false
                    }}>Save
          </g-btn-bs>
        </div>
      </>
    }
    function render1stColumn() {
      return (
          <div class="por__category col-flex" style="background-color: #E3F2FD">
            <pos-retail-category class="flex-1"/>
            <g-spacer style="min-height: 15px"/>
            <div style="margin: 5px;" class="row-flex">
              <g-btn-bs style="margin: 0; background-color: #FFF; flex: 1" onClick={goBack}>
                <g-icon>icon-back</g-icon>
                <span class="por__category__back__content">Back</span>
              </g-btn-bs>
              <g-menu v-model={showMoreSettingCtxMenu.value} close-on-content-click top nudge-top={5} v-slots={{
                default: () => (
                    <g-expand-x-transition>{execGenScopeId(() =>
                        <div style="background-color: #FFF;" class="col-flex">
                          <g-btn-bs icon="icon-blue-cog" onClick={() => {
                            loadRetailLayoutSetting()
                            inEditScreenMode.vale = true
                          }}>Edit Screen
                          </g-btn-bs>
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
      )
    }

    function render2ndColumn() {
      return (
          <div class="por__main">
            <pos-order-screen-scroll-window is-refund-mode={isRefundMode.value} class="por__main__window"/>
            <pos-order-screen-number-keyboard class="por__main__keyboard"/>
            <pos-order-screen-button-group
                class="por__main__buttons"
                in-refund-mode={isRefundMode.value}
                in-edit-mode={inEditScreenMode.value}/>
          </div>
      )
    }

    const customer = ref(null)
    const showCustomerDialog = ref(false)
    function renderCustomer() {
      return <div style="cursor: pointer" onClick={() => showCustomerDialog.value = true}>
        { !customer.value
            ? <div style="font-size: 12px">
              Select customer
              {/*TODO: Render customer dialog somehow*/}
              <g-dialog v-model={showCustomerDialog.value}></g-dialog>
            </div>
            : <div>
              <p style="color: #2979FF">{customer.value.name}</p>
              <p style="color: #757575">{customer.value.phone}</p>
            </div>
        }
      </div>
    }
    const showSavedListDialog = ref(false)
    function renderSavedList() {
      return savedOrders.value.length > 0 && <div>
        <g-btn style="padding: 0 12px; min-width: initial;" onClick={() => showSavedListDialog.value = true}>
          <g-badge badge-size={20} nudge-top={-10} nudge-right={-10} color="red" v-slots={{
            badge: () => <div>{savedOrders.value.length}</div>,
            default: () => <g-icon>icon-save</g-icon>
          }}/>
        </g-btn>
        <dialog-saved-list v-model={showSavedListDialog.value}/>
      </div>
    }
    const topRightToolbarHeight = '46px';
    const topRightToolbarHeightStyle = `height: ${topRightToolbarHeight}; padding-bottom: 5px` // => button height = 41px
    function renderTopRightToolbar() {
      return (
          <div class="row-flex justify-between align-items-center" style={topRightToolbarHeightStyle}>
            { renderCustomer() }
            { renderSavedList() }
          </div>
      )
    }
    function render3rdColumn() {
      return (
          <div class="por__detail">
            {inEditScreenMode.value
                ? renderScreenSettingPanel()
                : <>
                  {renderTopRightToolbar()}
                  <pos-retail-cart
                      is-refund-mode={isRefundMode.value}
                      style={`max-height: calc(100% - ${topRightToolbarHeight}); height: calc(100% - ${topRightToolbarHeight});`}/>
                </>
            }
          </div>
      )
    }

    return genScopeId(() => (
        <div class="por">
          { render1stColumn() }
          { render2ndColumn() }
          { render3rdColumn() }
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

    &__back__content {
      margin-left: 4px;
      font-size: 12px;
    }
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

@media screen and (max-width: 667px) {
  .por__category__back__content {
    margin-left: 0;
    font-size: 0;
  }
}
</style>
