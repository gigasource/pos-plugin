<template>
  <g-dialog v-model="internalValue" width="464" overlayOpacity="0.2" eager persistent>
    <div class="cpn-order-created">
      <div class="cpn-order-created__header">
        <div class="mt-2">{{$t('store.orderSuccessfully')}}</div>
      </div>
      <div class="cpn-order-created__content">
        <!-- Order progress -->
        <div style="text-align: center">
          <div class="order-progress">
            <div style="position:relative; background-color: #EEEEEE; border-radius: 50%; display: inline-block;">
              <g-progress-circular v-if="waitingConfirm" :rotate="-90" :size="circularSize" width="4" :value="confirmProgress" color="#536DFE"/>
              <div v-if="waitingConfirm && remainConfirmTime < orderProcessTimeOut * 3/4" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #424242; font-weight: bold; font-size: 18px;">{{ roundedRemainConfirmTIme }}</div>
              <div v-if="orderHasBeenProcessed || orderMissed" style="padding: 4px;">
                <div :style="actResultDivStyle">
                  <img draggable="false" v-if="confirmed" src="/plugins/pos-plugin/assets/order-progress--confirmed.svg">
                  <img draggable="false" v-else-if="cancelled || orderMissed" src="/plugins/pos-plugin/assets/order-progress--cancelled.svg">
                </div>
              </div>
            </div>
            <div class="order-message">
              <div v-if="waitingConfirm" v-html>{{ waitingConfirmMessage }}</div>
              <div v-else-if="orderMissed">
                <div style="color: #E57373">{{$t('store.orderMissed')}}</div>
                <i18n path="store.apology" tag="div" for="store.tryAgain">
                  <span class="link-try-again" @click="tryAgain">{{$t('store.tryAgain')}}</span>
                </i18n>
              </div>
              <div v-else-if="confirmed">
                <div>{{$t('store.orderConfirmed')}}</div>
                <div style="font-weight: bold">{{ deliveryTime }}</div>
              </div>
              <div v-else-if="cancelled">
                <div style="color: #E57373">{{$t('store.orderCancelled')}}</div>
                <div style="color: #747474" v-if="cancelledReason">{{$t('store.reason')}}: {{ cancelledReason }}</div>
              </div>
            </div>
          </div>
        </div>

        <template v-if="!orderMissed">
          <div class="order-item">
            <div v-for="(item, index) in order.items" :key="index" class="order-detail">
              <div class="order-detail__index" >{{ item.quantity || 1}}</div>
              <div class="order-detail__name">
                {{ item.name }}
                <span v-if="item.modifiers && item.modifiers.length > 0"
                      style="color: #757575; font-size: 12px; text-transform: capitalize">- {{getItemModifier(item)}}</span>
              </div>
              <div>{{ getItemPrice(item) | currency }}</div>
            </div>
          </div>
          <div class="order-info">
            <span>{{$t('store.total')}} <b>{{ totalItems }}</b> {{$t('store.items')}}</span>
            <g-spacer/>
            <span>{{ order.totalPrice | currency }}</span>
          </div>
          <div :class="order.discounts.length === 0 ? 'order-detail' : 'order-info'">
            <span>{{$t('store.shippingFee')}}:</span>
            <g-spacer/>
            <span>{{ order.shippingFee | currency }}</span>
          </div>
          <div v-if="order.discounts.length > 0">
            <div class="order-discount" v-for="{name, coupon, value} in order.discounts">
              <span>{{coupon ? `Coupon (${coupon})` : `${name}`}}:</span>
              <g-spacer/>
              <span>-{{ value | currency }}</span>
            </div>
          </div>
          <div class="order-info fw-700">
            <span>{{$t('store.total')}}</span>
            <g-spacer/>
            <span>{{ order.effectiveTotal | currency}}</span>
          </div>
        </template>
        <template v-else>
          <div class="more-info">
            <p class="fw-700 i">{{$t('store.possibleReasons')}}:</p>
            <div class="ml-1">•  {{$t('store.reason1')}}</div>
            <div class="ml-1">•  {{$t('store.reason2')}}</div>
            <p class="fw-700 i mt-1">{{$t('store.callUs')}}:</p>
            <div class="phone">
              <g-icon class="mr-1" size="20">icon-phone_blue</g-icon>
              <div class="fw-600 text-indigo-accent-2">{{phone}}</div>
            </div>
          </div>
        </template>

      </div>
      <div v-show="orderHasBeenProcessed || orderMissed" class="cpn-order-created__actions">
        <g-btn-bs width="98" text-color="#536DFE" rounded @click="close">Close</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>
