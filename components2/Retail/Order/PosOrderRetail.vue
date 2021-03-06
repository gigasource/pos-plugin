<script>
import PosOrderScreenNumberKeyboard from './Keyboard/PosOrderScreenNumberKeyboard';
import PosOrderScreenButtonGroup from './FnBtns/PosOrderScreenButtonGroup';
import PosOrderScreenScrollWindow from './PosOrderScreenScrollWindow';
import PosRetailCart from './PosRetailCart';
import PosRetailCategory from './PosRetailCategory';
import { onBeforeMount, ref, onActivated, watch, nextTick, onDeactivated } from 'vue'
import { useRouter } from 'vue-router'
import { loadCategories, loadProducts } from '../../Product/product-logic-be'
import {execGenScopeId, genScopeId} from '../../utils';
import {addProductByBarcode, refundOrder} from '../pos-retail-shared-logic'
import { makeRefundOrder, prepareOrder } from '../../OrderView/pos-logic-be'
import {
  changeValue,
  loadRetailLayoutSetting,
  retailLayoutSetting,
  saveRetailLayoutSetting
} from './retail-layout-setting-logic';
import { savedOrders } from './temp-logic';
import { username, formattedTime } from '../../AppSharedStates';
import {
  getCurrentOrder
} from "../../OrderView/pos-logic-be";
import {
  addCustomer
} from "../../OrderView/pos-logic";
import {customerNames, customers} from "../../Customer/customer-logic";
import {loadCustomers} from "../../Customer/customer-be-logics";
import {renderCustomerInfo, customerDialogData, clearCustomerDialogData, onCreateCustomer} from "../../Customer/customer-ui-logics-shared";
import PosKeyboardFull from "../../pos-shared-components/PosKeyboardFull";
import { barcodeHook, setHandleKeyupBarcode, removeHandleKeyupBarcode } from "../../Product/barcode-listener";

