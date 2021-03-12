<script>
import {genScopeId, internalValueFactory} from "../../utils";
import {getCurrentOrder} from "../pos-logic-be";
import {useI18n} from "vue-i18n";
import {computed, nextTick, ref, watch, withModifiers} from "vue";
import {addSinglePayment, calItemVSum, clearPayment, hooks, mergeSameItems} from "../pos-logic";
import {$filters, appHooks, posSettings} from "../../AppSharedStates";
import {useRouter} from "vue-router";
import _ from 'lodash';
import dialogMultiPayment from "../../Payment/Helpers/dialogMultiPayment";

export default {
  name: 'PosOrderReceipt',
  components: {
    dialogMultiPayment
  },
  props: {
    modelValue: Boolean,
    split: Boolean,
    splitOrders: Array,
    order: Object
  },
  //fixme
  emits: ['update:modelValue', 'updatePayment', 'updateCurrentOrder', 'printOrderReport', 'saveRestaurantOrder', 'print', 'complete'],
  setup(props, {emit}) {
    const internalValue = internalValueFactory(props, {emit});
    const order = props.order || getCurrentOrder();
    const {t, locale} = useI18n();
    const store = computed(() => {
      if (!posSettings.value.companyInfo) appHooks.emit('settingChange');
      return posSettings.value.companyInfo || {};
    })

    const menu = ref([]);
    const dialog = ref({multi: false, tip: false});
    const tempSplit = ref({});
    const tipEditValue = ref('');
    const paymentMethodMenu = ref(false);
    const paymentMethods = [
      {text: 'Cash', type: 'cash', icon: 'icon-cash'},
      {text: 'Card', type: 'card', icon: 'icon-credit_card'},
      {text: 'Multi', type: 'multi', icon: 'icon-multi_payment'},
    ];
    const printed = ref(null);
    const tipTextFieldRef = ref();

    const blurReceipt = computed(() => menu.value.some(i => i === true))
    const activeOrderPaymentItem = computed(() => {
      if (!order.payment || order.payment.length === 0) return paymentMethods.find(i => i.type === 'cash')
      if (order.payment.length > 1) return paymentMethods.find(i => i.type === 'multi')
      else if (!order.payment.length) return {}
      return paymentMethods.find(i => i.type === order.payment[0].type)
    })
    const paymentMethodMenuItems = computed(() => {
      return paymentMethods.filter(i => i.type !== activeOrderPaymentItem.value.type);
    })

    const orderItems = computed(() => {
      if (!props.split && order.items) {
        return mergeSameItems(order, false)
      }
      return []
    })

    //todo: analyse props.splitOrders
    menu.value = (props.splitOrders && props.splitOrders.map(() => false)) || [];

    watch(() => dialog.value.tip, () => {
      if (dialog.value.tip) {
        setTimeout(() => {
          if (!tipEditValue.value) tipEditValue.value = '' + tempSplit.value.vSum
          nextTick(() => tipTextFieldRef.value && tipTextFieldRef.value.$el.click())
        }, 500)
      }
    })

    function getIcon(type) {
      if (!order) return
      if (type === 'card') return 'icon-credit_card'
      if (type === 'cash') return 'icon-cash'
      if (type === 'tip') return 'icon-coin-box'
      return 'icon-multi_payment'
    }

    function getPaymentColor(payment, type) {
      if (payment.length > 1 && type === 'multi') return '#1271ff'
      if (payment.length === 1 && type === payment[0].type) return '#1271ff'
      return '#fff'
    }

    function openMultiDialog(seat) {
      tempSplit.value = seat
      dialog.value.multi = true
    }

    function formatModifiers(product) {
      return `(${product.modifiers.map(i => i.name).join(', ')})`
    }

    function getProductTotal(product) {
      return calItemVSum(product)
    }

    function saveMultiPayment(payment) {
      //fixme
      const formattedPayment = _.map(payment, (value, type) => ({type, value}))
      dialog.value.multi = false

      if (props.split) {
        emit('updatePayment', tempSplit.value._id, formattedPayment)
        tempSplit.value = {}
      } else {
        order.payment = formattedPayment;
      }
    }

    function savePayment(split, payment) {
      //fixme
      if (!split) {
        clearPayment(order);
        addSinglePayment(order, payment[0]);
      }
      emit('updatePayment', split._id, [{type: payment, value: split.vSum}])
    }

    async function print() {
      if (!props.split) {
        await hooks.emit('pay', true);
        internalValue.value = false
        printed.value = false
        router.go(-1)
      } else {

      }
    }

    function back() {
      if (props.split) {
        internalValue.value = false
        return;
      }
      internalValue.value = false
      printed.value = false
      clearPayment(order);
      //complete();
    }

    const router = useRouter();

    async function complete() {
      emit('complete');
      if (!props.split) {
        await hooks.emit('pay')

        internalValue.value = false
        printed.value = false
        router.go(-1)
      }
    }

    function setOrderPaymentMethod(item) {
      if (item.type === 'multi') {
        return openMultiDialog()
      }
      clearPayment(order)
      addSinglePayment(order, {type: item.type, value: order.vSum});
      //emit('updateCurrentOrder', 'payment', [{type: item.type, value: order.vSum}])
    }

    function showTipDialog(split) {
      if (split)
        tempSplit.value = split
      dialog.value.tip = true
    }

    function saveTip() {
      const tip = props.split ? (+tipEditValue.value) - tempSplit.value.vSum : (+tipEditValue.value) - order.vSum

      if (tip <= 0) {
        return
      }

      if (props.split) {
        tipEditValue.value = ''
        emit('updatePayment', tempSplit.value._id, [{type: 'card', value: tempSplit.value.vSum}], tip)
        tempSplit.value = {}
      } else {
        emit('updateCurrentOrder', 'tip', tip)
        emit('updateCurrentOrder', 'payment', [{name: 'card', value: +tipEditValue.value}])
      }

      dialog.value.tip = false
    }

    const contentRender = genScopeId(() => (<>
      <div class="receipt">
        <g-toolbar color="#EFEFEF">
          {genScopeId(() => <>
            <g-btn-bs width="120" icon="icon-back" class="elevation-2" onClick={back}>
              Back
            </g-btn-bs>
            <g-btn-bs width="120" icon="icon-print" class="elevation-2"
                      onClick={print}>
              Print
            </g-btn-bs>
            <g-btn-bs width="120" icon="icon-receipt2" style="white-space: unset" class="elevation-2">
              <div style="line-height: 0.9">
                <p>Company</p>
                <p>Receipt</p>
              </div>
            </g-btn-bs>
            {!props.split &&
            <g-menu v-model={paymentMethodMenu.value} close-on-content-click content-class="menu-payment-option"
                    v-slots={{
                      activator: ({on}) => genScopeId(() =>
                          <g-btn-bs class="elevation-2" icon={activeOrderPaymentItem.value.icon} onClick={on.click}>
                            <div>{activeOrderPaymentItem.value.text}</div>
                          </g-btn-bs>
                      )()
                      ,
                      default: () => genScopeId(() =>
                          <div class="col-flex">
                            {paymentMethodMenuItems.value.map((item, index) =>
                                <g-btn-bs
                                    class="ml-0 mr-0"
                                    icon={item.icon}
                                    onClick={() => setOrderPaymentMethod(item)}
                                    key={`paymentMethodMenuItems-${index}`}
                                >
                                  <div>{item.text}</div>
                                </g-btn-bs>)}
                          </div>
                      )()
                    }}>
            </g-menu>}
            <g-spacer/>
            <g-btn-bs width="120" background-color="#0EA76F" icon="icon-complete" class="elevation-2"
                      onClick={complete}>
              Complete
            </g-btn-bs>
          </>)()}
        </g-toolbar>
        <div class="receipt-main">
          <div class="receipt-main__header">
            <div class="receipt-main__header-title">{store.value.name}</div>
            <div class="receipt-main__header-subtitle">{store.value.address}</div>
            <div class="receipt-main__header-subtitle">
              <span class="mr-3">Tel: {store.value.telephone}</span>
              <span>VAT Reg No: {store.value.taxNumber}</span>
            </div>
          </div>
          <div class="receipt-main__title">Table: {order.table}</div>
          {props.split ? <>
                {props.splitOrders.map((split, i) => <>
                  <div class="receipt-main__item" key={split._id}>
                    <div class="row-flex align-items-center">
                      <g-menu v-model={menu[i]} nudge-bottom="10" content-class="menu-receipt-action" v-slots={{
                        activator: ({on}) => genScopeId(() =>
                            <div onClick={on.click}
                                 class={['receipt-main__item-seat', menu[i] && 'receipt-main__item-seat--selected']}>
                              Seat {i + 1}
                            </div>
                        )()
                        ,
                        default: () => genScopeId(() =>
                            <div class="menu-seat-btn">
                              <div class="menu-seat-btn--payment">
                                <g-btn-bs width="100" icon="icon-print" class="elevation-2"
                                          onClick={withModifiers(() => print(split), ['stop'])}>
                                  Print
                                </g-btn-bs>
                                <g-btn-bs width="100" class="elevation-2">
                                  Bewirtung
                                </g-btn-bs>
                              </div>
                              <div class="menu-seat-btn--payment">
                                <g-btn-bs width="100" icon="icon-credit_card"
                                          background-color={getPaymentColor(split.payment, 'card')}
                                          class="elevation-2"
                                          onClick={withModifiers(() => savePayment(split, 'card'), ['stop'])}>
                                  Card
                                </g-btn-bs>
                                <g-btn-bs width="100" icon="icon-cash"
                                          background-color={getPaymentColor(split.payment, 'cash')}
                                          class="elevation-2"
                                          onClick={withModifiers(() => savePayment(split, 'cash'), ['stop'])}>
                                  Cash
                                </g-btn-bs>
                                <g-btn-bs width="100" icon="icon-multi_payment"
                                          background-color={getPaymentColor(split.payment, 'multi')}
                                          class="elevation-2"
                                          onClick={withModifiers(() => openMultiDialog(split), ['stop'])}>
                                  Multi
                                </g-btn-bs>
                              </div>
                              <g-btn-bs width="100" icon="icon-email" class="elevation-2">
                                Email
                              </g-btn-bs>
                              <g-btn-bs width="100" icon="icon-coin-box" class="elevation-2"
                                        onClick={withModifiers(() => showTipDialog(split), ['stop'])}>
                                Trinkgeld
                              </g-btn-bs>
                            </div>
                        )()
                      }}/>

                      <g-spacer/>
                      {split.payment.map((p, iP) =>
                          <div class="receipt-main__item-total" key={`payment_${i}_${iP}`}>
                            <g-icon class="mr-1">{getIcon(p.type)}</g-icon>
                            <span>{t('common.currency', locale)} {p.value}</span>
                          </div>)}
                      {split.tip ?
                          <div class="receipt-main__item-total">
                            <g-icon class="mr-1">{getIcon('tip')}</g-icon>
                            <span>{t('common.currency', locale)} {split.tip}</span>
                          </div> : null}
                    </div>
                    <div class="receipt-main__item-header">
                      <div class="col-1">Q.ty</div>
                      <div class="col-9 pl-2">Item name</div>
                      <div class="col-2 ta-right">Total</div>
                    </div>
                    {split.items.map((item, j) =>
                        <div class="receipt-main__item-row" key={`item_${i}_${j}`}>
                          <div class="col-1">{item.quantity}</div>
                          <div class="col-9 pl-2">
                            <div>{item.name}</div>
                            {(item.modifiers && item.modifiers.length) &&
                            <div class="receipt-main__item-row__modifier">
                              {formatModifiers(item)}
                            </div>}
                          </div>
                          <div class="col-2 ta-right">{$filters.formatCurrency(getProductTotal(item))}</div>
                        </div>)}
                  </div>
                </>)}
              </> :
              <div class="receipt-main__item">
                <div class="row-flex align-items-center">
                  <g-spacer/>
                  {_.map(order.payment, (p, iP) =>
                      <div class="receipt-main__item-total" key={`payment_${iP}`}>
                        <g-icon class="mr-1">{getIcon(p.type)}</g-icon>
                        <span>{t('common.currency', locale)} {p.value}</span>
                      </div>)}
                </div>
                <div class="receipt-main__item-header">
                  <div class="col-1">Q.ty</div>
                  <div class="col-9">Item name</div>
                  <div class="col-2 ta-right">Total</div>
                </div>
                {orderItems.value.map(item =>
                    <div class="receipt-main__item-row" key={item._id.toString()}>
                      <div class="col-1">{item.quantity}</div>
                      <div class="col-9">
                        <div>{item.name}</div>
                        {(item.modifiers && item.modifiers.length) ?
                            <div class="receipt-main__item-row__modifier">
                              {formatModifiers(item)}
                            </div> : null}
                      </div>
                      <div class="col-2 ta-right">{$filters.formatCurrency(getProductTotal(item))}</div>
                    </div>)}
              </div>}
        </div>
      </div>
      <div class="blur-overlay" v-show={blurReceipt.value}/>
    </>))

    function renderMultiPaymentDialog() {
      return (
          <dialog-multi-payment
              rotate
              v-model={dialog.value.multi}
              total={props.split ? tempSplit.vSum : order.vSum}
              onSubmit={saveMultiPayment}/>
      )
    }

    function renderTipDialog() {
      return (
          <dialog-form-input
              width="40%"
              v-model={dialog.value.tip}
              keyboard-type="numeric"
              onSubmit={saveTip}
              keyboard-width="100%"
              rotate v-slots={{
            input: () => (
                <pos-textfield-new
                    ref={tipTextFieldRef}
                    label="Card Payment"
                    v-model={tipEditValue.value}
                    clearable/>
            )
          }}>
          </dialog-form-input>
      )
    }

    return genScopeId(() => <>
      <g-dialog fullscreen v-model={internalValue.value}>
        {contentRender()}
      </g-dialog>
      { renderMultiPaymentDialog() }
      { renderTipDialog() }
    </>)
  }
}
</script>
<style scoped lang="scss">
.blur-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
}

