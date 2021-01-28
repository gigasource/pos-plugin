<script>
import { ref, computed, withModifiers, watch } from 'vue'
import orderUtil from '../../components/logic/orderUtil';
import { CALL_SYSTEM_MODES } from '../../components/constants';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { $filters } from '../AppSharedStates';
import { pendingReservationsLength } from '../../composition/usePosLogic';
import { renderPendingOrdersFactory } from "./online-order-main-pending-orders-render";

export default {
  props: {
    pendingOrders: Array,
    kitchenOrders: Array,
    defaultPrepareTime: Number,
    onlineOrderSorting: String
  },
  setup(props, { emit }) {
    const { t, locale } = useI18n()
    const router = useRouter()
    const pendingOrders = ref(props.pendingOrders)
    const defaultPrepareTime = ref(props.defaultPrepareTime)
    const kitchenOrders = ref(props.kitchenOrders)
    const onlineOrderSorting = ref(props.onlineOrderSorting)
    const showDialog = ref(false)
    const decimals = ref(2)
    const dialog = ref({
      order: {},
      reason: false,
      reservation: false,
      createOrder: false
    })
    const dialogRef = ref(null)

    ///todo:
    const selectedCustomer = ref(null)
    const orderType = ref(null)

    const timeoutInterval = ref({})
    const timeoutProgress = ref({})
    const modemDeviceConnected = ref(null)
    const sortedKitchenOrders = computed(() => {
      if (onlineOrderSorting.value) return kitchenOrders.value.sort((current, next) => {
        if (onlineOrderSorting.value === 'order' && current.id && next.id) {
          return next.id - current.id
        }
        return getPendingOrderKitchenTime(current) - getPendingOrderKitchenTime(next)
      })
      return kitchenOrders
    })


    function getPaymentIcon(payment) {
      let paymentMethod = cms.getList('PosSetting')[0].payment.find(i => i.name === payment[0].type)
      return paymentMethod && paymentMethod.icon
    }

    function declineOrder(order) {
      emit('declineOrder', order)
      emit('getPendingOnlineOrderCounter')
    }

    function acceptOrder(order) {
      emit('acceptPendingOrder', order)
      emit('getPendingOnlineOrderCounter')
    }

    function completeOrder(order) {
      emit('completeOrder', order)
    }

    function onClickAccept(order) {
      if (order.deliveryTime !== 'asap') return acceptOrder(order)
      if (order.declineStep2) order.declineStep2 = false
      if (!order.confirmStep2) return order.confirmStep2 = true
      if (!order.prepareTime) order.prepareTime = defaultPrepareTime
      acceptOrder(order)
    }

    function onClickDecline(order) {
      if (order.confirmStep2) return order.confirmStep2 = false
      if (!order.declineStep2) return order.declineStep2 = true
    }

    function openDialog(order) {
      if (dialogRef.value) dialogRef.value.showDialog(order)
    }

    function onBack(order) {
      order.declineStep2 = false
      order.confirmStep2 = false
    }

    function openDialogReason(order) {
      dialog.order = order
      dialog.reason = true
    }

    function submitReason(reason) {
      const order = internalOrders.find(o => o._id === dialog.order._id)
      order.declineReason = reason
    }

    function getDeliveryDate(order) {
      return dayjs(order.date).add(order.prepareTime, 'minute').toDate()
    }

    function getShippingFee(order) {
      if (!order.discounts) return order.shippingFee

      const freeShipping = order.discounts.find(item => item.type === 'freeShipping');
      return freeShipping ? freeShipping.value : order.shippingFee;
    }

    function getTimeoutProgress(order) {
      const calc = () => {
        clearTimeout(timeoutInterval[order._id])
        requestAnimationFrame(() => {
          const now = new Date()
          const diff = dayjs(order.timeoutDate).diff(now, 'second', true);
          const timeout = dayjs(order.timeoutDate).diff(order.date, 'second', true)
          if (diff <= 0) {
            emit('getPendingOnlineOrderCounter')
            return timeoutProgress[order._id] = { progress: 0, remaining: 0 }
          }

          const x = (timeout - diff) / timeout
          const progress = 100 * (1 - Math.sin((x * Math.PI) / 2))

          order.timeoutProgress = progress
          timeoutProgress[order._id] = { progress, remaining: diff.toFixed(0) }
          timeoutInterval[order._id] = setTimeout(calc, 250)
        })
      }

      if (!order.timeoutDate) return
      return calc()
    }

    function getPendingOrderKitchenTime(order) {
      return dayjs(order.deliveryTime, 'HH:mm').diff(dayjs(), 'minute')
    }


    const {
      renderPendingOrders
    } = renderPendingOrdersFactory()

    return () =>
        <div class="main">
          <div class="pending-orders pr-2">
            <div class="header">
              <span>
                {t('onlineOrder.pendingOrders')} </span>
              {
                (internalOrders.value && internalOrders.value.length) &&
                <g-badge class="ml-1" inline modelValue={true} color="#4CAF50" v-slots={{
                  'badge': () =>
                      <div class="px-2">
                        {internalOrders.value.length} </div>
                }}>
                </g-badge>
              }
              <g-spacer></g-spacer>
              {
                (modemDeviceConnected.value === false) &&
                <span style="color: #D32F2F">
                  Modem not connected
                </span>
              }
            </div>
            <div class="content">
              {
                ((!internalOrders.value || !internalOrders.value.length) && calls.length === 0 && missedCalls.length === 0) ?
                    <div class="pending-orders--empty">
                      <img alt src="/plugins/pos-plugin/assets/pending_order.svg"> </img>
                      <p> {t('onlineOrder.noPending')} </p>
                    </div>
                    :
                    (
                        ((!internalOrders.value || !internalOrders.value.length) && (calls.length > 0 || missedCalls.length > 0)) ?
                            <>
                              {calls.value.map((call, i) =>
                                  <div class={['pending-orders--call', call.type === 'missed' && 'b-red']} key={`call_${i}`}>
                                    <div class='pending-orders--call-title'>
                                      <div>
                                        {call.customer.name} <span> - </span>
                                        {call.customer.phone}
                                      </div>
                                      <g-spacer></g-spacer>
                                      <g-icon size="20">
                                        icon-call
                                      </g-icon>
                                    </div>
                                    <p class="fs-small-2 text-grey-darken-1">
                                      {call.type === 'missed' ? 'Missed' : 'Incoming'} call
                                    </p>
                                    <div class="pending-orders--call-buttons">
                                      <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => deleteCall(i, call)}>
                                        <g-icon size="16">
                                          icon-cross-red
                                        </g-icon>
                                      </g-btn-bs>
                                      <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => openReservationDialog(call)}>
                                        <g-icon size="16">
                                          icon-table-reservation
                                        </g-icon>
                                      </g-btn-bs>
                                      <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => openOrderDialog(call, 'pickup')}>
                                        <g-icon size="16">
                                          icon-take-away
                                        </g-icon>
                                      </g-btn-bs>
                                      <g-btn-bs class="flex-equal" border-color="#C4C4C4" onClick={() => openOrderDialog(call, 'delivery')}>
                                        <g-icon size="16">
                                          icon-delivery-scooter
                                        </g-icon>
                                      </g-btn-bs>
                                    </div>
                                  </div>
                              )}
                              {missedCalls.map((call, i) =>
                                  <div class="pending-orders--call b-red" key={`missed_call_${i}`}>
                                    <div class="pending-orders--call-title">
                                      <div>
                                        {call.customer.name} <span> - </span>
                                        {call.customer.phone} </div>
                                      <g-spacer></g-spacer>
                                      <g-icon size="20">
                                        icon-missed-call
                                      </g-icon>
                                    </div>
                                    <p class="fs-small-2 text-grey-darken-1">
                                      Missed call </p>
                                    <div class="pending-orders--call-buttons">
                                      <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => deleteMissedCall(i)}>
                                        <g-icon size="16">
                                          icon-cross-red
                                        </g-icon>
                                      </g-btn-bs>
                                      <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => openReservationDialog(call)}>
                                        <g-icon size="16">
                                          icon-table-reservation
                                        </g-icon>
                                      </g-btn-bs>
                                      <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => openOrderDialog(call, 'pickup', i)}>
                                        <g-icon size="16">
                                          icon-take-away
                                        </g-icon>
                                      </g-btn-bs>
                                      <g-btn-bs class="flex-equal" border-color="#C4C4C4" onClick={() => openOrderDialog(call, 'delivery', i)}>
                                        <g-icon size="16">
                                          icon-delivery-scooter
                                        </g-icon>
                                      </g-btn-bs>
                                    </div>
                                  </div>
                              )} </>
                            :
                            <>
                              {calls.value.map((call, i) =>
                                  <div class="pending-orders--call" key={`call_${i}`}>
                                    <div class="pending-orders--call-title">
                                      <div>
                                        {call.customer.name} <span>
                                        - </span>
                                        {call.customer.phone} </div>
                                      <g-spacer></g-spacer>
                                      <g-icon>
                                        icon-call
                                      </g-icon>
                                    </div>
                                    <p class="fs-small-2 text-grey-darken-1">
                                      Incoming call </p>
                                    <div class="pending-orders--call-buttons">
                                      <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => deleteCall(i, call)}>
                                        <g-icon size="16">
                                          icon-cross-red
                                        </g-icon>
                                      </g-btn-bs>
                                      <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => openReservationDialog(call)}>
                                        <g-icon size="16">
                                          icon-table-reservation
                                        </g-icon>
                                      </g-btn-bs>
                                      <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => openOrderDialog(call, 'pickup')}>
                                        <g-icon size="16">
                                          icon-take-away
                                        </g-icon>
                                      </g-btn-bs>
                                      <g-btn-bs class="flex-equal" border-color="#C4C4C4" onClick={() => openOrderDialog(call, 'delivery')}>
                                        <g-icon size="16">
                                          icon-delivery-scooter
                                        </g-icon>
                                      </g-btn-bs>
                                    </div>
                                  </div>
                              )}
                              {missedCalls.value.map((call, i) =>
                                  <div class="pending-orders--call b-red" key={`call_${i}`} v-touch="getTouchHandlers(i)">
                                    <div class="pending-orders--call-title">
                                      <div>
                                        {call.customer.name} <span> - </span>
                                        {call.customer.phone} </div>
                                      <g-spacer></g-spacer>
                                      <g-icon size="20">
                                        icon-missed-call
                                      </g-icon>
                                    </div>
                                    <p class="fs-small-2 text-grey-darken-1">
                                      Missed call - {calcDiffTime(call.date)} </p>
                                    <p class="mt-1 fs-small text-grey-darken-1 fw-700">
                                      Swipe right to dismiss
                                      <g-icon color="grey darken-1" size="16">
                                        double_arrow </g-icon>
                                    </p>
                                  </div>
                              )}
                              {internalOrders.value.map((order, index) =>
                                  <g-card elevation="0" key={index}>
                                    <g-card-title class="pending-orders--title">
                                      <div class="row-flex align-items-center flex-grow-1">
                                        {
                                          (order.type === 'delivery') &&
                                          <g-icon>
                                            icon-delivery-scooter </g-icon>
                                        }
                                        {
                                          (order.type === 'pickup') &&
                                          <g-icon>
                                            icon-take-away </g-icon>
                                        }
                                        <div class="fs-small-2 ml-1" style="max-width: calc(100% - 24px); line-height: 1.2">
                                          <span class="fs-small fw-700 text-indigo-accent-2">
                                            #{order.dailyId}
                                          </span>

                                          {order.customer ? order.customer.name : 'No customer name'} -
                                          {order.customer ? order.customer.phone : 'No customer phone'}
                                        </div>
                                      </div>
                                      <div class="row-flex justify-end align-items-center r" style="flex: 0 0 auto">
                                        {
                                          (order.deliveryTime) &&
                                          <span class="fw-700 fs-small ml-2 mr-2" style="text-transform: uppercase">
                                            {order.deliveryTime} </span>
                                        }
                                        {
                                          (order.timeoutDate && timeoutProgress.value[order._id]) &&
                                          <>
                                            <g-progress-circular rotate="-90" width="1.5" size="36" color="#E57373" value={timeoutProgress.value[order._id].progress}></g-progress-circular>
                                            <div class="progress-remaining">
                                              {timeoutProgress.value[order._id].remaining} </div>
                                          </>
                                        }
                                      </div>
                                    </g-card-title>
                                    <g-card-text>
                                      {
                                        (order.note) &&
                                        <div class="text-grey-darken-1 i mb-1" style="font-size: 13px; line-height: 16px">

                                          {t('onlineOrder.note')}: {order.note}
                                        </div>
                                      }
                                      {
                                        (order.type === 'delivery') &&
                                        <div class="row-flex">
                                          <div style="flex: 0 0 25px">
                                            <g-icon color="#9E9E9E" size="20">
                                              icon-place
                                            </g-icon>
                                          </div>
                                          <div style="max-width: calc(100% - 25px);" class="flex-equal pl-1">

                                            {`${order.customer.address} ${order.customer.zipCode}`}
                                          </div>
                                        </div>
                                      }
                                      {
                                        (order.items) &&
                                        <div>
                                          {order.items.map(item =>
                                              <div class="row-flex align-items-start">
                                                <div style="flex: 0 0 25px; font-weight: 700; font-size: 12px">
                                                  {item.quantity}x
                                                </div>
                                                <div class="flex-equal fs-small-2 pl-1" style="word-break: break-all">

                                                  {item.id && `${item.id}.`} {item.name}
                                                  <span class="i text-grey">
                                                    {getExtraInfo(item)} </span>
                                                </div>
                                                <div class="fs-small-2 ta-right">
                                                  €{$filters.formatCurrency(getItemPrice(item), decimals.value)} </div>
                                              </div>
                                          )} </div>
                                      }
                                      {
                                        (order.type === 'delivery') &&
                                        <div class="row-flex">
                                          <div class="flex-equal fw-700">
                                            {t('onlineOrder.shippingFee')} </div>
                                          <div class="fs-small-2 ta-right">
                                            €{$filters.formatCurrency(order.shippingFee, decimals.value)} </div>
                                        </div>
                                      }
                                      {
                                        (order.discounts && order.discounts.length) &&
                                        <div>
                                          {order.discounts.map(discount =>
                                              <div class="row-flex align-items-start">
                                                <div>
                                                  <span>
                                                    {discount.coupon ? `Coupon ` : discount.name} </span>
                                                  {
                                                    (discount.coupon) &&
                                                    <span style="color: #757575; font-style: italic">
                                                      ({discount.coupon}) </span>
                                                  }
                                                </div>
                                                <g-spacer></g-spacer>
                                                <div class="fs-small-2">

                                                  -{t('common.currency', locale.value)}{$filters.formatCurrency(discount.value, decimals.value)}
                                                </div>
                                              </div>
                                          )} </div>
                                      }
                                    </g-card-text>
                                    {
                                      (order.declineStep2) &&
                                      <g-card-actions>
                                        <g-text-field-bs label={t('onlineOrder.reasonDecline')} v-model={order.declineReason} v-slots={{
                                          'append-inner': () =>
                                              <g-icon style="cursor: pointer" onClick={() => openDialogReason(order)}>
                                                icon-keyboard
                                              </g-icon>
                                        }}></g-text-field-bs>
                                      </g-card-actions>
                                    }
                                    {
                                      (order.confirmStep2
                                          && ((order.type === 'delivery' && order.deliveryTime === 'asap') || (order.type === 'pickup'))) &&
                                      <g-card-actions>
                                        <div class="w-100">
                                          <p class="ml-2 mb-1">
                                            {t('onlineOrder.settings.timeToComplete2')} (min) </p>
                                          <value-picker values={[15, 30, 45, 60]} defaultValue={defaultPrepareTime || 30} allow-custom v-model={order.prepareTime}></value-picker>
                                        </div>
                                      </g-card-actions>
                                    }
                                    <g-card-actions>
                                      {
                                        (!order.confirmStep2 && !order.declineStep2) &&
                                        <g-btn-bs height="54" width="60" border-color="#C4C4C4" text-color="black" onClick={withModifiers(() => onClickDecline(order), ['stop'])}>
                                          <g-icon size="14">
                                            icon-cross-red
                                          </g-icon>
                                        </g-btn-bs>
                                      }
                                      {
                                        (order.confirmStep2 || order.declineStep2) &&
                                        <g-btn-bs height="54" width="60" border-color="#C4C4C4" text-color="black" onClick={withModifiers(() => onBack(order), ['stop'])}>

                                          {t('onlineOrder.back')}
                                        </g-btn-bs>
                                      }
                                      {
                                        (order.declineStep2) ?
                                            <g-btn-bs height="54" background-color="#E0E0E0" text-color="black" style="flex: 1" onClick={() => declineOrder(order)}>
                                              Confirm
                                            </g-btn-bs>
                                            :
                                            <g-btn-bs height="54" background-color="#E0E0E0" class="pending-orders--btn-price" text-color="black" style="flex: 1" onClick={withModifiers(() => onClickAccept(order), ['stop'])}>
                                              {
                                                (getPaymentIcon(order.payment)) ?
                                                    <img src={getPaymentIcon(order.payment)} alt={order.payment[0].type} style="height: 16px" class="mr-2"> </img>
                                                    :
                                                    <span class="mr-2"> {order.payment[0].type} </span>
                                              }
                                              <span>
                                                {t('common.currency', locale.value)}
                                                {$filters.formatCurrency(order.payment[0].value, decimals.value)}
                                              </span>
                                            </g-btn-bs>
                                      }
                                    </g-card-actions>
                                    {
                                      (order.forwardedStore) &&
                                      <g-card-actions class="pending-orders--forward-store">
                                        <b class="mr-1">
                                          From:
                                        </b>
                                        {order.forwardedStore}
                                      </g-card-actions>
                                    }
                                  </g-card>
                              )} </>
                    )
              }
            </div>
          </div>
          <div class="kitchen-orders pl-2">
            <div class="header">
              {t('onlineOrder.sentToKitchen')}
              {
                (sortedKitchenOrders && sortedKitchenOrders.length) &&
                <g-badge class="ml-1" inline modelValue={true} color="#F9A825" v-slots={{
                  'badge': () =>
                      <div class="px-2">
                        {sortedKitchenOrders.length} </div>
                }}></g-badge>
              }
            </div>
            <div class="content">
              {
                (!sortedKitchenOrders.value || !sortedKitchenOrders.value.length) ?
                    <div class="kitchen-orders--empty">
                      <p>
                        {t('onlineOrder.noKitchen')} </p>
                    </div>
                    :
                    <>
                      {sortedKitchenOrders.value.map((order, index) =>
                          <g-card elevation="0" key={index} style={[getPendingOrderKitchenTime(order) < 10 && { border: '1px solid #FF4452' }]}>
                            <g-card-title>
                              <div class="fs-small-2 ml-1" style="max-width: calc(100% - 96px); line-height: 1.2">
                                <span class="fs-small fw-700 text-indigo-accent-2">
                                  #{order.dailyId ? order.dailyId : order.id} </span>

                                {order.customer ? order.customer.name : 'No customer name'} -
                                {order.customer ? order.customer.phone : 'No customer phone'}
                              </div>
                              <g-spacer></g-spacer>
                              <div class="kitchen-orders__timer" onClick={withModifiers(() => openDialog(order), ['stop'])}>
                                {
                                  (order.type === 'delivery') &&
                                  <g-icon>
                                    icon-delivery-scooter </g-icon>
                                }
                                {
                                  (order.type === 'pickup') &&
                                  <g-icon>
                                    icon-take-away </g-icon>
                                }
                                <span class="fw-700 fs-small ml-2">
                                  {order.deliveryTime} </span>
                              </div>
                            </g-card-title>
                            <g-card-text>
                              {
                                (order.note) &&
                                <div class="text-grey-darken-1 i mb-1" style="font-size: 13px; line-height: 16px">

                                  Note: {order.note}
                                </div>
                              }
                              {
                                (order.type === 'delivery') &&
                                <div class="row-flex">
                                  <div class="col-1">
                                    <g-icon color="#9E9E9E" size="20">
                                      icon-place
                                    </g-icon>
                                  </div>
                                  <div class="col-11 text-grey-darken-1">
                                    {`${order.customer.address} ${order.customer.zipCode}`} </div>
                                </div>
                              }
                              {
                                (order.items) &&
                                <div class="row-flex">
                                  <div class="col-1" style="line-height: 20px">
                                    <g-icon color="#9E9E9E" size="20">
                                      icon-food
                                    </g-icon>
                                  </div>
                                  <div style="padding-top: 2px">
                                    {order.items.map(item =>
                                        <span>
                                          <span class="fw-700">
                                            {item.quantity}x </span>
                                          <span class="mr-3" style="word-break: break-all">

                                            {item.id && `${item.id}.`} {item.name}
                                            <span class="i text-grey fs-small-2">
                                              {getExtraInfo(item)} </span>
                                          </span>
                                        </span>
                                    )} </div>
                                </div>
                              }
                              {
                                (order.forwardedStore) &&
                                <div class="row-flex">
                                  <div class="col-1 row-flex align-items-center">
                                    <g-icon color="#9E9E9E" size="17">
                                      icon-double-arrow-right
                                    </g-icon>
                                  </div>
                                  <div>
                                    {order.forwardedStore} </div>
                                </div>
                              }
                            </g-card-text>
                          </g-card>
                      )} </>
              }
            </div>
          </div>
          <dialog-complete-order ref={dialogRef} v-model={showDialog} onCompleteorder={completeOrder} onDeclineorder={declineOrder}></dialog-complete-order>
          <dialog-text-filter v-model={dialog.reason} label="Reason" defaultValue={dialog.value.order.declineReason} onSubmit={submitReason}></dialog-text-filter>
          <new-reservation-dialog v-model={dialog.reservation} receivedPhone={selectedCustomer ? selectedCustomer.phone : ''} onSubmit={getPendingReservationsLength}></new-reservation-dialog>
        </div>
  }
}
</script>

