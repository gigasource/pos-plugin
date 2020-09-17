<template>
  <div class="order-detail">
    <div class="order-detail__header">
      <g-menu v-if="isMobile" v-model="menu">
        <template v-slot:activator="{ on }">
          <div v-on="on">
            <g-avatar size="36">
              <img alt :src="avatar">
            </g-avatar>
          </div>
        </template>
        <div class="order-detail__menu">
          <g-btn-bs v-if="actionList" :disabled="disablePrintBtn" icon="icon-printer-setting"
                    @click.stop="$emit('saveTableOrder')">
            Print
          </g-btn-bs>
          <g-btn-bs icon="icon-split_check_2">Split check</g-btn-bs>
          <g-btn-bs icon="icon-dinner_2">Div. item</g-btn-bs>
          <g-btn-bs icon="icon-food_container" @click="quickCash(true)">Take away</g-btn-bs>
          <g-btn-bs icon="icon-print" @click="pay">Send</g-btn-bs>
        </div>
      </g-menu>
      <g-avatar v-else size="36">
        <img alt :src="avatar">
      </g-avatar>
      <div :style="{'display': isMobile ? 'block' : 'flex', 'flex': 2}" class="ml-1 align-items-baseline">
        <p class="order-detail__header-username">{{username}}</p>
        <span class="order-detail__header-title" v-if="table">Table</span>
        <span class="order-detail__header-value" v-if="table">{{table}}</span>
      </div>
      <g-spacer v-if="isMobile"/>
      <g-btn-bs v-if="isMobile" class="elevation-1 btn-back" @click="back">
        <g-icon>icon-back</g-icon>
      </g-btn-bs>
      <g-spacer/>
      <span class="order-detail__header-title">{{$t('common.total')}}</span>
      <span class="order-detail__header-value text-red">€{{total | convertMoney}}</span>
    </div>
    <div class="order-detail__content">
      <div v-for="(item, i) in itemsWithQty" :key="i" class="item"
           :style="[item.separate && {borderBottom: '2px solid red'}]"
           @click.stop="openConfigDialog(item)" v-touch="getTouchHandlers(item)">
        <div class="item-detail">
          <div>
            <p class="item-detail__name">{{item.id}}. {{item.name}}</p>
            <p>
              <span :class="['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']">€{{item.originalPrice | convertMoney}}</span>
              <span class="item-detail__price--new" v-if="isItemDiscounted(item)">{{$t('common.currency', storeLocale)}} {{item.price | convertMoney }}</span>
              <span :class="['item-detail__option', item.takeout ? 'text-green-accent-3' : 'text-red-accent-2']">{{getItemSubtext(item)}}</span>
            </p>
          </div>
          <div class="item-action">
            <g-icon @click.stop="removeItem(item)">remove_circle_outline</g-icon>
            <span>{{item.quantity}}</span>
            <g-icon @click.stop="addItem(item)">add_circle_outline</g-icon>
          </div>
        </div>
        <div v-if="item.modifiers">
          <g-chip v-for="(modifier, index) in item.modifiers" :key="`${item._id}_${index}`"
                  label small text-color="#616161" close @close="removeModifier(item, index)">
            {{modifier.name}} | {{$t('common.currency', storeLocale)}}{{modifier.price | convertMoney}}
          </g-chip>
        </div>
      </div>
    </div>
    <dialog-config-order-item v-model="dialogConfigOrderItem.value" :original-value="dialogConfigOrderItem.originalPrice"
                              :product="dialogConfigOrderItem.product"
                              @addModifier="addModifier" @changePrice="changePrice"/>
  </div>
</template>

