import { ref, onActivated, computed, onBeforeMount } from 'vue'
import {useI18n} from 'vue-i18n'
import {$filters} from '../AppSharedStates'
import { formatDate } from "../utils";
import {getOnlineOrdersByLimit} from './online-order-main-logic-be'

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
    return resultList.filter(order => dayjs(order.date).isBetween(filter.value.fromDate, filter.value.toDate), 'day', [])
  }
  return resultList
})
export const totalOrder = computed(() => {
  return ordersListByStatus.length
})
export const totalIncome = computed(() => {
  return _.sumBy(ordersListByStatus.value, order => order.vSum ? order.vSum : 0)
})
//</editor-fold>

//<editor-fold desc="function">
export function changeFilter(range) {
  filter.value = range
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

  const renderOnlineOrderListTitle = function () {
    return (
      <div className="row-flex align-items-center mb-2">
        <div className="online-order-list__title">
          {`${t(`onlineOrder.${listOnlineOrderStatus.value}`)} ${t('onlineOrder.orders')}`}
        </div>
        <g-spacer></g-spacer>
        <div className="online-order-list__info">
          <div className="row-flex align-items-center">
            <g-icon className="mr-2" size="20">
              icon-cutleries2
            </g-icon>
            <span className="fw-700">
                {totalOrder.value} </span>
          </div>
          <div className="row-flex align-items-center">
            <g-icon className="mr-2" size="20">
              icon-money-bag
            </g-icon>
            <span className="fw-700">
                {t('common.currency', locale.value)}{$filters.formatCurrency(totalIncome.value)} </span>
          </div>
        </div>
        <date-range-picker from={filter.value.fromDate} to={filter.value.toDate}
                           onSave={changeFilter}></date-range-picker>
      </div>
    )
  }

  const renderOnlineOrderListTable = function () {
    return (
      <g-table elevation="2" fixed-header>
        <thead>
        <tr>
          {headers.map(header =>
            <th style="white-space: nowrap">
              {header} </th>
          )} </tr>
        </thead>
        <tbody>
        {computedItems.value.map((item, i) =>
          <tr key={i} onClick={() => openDialogDetail(item)}>
            <td className="fw-700">
              <p style="white-space: nowrap">
                #{item.dailyId ? item.dailyId : item.id} </p>
              <g-tooltip openOnHover={true} color="#616161" transition="0.3" speech-bubble remove-content-on-close
                 v-slots={{
                   'default': () => <> <span>
                <b> From: </b>
                     {item.forwardedStore} </span>
                   </>
                   ,
                   'activator': ({on}) => <>
                     {
                       (item.forwardedStore) &&
                       <div v-on="on">
                         <g-icon size="16">
                           icon-delivery-forward
                         </g-icon>
                       </div>
                     }
                   </>
                 }}/>
            </td>
            <td>
              <p> {item.customer.name} </p>
              <p style="white-space: nowrap"> {item.customer.phone} </p>
            </td>
            <td>
              {
                (item.customer.address) ?
                  <div>
                    <p style="word-break: break-word">
                      {item.customer.address} </p>
                    <p>
                      {item.customer.zipCode} </p>
                  </div>
                  :
                  <div> -- </div>
              }
            </td>
            <td>
              <p className="fw-700" style="white-space: nowrap">

                {t('common.currency', locale.value)}{$filters.formatCurrency(item.payment[0].value)}
              </p>
              <p>
                <img alt src={getImagePayment(item.payment[0].type)}> </img>
              </p>
            </td>
            <td style="white-space: nowrap">
              {formatDate(item.date)} </td>
            <td style="white-space: nowrap">
              {item.deliveryTime} </td>
            <td>
              {
                (item.type === 'delivery') &&
                <g-icon>
                  icon-delivery-scooter </g-icon>
              }
              {
                (item.type === 'pickup') &&
                <g-icon>
                  icon-take-away </g-icon>
              }
            </td>
            <td className={statusClass.value}>
              <div style="white-space: nowrap">
                {t(`onlineOrder.${item.status}`)} </div>
              <div style="font-size: x-small; margin-top: -5px">
                {isRefunded(item) ? refundedStr.value : ''} </div>
            </td>
            <td>
              {
                (isAdminUser.value && isRefundable(item)) &&
                <g-menu v-model={item.showMenu} nudgeBottom={10} close-on-content-click v-slots={{
                  'default': () => <>
                    <g-card background="white">
                      <div style="padding: 10px; cursor: pointer" onClick={() => emit('refundOrder', item, status)}>
                        {
                          refundStr
                        }
                      </div>
                    </g-card>
                  </>
                  ,
                  'activator': ({on}) => <>
                    <div onClick={on.click} style={moreMenuStyle}>
                      ···
                    </div>
                  </>
                }}/>
              }
            </td>
          </tr>
        )} </tbody>
      </g-table>
    )
  }

  const renderOnlineOrderList = function () {
    return (
      <div className="online-order-list">
        {renderOnlineOrderListTitle()}
        <div className="online-order-list__table">

        </div>
        <dialog-complete-order disabled-btn v-model={showDialog.value}></dialog-complete-order>
      </div>
    )
  }

  return {
    renderOnlineOrderList
  }
}
