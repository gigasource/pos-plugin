<script>
import { genScopeId } from '../utils';
import { $filters } from '../AppSharedStates';
import { OrderHistoryDetailFactory } from './order-history-logics';
import { useI18n } from 'vue-i18n';

// TODO: i18n & formatCurrency.
// ATM, we hard-code with € symbol

export default {
  props: {
    order: Object
  },
  setup(props) {
    const {
      order,
      promotionTotal,
      subTotal,
      payment,
      tip,
      items,
      staffs,
      createdUser,
      cashierUser,
      getItemPrice,
      getExtraInfo,
      formatDate
    } = OrderHistoryDetailFactory(props)

    const { t } = useI18n()
    const renderOrderId = () =>
        <div class="flex-grow-1">
          <div class="order-title">
            {t('orderHistory.orderNo')} </div>
          <div class="order-id">
            {order.value.id} </div>
        </div>
    const renderTableNo = () => (order.value.table) &&
        <div class="pl-2 flex-grow-1">
          <div class="order-title">{t('restaurant.table')}</div>
          <div class="order-id">{order.value.table}</div>
        </div>
    const renderCreatedTime = () =>
        <div class="row-flex">
          <div class="flex-grow-1" style="opacity: 0.5">{t('order.createdTime')}</div>
          <div> {formatDate(order.value.date)} </div>
        </div>
    const renderStaff = () => (staffs.value.length) &&
        <>
          <div class="row-flex">
            <div class="flex-grow-1" style="opacity: 0.5">{t('order.createdBy')}</div>
            <span class="ta-right"> {createdUser.value} </span>
          </div>
          <div class="row-flex">
            <div class="flex-grow-1" style="opacity: 0.5">{t('order.cashier')}</div>
            <span class="ta-right"> {cashierUser.value} </span>
          </div>
        </>

    const renderItems = () => <g-simple-table striped>
      {genScopeId(() => <>
        {items.value.map(product =>
            <tr>
              <td>{product.quantity}x</td>
              <td>
                {product.id && `${product.id}.`} {product.name}
                <span class="i text-grey-darken-1">
                  {getExtraInfo(product)}
                </span>
              </td>
              <td class="ta-right">
                € {$filters.formatCurrency(getItemPrice(product))}
              </td>
            </tr>
        )}
        {(order.value.type) &&
        <tr>
          <td></td>
          <td>
            Shipping Fee
          </td>
          <td class="ta-right">
            € {$filters.formatCurrency(order.value.shippingFee)} </td>
        </tr>
        }
      </>)()}
    </g-simple-table>

    const renderPromotions = () => <div class="order-info my-2">
      <span class="fw-700"> {t('orderHistory.promotionalApplied')} </span>
      <span class="order-info-number">
        -{promotionTotal.value > 0 ? (' € ' + $filters.formatCurrency(promotionTotal.value)) : ''}
      </span>
    </div>

    const renderSubtotal = () => <div class="order-info mt-2">
      <span> {t('common.subtotal')} </span>
      <span class="order-info-number">
        € {$filters.formatCurrency(subTotal.value)} </span>
    </div>

    const renderTax = () => <div class="order-info mb-2">
      <span> {t('common.tax')} </span>
      <span class="order-info-number">
        € {$filters.formatCurrency(order.value.tax)} </span>
    </div>


    const renderPayment = () =>
        <div class="row-flex align-items-center" style="justify-content: space-between; text-transform: capitalize">
          <span>{t('order.payment')}</span>
          {
            (payment.value.length > 1) ?
                <div class="row-flex">
                  <g-icon size="24" class="mr-2">icon-multi_payment</g-icon>
                  {payment.value.map((p, index) =>
                      <div class="row-flex align-items-center">
                        <span style={{ color: p.type === 'cash' ? '#25D778' : '#FFCB3A' }}>
                          { $filters.formatCurrency(p.value) }
                        </span>
                        { (!index) && <g-divider vertical class="ml-1 mr-1"/>}
                      </div>
                  )}
                </div>
                :
                (
                    (payment.value.length === 1) &&
                    <div class="row-flex align-items-center">
                      { (payment.value[0].icon) && <img src={payment.value[0].icon} style="height: 16px" class="mr-2"> </img> }
                      <span>{ $filters.formatCurrency(payment.value[0].value) }</span>
                    </div>
                )
          }
        </div>

    const renderTip = () => (tip.value) &&
        <div class="row-flex align-items-center" style="justify-content: space-between; text-transform: capitalize">
          <span> Tip </span>
          <span> € {$filters.formatCurrency(tip.value)} </span>
        </div>
    const renderTotal = () => <div class="total">
      <div class="row-flex align-items-center" style="justify-content: space-between">
        <span>{t('common.total')}</span>
        <span class="total__important">
          € {$filters.formatCurrency(order.value.amount)}
        </span>
      </div>
      {renderPayment()}
      {renderTip()}
    </div>
    return genScopeId(() =>
        (order.value) ?
            <div class="order-detail">
              <div class="order-detail__header">
                {renderOrderId()}
                {renderTableNo()}
              </div>
              <g-divider/>
              <div class="order-detail__info">
                {renderCreatedTime()}
                {renderStaff()}
              </div>
              <g-divider/>
              {renderItems()}
              <g-divider/>
              {renderPromotions()}
              <g-divider/>
              {renderSubtotal()}
              {renderTax()}
              <g-divider/>
              {renderTotal()}
            </div>
            :
            <div class="order-detail align-items-center justify-center">
              <img class="mb-1" alt src="/plugins/pos-plugin/assets/pending_order.svg"/>
              Order history is currently empty
            </div>
    )
  }
}
</script>

