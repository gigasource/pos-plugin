<template>
  <div class="main">
    <div class="pending-orders pr-2">
      <div class="header">
        {{$t('onlineOrder.pendingOrders')}}
        <g-badge inline :value="true" color="#4CAF50" v-if="internalOrders && internalOrders.length">
          <template v-slot:badge>
            <div class="px-2">{{internalOrders.length}}</div>
          </template>
        </g-badge>
      </div>
      <div class="content">
        <template v-if="(!internalOrders || !internalOrders.length) && calls.length === 0">
          <div class="pending-orders--empty">
            <img alt src="/plugins/pos-plugin/assets/pending_order.svg"/>
            <p>{{$t('onlineOrder.noPending')}}</p>
          </div>
        </template>
        <template v-else-if="(!internalOrders || !internalOrders.length) && calls.length > 0">
          <div class="pending-orders--call" v-for="(call, i) in calls" :key="`call_${i}`">
            <div class="pending-orders--call-title">
              <div>{{call.customer.name}} <span>-</span> {{call.customer.phone}}</div>
              <g-spacer/>
              <g-icon size="20">icon-call</g-icon>
            </div>
            <p class="fs-small-2 text-grey-darken-1">Incomming call</p>
            <div class="pending-orders--call-buttons">
              <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" @click="deleteCall(i)">
                <g-icon size="16">icon-cross-red</g-icon>
              </g-btn-bs>
              <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" @click="openReservationDialog(call.customer)">
                <g-icon size="16">icon-table-reservation</g-icon>
              </g-btn-bs>
              <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" @click="openOrderDialog(call.customer, 'pickup')">
                <g-icon size="16">icon-take-away</g-icon>
              </g-btn-bs>
              <g-btn-bs class="flex-equal" border-color="#C4C4C4" @click="openOrderDialog(call.customer, 'delivery')">
                <g-icon size="16">icon-delivery-scooter</g-icon>
              </g-btn-bs>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="pending-orders--call" v-for="(call, i) in calls" :key="`call_${i}`">
            <div class="pending-orders--call-title">
              <div>{{call.customer.name}} <span>-</span> {{call.customer.phone}}</div>
              <g-spacer/>
              <g-icon>icon-call</g-icon>
            </div>
            <p class="fs-small-2 text-grey-darken-1">Incomming call</p>
            <div class="pending-orders--call-buttons">
              <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" @click="deleteCall(i)">
                <g-icon size="16">icon-cross-red</g-icon>
              </g-btn-bs>
              <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" @click="openReservationDialog(call.customer)">
                <g-icon size="16">icon-table-reservation</g-icon>
              </g-btn-bs>
              <g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" @click="openOrderDialog(call.customer, 'pickup')">
                <g-icon size="16">icon-take-away</g-icon>
              </g-btn-bs>
              <g-btn-bs class="flex-equal" border-color="#C4C4C4" @click="openOrderDialog(call.customer, 'delivery')">
                <g-icon size="16">icon-delivery-scooter</g-icon>
              </g-btn-bs>
            </div>
          </div>
          <g-card elevation="0" v-for="(order, index) in internalOrders" :key="index">
            <g-card-title class="pending-orders--title">
              <div class="row-flex align-items-center flex-grow-1">
                <g-icon v-if="order.type === 'delivery'">icon-delivery-scooter</g-icon>
                <g-icon v-if="order.type === 'pickup'">icon-take-away</g-icon>
                <div class="fs-small-2 ml-1" style="max-width: calc(100% - 24px); line-height: 1.2">
                  <span class="fs-small fw-700 text-indigo-accent-2">#{{order.id}}</span>
                  {{order.customer ? order.customer.name : 'No customer name'}} - {{order.customer ? order.customer.phone : 'No customer phone'}}
                </div>
              </div>
              <div class="row-flex justify-end align-items-center r" style="flex: 0 0 auto">
                <span v-if="order.deliveryTime" class="fw-700 fs-small ml-2 mr-2" style="text-transform: uppercase">{{order.deliveryTime}}</span>
                <template v-if="order.timeoutDate && timeoutProgress[order._id]">
                  <g-progress-circular rotate="-90" width="1.5" size="36" color="#E57373" :value="timeoutProgress[order._id].progress"/>
                  <div class="progress-remaining">{{timeoutProgress[order._id].remaining}}</div>
                </template>
              </div>
            </g-card-title>
            <g-card-text>
              <div v-if="order.note" class="text-grey-darken-1 i mb-1" style="font-size: 13px; line-height: 16px">
                {{$t('onlineOrder.note')}}: {{order.note}}
              </div>
              <div class="row-flex" v-if="order.type === 'delivery'">
                <div style="flex: 0 0 25px">
                  <g-icon color="#9E9E9E" size="20">icon-place</g-icon>
                </div>
                <div style="max-width: calc(100% - 25px);" class="flex-equal pl-1">{{`${order.customer.address} ${order.customer.zipCode}`}}</div>
              </div>
              <div v-if="order.items">
                <div class="row-flex align-items-start" v-for="item in order.items">
                  <div style="flex: 0 0 25px; font-weight: 700; font-size: 12px">{{item.quantity}}x</div>
                  <div class="flex-equal fs-small-2 pl-1" style="word-break: break-all">
                    {{item.id && `${item.id}.`}} {{item.name}}
                    <span class="i text-grey">{{getExtraInfo(item)}}</span>
                  </div>
                  <div class="fs-small-2 ta-right">€{{ getItemPrice(item) | formatMoney(decimals)}}</div>
                </div>
              </div>
              <div v-if="order.type === 'delivery'" class="row-flex">
                <div class="flex-equal fw-700">{{$t('onlineOrder.shippingFee')}}</div>
                <div class="fs-small-2 ta-right">€{{order.shippingFee | formatMoney(decimals)}}</div>
              </div>
              <div v-if="order.discounts && order.discounts.length">
                <div class="row-flex align-items-start" v-for="discount in order.discounts">
                  <div>
                    <span>{{discount.coupon ? `Coupon ` : discount.name}}</span>
                    <span style="color: #757575; font-style: italic" v-if="discount.coupon">({{discount.coupon}})</span>
                  </div>
                  <g-spacer/>
                  <div class="fs-small-2">-{{$t('common.currency', storeLocale)}}{{discount.value | formatMoney(decimals)}}</div>
                </div>
              </div>
            </g-card-text>
            <g-card-actions v-if="order.declineStep2">
              <g-text-field-bs :label="$t('onlineOrder.reasonDecline')" v-model="order.declineReason">
                <template v-slot:append-inner>
                  <g-icon style="cursor: pointer" @click="openDialogReason(order)">icon-keyboard</g-icon>
                </template>
              </g-text-field-bs>
            </g-card-actions>
            <g-card-actions v-if="order.confirmStep2
              && ((order.type === 'delivery' && order.deliveryTime === 'asap') || (order.type === 'pickup'))">
              <div class="w-100">
                <p class="ml-2 mb-1">{{$t('onlineOrder.settings.timeToComplete2')}} (min)</p>
                <value-picker :values="[15, 30, 45, 60]" :default-value="defaultPrepareTime || 30" allow-custom v-model="order.prepareTime"></value-picker>
              </div>
            </g-card-actions>
            <g-card-actions>
              <g-btn-bs v-if="!order.confirmStep2 && !order.declineStep2" height="54" width="60" border-color="#C4C4C4" text-color="black" @click.stop="onClickDecline(order)">
                <g-icon size="14">icon-cross-red</g-icon>
              </g-btn-bs>
              <g-btn-bs v-if="order.confirmStep2 || order.declineStep2" height="54" width="60" border-color="#C4C4C4" text-color="black" @click.stop="onBack(order)">
                {{$t('onlineOrder.back')}}
              </g-btn-bs>
              <g-btn-bs v-if="order.declineStep2" height="54" background-color="#E0E0E0" text-color="black" style="flex: 1" @click="declineOrder(order)">
                Confirm
              </g-btn-bs>
              <g-btn-bs v-else height="54" background-color="#E0E0E0" class="pending-orders--btn-price" text-color="black" style="flex: 1" @click.stop="onClickAccept(order)">
                <img v-if="order.payment.icon" :src="order.payment.icon" :alt="order.payment.type" style="height: 16px" class="mr-2"/>
                <span v-else class="mr-2">{{order.payment.type}}</span>
                <span>{{$t('common.currency', storeLocale)}}{{order.payment.value | formatMoney(decimals)}}</span>
              </g-btn-bs>
            </g-card-actions>
            <g-card-actions v-if="order.forwardedStore" class="pending-orders--forward-store">
              <b class="mr-1">From:</b> {{order.forwardedStore}}
            </g-card-actions>
          </g-card>
        </template>
      </div>
    </div>
    <div class="kitchen-orders pl-2">
      <div class="header">
        {{$t('onlineOrder.sentToKitchen')}}
        <g-badge inline :value="true" color="#F9A825" v-if="sortedKitchenOrders && sortedKitchenOrders.length">
          <template v-slot:badge>
            <div class="px-2">{{sortedKitchenOrders.length}}</div>
          </template>
        </g-badge>
      </div>
      <div class="content">
        <template v-if="!sortedKitchenOrders || !sortedKitchenOrders.length">
          <div class="kitchen-orders--empty">
            <p>{{$t('onlineOrder.noKitchen')}}</p>
          </div>
        </template>
        <template v-else>
          <g-card elevation="0" v-for="(order, index) in sortedKitchenOrders" :key="index"
                  :style="[getPendingOrderKitchenTime(order) < 10 && {border: '1px solid #FF4452'}]">
            <g-card-title>
              <div class="fs-small-2 ml-1" style="max-width: calc(100% - 96px); line-height: 1.2">
                <span class="fs-small fw-700 text-indigo-accent-2">#{{order.id}}</span>
                {{order.customer ? order.customer.name : 'No customer name'}} - {{order.customer ? order.customer.phone : 'No customer phone'}}
              </div>
              <g-spacer/>
              <div class="kitchen-orders__timer" @click.stop="openDialog(order)">
                <g-icon v-if="order.type === 'delivery'">icon-delivery-scooter</g-icon>
                <g-icon v-if="order.type === 'pickup'">icon-take-away</g-icon>
                <span class="fw-700 fs-small ml-2">{{order.deliveryTime}}</span>
              </div>
            </g-card-title>
            <g-card-text>
              <div v-if="order.note" class="text-grey-darken-1 i mb-1" style="font-size: 13px; line-height: 16px">
                Note: {{order.note}}
              </div>
              <div class="row-flex" v-if="order.type === 'delivery'">
                <div class="col-1">
                  <g-icon color="#9E9E9E" size="20">icon-place</g-icon>
                </div>
                <div class="col-11 text-grey-darken-1">{{`${order.customer.address} ${order.customer.zipCode}`}}</div>
              </div>
              <div class="row-flex" v-if="order.items">
                <div class="col-1" style="line-height: 20px">
                  <g-icon color="#9E9E9E" size="20">icon-food</g-icon>
                </div>
                <div style="padding-top: 2px">
                  <span v-for="item in order.items">
                    <span class="fw-700">{{item.quantity}}x </span>
                    <span class="mr-3" style="word-break: break-all">
                      {{item.id && `${item.id}.`}} {{item.name}}
                      <span class="i text-grey fs-small-2">{{getExtraInfo(item)}}</span>
                    </span>
                  </span>
                </div>
              </div>
              <div class="row-flex" v-if="order.forwardedStore">
                <div class="col-1 row-flex align-items-center">
                  <g-icon color="#9E9E9E" size="17">icon-double-arrow-right</g-icon>
                </div>
                <div>{{order.forwardedStore}}</div>
              </div>
            </g-card-text>
          </g-card>
        </template>
      </div>
    </div>
    <dialog-complete-order ref="dialog" v-model="showDialog"
                           @completeOrder="completeOrder"
                           @declineOrder="declineOrder"/>
    <dialog-text-filter v-model="dialog.reason" label="Reason" :default-value="dialog.order.declineReason" @submit="submitReason"/>
    <new-reservation-dialog v-model="dialog.reservation" :received-phone="customer ? customer.phone : ''" @submit="getPendingReservationsLength"/>
    <dialog-order v-model="dialog.createOrder" :customer="customer" :type="orderType"/>
  </div>
