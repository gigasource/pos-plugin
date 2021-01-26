<script>
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import { user } from '../AppSharedStates';
import { ref, computed, onBeforeMount } from 'vue'
import _ from 'lodash';
import { $filters } from '../AppSharedStates';

export default {
  props: {
    status: String,
    onlineOrders: {
      type: Array,
      default: () => []
    }
  },
  setup() {
    const { t, locale } = useI18n()
    const onlineOrders = ref(props.onlineOrders)
    const status = ref(props.status)
    const dialogRef = ref(null)
    const i18n = useI18n();
    const { onlineOrder: { address, amount, customer, delivery, no, received, _status, type, refund, refunded } } = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]
    const headers = [no, customer, address, amount, received, delivery, type, _status, '']
    const refundStr = ref(refund)
    const refundedStr = ref(refunded)
    const filter = ref({
      fromDate: '',
      toDate: ''
    })
    const dialog = ref(false)
    const computedItems = computed(() => {
      const items = onlineOrders.map(i => ({ ...i, status: status }))
      if (filter.value.fromDate && filter.value.toDate) {
        return items.filter(item => dayjs(item.date).isBetween(filter.value.fromDate, filter.value.toDate, 'day', '[]'))
      }
      return []
    })
    const statusClass = computed(() => {
      return props.status
    })
    const totalOrder = computed(() => {
      return computedItems.value.length
    })
    const totalIncome = computed(() => {
      return _.sumBy(computedItems.value, item => item.vSum);
    })
    const isAdminUser = computed(() => {
      return user.value.role === 'admin'
    })
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

    function changeFilter(range) {
      filter.value = range
    }

    function getImagePayment(type) {
      let paymentMethod = cms.getList('PosSetting')[0].payment.find(i => i.name === type)
      return paymentMethod && paymentMethod.icon
    }

    function openDialogDetail(item) {
      dialogRef.value.showDialog(item)
    }

    function formatDate(date) {
      if (!date || !dayjs(date).isValid()) return ''
      return dayjs(date).format('HH:mm')
    }

    function isCaptureRefundExpired(captureResponses) {
      // find final capture
      let finalCapture;
      for (let purchase_unit of captureResponses.purchase_units) {
        for (let capture of purchase_unit.payments.captures) {
          if (capture.final_capture) {
            finalCapture = capture
            break;
          }
        }
      }

      // capture not completed, doesn't allow refund
      if (!finalCapture)
        return true;

      const _3HoursBefore = dayjs().subtract(3, 'hour')
      const createTime = dayjs(finalCapture.create_time)
      return createTime.isBefore(_3HoursBefore)
    }
    function isRefundable(order) {
      // refundable order is order paid via paypal and money has been captured
      // and not refund yet or refund but some capture failed
      return (order.paypalOrderDetail
          && order.paypalOrderDetail.captureResponses
          && order.paypalOrderDetail.captureResponses.status === 'COMPLETED' && !isCaptureRefundExpired(order.paypalOrderDetail.captureResponses)
          && (!order.paypalOrderDetail.refundResponses || isRefundFailed(order.paypalOrderDetail.refundResponses)))
    }

    function isRefunded(order) {
      return (order.paypalOrderDetail
          && order.paypalOrderDetail.refundResponses
          && _.every(order.paypalOrderDetail.refundResponses, r => r.status === 'COMPLETED'))
    }

    function isRefundFailed(refundResponses) {
      return _.find(refundResponses, r => r.status !== 'COMPLETED') != null
    }

    async function getOnlineOrdersWithStatus(status) {
      onlineOrders.value = await cms.getModel('Order').find({
        online: true,
        status
      })
    }

    watch(() => props.status, async (newV) => {
      if (!newV) return
      await getOnlineOrdersWithStatus(newV)
    })

    onBeforeMount(async () => {
      if (status.value) await getOnlineOrdersWithStatus(status.value)
      filter.value.fromDate = dayjs().format('YYYY-MM-DD')
      filter.value.toDate = dayjs().format('YYYY-MM-DD')
    })

    return () => <>
      <div class="online-order-list">
        <div class="row-flex align-items-center mb-2">
          <div class="online-order-list__title">
            {`${t(`onlineOrder.${status.value}`)} ${t('onlineOrder.orders')}`}
          </div>
          <g-spacer></g-spacer>
          <div class="online-order-list__info">
            <div class="row-flex align-items-center">
              <g-icon class="mr-2" size="20">
                icon-cutleries2
              </g-icon>
              <span class="fw-700">
                {totalOrder.value} </span>
            </div>
            <div class="row-flex align-items-center">
              <g-icon class="mr-2" size="20">
                icon-money-bag
              </g-icon>
              <span class="fw-700">
                {t('common.currency', locale.value)}{$filters.formatCurrency(totalIncome.value)} </span>
            </div>
          </div>
          <date-range-picker from={filter.value.fromDate} to={filter.value.toDate} onSave={changeFilter}></date-range-picker>
        </div>
        <div class="online-order-list__table">
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
                  <td class="fw-700">
                    <p style="white-space: nowrap">
                      #{item.dailyId ? item.dailyId : item.id} </p>
                    <g-tooltip openOnHover={true} color="#616161" transition="0.3" speech-bubble remove-content-on-close v-slots={{
                      'default': () => <> <span>
                        <b> From: </b>
                        {item.forwardedStore} </span>
                      </>
                      ,
                      'activator': ({ on }) => <>
                        {
                          (item.forwardedStore) &&
                          <div v-on="on">
                            <g-icon size="16">
                              icon-delivery-forward
                            </g-icon>
                          </div>
                        }
                      </>
                    }}></g-tooltip>
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
                    <p class="fw-700" style="white-space: nowrap">

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
                  <td class={statusClass.value}>
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
                        'activator': ({ on }) => <>
                          <div onClick={on.click} style={moreMenuStyle}>
                            ···
                          </div>
                        </>
                      }}></g-menu>
                    }
                  </td>
                </tr>
            )} </tbody>
          </g-table>
        </div>
        <dialog-complete-order disabled-btn ref={dialogRef} v-model={dialog.value}></dialog-complete-order>
      </div>
    </>
  }
}
</script>