<style scoped lang="scss">
.order-detail {
  padding: 16px 7px;
  border-left: 1px solid #e0e0e0;
  // box-shadow: -1px 0px 6px rgba(0, 0, 0, 0.25);
  overflow: auto;
  z-index: 2;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    flex-shrink: 0;
    padding-bottom: 8px;
  }

  &__info {
    font-size: 12px;
    padding: 6px 0;
  }

  &::-webkit-scrollbar {
    display: none;
  }

  .order-title {
    font-weight: 700;
    font-size: 14px;
    line-height: 18px;
    color: #9E9E9E;
  }

  .order-id {
    font-size: 20px;
    font-weight: 700;
    line-height: 30px;
    margin-left: 4px;
  }

  .g-table {
    margin-top: 16px;
    margin-bottom: 16px;
    flex-grow: 1;

    tr td {
      height: 28px;
      padding: 0 4px 0 0;
      font-size: 11.5px;
      line-height: 28px;
      white-space: nowrap;
      max-width: 0;
    }

    tr td:first-child {
      width: 20%;
    }

    tr td:nth-child(2) {
      width: 50%;
      padding-left: 8px;
      font-weight: bold;
      white-space: initial;
      word-break: break-word;
      line-height: 1.2;
    }
  }

  .order-info {
    display: flex;
    flex-shrink: 0;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    line-height: 15px;
    margin: 4px;
    font-weight: 700;

    &__sub {
      padding-left: 8px;
    }

    &__important {
      color: #ff4552;
    }

    &-number {
      font-size: 13px;
      line-height: 16px;
      font-weight: 400;

      &__big {
        font-size: 16px;
        line-height: 20px;
        font-weight: 400;
      }
    }
  }

  .total {
    font-size: 12px;
    line-height: 15px;
    margin: 8px 4px;
    font-weight: 700;

    &__important {
      color: #1271ff;
      font-size: 18px;
      line-height: 24px;
    }
  }
}

@media screen and (max-height: 599px) {
  .order-detail {
    padding: 6px;

    &__header {
      padding-bottom: 4px;
    }

    &__info {
      padding: 4px 0;
    }

    .order-info, .total {
      margin: 4px !important;
    }

    .g-table {
      margin-top: 4px;
      margin-bottom: 4px;
    }
  }
}
</style>
