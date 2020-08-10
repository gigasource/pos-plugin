<template>
  <g-dialog v-model="internalValue" width="464" eager :persistent="loading">
    <div class="dialog">
      <div class="dialog-title">{{$t('store.orderConfirmation')}}</div>
      <div class="dialog-message">
        {{$t('store.messageConfirm')}}
      </div>
      <div class="dialog-content">
        <div class="order-item">
          <div v-for="(item, index) in items" :key="index" class="order-item-detail">
            <div class="order-item-detail__index" >{{ item.quantity || 1}}</div>
            <div class="order-item-detail__name">
              {{ item.name }}
              <span v-if="item.modifiers && item.modifiers.length > 0" class="po-order-table__item__modifier">- {{getItemModifiers(item)}}</span>
            </div>
            <div class="pl-1">{{ getItemPrice(item) | currency(storeCountryLocale) }}</div>
          </div>
        </div>
        <div class="order-item-summary">
          <span>{{$t('store.total')}}: <b>{{ totalItems }}</b> {{$t('store.items')}}</span>
          <g-spacer/>
          <span>{{ totalPrice | currency(storeCountryLocale) }}</span>
        </div>
        <div class="order-item-summary" v-if="type === 'delivery'">
          <span>{{$t('store.shippingFee')}}:</span>
          <g-spacer/>
          <span>{{ shippingFee | currency(storeCountryLocale) }}</span>
        </div>
        <div class="order-item-summary" v-for="{name, coupon, value} in discounts">
          <span>{{coupon ? `Coupon (${coupon})` : `${name}`}}:</span>
          <g-spacer/>
          <span>-{{ value | currency(storeCountryLocale) }}</span>
        </div>
        <div class="order-item-summary order-item-summary--end fw-700">
          <span>{{$t('store.total')}}</span>
          <g-spacer/>
          <span>{{effectiveTotal | currency(storeCountryLocale)}}</span>
        </div>
      </div>
      <div class="dialog-action">
        <g-btn-bs text-color="#424242" @click="internalValue = false" v-if="!loading">{{$t('setting.cancel')}}</g-btn-bs>
        <g-btn-bs width="110" text-color="white" :background-color="loading ? 'grey' : '#536DFE'" :disabled="loading" rounded @click="confirm">
          <template v-if="loading"><g-progress-circular indeterminate/></template>
          <template v-else>{{$t('store.confirm')}}</template>
        </g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogOrderConfirm",
    props: {
      value: Boolean,
      items: Array,
      totalItems: Number,
      totalPrice: Number,
      shippingFee: Number,
      discounts: Array,
      effectiveTotal: Number,
      loading: Boolean,
      type: String,
      storeCountryLocale: String,
    },
    filters: {
      currency(value, locale) {
        if (value != null) return $t('common.currency', locale) + value.toFixed(2)

        return 0
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
      }
    },
    methods: {
      getItemPrice(item) {
        return item.price + _.sumBy(item.modifiers, modifier => modifier.price * modifier.quantity)
      },
      getItemModifiers(item) {
        return item.modifiers.map(m => m.name).join(', ')
      },
      confirm() {
        this.$emit('confirm')
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    background: white;
    width: 100%;
    border-radius: 4px;
    padding: 36px;

    &-title {
      font-size: 20px;
      font-weight: 700;
    }

    &-message {
      color: #424242;
      font-size: 18px;
      text-align: center;
      padding: 16px;
    }

    &-content {
      .order-item {
        overflow: auto;
        max-height: 210px;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none; // firefox
        -ms-overflow-style: none; // ie

        &::-webkit-scrollbar {
          display: none;
        }

        &-detail {
          display: flex;
          flex-direction: row;
          border-bottom: 1px solid #D8D8D8;
          padding: 8px 0;
          font-size: 14px;

          &__index {
            width: 20px;
            height: 20px;
            line-height: 20px;
            font-weight: bold;
            font-size: 12px;
            margin-right: 10px;
            background-color: #424242;
            box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.1398);
            color: #FFF;
            text-align: center;
            border-radius: 50%;
          }

          &__name {
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            min-width: 0;
          }
        }

        &-summary {
          @extend .order-item-detail;
          border-bottom: none;
          padding: 4px 0;

          &--end {
            border-top: 1px solid #d8d8d8;
          }
        }
      }

    }

    &-action {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-top: 16px;
      margin-right: -8px;
    }
  }

  @media screen and (max-height: 720px) {
    .dialog {
      padding: 24px;

      &-title {
        font-size: 18px;
      }

      &-message {
        font-size: 16px;
      }

      &-content {
        .order-item {
          max-height: 120px;

          &-detail {
            padding: 4px 0;
            font-size: 12px;

            &__index {
              width: 14px;
              height: 14px;
              line-height: 14px;
              font-size: 11px;
            }
          }
        }
      }
    }
  }
</style>