<script>
  export default {
    name: 'OrderCreated',
    props: {
      value: Boolean,
      order: Object,
      phone: [Number, String],
      timeout: {
        type: Number,
        default: 3
      },
      getItemPrice: Function,
      getItemModifier: Function
    },
    filters: {
      currency(value) {
        if (value)
          return $t('common.currency') + value.toFixed(2)
        return 0
      }
    },
    data() {
      return {
        deliveryTime: '',
        cancelledReason: '',
        sprintTimeOut: 60,
        waited: 0,
        circularSize: 70,
        status: 'inProgress', // inProgress, kitchen, declined,
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        }
      },
      orderProcessTimeOut() {
        return this.timeout * 60
      },
      orderHasBeenProcessed() {
        return this.order.status !== 'inProgress'
      },
      waitingConfirm() {
        return this.order.status === 'inProgress' && this.waited < this.orderProcessTimeOut
      },
      remainConfirmTime() {
        return this.orderProcessTimeOut - this.waited
      },
      roundedRemainConfirmTIme() {
        return Math.floor(this.remainConfirmTime)
      },
      confirmProgress() {
        const x = this.waited / this.orderProcessTimeOut
        // Refs: https://easings.net/#easeOutCubic
        return 100 * (Math.pow(1 - x, 3)) // 1 - (1 - Math.pow(1 - x, 3))
      },
      waitingConfirmMessage() {
        if (this.remainConfirmTime > this.orderProcessTimeOut * 3/4)
          return $t('store.waiting1')
        else if (this.remainConfirmTime > this.orderProcessTimeOut / 2)
          return $t('store.waiting2')
        else if (this.remainConfirmTime > this.orderProcessTimeOut / 4)
          return $t('store.waiting3')
        else
          return $t('store.waiting4')
      },
      orderMissed() {
        return this.order.status === 'inProgress' && this.waited >= this.orderProcessTimeOut
      },
      confirmed() {
        return this.order.status === 'kitchen'
      },
      cancelled() {
        return this.order.status === 'declined' || this.waited > this.orderProcessTimeOut
      },
      actResultDivStyle() {
        return {
          width: `${this.circularSize}px`,
          height: `${this.circularSize}px`,
          display: 'flex',
          'justify-content': 'center',
          'align-items': 'center',
          'border-radius': '50%',
          'background-color': this.confirmed ? '#536DFE' : '#E57373',
        }
      },
      totalItems() {
        return this.order.items ? this.order.items.reduce((quan, item) => quan + item.quantity, 0) : 0
      },
    },
    methods: {
      close() {
        this.$emit('close')
        this.internalValue = false
      },
      tryAgain() {

      }
    },
    created() {
      window.cms.socket.on('updateOrderStatus', (orderToken, orderStatus, extraInfo) => {
        if (orderToken === this.order.orderToken) {
          this.order.status = orderStatus
          if (orderStatus === 'declined') {
            this.cancelledReason = extraInfo
          } else if (orderStatus === 'kitchen') {
            this.deliveryTime = extraInfo
          }
        }
      })
      this.intervalId = setInterval(() => {
        this.waited += 0.25
        if (this.waited >= this.orderProcessTimeOut) {
          clearInterval(this.intervalId)
        }
      }, 250)
    },
    beforeDestroy() {
      window.cms.socket.off('updateOrderStatus')
      clearInterval(this.intervalId)
    }
  }
