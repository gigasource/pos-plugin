<template>
  <div v-if="orderHistoryCurrentOrder" class="wrapper">
    <div class="row-flex" style="padding-bottom: 14px">
      <div class="pl-2 flex-grow-1">
        <div class="order-title">{{$t('orderHistory.orderNo')}}</div>
        <div class="order-id">{{orderHistoryCurrentOrder.id}}</div>
      </div>
      <div class="pl-2 flex-grow-1" v-if="orderHistoryCurrentOrder.table">
        <div class="order-title">Table No</div>
        <div class="order-id">{{orderHistoryCurrentOrder.table}}</div>
      </div>
    </div>
    <g-divider/>
    <div style="font-size: 12px; padding: 6px 0">
      <div class="row-flex">
        <div class="flex-grow-1" style="opacity: 0.5">Created time</div>
        <div>{{orderHistoryCurrentOrder.date | formatDate}}</div>
      </div>
      <template v-if="orderHistoryCurrentOrder.staff && orderHistoryCurrentOrder.staff.length">
        <div class="row-flex">
          <div class="flex-grow-1" style="opacity: 0.5">Created by</div>
          <span class="ta-right">{{getCreatedUser(orderHistoryCurrentOrder)}}</span>
        </div>
        <div class="row-flex">
          <div class="flex-grow-1" style="opacity: 0.5">Cashier</div>
          <span class="ta-right">{{getCashierUser(orderHistoryCurrentOrder)}}</span>
        </div>
      </template>
    </div>
    <g-divider/>
    <g-simple-table striped>
      <tr v-for="product in orderHistoryCurrentOrder.items">
        <td>{{product.quantity}}x</td>
        <td>
          {{product.id && `${product.id}.`}} {{product.name}}
          <span class="i text-grey-darken-1">{{getExtraInfo(product)}}</span>
        </td>
        <td class="ta-right">€ {{getItemPrice(product) | formatNumber}}</td>
      </tr>
      <tr v-if="orderHistoryCurrentOrder.type">
        <td></td>
        <td>Shipping Fee</td>
        <td class="ta-right">€ {{orderHistoryCurrentOrder.shippingFee | formatNumber}}</td>
      </tr>
    </g-simple-table>
    <g-divider/>
    <div class="order-info my-2">
      <span class="fw-700">{{$t('orderHistory.promotionalApplied')}}</span>
      <span class="order-info-number">-{{promotionTotal > 0 ? (' € ' + promotionTotal.toFixed(2) ) : ''}}</span>
    </div>
    <g-divider/>
    <div class="order-info mt-2">
      <span>{{$t('common.subtotal')}}</span>
      <span class="order-info-number">€ {{subTotal | formatNumber}}</span>
    </div>
    <div class="order-info mb-2">
      <span>{{$t('common.tax')}}</span>
      <span class="order-info-number">€ {{orderHistoryCurrentOrder.tax | formatNumber}}</span>
    </div>
    <g-divider/>
    <div class="total">
      <div class="row-flex align-items-center" style="justify-content: space-between">
        <span>{{$t('common.total')}} </span>
        <span class="total__important">€ {{orderHistoryCurrentOrder.amount | formatNumber}}</span>
      </div>
      <div class="row-flex align-items-center" style="justify-content: space-between; text-transform: capitalize">
        <span>Payment</span>
        <div class="row-flex align-items-center">
          <img :src="payment.icon" v-if="payment.icon" style="height: 16px" class="mr-2">
          <span>{{payment.name || payment.type}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import orderUtil from '../logic/orderUtil'

  export default {
    name: 'OrderHistoryDetail',
    props: {},
    injectService: [
      'OrderStore:orderHistoryCurrentOrder'
    ],
    filters: {
      formatNumber: (val) => {
        return isNaN(val) ? '0.00' : val.toFixed(2)
      },
      formatDate(val) {
        return dayjs(val).format('DD MMM YY, HH:mm')
      }
    },
    computed: {
      promotionTotal() {
        return this.orderHistoryCurrentOrder && this.orderHistoryCurrentOrder.vDiscount;
      },
      subTotal() {
        return this.orderHistoryCurrentOrder && this.orderHistoryCurrentOrder.amount - this.orderHistoryCurrentOrder.tax;
      },
      payment() {
        const { value, type } = this.orderHistoryCurrentOrder.payment[0]
        let paymentMethod = cms.getList('PosSetting')[0].payment.find(i => i.name === type)
        return Object.assign(paymentMethod || {}, { value, type })
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
      }
    }
  }
</script>

<style scoped lang="scss">
  .wrapper {
    padding: 16px 7px;
    box-shadow: -1px 0px 6px rgba(0, 0, 0, 0.25);
    overflow: auto;
    z-index: 2;
    display: flex;
    flex-direction: column;

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
      margin: 16px 4px;
      font-weight: 700;

      &__important {
        color: #1271ff;
        font-size: 18px;
        line-height: 24px;
      }
    }
  }
</style>