<script>
  import {Touch} from 'pos-vue-framework';

  export default {
    name: "posOrder",
    directives: {
      Touch
    },
    injectService:['PosStore:isMobile'],
    props: {
      total: Number,
      items: Array,
      user: Object,
      storeLocale: String,
      actionList: Array
    },
    filters: {
      convertMoney(value) {
        return !isNaN(value) ? value.toFixed(2) : value
      }
    },
    data() {
      return {
        table: '',
        dialogConfigOrderItem: {
          value: false,
          product: null,
          originalPrice: 0,
          price: 0
        },
        menu: false
      }
    },
    computed: {
      username() {
        return this.user ? this.user.name : ''
      },
      avatar() {
        return this.user ? this.user.avatar : ''
      },
      computedItems: {
        get() {
          return this.items
        },
        set(value) {
          this.$emit('updateOrderItems', value)
        }
      },
      itemsWithQty() {
        if (this.items) return this.items.filter(i => i.quantity > 0)
        return []
      },
      disablePrintBtn() {
        return this.actionList.length === 0
      }
    },
    methods: {
      isItemDiscounted(item) {
        return item.originalPrice !== item.price
      },
      addItem(item) {
        this.$emit('addItemQuantity', item)
      },
      removeItem(item) {
        this.$emit('removeItemQuantity', item)
      },
      removeModifier(item, index) {
        this.$emit('removeProductModifier', item, index)
      },
      openConfigDialog(item) {
        this.dialogConfigOrderItem = Object.assign({} , this.dialogConfigOrderItem, {
          product: item,
          value: true,
          originalPrice: item.originalPrice,
          price: 0
        })
      },
      addModifier(modifier) {
        this.$emit('addModifierToProduct', {...modifier, quantity: 1}, this.dialogConfigOrderItem.product)
      },
      changePrice(price) {
        this.$emit('changePrice', price, this.dialogConfigOrderItem.product)
      },
      getTouchHandlers(item) {
        return {
          left: () => {
            // console.log(`RTL ${item.name}`)

            if (!item.course) this.$set(item, 'course', 1)

            if (item.course === 1) {
              if (item.takeout) {
                this.$set(item, 'takeout', false)
                this.$set(item, 'separate', true)
              }
              else this.$set(item, 'takeout', true)
            } else {
              this.$set(item, 'course', item.course - 1)
            }
          },
          right: () => {
            // console.log(`LTR ${item.name}`)

            if (!item.course) this.$set(item, 'course', 1)

            if (item.separate) {
              return this.$set(item, 'separate', false)
            }

            if (item.takeout) this.$set(item, 'takeout', false)
            else this.$set(item, 'course', item.course + 1)
          }
        }
      },
      getItemSubtext({ course, takeout, separate }) {
        if (separate) return
        if (takeout) return 'Take-away'
        if (course && course > 1) return `Course: ${course}`
      },
      back() {
        this.$emit('resetOrderData')
        this.$router.push({path: '/pos-dashboard'})
      },
      pay() {
        this.$router.push({path: '/pos-payment'})
      },
      quickCash(isTakeout = false) {
        this.currentOrder.takeOut = isTakeout
        this.$emit('quickCash')
      }
    },
    mounted() {
      const orderStore = this.$getService('OrderStore')

      orderStore.$watch('currentOrder.items', (items, oldItems) => {
        if (this.$el) {
          if (!items) return
          const tableEl = this.$el.querySelector('.order-detail__content')
          if (items.filter(i => i.quantity).length > oldItems.filter(i => i.quantity).length) {
            tableEl.scrollTop = tableEl.scrollHeight
          }
        }
      }, { deep: true })
    },
    activated() {
      if (this.$router.currentRoute.params && this.$router.currentRoute.params.name) {
        this.table = this.$router.currentRoute.params.name
        this.$emit('updateOrderTable', this.table)
      } else this.table = ''
    }
  }
</script>

<style scoped lang="scss">
  .order-detail {
    padding: 0 8px;
    background: white;
    color: #1d1d26;
    box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    max-height: 100vh;

    &__header {
      display: flex;
      align-items: center;
      padding: 8px 0;

      &-username {
        font-weight: 700;
        font-size: 13px;
        flex-grow: 1;
      }

      &-title {
        opacity: 0.5;
        font-size: 11px;
        font-weight: 600;
        margin-right: 4px;
      }

      &-value {
        font-size: 16px;
        font-weight: 600;
        margin-left: 2px;
      }

      .btn-back {
        width: 37px;
        height: 37px;
        border-radius: 50%;
        margin: 0;

        & > .g-icon {
          min-width: 24px;
        }
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
            -webkit-tap-highlight-color: transparent;
          }
        }
      }
    }

    &__menu {
      background-color: white;
      display: flex;
      flex-direction: column;

      .g-btn-bs {
        justify-content: flex-start;
      }
    }
  }

  @media screen and (max-width: 700px) {
    .order-detail__header {
      padding: 4px 0;

      .g-avatar {
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
      }

      &-username {
        font-size: 11px;
      }

      .btn-back {
        width: 28px;
        height: 28px;

        & > .g-icon {
          width: 16px !important;
          height: 16px !important;
          min-width: 16px !important;
        }
      }

      &-title {
        font-size: 9px;
      }

      &-value {
        font-size: 14px;
      }
    }
  }
</style>