<style scoped lang="scss">
.online-order-list {
  background-image: url('/plugins/pos-plugin/assets/out.png');
  width: 100%;
  height: 100%;
  padding: 16px 16px 24px 16px;

  &__title {
    font-size: 15px;
    font-weight: 700;
    text-transform: capitalize;
  }

  .g-select ::v-deep {
    .bs-tf-label {
      display: none;
    }

    .bs-tf-inner-input-group {
      padding: 0 0 0 8px;
    }

    .input {
      font-size: 14px;
      min-width: 85px;
      text-align: center;
    }
  }

  &__info {
    display: flex;
    align-items: center;
    margin-right: 16px;
    background-color: #fff;
    border: 1px solid #E0E0E0;
    border-radius: 4px;

    & > div:first-child {
      border-right: 1px solid #E0E0E0;
    }

    div {
      padding: 5px 8px;
    }
  }

  &__table {
    height: calc(100% - 40px);
    width: 100%;

    .g-table {
      th, td {
        height: auto;
        padding: 8px 4px;
        vertical-align: top;
        font-size: 14px;
        word-break: break-word;

        &:nth-child(1) {
          width: 6%;
        }

        &:nth-child(2),
        &:nth-child(3) {
          width: 21%;
        }

        &:nth-last-child(-n+6) {
          width: 10%;
        }

        // actions menu
        &:nth-last-child(1) {
          width: 40px;
        }
      }

      thead th {
        background: #EFEFEF;
        font-size: 12px;
        color: #757575;
        height: 38px;
      }

      tr:nth-child(even) {
        td {
          background: #F8F8FB;
        }
      }

      .completed {
        color: #4CAF50;
        text-transform: capitalize;
      }

      .declined {
        color: #FF5252;
        text-transform: capitalize;
      }
    }
  }

  ::v-deep .bs-tf-wrapper {
    margin: 8px 0;
    background-color: #FFF;
    width: 150px;

    .bs-tf-label {
      margin-bottom: 0;
    }
  }
}

@media screen and (max-width: 1023px) {
  .online-order-list {

    &__table {
      .g-table td {
        font-size: 12px;
      }
    }
  }
}

</style>
