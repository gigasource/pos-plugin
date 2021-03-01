import { ref, onActivated, computed, onBeforeMount, withModifiers } from 'vue'
import {useI18n} from 'vue-i18n'
import {$filters, user} from '../AppSharedStates'
import { formatDate } from "../utils";
import {getOnlineOrdersByLimit} from './online-order-main-logic-be'
import { isRefunded, isRefundable } from "./online-order-main-logic"
import { dialogOrder } from './helpers/dialog-complete-order-render'
import cms from 'cms'
import { genScopeId } from '../utils'
import isBetween from 'dayjs/plugin/isBetween'
import dayjs from 'dayjs'
dayjs.extend(isBetween)
import _ from 'lodash'

//<editor-fold desc="Variables">
/**
 * @type {Object}
 * @desc Filter for order item with date in range fromDate to toDate
 */
export const filter = ref({})
export const limit = ref(50)
export const onlineOrdersList = ref([])
export const page = ref(0)
export const showDialog = ref(false)
export const listOnlineOrderStatus = ref('completed')
export const ordersListByStatus = computed(() => {
  const resultList = onlineOrdersList.value.filter(order => order.status === listOnlineOrderStatus.value)
  if (filter.value && filter.value.fromDate && filter.value.toDate) {
    return resultList.filter(order => dayjs(order.date).isBetween(filter.value.fromDate, filter.value.toDate, 'day', []))
  }
  return resultList
})
export const totalOrder = computed(() => {
  return ordersListByStatus.length
})
export const totalIncome = computed(() => {
  return _.sumBy(ordersListByStatus.value, order => order.vSum ? Number(order.vSum) : 0)
})
//</editor-fold>

//<editor-fold desc="function">
export function changeFilter(range) {
  filter.value = range
}
export function getImagePayment(type) {
  let paymentMethod = cms.getList && cms.getList('PosSetting')[0].payment.find(i => i.name === type)
  return paymentMethod && paymentMethod.icon
}
export function openDialogDetail(order) {
  dialogOrder.value = order
  showDialog.value = true
}
//</editor-fold>

