<script>
import dialogMultiPayment from '../../../components/posOrder/dialogMultiPayment';
import {computed, ref, watch} from "vue";
import {$filters, avatar, isMobile, username} from "../../AppSharedStates";
import {useI18n} from "vue-i18n";
import {
  finishSplitOrder,
  getCurrentOrder,
  makeSplitOrder,
  moveItemToSecondOrder,
  order2,
  returnItem
} from "../pos-logic-be";
import {getItemSubtext, isItemDiscounted, itemsRenderFactory} from "../pos-ui-shared";
import {useRouter} from "vue-router";
import {genScopeId, internalValueFactory} from "../../utils";

//todo: make run with new logic
export default {
  name: 'PosOrderSplitOrder2',
  components: {dialogMultiPayment},
  props: {
    modelValue: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const order = getCurrentOrder();
    const {t, locale} = useI18n();
    const internalValue = internalValueFactory(props, {emit});

    const showMultiPaymentDialog = ref(false);
    //use for show receipt, why don't use router
    const showReceiptDialog = ref(false);
    const paying = ref(false);

    const disablePayment = computed(() => paying.value || !order2.vSum)

    const back = () => internalValue.value = false;

    function saveMultiPayment(payment) {
      //fixme: maybe remove it later
      const paymentMethod = _.map(payment, (value, key) => {
        return {
          type: key,
          value
        }
      });

      //todo: finishSplitOrder
      finishSplitOrder();
      //_createOrder(paymentMethod)
      showMultiPaymentDialog.value = false
    }

    const router = useRouter();

    function complete() {
      showReceiptDialog.value = false
      internalValue.value = false

      router.push({path: '/pos-dashboard'})
    }

    //todo: print base on pay order hooks, not from frontend
    function printReceipt(order) {
      if (order) return emit('printOrderReport', order)
      order2.items.forEach(order => emit('printOrderReport', order))
    }

    //todo: update payment
    function updateSplitPayment() {
    }

    watch(() => props.modelValue, () => {
      paying.value = false;
      if (props.modelValue) {
        makeSplitOrder();
      }
    })

    const itemsRender = itemsRenderFactory();

    const splitterStyle = isMobile.value ? {height: 'calc(100% - 20px)'} : {height: 'calc(100% - 84px)'}
    //todo: removeModifier

    const contentRender = genScopeId(() => (<>
      <div class="row-flex justify-end w-100">
        <div class="splitter" style={splitterStyle}>
          {isMobile.value ?
              <div class="splitter__header row-flex align-items-center">
                <g-btn-bs uppercase={false}
                          background-color="#1271ff" disabled={!order2.items.length}
                          onClick={() => showReceiptDialog.value = true}>
                  <g-icon size="20" class="mr-2">icon-receipt3</g-icon>
                  <span>{t('restaurant.viewReceipt')}</span>
                </g-btn-bs>
                {order2.items.length && <g-spacer/>}
                {order2.items.length && <div>
                  <span style="font-weight: 700; font-size: 15px">Split: </span>
                  <span style="font-weight: 600; color: #ff4452">{order2.items.length}</span>
                </div>}
                <g-spacer/>
                <div style="font-weight: 600; color: #ff4452">
                  {t('common.currency', locale)} {$filters.formatCurrency(order2.vSum)}
                </div>
              </div>
              :
              <div class="splitter__header">
                <p>
                  Total:
                  <span style="font-size: 18px; color: #ff4452">
                    {$filters.formatCurrency(order2.vSum)}
                  </span>
                </p>
              </div>
          }

          <div class="splitter__content">
            {itemsRender(order2.items, returnItem)}

          </div>
          <div class="splitter__actions">
            <g-btn-bs class="splitter__actions-btn" background-color="#046EFF" disabled={disablePayment.value}
                      style="border-radius: 0 0 0 6px"
                      onClick={() => _createOrder([{type: 'cash', value: order2.vSum}])}>
              <g-icon size="36">icon-cash</g-icon>
            </g-btn-bs>
            <g-btn-bs class="splitter__actions-btn" background-color="#0EA76F" disabled={disablePayment.value}
                      onClick={() => _createOrder([{type: 'card', value: order2.vSum}])}>
              <g-icon size="36">icon-credit_card</g-icon>
            </g-btn-bs>
            <g-btn-bs class="splitter__actions-btn" background-color="#795548" disabled={disablePayment.value}
                      style="border-radius: 0 0 6px 0"
                      onClick={() => showMultiPaymentDialog.value = true}>
              <g-icon size="36">icon-multi_payment</g-icon>
            </g-btn-bs>
          </div>
        </div>

        <g-icon class="mr-4 ml-4" size="40" color="#fff" style="height: calc(100% - 64px)">
          keyboard_backspace
        </g-icon>

        <div class="order-detail" style={isMobile.value ? {height: '100%'} : {height: 'calc(100% - 64px)'}}>
          <div class="order-detail__header row-flex align-items-center">
            <div>
              <g-avatar size="36">
                <img alt src={avatar.value}/>
              </g-avatar>
              <span class="ml-1 fw-700" style="font-size: 13px">{username.value}</span>
            </div>
            {isMobile.value && <g-spacer/>}
            {isMobile.value &&
            <g-btn-bs class="elevation-1 btn-back" onClick={back}>
              <g-icon>icon-back</g-icon>
            </g-btn-bs>}
            <g-spacer/>
            <div style="font-size: 18px; color: #ff4452">
              {t('common.currency', locale)} {$filters.formatCurrency(order.vSum)}
            </div>
          </div>
          <div class="order-detail__content">
            {itemsRender(order.items, moveItemToSecondOrder)}
          </div>
        </div>
      </div>

      {!isMobile.value && <g-toolbar elevation="0" color="#eee" class="toolbar">
        <g-btn-bs icon="icon-back" onClick={back}>{t('ui.back')}</g-btn-bs>
        <g-spacer/>
        {order2.items.length && <span class="ml-2 mr-2">Split: {order2.items.length}</span>}
        <g-btn-bs uppercase={false} background-color="#1271ff" disabled={!order2.items.length}
                  onClick={() => showReceiptDialog.value = true}>
          View receipt
        </g-btn-bs>
      </g-toolbar>}
    </>))

    return genScopeId(() => (
        <>
          <g-dialog v-model={internalValue.value} transition={false} content-class="split-order-dialog">
            {contentRender()}
          </g-dialog>

          <dialog-multi-payment v-model={showMultiPaymentDialog.value}
                                total={order2.vSum}
                                onSubmit={saveMultiPayment}/>

          <pos-order-receipt v-model={showReceiptDialog.value} order={order2}
                             store-locale={locale} split
                             onUpdatePayment={updateSplitPayment}
                             onComplete={complete}
                             onPrint={printReceipt}/>
        </>
    ))
  }
}
</script>

