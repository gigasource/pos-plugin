<template>
  <g-dialog v-if="order" v-model="dialog" width="580px">
    <g-card class="px-3 pb-2">
      <g-card-title style="font-size: 20px">Order Details</g-card-title>
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
              <template v-if="item.modifiers.length > 0">
                <span class="i text-grey">(<span v-for="modifier in item.modifiers">{{modifier}}</span>)</span>
              </template>
            </div>
            <div class="col-2 fs-small-2 ta-right">€ {{item.price.toFixed(2)}}</div>
          </div>
        </div>

        <div class="dashed-gradient"/>
        <div class="row-flex justify-between mt-2">
          <div>Total <b>{{orderQuantity}}</b> item(s)</div>
          <div class="ta-right">€ {{order.vSum.toFixed(2)}}</div>
        </div>
        <div class="row-flex justify-between mb-2">
          <div>{{$t('onlineOrder.shippingFee')}}:</div>
          <div class="ta-right">€ {{order.shippingFee ? order.shippingFee.toFixed(2) : 0}}</div>
        </div>
        <div class="dashed-gradient"/>
        <div class="row-flex justify-between mt-2" style="font-size: 15px; font-weight: 700; font-family: Verdana, sans-serif">
          <div>Total</div>
          <div class="ta-right">€ {{(order.vSum + (order.shippingFee || 0)).toFixed(2)}}</div>
        </div>
      </g-card-text>
      <g-card-actions>
        <g-btn-bs height="60" background-color="#E57373" text-color="white" class="flex-equal" @click.stop="declineOrder(order)">Cancel & move to declined orders</g-btn-bs>
        <g-btn-bs height="60" background-color="#2979FF" text-color="white" class="flex-equal" @click.stop="completeOrder(order)">Complete order</g-btn-bs>
      </g-card-actions>
    </g-card>
  </g-dialog>
</template>

<script>
  export default {
    name: 'dialogCompleteOrder',
    props: {
      value: Boolean
    },
    data() {
      return {
        order: null
      }
    },
    computed: {
      dialog: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        }
      },
      orderQuantity() {
        return this.order.items.reduce((acc, val) => acc + val.quantity, 0)
      }
    },
    methods: {
      showDialog(order) {
        if (order) {
          this.order = order
          this.dialog = true
        }
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