export function onlineOrderListFactory(props) {
  onBeforeMount(() => {
    filter.value.fromDate = dayjs().format('YYYY-MM-DD')
    filter.value.toDate = dayjs().format('YYYY-MM-DD')
  })

  onActivated(async () => {
    page.value = 0
    onlineOrdersList.value = await getOnlineOrdersByLimit(0, limit.value)
  })

  const { t, locale } = useI18n()
  const i18n = useI18n();
  const { onlineOrder: { address, amount, customer, delivery, no, received, _status, type, refund, refunded } } = i18n.messages ? (i18n.messages.value[i18n.locale.value] || i18n.messages.value[i18n.fallbackLocale.value]) : { onlineOrder: {} }
  const headers = [no, customer, address, amount, received, delivery, type, _status, '']

  const renderOnlineOrderListTitle = function () {
    return (
      <div class="row-flex align-items-center mb-2">
        <div class="online-order-list__title">
          {`${t(`onlineOrder.${listOnlineOrderStatus.value}`)} ${t('onlineOrder.orders')}`}
        </div>
        <g-spacer/>
        <div class="online-order-list__info">
          <div class="row-flex align-items-center">
            <g-icon class="mr-2" size="20">icon-cutleries2</g-icon>
            <span class="fw-700">{totalOrder.value}</span>
          </div>
          <div class="row-flex align-items-center">
            <g-icon class="mr-2" size="20">icon-money-bag</g-icon>
            <span class="fw-700">{t('common.currency', locale.value)}{$filters.formatCurrency(totalIncome.value)}</span>
          </div>
        </div>
        <date-range-picker from={filter.value.fromDate} to={filter.value.toDate}
                           onSave={changeFilter}></date-range-picker>
      </div>
    )
  }

  const renderOnlineOrderListTable = function () {
    const moreMenuStyle = {
      'text-align': 'center',
      'line-height': '18px',
      color: '#999',
      // border: `1px solid ${color}`,
      'border-radius': '50%',
      width: '20px',
      height: '20px',
      'box-sizing': 'border-box',
      'box-shadow': '0px 0px 3px 0px rgba(0,0,0, 0.6)',
      cursor: 'pointer',
      'background-color': '#fff'
    }

    return (
      <g-table elevation="2" fixed-header>
        {genScopeId(() => (<>
            <thead>
              <tr>{headers.map(header => <th style="white-space: nowrap">{header}</th>)}</tr>
            </thead>
            <tbody>
              {ordersListByStatus.value.map((order, i) =>
                <tr key={i} onClick={() => openDialogDetail(order)} style="cursor: pointer">
                  <td class="fw-700">
                    <p style="white-space: nowrap">#{order.dailyId ? order.dailyId : order.id}</p>
                    { order.forwardedStore && (<g-tooltip
                        openOnHover={true} color="#616161" transition="0.3" speech-bubble remove-content-on-close
                         v-slots={{
                           default: () => <span><b>From: </b>{order.forwardedStore}</span>,
                           activator: ({on}) => <div
                               onMouseEnter={on.mouseenter}
                               onMouseLeave={on.mouseleave}
                               onClick={on.click}>
                             <g-icon size="16">icon-delivery-forward</g-icon>
                           </div>
                         }}/>)
                    }
                  </td>
                  <td>
                    <p>{order.customer.name}</p>
                    <p style="white-space: nowrap">{order.customer.phone}</p>
                  </td>
                  <td>
                    {
                  (order.customer.address) ?
                        <div>
                          <p style="word-break: break-word">{order.customer.address}</p>
                          <p>{order.customer.zipCode}</p>
                        </div>
                        : <div style="text-align: center"> -- </div>
                    }
                  </td>
                  <td>
                    <div class="col-flex align-items-center">
                      <p class="fw-700" style="white-space: nowrap">
                        {t('common.currency', locale.value)}{$filters.formatCurrency(Number(order.payment[0].value))}
                      </p>
                      <p> <img alt src={getImagePayment(order.payment[0].type)}> </img></p>
                    </div>
                  </td>
                  <td style="white-space: nowrap; text-align: center">{formatDate(order.date)}</td>
                  <td style="white-space: nowrap; text-align: center">{order.deliveryTime}</td>
                  <td>
                    <div class="row-flex justify-center">
                      { order.type === 'delivery' && <g-icon>icon-delivery-scooter</g-icon> }
                      { order.type === 'pickup' && <g-icon>icon-take-away</g-icon> }
                    </div>
                  </td>
                  <td class={listOnlineOrderStatus.value}>
                    <div style="white-space: nowrap">{t(`onlineOrder.${order.status}`)}</div>
                    <div style="font-size: x-small; margin-top: -5px">{isRefunded(order) ? refunded : ''}</div>
                  </td>
                  <td>
                    {
                      (user.role === 'admin' && isRefundable(order)) &&
                      <g-menu v-model={order.showMenu} nudgeBottom={10} close-on-content-click v-slots={{
                        default: () => (
                          <g-card background="white">
                            <div style="padding: 10px; cursor: pointer" onClick={() => emit('refundOrder', order, status)}>{ refunded }</div>
                          </g-card>
                        ),
                        activator: ({on}) => <div onClick={withModifiers(on.click, ['stop'])} style={moreMenuStyle}>···</div>
                      }}/>
                    }
                  </td>
                </tr>
              )}
            </tbody>
        </>))()}
      </g-table>
    )
  }

  const renderOnlineOrderList = function () {
    return (
      <div class="online-order-list">
        {renderOnlineOrderListTitle()}
        <div class="online-order-list__table">
          {renderOnlineOrderListTable()}
        </div>
        <dialog-complete-order disable-btn v-model={showDialog.value}></dialog-complete-order>
      </div>
    )
  }

  return {
    renderOnlineOrderList
  }
}