<style scoped lang="scss">
.splitter {
  background: #fff;
  flex-basis: 40%;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  margin: 10px 0;

  &__header {
    padding: 0 8px;
    position: relative;

    .g-btn-bs {
      margin: 0;
    }
  }

  &__content {
    border-radius: 8px;
    border: 1px solid #e8e8e8;
    overflow: scroll;
    flex-grow: 1;
    margin: 8px;
    position: relative;
  }

  &__actions {
    display: flex;
    flex-direction: row;
    align-items: center;

    &-btn {
      flex: 1;
      margin: 0;
      border-radius: 0;
    }
  }
}

.order-detail {
  background: #fff;
  flex-basis: 30%;
  padding: 0 8px;
  position: relative;

  &__header {
    padding: 8px 0;
    display: flex;
    align-items: center;

    .btn-back {
      width: 37px;
      height: 37px;
      border-radius: 50%;
      margin: 0;

      & > .g-icon {
        min-width: 24px;
      }
    }
  }

  &__content {
    border-radius: 8px;
    border: 1px solid #e8e8e8;
    overflow: scroll;
    margin-bottom: 3px;
  }
}

.item {
  padding: 8px;

  &:nth-child(even) {
    background-color: #f8f8f8;
  }

  &-detail {
    display: flex;
    justify-content: space-between;
    cursor: pointer;

    &__name {
      font-weight: 700;
      font-size: 14px;
    }

    &__price {
      font-size: 12px;
      color: #616161;
      margin-right: 4px;

      &--new {
        font-size: 14px;
        color: #ff5252;
        margin-right: 4px;
      }
    }

    &__discount {
      text-decoration: line-through;
    }

    &__option {
      font-size: 12px;
      font-style: italic;
      font-weight: 700;
    }
  }
}

.toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 64px;
}

.g-btn-bs {
  background-color: white;
  font-size: 14px;
}

.blur-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(107, 111, 130, 0.7);
  z-index: 2;
}
</style>

<style lang="scss">
.split-order-dialog {
  height: 100% !important;
  max-height: 100% !important;
  width: 100% !important;
  max-width: 100% !important;
}

.splitter__actions-menu {
  display: flex;
  flex-direction: column;
  transform: translateX(25%);

  .g-btn-bs {
    margin: 0;
    font-weight: 700;
    font-size: 16px;
  }
}
</style>
