<template>
  <g-dialog v-if="order" v-model="dialog" width="580px">
    <g-card class="px-3 pb-2">
      <g-card-title style="font-size: 20px">{{$t('onlineOrder.orderDetails')}}</g-card-title>
      <g-card-text class="fs-small">
        <div class="row-flex mb-2">
          <div style="flex: 0 0 30px">
            <g-icon v-if="order.type === 'delivery'">icon-delivery-man</g-icon>
            <g-icon v-if="order.type === 'pickup'">icon-pickup</g-icon>
          </div>
          <p>
            <span class="text-indigo-accent-2 fw-600">#{{order.id}}</span>
            {{order.customer ? order.customer.name : 'No customer name'}} - {{order.customer ? order.customer.phone : 'No customer phone'}}
          </p>
          <g-spacer/>
          <span class="fw-700 fs-large">{{order.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}}</span>
        </div>

        <div class="row-flex mb-2" v-if="order.type === 'delivery'">
          <div style="flex: 0 0 30px">
            <g-icon color="#9E9E9E" size="20">icon-place</g-icon>
          </div>
          <div class="col-10">{{`${order.customer.address} ${order.customer.zipCode}`}}</div>
        </div>

        <div v-if="order.items" class="mb-2">
          <div class="row-flex" v-for="item in order.items">
            <div class="fw-700" style="flex: 0 0 30px">{{item.quantity}}x</div>
            <div class="flex-equal">
              {{item.name}}
              <span class="i text-grey">{{getExtraInfo(item)}}</span>
            </div>
            <div class="col-2 fs-small-2 ta-right">{{$t('common.currency')}} {{getItemPrice(item) | formatMoney}}</div>
          </div>
        </div>

        <div class="dashed-gradient"/>
        <div class="row-flex justify-between mt-2">
          <div>{{$t('onlineOrder.total')}} <b>{{orderQuantity}}</b> {{$t('onlineOrder.items')}}</div>
          <div class="ta-right">{{$t('common.currency')}} {{subTotal | formatMoney}}</div>
        </div>
        <div class="row-flex justify-between" v-if="order.type === 'delivery'">
          <div>{{$t('onlineOrder.shippingFee')}}:</div>
          <div class="ta-right">{{$t('common.currency')}} {{getShippingFee() | formatMoney}}</div>
        </div>
        <div class="row-flex justify-between" v-for="discount in order.discounts">
          <div>
            <span>{{discount.coupon ? 'Coupon ' : discount.name}}</span>
            <span style="color: #757575; font-style: italic"  v-if="discount.coupon">({{discount.coupon}})</span>:
          </div>
          <div class="ta-right">-{{$t('common.currency')}}{{discount.value | formatMoney(decimals)}}</div>
        </div>
        <div class="dashed-gradient mt-2"/>
        <div class="row-flex justify-between mt-2" style="font-size: 15px; font-weight: 700; font-family: Verdana, sans-serif">
          <div>{{$t('onlineOrder.total')}}</div>
          <div class="ta-right">{{$t('common.currency')}} {{order.vSum | formatMoney}}</div>
        </div>
        <div class="row-flex justify-between mt-1" style="font-size: 15px; font-weight: 700; font-family: Verdana, sans-serif">
          <div>Payment</div>
          <div class="ta-right row-flex align-items-center" style="text-transform: capitalize">
            <img v-if="paymentMethod.icon" :src="paymentMethod.icon" class="mr-1"/>
            <span>{{paymentMethod.type}}</span>
          </div>
        </div>
      </g-card-text>
      <g-card-actions>
        <g-btn-bs height="60" background-color="#E57373" text-color="white" class="flex-equal" @click.stop="declineOrder(order)">{{$t('onlineOrder.cancelOrder')}}</g-btn-bs>
        <g-btn-bs height="60" background-color="#2979FF" text-color="white" class="flex-equal" @click.stop="completeOrder(order)">{{$t('onlineOrder.completeOrder')}}</g-btn-bs>
      </g-card-actions>
    </g-card>
  </g-dialog>
</template>

<script>
  import orderUtil from '../logic/orderUtil'

  export default {
    name: 'dialogCompleteOrder',
    props: {
      value: Boolean
    },
    data() {
      return {
        order: null,
        decimals: 2,
      }
    },
    filters: {
      formatDate(date) {
        return dayjs(date).format('HH:mm')
      },
      formatMoney(value, decimals = 2) {
        if (value != null)
          return !isNaN(value) ? value.toFixed(decimals) : value
      }
    },
    computed: {
      dialog: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        },
      },
      subTotal() {
        return this.order.items.reduce((sum, item) => sum + orderUtil.getItemPrice(item) * item.quantity, 0)
      },
      totalWithShipping() {
        const { shippingFee, vSum } = this.order;
        return vSum + shippingFee
      },
      orderQuantity() {
        return this.order.items.reduce((acc, val) => acc + val.quantity, 0)
      },
      paymentMethod() {
        const { value, type } = this.order.payment[0];
        let payment = cms.getList('PosSetting')[0].payment.find(i => i.name === type)
        return Object.assign(payment || {}, { value, type })
      }
    },
    methods: {
      showDialog(order) {
        if (order) {
          this.order = order
          this.dialog = true
        }
      },
      getItemPrice(item) {
        return orderUtil.getItemPrice(item)
      },
      getExtraInfo(item) {
        return orderUtil.getExtraInfo(item)
      },
      getShippingFee() {
        const { discounts, shippingFee } = this.order
        if (!discounts) return shippingFee

        const freeShipping = discounts.find(item => item.type === 'freeShipping');
        return freeShipping ? freeShipping.value : shippingFee;
      },
      declineOrder(order) {
        this.$emit('declineOrder', order)
        this.dialog = false
      },
      setPendingOrder(order) {
        this.$emit('setPendingOrder', order)
        this.dialog = false
      },
      completeOrder(order) {
        this.$emit('completeOrder', order)
        this.dialog = false
      }
    },
    mounted() {
      this.decimals = this.$t('common.currencyDecimal')
    }
  }
</script>

<style scoped>
  .dashed-gradient {
    height: 1px;
    width: 100%;
    background-image: linear-gradient(to right, #9E9E9E 50%, transparent 50%);
    background-size: 20px 1px;
  }
</style>