.receipt {
  transform: rotate(-90deg);
  transform-origin: left top;
  width: 100vh;
  height: 100vw !important;
  position: absolute;
  top: 100%;
  left: 0;
  display: flex;
  flex-direction: column;

  .g-toolbar {
    flex: 0 0 64px !important;
  }

  &-main {
    padding: 32px;
    background-color: white;
    flex: 1;
    overflow: scroll;

    &__header {
      margin-bottom: 32px;
      text-align: center;

      &-title {
        font-size: 20px;
        font-weight: 700;
      }

      &-subtitle {
        font-size: 12px;
        line-height: 14px;
      }
    }

    &__title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    &__item {
      margin-bottom: 36px;

      &-seat {
        width: 100px;
        height: 36px;
        line-height: 36px;
        font-weight: 700;
        background: #FFFFFF;
        border: 1px solid #D0D0D0;
        border-radius: 2px;
        text-align: center;

        &--selected {
          border-color: #1271FF;
          background: #E3F2FD;
        }
      }

      &-total {
        font-weight: 700;
        margin-left: 4px;
        padding: 0 4px;

        & + .receipt-main__item-total {
          border-left: 1px solid black;
        }
      }

      &-header {
        display: flex;
        align-items: center;
        border-top: 1px dashed black;
        border-bottom: 1px dashed black;
        margin: 12px 0 4px;
        padding: 4px 0;
        font-weight: 700;
      }

      &-row {
        display: flex;
        align-items: center;
        padding: 4px 0;

        &__modifier {
          font-style: italic;
          font-size: 12px;
        }
      }
    }
  }
}

.g-btn-bs {
  font-size: 14px;
  background-color: white;
}

.menu-seat-btn {
  display: flex;
  align-items: flex-start;
  padding: 8px;
  background-color: white;

  &--payment {
    display: flex;
    flex-direction: column;

    .g-btn-bs:nth-child(2) {
      margin-top: 8px;
      margin-bottom: 8px;
    }
  }
}

@media screen and (max-height: 599px) {
  .g-toolbar {
    .g-btn-bs {
      width: auto !important;
      font-size: 0;

      ::v-deep .g-icon {
        margin-right: 0 !important;
      }
    }
  }

  .receipt-main__item-header {
    font-size: 14px;
  }

  .menu-seat-btn {
    flex-direction: column;

    .g-btn-bs {
      margin-bottom: 8px;
      margin-left: 0;
    }

    &--payment {
      flex-direction: row;
    }
  }
}
</style>

<style lang="scss">
.menu-receipt-action {
  transform: rotate(-90deg) translateX(calc(-100% + 16px)) translateY(40px);
  transform-origin: left top;
}

.menu-payment-option {
  transform: rotate(-90deg) translateY(40px);
  transform-origin: left top;
}
</style>
