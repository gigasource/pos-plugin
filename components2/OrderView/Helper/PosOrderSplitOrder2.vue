<script>
import orderUtil from '../../../components/logic/orderUtil';
import {v4 as uuidv4} from 'uuid';
import dialogMultiPayment from '../../../components/posOrder/dialogMultiPayment';
import {computed} from "vue";
import {$filters, avatar, isMobile, username} from "../../AppSharedStates";
import {useI18n} from "vue-i18n";
import {getCurrentOrder} from "../pos-logic-be";
import {getItemSubtext} from "../pos-ui-shared";
import {useRouter} from "vue-router";

export default {
  name: 'PosOrderSplitOrder2',
  components: {dialogMultiPayment},
  props: {
    modelValue: Boolean,
  },
  emits: ['update:modelValue', 'saveSplitOrder', 'updateCurrentOrder', 'updatePrintedOrder', 'resetOrderData', 'printOrderReport', 'createOrderCommit'],
  setup(props, {emit}) {
    const order = getCurrentOrder();
    const {i18n, locale} = useI18n();
    const internalValue = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val)
    })
    const remainingItems = ref([]);
    const splitOrders = ref([]);
    const currentSplitOrder = ref([]);
    const showPaymentMethodsMenu = ref(false);
    const showMultiPaymentdialog = ref(false);
    const showReceipt = ref(false);
    const splitId = ref();
    const paying = ref(false);
    const itemsWithQty = computed(() => {
      if (remainingItems) return remainingItems.filter(i => i.quantity > 0)
      return [];
    })

    //fixme
    function getTotal(items) {
      if (!items) return 0
      return orderUtil.calOrderTotal(items) + orderUtil.calOrderModifier(items)
    }

    const totalLeft = computed(() => {
      return getTotal(remainingItems.value)
    })
    const totalCurrent = computed(() => {
      return getTotal(currentSplitOrder.value)
    })
    const orderWithSplits = computed(() => {
      return Object.assign({}, order, {splits: splitOrders.value})
    })
    const disablePayment = computed(() => {
      return paying.value || !totalCurrent.value
    })

    function back() {
      internalValue.value = false;
    }

    function isItemDiscounted(item) {
      return item.originalPrice > item.price
    }

    function addToSplitOrder(item) {
      if (item.quantity > 1) {
        const existingItem = currentSplitOrder.value.find(i => i._id === item._id)
        if (existingItem) {
          existingItem.quantity++
        } else {
          currentSplitOrder.value.push({...item, quantity: 1})
        }
        item.quantity--
        return
      }
      const existingItem = currentSplitOrder.value.find(i => i._id === item._id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        currentSplitOrder.value.push({...item, quantity: 1})
      }
      remainingItems.value.splice(remainingItems.value.indexOf(item), 1)
    }

    function returnItem(item) {
      if (item.quantity > 1) {
        const existingItem = remainingItems.value.find(i => i._id === item._id)
        if (existingItem) {
          existingItem.quantity++
        } else {
          remainingItems.value.push({...item, quantity: 1})
        }
        item.quantity--
        return
      }
      const existingItem = remainingItems.value.find(i => i._id === item._id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        remainingItems.value.push({...item, quantity: 1})
      }
      currentSplitOrder.value.splice(currentSplitOrder.value.indexOf(item), 1)
    }

    function saveMultiPayment(payment) {
      const paymentMethod = _.map(payment, (value, key) => {
        return {
          type: key,
          value
        }
      });

      _createOrder(paymentMethod)
      showMultiPaymentdialog.value = false
    }

    function _createOrder(paymentMethod) {
      showPaymentMethodsMenu.value = false
      const isLastSplit = remainingItems.value.length === 0;
      emit('saveSplitOrder', currentSplitOrder.value, paymentMethod, isLastSplit,
          order => {
            paying.value = false
            currentSplitOrder.value = []

            if (order) {
              splitOrders.value.push(order)
              const newItems = _.cloneDeep(remainingItems.value)
              const printedItems = newItems.filter(i => i.printed);
              emit('updateCurrentOrder', 'items', newItems)
              emit('updatePrintedOrder', 'items', printedItems)
              if (!isLastSplit)
                if (order._id) emit('createOrderCommit', {key: 'items', value: printedItems})
            }

            if (isLastSplit) showReceipt.value = true
          })
      paying.value = true
    }

    function updateSplitPayment(_id, payment, tip) {
      //todo: test backend
      cms.socket.emit('update-split-payment', _id, payment, ({order, error}) => {
        if (error) return console.log(error)
        const split = splitOrders.value.find(i => i._id === _id)
        split.payment = payment

        // TODO: tip is not saved on backend yet
        split['tip'] = tip
      })
    }

    const router = useRouter();

    function complete() {
      showReceipt.value = false
      internalValue.value = false
      if (remainingItems.value.length > 0) return

      emit('resetOrderData')
      emit('updateCurrentOrder', 'table', null)
      router.push({path: '/pos-dashboard'})
    }

    function printReceipt(order) {
      if (order) return emit('printOrderReport', order)
      splitOrders.value.forEach(order => emit('printOrderReport', order))
    }

    watch(props.modelValue, () => {
      //fixme
      currentSplitOrder.value = []
      splitOrders.value = []
      remainingItems.value = _.cloneDeep(order.items)
      paying.value = false

      if (val) {
        if (order.splitId) {
          splitId.value = order.splitId
        } else {
          splitId.value = uuidv4()
          emit('updateCurrentOrder', 'splitId', splitId.value)
          if (order._id) {
            emit('createOrderCommit', {key: 'splitId', value: splitId.value})
          }
        }

        if (order.items) {
          remainingItems.value = _.cloneDeep(order.items)
        }
      }
    })

    const splitterStyle = isMobile.value ? {height: 'calc(100% - 20px)'} : {height: 'calc(100% - 84px)'}
    //todo: removeModifier
    return () => (
        <div>
          <g-dialog v-model={internalValue} transition={false} content-class="split-order-dialog">
            <div class="row-flex justify-end w-100">
              <div class="splitter" style={splitterStyle}>
                {isMobile ?
                    <div class="splitter__header row-flex align-items-center">
                      {showPaymentMethodsMenu && <div class="blur-overlay"/>}
                      <g-btn-bs uppercase={false}
                                background-color="#1271ff" disabled={!splitOrders.value.length}
                                onClick_stop={() => showReceipt.value = true}>
                        <g-icon size="20" class="mr-2">icon-receipt3</g-icon>
                        <span>{$t('restaurant.viewReceipt')}</span>
                      </g-btn-bs>
                      {splitOrders.length && <g-spacer/>}
                      {splitOrders.length && <div>
                        <span style="font-weight: 700; font-size: 15px">Split: </span>
                        <span style="font-weight: 600; color: #ff4452">{splitOrders.length}</span>
                      </div>}
                      <g-spacer/>
                      <div style="font-weight: 600; color: #ff4452">
                        {$t('common.currency', locale)} {$filters.formatCurrency(totalCurrent)}
                      </div>
                    </div>
                    :
                    <div class="splitter__header">
                      {showPaymentMethodsMenu && <div class="blur-overlay"/>}
                      <p>
                        Total:
                        <span style="font-size: 18px; color: #ff4452">
                          {$filters.formatCurrency(totalCurrent)}
                        </span>
                      </p>
                    </div>
                }

                <div class="splitter__content">
                  {showPaymentMethodsMenu.value && <div class="blur-overlay"/>}
                  {currentSplitOrder.value.map(item => (
                      <>
                        <div class="item">
                          <div class="item-detail" onClick_stop={returnItem(item)}>
                            <div>
                              <p class="item-detail__name" style={[item.printed && {opacity: 0.55}]}>
                                {item.id && `${item.id}. `}{item.name}</p>
                              <p>
                                <span class={['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']}>
                                  {$t('common.currency', locale)}{$filters.formatCurrency(item.originalPrice)}
                                </span>
                                {isItemDiscounted(item) &&
                                <span class="item-detail__price--new">
                                  {$t('common.currency', locale)} {$filters.formatCurrency(item.price)}
                                </span>
                                }
                                <span class={['item-detail__option', 'text-red-accent-2']}>
                                  {getItemSubtext(item)}
                                </span>
                              </p>
                            </div>
                            <div class="mr-2 fw-700 row-flex align-items-center"
                                 style="font-size: 18px">{item.quantity}</div>
                          </div>
                          {item.modifiers && <div>
                            {item.modifiers.map(modifier => (
                                <g-chip label small text-color="#616161">
                                  {modifier.name} |
                                  {$t('common.currency', locale)} {$filters.formatCurrency(modifier.price)}
                                </g-chip>
                            ))}

                          </div>}
                        </div>
                      </>
                  ))}

                </div>
                <div class="splitter__actions">
                  <g-btn-bs class="splitter__actions-btn" background-color="#046EFF" disabled={disablePayment}
                            style="border-radius: 0 0 0 6px"
                            onClick_stop={_createOrder([{type: 'cash', value: totalCurrent}])}>
                    <g-icon size="36">icon-cash</g-icon>
                  </g-btn-bs>
                  <g-btn-bs class="splitter__actions-btn" background-color="#0EA76F" disabled={disablePayment}
                            onClick_stop={_createOrder([{type: 'card', value: totalCurrent}])}>
                    <g-icon size="36">icon-credit_card</g-icon>
                  </g-btn-bs>
                  <g-btn-bs class="splitter__actions-btn" background-color="#795548" disabled={disablePayment}
                            style="border-radius: 0 0 6px 0"
                            onClick_stop={() => showMultiPaymentdialog.value = true}>
                    <g-icon size="36">icon-multi_payment</g-icon>
                  </g-btn-bs>
                </div>
              </div>

              <g-icon class="mr-4 ml-4" size="40" color="#fff" style="height: calc(100% - 64px)">keyboard_backspace
              </g-icon>

              <div class="order-detail" style={isMobile.value ? {height: '100%'} : {height: 'calc(100% - 64px)'}}>
                {showPaymentMethodsMenu.value && <div class="blur-overlay"/>}
                <div class="order-detail__header row-flex align-items-center">
                  <div>
                    <g-avatar size="36">
                      <img alt src={avatar.value}/>
                    </g-avatar>
                    <span class="ml-1 fw-700" style="font-size: 13px">{username.value}</span>
                  </div>
                  {isMobile.value && <g-spacer/>}
                  {isMobile.value &&
                  <g-btn-bs class="elevation-1 btn-back" onClick="back">
                    <g-icon>icon-back</g-icon>
                  </g-btn-bs>}
                  <g-spacer/>
                  <div style="font-size: 18px; color: #ff4452">
                    {$t('common.currency', locale)} {$filters.formatCurrency(totalLeft)}
                  </div>
                </div>
                <div class="order-detail__content">
                  {itemsWithQty.value.map(item => (
                      <div class="item" onClick_stop={addToSplitOrder(item)}>
                        <div class="item-detail">
                          <div>
                            <p class="item-detail__name" style={[item.printed && {opacity: 0.55}]}>
                              {item.id && `${item.id}. `} {item.name}</p>
                            <p>
                              <span
                                  class={['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']}>
                                {$t('common.currency', locale)} {$filters.formatCurrency(item.originalPrice)}
                              </span>
                              {isItemDiscounted(item) &&
                              <span class="item-detail__price--new">
                                {$t('common.currency', locale)} {$filters.formatCurrency(item.price)}
                              </span>}
                              <span class={['item-detail__option', 'text-red-accent-2']}>
                                {getItemSubtext(item)}
                              </span>
                            </p>
                          </div>
                          <div class="mr-2 fw-700 row-flex align-items-center"
                               style="font-size: 18px">{item.quantity}</div>
                        </div>
                        {item.modifiers && <div>
                          {
                            item.modifiers.map(modifier => (
                                <g-chip label small text-color="#616161" close close={removeModifier(item, index)}>
                                  {modifier.name} |
                                  {$t('common.currency', locale)}{$filters.formatCurrency(modifier.price)}
                                </g-chip>
                            ))
                          }
                          }
                        </div>}
                      </div>
                  ))}
                </div>
              </div>
            </div>

            <g-toolbar elevation="0" color="#eee" class="toolbar" v-if="!isMobile">
              <g-btn-bs icon="icon-back" onClick_stop={back}>{$t('ui.back')}</g-btn-bs>
              <g-spacer/>
              <span class="ml-2 mr-2" v-if="splitOrders.length">Split: {splitOrders.value.length}</span>
              <g-btn-bs uppercase={false} background-color="#1271ff" disabled={!splitOrders.value.length}
                        onClick_stop={() => showReceipt.value = true}>
                View receipt
              </g-btn-bs>
            </g-toolbar>
          </g-dialog>

          <dialog-multi-payment v-model={showMultiPaymentdialog}
                                total={totalCurrent}
                                store-locale={locale}
                                onSubmit={saveMultiPayment}
          />

          <pos-order-receipt v-model={showReceipt} order={orderWithSplits} store-locale={locale} split
                             onUpdatePayment={updateSplitPayment}
                             onComplete={complete}
                             onPrint={printReceipt}/>
        </div>
    )
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