</script>
<style scoped lang="scss">
  .cpn-order-created {
    background-color: #FFF;
    width: 100%;
    border-radius: 4px;
    box-shadow: 0px 0px 28px rgba(58, 56, 56, 0.15);
    padding: 24px 48px;
    
    &__header {
      font-weight: bold;
      font-size: 20px;
      line-height: 25px;
      color: #536DFE;
      margin-top: 16px;
      margin-bottom: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      & > img {
        max-width: 60px;
      }
    }
    
    &__message {
      margin-top: 24px;
      font-size: 14px;
      line-height: 18px;
      color: #9E9E9E;
    }

    &__content {
      font-size: 14px;

      .order-item {
        overflow: auto;
        scrollbar-width: none; // firefox
        border-bottom: 1px solid #d8d8d8;
        max-height: 210px;
        -webkit-overflow-scrolling: touch;

        &::-webkit-scrollbar {
          display: none;
        }
      }

      .order-detail {
        display: flex;
        border-bottom: 1px solid #D8D8D8;
        padding-top: 8px;
        padding-bottom: 8px;
        font-size: 14px;

        &:last-child {
          border-bottom: none;
        }

        &__index {
          width: 20px;
          height: 20px;
          line-height: 20px;
          font-weight: bold;
          font-size: 13px;
          margin-right: 10px;
          background-color: #424242;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1398);
          color: #FFF;
          text-align: center;
          border-radius: 50%;
        }

        &__name {
          min-width: 0;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
      }

      .order-info {
        display: flex;
        padding-top: 4px;
        padding-bottom: 4px;
      }

      .order-discount {
        display: flex;
        padding-top: 4px;
        padding-bottom: 4px;
        font-size: 14px;

        &:last-child {
          border-bottom: 1px solid #D8D8D8;
        }
      }

      .g-tf-wrapper ::v-deep input {
        user-select: text !important;
      }
    }
    
    &__actions {
      padding-top: 10px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      border-top: 1px solid #eee;
    }
  }

  /* Order progress */
  .order-progress {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .order-message {
      font-size: 18px;
      margin-top: 12px;

      .link-try-again {
        color: #536DFE;
        text-decoration: underline;
        cursor: pointer;
      }
    }
  }
  ::v-deep {
    .g-progress-circular__underlay {
      stroke: transparent;
    }
  }

  .more-info {
    margin-top: 16px;
    font-size: 16px;

    .phone {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 16px;
      font-size: 21px;
    }
  }

  @media screen and (max-width: 1139px) {
    .cpn-order-created {
      padding: 24px;
    }

    .order-progress {
      .order-message {
        font-size: 16px;
      }
    }

    .more-info {
      font-size: 14px;
    }
  }

  @media screen and (max-height: 720px) {
    .cpn-order-created {
      padding-top: 12px;
      padding-bottom: 12px;

      &__header {
        margin-top: 0;
        margin-bottom: 16px;
        font-size: 18px;
      }

      &__content {
        max-height: calc(100% - 90px);
        font-size: 12px;
        line-height: 1.2;

        .order-message {
          font-size: 14px;
        }

        .order-item {
          max-height: 125px;
        }

        .order-detail {
          padding: 4px 0;
          font-size: 12px;

          &__index {
            width: 14px;
            height: 14px;
            line-height: 14px;
            font-size: 11px;
          }
        }

        .order-discount, .order-info {
          font-size: 12px;
          padding-top: 2px;
          padding-bottom: 2px;
        }

        .more-info {
          font-size: 12px;
          margin-top: 8px;

          .g-icon {
            transform: scale(0.75);
          }

          .phone {
            font-size: 14px;
          }
        }
      }

      &__actions {
        padding-top: 0;
        margin-top: 4px;
      }
    }
  }

</style>