<style scoped lang="scss">
.main {
  background-image: url('/plugins/pos-plugin/assets/out.png');
  width: 100%;
  height: 100%;
  display: flex;
  padding: 16px;

  .g-card {
    border-radius: 4px;
    border: solid #9e9e9e 0.05em;
    margin-bottom: 6px;
    font-size: 14px;

    .g-btn-bs {
      border-radius: 2px;
    }

    .g-card-title {
      padding-bottom: 8px;
    }

    .g-card-text {
      padding: 0 16px 16px;
    }

    .g-card-actions {
      padding: 0 8px 16px;

      .g-btn-bs {
        text-transform: capitalize;
      }
    }
  }
}

.header {
  display: flex;
  flex-wrap: wrap;
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
}

.content {
  height: calc(100% - 34px);
  overflow: hidden scroll;

  &::-webkit-scrollbar {
    display: none;
  }
}

.pending-orders {
  width: 40%;
  height: 100%;
  overflow: hidden;

  &--empty {
    height: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: white;
    border: 0.5px solid #9E9E9E;
    border-radius: 4px;

    p {
      font-size: 12px;
      color: #9E9E9E;
      margin-top: 8px;
    }
  }

  &--forward-store {
    display: flex;
    justify-content: center !important;
    align-items: center !important;
    padding: 2px !important;
    margin: -8px 16px 12px;
    text-align: center;
    background-color: #E1F5FE;
    border-radius: 12px !important;
  }

  &--title {
    align-items: flex-start !important;
    flex-wrap: nowrap !important;
  }

  &--call {
    width: 100%;
    background-color: white;
    border: 1px solid #9e9e9e;
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 8px;

    &-title {
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: bold;
    }

    &-buttons {
      display: flex;
      align-items: center;
      margin-top: 4px;

      .g-btn-bs {
        margin: 0;
        padding: 18px;
      }
    }
  }
}