export default {
  name: 'PosOrderRetail',
  props: {},
  components: {
    PosKeyboardFull,
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
      await loadCustomers()
      await loadCategories()
      await loadProducts()
    })

    //<editor-fold desc="activated and deactivated">
    let off
    onActivated(() => {
      // todo: Don't reset order when activated (.i.e when back from payment)
      !isRefundMode.value ? prepareOrder(0) : prepareOrder(makeRefundOrder(refundOrder.value))
      // clear data of customer in add new
      clearCustomerDialogData()
      // barcode hook
      setHandleKeyupBarcode()
      off = barcodeHook.on('newBarcode', barcode => {
        addProductByBarcode(barcode)
      }).off
    })

    onDeactivated(() => {
      removeHandleKeyupBarcode()
      off()
    })
    //</editor-fold>

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
      const sectionStyle = { marginTop: '6px', position: 'relative', border: '1px solid #444', paddingBottom: '10px' }
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
              </g-btn-bs>
              <g-menu v-model={showMoreSettingCtxMenu.value} close-on-content-click top nudge-top={5} v-slots={{
                default: () => (
                    <g-expand-x-transition>{execGenScopeId(() =>
                        <div style="background-color: #FFF;" class="col-flex">
                          <g-btn-bs icon="icon-blue-cog" onClick={() => {
                            loadRetailLayoutSetting()
                            inEditScreenMode.value = !inEditScreenMode.value
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
            <pos-order-screen-scroll-window is-edit-mode={inEditScreenMode.value} is-refund-mode={isRefundMode.value} class="por__main__window"/>
            <pos-order-screen-number-keyboard class="por__main__keyboard"/>
            <pos-order-screen-button-group
                class="por__main__buttons"
                in-refund-mode={isRefundMode.value}
                in-edit-mode={inEditScreenMode.value}/>
          </div>
      )
    }

    //<editor-fold desc="customer render logic">
    const customer = ref('')
    const showCustomerDialog = ref(false)
    const autoCompleteRef = ref(null)
    const tabsTitle = [{
      title: 'Find',
    }, {
      title: 'Add new'
    }]
    const selectedTab = ref(tabsTitle[0])
    watch(() => showCustomerDialog.value, (val) => {
      if (val) {
        setTimeout(() => {
          nextTick(() => autoCompleteRef._rawValue.$refs.textfield.onFocus())
        }, 200)
      }
    })

    async function onDialogSubmitCustomerForOrder() {
      showCustomerDialog.value = false
      if (!customer.value && customerDialogData) {
        await onCreateCustomer(customerDialogData)
        customer.value = `${customerDialogData.name} - ${customerDialogData.phone}`
      }
      if (!customer.value) return
      // customer.value form is "name - phone"
      const phone = customer.value.split('-')[1].trim()
      const foundCustomer = customers.value.find(customer => {
        return customer.phone === phone
      })
      const order = getCurrentOrder()
      addCustomer(order, foundCustomer._id)
      clearCustomerDialogData()
    }

    function renderCustomer() {
      selectedTab.value = tabsTitle[0]
      if (!showCustomerDialog.value) { // prevent change of customer.value while dialog is opening
        const order = getCurrentOrder()
        if (order.customer) {
          const foundCustomer = customers.value.find(_customer => order.customer.toString() === _customer._id.toString())
          customer.value = `${foundCustomer.name} - ${foundCustomer.phone}`
        } else {
          customer.value = null
        }
      }
      return <div style="cursor: pointer" onClick={() => showCustomerDialog.value = true}>
        { !customer.value
            ? <div style="font-size: 12px">
              <p>Select customer</p>
              <p>{username.value} - {formattedTime.value}</p>
            </div>
            : <div onClick={() => showCustomerDialog.value = true}>
              <p style="color: #2979FF">{customer.value.split('-')[0].trim()}</p>
              <p style="color: #757575">{customer.value.split('-')[1].trim()}</p>
            </div>
        }
        <g-dialog fullscreen v-model={showCustomerDialog.value} persistent>
          {
            genScopeId(() => (
                <div class="dialog">
                  <g-tabs class="dialog-left" items={tabsTitle} v-model={selectedTab.value}>
                    <g-tab-item item={tabsTitle[0]}>
                      <g-autocomplete text-field-component="GTextFieldBs"
                                      v-model={customer.value} items={customerNames.value}
                                      style="margin-bottom: 100px; width: 50%"
                                      ref={autoCompleteRef}/>
                    </g-tab-item>
                    <g-tab-item item={tabsTitle[1]}>
                      {renderCustomerInfo()}
                    </g-tab-item>
                  </g-tabs>
                  <div class="dialog-keyboard">
                    <div style="flex: 1" onClick={() => showCustomerDialog.value = false}/>
                    <div class="keyboard-wrapper">
                      <pos-keyboard-full class="dialog-keyboard" type="alpha-number"
                                         onEnterPressed={onDialogSubmitCustomerForOrder}/>
                    </div>
                  </div>
                </div>
            ))()
          }
        </g-dialog>
      </div>
    }
    //</editor-fold>


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
                : <div style="height: 100%">
                    {renderTopRightToolbar()}
                    <pos-retail-cart
                        is-refund-mode={isRefundMode.value}
                        style={`max-height: calc(100% - ${topRightToolbarHeight}); height: calc(100% - ${topRightToolbarHeight});`}/>
                  </div>
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
}

.dialog {
  width: 100%;
  background: rgba(21, 21, 21, 0.42);
  display: flex;

  &-left {
    flex: 0 0 45%;
    background-color: white;
    padding: 4px;
    overflow: auto;

    ::v-deep .g-tf-wrapper {
      margin: 4px 2px 4px;
      width: auto;

      fieldset {
        border-width: 1px !important;
        border-color: #9e9e9e;
      }

      &.g-tf__focused fieldset {
        border-color: #1271FF;
      }

      .g-tf-input {
        font-size: 14px;
        padding: 4px;
      }

      .g-tf-label {
        font-size: 14px;
        top: 4px;

        &__active {
          transform: translateY(-13px) translateX(7px) scale(0.75) !important;
        }
      }
    }
  }

  &-keyboard {
    flex: 0 0 55%;
    display: flex;
    flex-direction: column;

    .keyboard-wrapper {
      padding: 4px;
      background-color: #f0f0f0;
    }
  }
}
</style>
