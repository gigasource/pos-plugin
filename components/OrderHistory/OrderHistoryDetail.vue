<template>
  <div v-if="orderHistoryCurrentOrder" class="order-detail">
    <div class="order-detail__header">
      <div class="flex-grow-1">
        <div class="order-title">{{ $t('orderHistory.orderNo') }}</div>
        <div class="order-id">{{ orderHistoryCurrentOrder.id }}</div>
      </div>
      <div class="pl-2 flex-grow-1" v-if="orderHistoryCurrentOrder.table">
        <div class="order-title">Table No</div>
        <div class="order-id">{{ orderHistoryCurrentOrder.table }}</div>
      </div>
    </div>
    <g-divider/>
    <div class="order-detail__info">
      <div class="row-flex">
        <div class="flex-grow-1" style="opacity: 0.5">Created time</div>
        <div>{{ formatDate(orderHistoryCurrentOrder.date) }}</div>
      </div>
      <template v-if="orderHistoryCurrentOrder.staff && orderHistoryCurrentOrder.staff.length">
        <div class="row-flex">
          <div class="flex-grow-1" style="opacity: 0.5">Created by</div>
          <span class="ta-right">{{ getCreatedUser(orderHistoryCurrentOrder) }}</span>
        </div>
        <div class="row-flex">
          <div class="flex-grow-1" style="opacity: 0.5">Cashier</div>
          <span class="ta-right">{{ getCashierUser(orderHistoryCurrentOrder) }}</span>
        </div>
      </template>
    </div>
    <g-divider/>
    <g-simple-table striped>
      <tr v-for="product in orderHistoryCurrentOrder.items">
        <td>{{ product.quantity }}x</td>
        <td>
          {{ product.id && `${product.id}.` }} {{ product.name }}
          <span class="i text-grey-darken-1">{{ getExtraInfo(product) }}</span>
        </td>
        <td class="ta-right">€ {{ $filters.formatCurrency(getItemPrice(product)) }}</td>
      </tr>
      <tr v-if="orderHistoryCurrentOrder.type">
        <td></td>
        <td>Shipping Fee</td>
        <td class="ta-right">€ {{ $filters.formatCurrency(orderHistoryCurrentOrder.shippingFee) }}</td>
      </tr>
    </g-simple-table>
    <g-divider/>
    <div class="order-info my-2">
      <span class="fw-700">{{ $t('orderHistory.promotionalApplied') }}</span>
      <span class="order-info-number">-{{ promotionTotal > 0 ? (' € ' + promotionTotal.toFixed(2)) : '' }}</span>
    </div>
    <g-divider/>
    <div class="order-info mt-2">
      <span>{{ $t('common.subtotal') }}</span>
      <span class="order-info-number">€ {{ $filters.formatCurrency(subTotal) }}</span>
    </div>
    <div class="order-info mb-2">
      <span>{{ $t('common.tax') }}</span>
      <span class="order-info-number">€ {{ $filters.formatCurrency(orderHistoryCurrentOrder.tax) }}</span>
    </div>
    <g-divider/>
    <div class="total">
      <div class="row-flex align-items-center" style="justify-content: space-between">
        <span>{{ $t('common.total') }} </span>
        <span class="total__important">€ {{ $filters.formatCurrency(orderHistoryCurrentOrder.amount) }}</span>
      </div>
      <div class="row-flex align-items-center" style="justify-content: space-between; text-transform: capitalize">
        <span>Payment</span>
        <template v-if="payment.length > 1">
          <div class="row-flex">
            <g-icon size="24" class="mr-2">icon-multi_payment</g-icon>
            <div v-for="(p, index) in payment" class="row-flex align-items-center">
              <span :style="{ color: p.type === 'cash' ? '#25D778' : '#FFCB3A' }">
                {{ $filters.formatCurrency(p.value) }}
              </span>
              <g-divider vertical v-if="!index" class="ml-1 mr-1"/>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="row-flex align-items-center">
            <img :src="payment[0].icon" v-if="payment[0].icon" style="height: 16px" class="mr-2">
            <span>{{ $filters.formatCurrency(payment[0].value) }}</span>
          </div>
        </template>
      </div>
      <div v-if="tip" class="row-flex align-items-center" style="justify-content: space-between; text-transform: capitalize">
        <span>Tip</span>
        <span>€ {{ $filters.formatCurrency(tip) }}</span>
      </div>
    </div>
  </div>
  <div v-else class="order-detail align-items-center justify-center">
    <img class="mb-1" alt src="/plugins/pos-plugin/assets/pending_order.svg"/>
    Order history is currently empty
  </div>
</template>

<script>
  import orderUtil from '../logic/orderUtil'

  export default {
    name: 'OrderHistoryDetail',
    props: {
      orderHistoryCurrentOrder: Object
    },
    computed: {
      promotionTotal() {
        return this.orderHistoryCurrentOrder && this.orderHistoryCurrentOrder.vDiscount;
      },
      subTotal() {
        return this.orderHistoryCurrentOrder && this.orderHistoryCurrentOrder.amount - this.orderHistoryCurrentOrder.tax;
      },
      payment() {
        let paymentMethods = cms.getList('PosSetting')[0].payment
        return this.orderHistoryCurrentOrder.payment
        .filter(i => paymentMethods.some(m => m.name === i.type))
        .map(i => {
          const method = paymentMethods.find(m => m.name === i.type)
          return {
            ...method,
            ...i
          }
        })
      },
      tip() {
        return this.orderHistoryCurrentOrder && this.orderHistoryCurrentOrder.tip
      }
    },
    methods: {
      getCreatedUser(order) {
        if (order.staff && order.staff.length) return _.first(order.staff).name
        return ''
      },
      getCashierUser(order) {
        if (order.staff && order.staff.length) return _.last(order.staff).name
        return ''
      },
      getItemPrice(item) {
        return orderUtil.getItemPrice(item)
      },
      getExtraInfo(item) {
        return orderUtil.getExtraInfo(item)
      },
      formatDate(val) {
        if (!val) return ''
        return dayjs(val).format('DD MMM YY, HH:mm')
      }
    }
  }
</script>

<style scoped lang="scss">
  .order-detail {
    padding: 16px 7px;
    box-shadow: -1px 0px 6px rgba(0, 0, 0, 0.25);
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