.kitchen-orders {
  width: 60%;

  &--empty {
    height: 30%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 0.5px solid #9E9E9E;
    border-radius: 4px;

    p {
      font-size: 12px;
      color: #9E9E9E;
      margin-top: 8px;
    }
  }

  &__timer {
    background: #EFEFEF;
    border: 1px solid #C4C4C4;
    border-radius: 2px;
    padding: 0 8px;
  }
}

.btn-clicked {
  background: #FFFFFF;
  border: 1px solid #536DFE !important;
  border-radius: 2px;
  color: #536DFE !important;
}

.options {
  background: #FFFFFF;
  border: 1px solid #D3D3D3;
  border-radius: 2px;

  .option {
    background-color: #FFF;
    font-size: 14px;
    line-height: 20px;
    padding: 12px 16px;
    text-align: left;
    user-select: none;
    cursor: pointer;
    color: #201F2B;

    &:hover {
      background-color: #EFEFEF;
    }
  }
}

.progress-remaining {
  color: #E57373;
  position: absolute;
  top: 3px;
  right: 3px;
  font-size: 15px;
  width: 32px;
  text-align: center;
}

@media screen and (max-width: 1023px) {
  .main {
    .g-card {
      .g-card-title {
        padding: 8px;
      }

      .g-card-text, .g-card-actions {
        padding: 0 8px 8px;

        & > .g-btn-bs {
          margin: 0 4px;
        }
      }
    }

    .pending-orders--empty > p {
      text-align: center;
    }

    .pending-orders--title {
      flex-wrap: wrap !important;
    }

    .pending-orders--btn-price {
      flex-direction: column;
      align-items: center;

      & > img {
        margin-right: 0 !important;
      }
    }

    .pending-orders--call-title {
      line-height: 1.2;

      div span {
        display: none;
      }
    }

    .pending-orders--call-buttons .g-btn-bs {
      padding: 4px;
    }
  }

}
</style>
