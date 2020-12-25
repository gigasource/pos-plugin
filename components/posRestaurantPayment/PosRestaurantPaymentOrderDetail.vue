<template>
  <div class="order-detail">
    <div class="order-detail__header">
      <g-avatar size="36">
        <img :src="avatar" alt="">
      </g-avatar>
      <div class="ml-2">
        <span class="order-detail__header-username">{{username}}</span>
        <div v-if="table">
          <span class="order-detail__header-title">{{$t('restaurant.table')}}</span>
          <span class="order-detail__header-value">{{table}}</span>
        </div>
      </div>
      <g-spacer/>
      <span class="order-detail__header-title">Total</span>
      <span class="order-detail__header-value text-red">€{{ $filters.formatCurrency(total) }}</span>
    </div>
    <div class="order-detail__content">
      <div v-for="(item, i) in items" :key="i" class="item">
        <div class="item-detail">
          <div>
            <p class="item-detail__name">{{item.name}}</p>
            <p>
              <span :class="['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']">€{{ $filters.formatCurrency(item.originalPrice) }}</span>
              <span class="item-detail__price--new" v-if="isItemDiscounted(item)">€ {{ $filters.formatCurrency(item.price) }}</span>
              <span :class="['item-detail__option', item.option === 'Take away' ? 'text-green-accent-3' : 'text-red-accent-2']">{{item.option}}</span>
            </p>
          </div>
          <div class="item-action">
            <span>{{item.quantity}}</span>
          </div>
        </div>
        <div v-if="item.modifiers">
          <template v-for="(modifier, index) in item.modifiers" :key="`${item._id}_${index}`">
            <g-chip label small text-color="#616161">
              {{ modifier.name }} | €{{ $filters.formatCurrency(modifier.price) }}
            </g-chip>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "PosRestaurantPaymentOrderDetail",
    props: {
      compactOrder: Function,
      total: 0,
      currentOrder: null,
      user: null
    },
    data() {
      return {
        username: 'Admin',
        //todo add table binding
      }
    },
    computed: {
      avatar() {
        return this.user ? this.user.avatar : ''
      },
      items() {
        return this.currentOrder.items.filter(i => i.quantity)
      },
      table() {
        return this.currentOrder.table
      },
      displayItems() {
        return this.compactOrder(this.items)
      }
    },
    methods: {
      isItemDiscounted(item) {
        return item.originalPrice !== item.price
      },
    }
  }
</script>

<style scoped lang="scss">
  .order-detail {
    padding: 0 8px;
    background: white;
    color: #1d1d26;
    box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.25);
    height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;

    &__header {
      display: flex;
      align-items: center;

      &-username {
        font-weight: 700;
        font-size: 11px;
        flex-grow: 1;
      }

      &-title {
        opacity: 0.5;
        font-size: 11px;
        font-weight: 600;
      }

      &-value {
        font-size: 16px;
        font-weight: 600;
        margin-left: 4px;
      }
    }

    &__content {
      border-radius: 8px;
      border: 1px solid #e8e8e8;
      overflow: scroll;
      margin-bottom: 3px;

      .item {
        padding: 8px;

        &:nth-child(even) {
          background-color: #f8f8f8;
        }

        &-detail {
          display: flex;
          justify-content: space-between;

          &__name {
            font-weight: 700;
            font-size: 14px;
          }

          &__price {
            font-size: 12px;
            color: #616161;
            margin-right: 4px;

            &--new {
              font-size: 14px;
              color: #ff5252;
              margin-right: 4px;
            }
          }

          &__discount {
            text-decoration: line-through;
          }

          &__option {
            font-size: 12px;
            font-style: italic;
            font-weight: 700;
          }
        }

        &-action {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-basis: 25%;

          .g-icon {
            cursor: pointer;
            color: #1d1d26;
          }
        }
      }
    }
  }
</style>
