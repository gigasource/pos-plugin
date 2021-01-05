<template>
  <div class="row-flex h-100">
    <div class="image col-6"></div>
    <div class="customer-order col-6">
      <div class="customer-order__top">
        <div class="customer-order__top--title">{{ companyName }}</div>
        <div>
          <p>{{ date }}</p>
          <p class="ta-right" style="font-weight: normal">{{ time }}</p>
        </div>
      </div>
      <div class="customer-order__table">
        <g-simple-table striped fixed-header style="height: 100%">
          <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Each (€)</th>
            <th>Total (€)</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="product in items" :key="product._id">
            <td>
              <p>{{ product.name }}</p>
              <!--              <p v-if="product.promotion" class="promotion ml-3">{{product.promotion}}</p>-->
              <div>
                <g-chip v-for="(modifier, index) in product.modifiers" :key="`${product._id}_${index}`"
                        label small text-color="#616161">
                  {{ modifier.name }}
                </g-chip>
              </div>
            </td>
            <td>{{ product.quantity }}</td>
            <td>
              <p>{{ getItemPrice(product) | convertMoney }}</p>
              <p v-if="hasPromotion(product)" class="promotion line-through">
                {{ getItemPrice(product, true) | convertMoney }}</p>
            </td>
            <td>
              <p class="fw-700">{{ getItemTotal(product) | convertMoney }}</p>
              <p v-if="hasPromotion(product)" class="promotion line-through">
                {{ getItemTotal(product, true) | convertMoney }}
              </p>
            </td>
          </tr>
          <tr v-for="row in 10">
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          </tbody>
        </g-simple-table>
      </div>
      <div class="customer-order__bottom">
        <div class="customer-order__bottom--left">
          <p>Discount (€)</p>
          <p class="ta-right">- {{ $filters.formatCurrency(discount) }}</p>
          <p>Tax (€)</p>
          <p class="ta-right">{{ $filters.formatCurrency(tax) }}</p>
          <p>Sub-total (€)</p>
          <p class="fw-700 ta-right">{{ $filters.formatCurrency(subTotal) }}</p>
          <p class="fw-700">Total (€)</p>
          <p class="fw-700 fs-large-3 ta-right" style="color: #1271FF">{{ $filters.formatCurrency(total) }}</p>
        </div>
        <g-divider vertical/>
        <div class="customer-order__bottom--right">
          <div class="row-flex justify-between align-items-center">
            <p>Payment method:</p>
            <p class="fw-700">{{ payment }}</p>
          </div>
          <div class="row-flex justify-between align-items-center">
            <p>Received (€)</p>
            <p class="fw-700">{{ $filters.formatCurrency(receive) }}</p>
          </div>
          <div class="row-flex justify-between align-items-center">
            <p>Tip (€)</p>
            <p class="fw-700">{{ $filters.formatCurrency(tip) }}</p>
          </div>
          <div class="row-flex justify-between align-items-center">
            <p>Change due (€)</p>
            <p class="fw-700 fs-large-3" style="color: #1271FF">{{ $filters.formatCurrency(change) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import * as orderUtils from '../logic/orderUtil'

  export default {
    name: 'CustomerOrder',
    data() {
      return {
        productList: [
          {
            name: 'Bread', unit: 'piece', quantity: 3, price: 0.75
          },
          {
            name: 'Butter', unit: 'piece', quantity: 2, price: 2.50
          },
          {
            name: 'Coca-cola', unit: 'bottle', quantity: 1, price: 2.00
          },
          {
            name: 'Egg', unit: 'piece', quantity: 12, price: 0.5, promotion: 'Promotion A', discount: 0.10
          },
        ],
        currentOrder: {},
        dateTime: new Date(),
        companyName: '',
        justPaidOrder: false,
        tempOrder: null
      }
    },
    computed: {
      discount() {
        return orderUtils.calOrderDiscount(this.currentOrder.items || [])
      },
      tax() {
        return orderUtils.calOrderTax(this.currentOrder.items || [])
      },
      total() {
        return orderUtils.calOrderVSum(this.currentOrder)
      },
      subTotal() {
        return this.total - this.tax
      },
      receive() {
        return orderUtils.calOrderReceive(this.currentOrder.payment || [])
      },
      tip() {
        return this.currentOrder.tip || 0
      },
      change() {
        if (!this.receive) return 0
        const change = this.receive - this.total - this.tip
        return change > 0 ? change : 0
      },
      payment() {
        const payment = this.currentOrder.payment || []
        return payment
        .filter(i => i.type === 'cash' || i.type === 'card')
        .map(i => i.type.charAt(0).toUpperCase() + i.type.slice(1)).join(', ')
      },
      items() {
        const items = this.currentOrder.items || [];
        return items.filter(i => i.quantity)
      },
      date() {
        return dayjs(this.dateTime).format('MMM DD, YYYY')
      },
      time() {
        return dayjs(this.dateTime).format('HH:mm')
      }
    },
    methods: {
      hasPromotion(item) {
        return item.price < item.originalPrice
      },
      getItemTotal(item, original) {
        const price = this.getItemPrice(item, original)
        return item.quantity * price
      },
      getItemPrice(item, original) {
        let price = original ? item.originalPrice : item.price
        if (item.modifiers && item.modifiers.length) price += _.sumBy(item.modifiers, 'price')
        return price
      }
    },
    async created() {
      cms.socket.on('get-customer-order', order => {
        if (this.justPaidOrder) {
          this.tempOrder = order
          return
        }

        this.currentOrder = order

        if (order.status === 'paid') {
          this.justPaidOrder = true
          setTimeout(() => {
            this.justPaidOrder = false
            this.currentOrder = this.tempOrder
            this.tempOrder = null
          }, 5000)
        }
      })
      this.getDateInterval = setInterval(() => {
        this.dateTime = new Date()
      }, 5000)

      const posSettings = await cms.getModel('PosSetting').findOne()
      if (posSettings.companyInfo) {
        this.companyName = posSettings.companyInfo.name || ''
      }
    },
    beforeUnmount() {
      if (this.getDateInterval) {
        clearInterval(this.getDateInterval)
        this.getDateInterval = null
      }
    }
  }
</script>

<style scoped lang="scss">
  .image {
    background-image: url("/plugins/pos-plugin/assets/customer-order.png");
    background-repeat: no-repeat;
    background-size: cover;
  }

  .customer-order {
    display: flex;
    flex-direction: column;
    font-size: 15px;
    color: #1d1d26;

    &__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      font-weight: 700;

      &--title {
        font-size: 18px;
      }
    }

    &__table {
      flex: 1;
      border-radius: 6px;
      border: 1px solid #E8E8E8;
      margin: 8px;
      overflow: auto;
      contain: content;

      .g-table {
        border-radius: inherit;

        ::v-deep .g-data-table__wrapper {
          border-radius: inherit;
          overflow: visible;
        }

        ::v-deep table {
          table-layout: fixed;

          th, td {
            padding: 12px;
            color: #1d1d26;
            text-align: center;

            &:first-child {
              width: 50%;
              text-align: left;
            }
          }

          th {
            font-weight: 700;
            background-color: white;
          }
        }
      }

      .promotion {
        color: #979797;

        &.line-through {
          text-decoration: line-through;
        }
      }
    }

    &__bottom {
      display: flex;
      padding: 12px 24px 12px 24px;
      justify-content: space-between;

      &--left {
        display: grid;
        flex-grow: 1;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: repeat(4, 1fr);
        align-items: center;
        margin-right: 24px;
      }

      &--right {
        display: grid;
        flex-grow: 1;
        grid-template-columns: 1fr;
        grid-template-rows: repeat(4, 1fr);
        align-items: center;
        margin-left: 24px;
      }
    }

    .g-chip {
      margin: 0 4px 4px 0;
    }
  }
</style>