</template>

<script>
  import orderUtil from '../logic/orderUtil'

  export default {
    name: 'OnlineOrderMain',
    injectService: ['PosStore:(storeLocale, getPendingReservationsLength)'],
    props: {
      pendingOrders: Array,
      kitchenOrders: Array,
      defaultPrepareTime: Number,
      onlineOrderSorting: String
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
    data() {
      return {
        internalOrders: [],
        showDialog: false,
        decimals: 2,
        dialog: {
          order: {},
          reason: false,
          reservation: false,
          createOrder: false
        },
        timeoutInterval: {},
        timeoutProgress: {},
        calls: [],
        customer: {},
        orderType: null
      }
    },
    created() {
      cms.socket.on('receiving-call', async (phone, date) => {
        const customer = await this.getCustomerInfo(phone)
        this.calls.unshift({customer, date})
      })
    },
    watch: {
      pendingOrders(val, oldVal) {
        if (val === oldVal) return
        this.internalOrders = val.map(order => Object.assign({}, order, {
          ...order.deliveryTime ? {deliveryTime: order.deliveryTime.toString()} : {},
          shippingFee: this.getShippingFee(order),
          payment: this.getPayment(order),
          confirmStep2: false,
          declineStep2: false,
          prepareTime: null,
          declineReason: ''
        }))

        const ordersWithTimeout = this.pendingOrders.filter(item => item.timeoutDate)
        this.timeoutProgress = ordersWithTimeout.reduce((timeouts, order) => {
          return Object.assign(timeouts, {
            [order._id]: this.getTimeoutProgress(order)
          })
        }, {})
      }
    },
    computed: {
      sortedKitchenOrders() {
        if (this.onlineOrderSorting) return this.kitchenOrders.sort((current, next) => {
          if (this.onlineOrderSorting === 'order' && current.id && next.id) {
            return next.id - current.id
          }
          return this.getPendingOrderKitchenTime(current) - this.getPendingOrderKitchenTime(next)
        })
        return this.kitchenOrders
      },
    },
    methods: {
      getPayment({ payment }) {
        const { value, type } = payment[0];
        let paymentMethod = cms.getList('PosSetting')[0].payment.find(i => i.name === type)
        return Object.assign(paymentMethod || {}, { value, type })
      },
      declineOrder(order) {
        this.$emit('declineOrder', order)
      },
      acceptOrder(order) {
        this.$emit('acceptPendingOrder', order)
      },
      completeOrder(order) {
        this.$emit('completeOrder', order)
      },
      onClickAccept(order) {
        if (order.deliveryTime !== 'asap') return this.acceptOrder(order)

        if (order.declineStep2) this.$set(order, 'declineStep2', false)
        if (!order.confirmStep2) return this.$set(order, 'confirmStep2', true)
        if (!order.prepareTime) order.prepareTime = this.defaultPrepareTime
        this.acceptOrder(order)
      },
      onClickDecline(order) {
        if (order.confirmStep2) return this.$set(order, 'confirmStep2', false)
        if (!order.declineStep2) return this.$set(order, 'declineStep2', true)
      },
      openDialog(order) {
        this.$refs.dialog.showDialog(order)
      },
      onBack(order) {
        this.$set(order, 'declineStep2', false)
        this.$set(order, 'confirmStep2', false)
      },
      openDialogReason(order) {
        this.dialog.order = order
        this.dialog.reason = true
      },
      submitReason(reason) {
        const order = this.internalOrders.find(o => o._id === this.dialog.order._id)
        this.$set(order, 'declineReason', reason)
      },
      getDeliveryDate(order) {
        return dayjs(order.date).add(order.prepareTime, 'minute').toDate()
      },
      getShippingFee(order) {
        if (!order.discounts) return order.shippingFee

        const freeShipping = order.discounts.find(item => item.type === 'freeShipping');
        return freeShipping ? freeShipping.value : order.shippingFee;
      },
      getTimeoutProgress(order) {
        const calc = () => {
          clearTimeout(this.timeoutInterval[order._id])

          requestAnimationFrame(() => {
            const now = new Date()
            const diff = dayjs(order.timeoutDate).diff(now, 'second', true);
            const timeout = dayjs(order.timeoutDate).diff(order.date, 'second', true)
            if (diff <= 0) return this.$set(this.timeoutProgress, order._id, { progress: 0, remaining: 0 })

            const x = (timeout - diff) / timeout
            const progress = 100 * (1 - Math.sin((x * Math.PI) / 2))

            this.$set(order, 'timeoutProgress', progress)
            this.$set(this.timeoutProgress, order._id, { progress, remaining: diff.toFixed(0) })

            this.timeoutInterval[order._id] = setTimeout(calc, 250)
          })
        }

        if (!order.timeoutDate) return
        return calc()
      },
      getPendingOrderKitchenTime(order) {
        return dayjs(order.deliveryTime, 'HH:mm').diff(dayjs(), 'minute')
      },
      getItemPrice(item) {
        return orderUtil.getItemPrice(item)
      },
      getExtraInfo(item) {
        return orderUtil.getExtraInfo(item)
      },
      async getCustomerInfo(phone) {
        const customer = await cms.getModel('Customer').findOne({phone})
        if (!customer) {
          return {
            phone,
            name: 'New customer',
            addresses: []
          }
        }
        return customer
      },
      deleteCall(index) {
        this.calls.splice(index, 1)
      },
      openReservationDialog(customer) {
        this.customer = customer
        this.dialog.reservation = true
      },
      openOrderDialog(customer, type) {
        this.customer = customer
        this.orderType = type
        this.dialog.createOrder = true
      }
    },
    mounted() {
      this.decimals = this.$t('common.currencyDecimal')
      this.$nextTick(() => {
        this.$emit('updateOnlineOrders')
      })
    },
    activated() {
      this.$nextTick(() => {
        this.$emit('updateOnlineOrders')
      })
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
        .g-card-title{
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

      .pending-orders--call-buttons .g-btn-bs{
        padding: 4px;
      }
    }

  }
</style>
