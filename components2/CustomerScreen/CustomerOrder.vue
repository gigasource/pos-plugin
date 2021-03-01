<script>
import { computed, onBeforeUnmount, ref } from 'vue';
import { posSettings } from '../AppSharedStates';
import { genScopeId } from '../utils';
import { $filters } from '../AppSharedStates';
import { getPaymentTotal } from '../OrderView/pos-logic';

export default {
  setup() {
    const companyName = computed(() => {
      return (posSettings.value && posSettings.value.companyInfo && posSettings.value.companyInfo.name) || ''
    })
    const currentOrder = ref(null)
    const dateTime = ref(new Date())

    const discount = computed(() => {
      return currentOrder.value && currentOrder.value.vDiscount
    })
    const items = computed(() => {
      const _items = (currentOrder.value && currentOrder.value.items) || [];
      return _items.filter(i => i.quantity)
    })
    const tax = computed(() => {
      return _.sumBy(items.value, i => i.tax ? i.vTaxSum[i.tax].tax : 0)
    })

    const total = computed(() => {
      return currentOrder.value ? currentOrder.value.vSum : 0
    })
    const subTotal = computed(() => {
      return total.value - tax.value
    })
    const receive = computed(() => {
      return currentOrder.value ? getPaymentTotal(currentOrder.value) : 0
    })
    const tip = computed(() => {
      return (currentOrder.value && currentOrder.value.tip) || 0
    })

    const change = computed(() => {
      return (currentOrder.value && currentOrder.value.cashback) || 0
    })

    const payment = computed(() => {
      const payment = (currentOrder.value && currentOrder.value.payment) || []
      return payment.filter(i => i.type === 'cash' || i.type === 'card')
      .map(i => i.type.charAt(0).toUpperCase() + i.type.slice(1))
      .join(', ')
    })

    const date = computed(() => {
      return dayjs(dateTime.value).format('MMM DD, YYYY')
    })

    const time = computed(() => {
      return dayjs(dateTime.value).format('HH:mm')
    })

    function hasPromotion(item) {
      return item.originalPrice && item.price < item.originalPrice
    }

    function getItemTotal(item) {
      const price = getItemPrice(item)
      return item.quantity * price
    }

    function getItemPrice(item) {
      let price = item.originalPrice || item.price
      if (item.modifiers && item.modifiers.length) price += _.sumBy(item.modifiers, 'price')
      return price
    }

    cms.socket.on('update-customer-order', order => {
      currentOrder.value = order
    })

    const getDateInterval = setInterval(() => {
      dateTime.value = new Date()
    }, 5000)

    onBeforeUnmount(() => {
      if (getDateInterval) {
        clearInterval(getDateInterval)
      }
    })

    const renderItems = () =>
        <tbody>
        {items.value && items.value.map(item =>
            <tr key={item._id}>
              <td>
                <p>
                  {item.name}
                </p>
                <div>
                  {item.modifiers && item.modifiers.map((modifier, index) =>
                      <g-chip key={`${item._id}_${index}`} label small text-color="#616161">
                        {modifier.name}
                      </g-chip>
                  )}
                </div>
              </td>
              <td> {item.quantity} </td>
              <td>
                <p> {getItemPrice(item)} </p>
                {
                  (hasPromotion(item)) &&
                  <p className="promotion line-through"> {getItemPrice(item, true)} </p>
                }
              </td>
              <td>
                <p className="fw-700"> {getItemTotal(item)} </p>
                {
                  (hasPromotion(item)) &&
                  <p className="promotion line-through">
                    {getItemTotal(item, true)}
                  </p>
                }
              </td>
            </tr>
        )}
        {
          //
          //
          // auto add empty rows
        }
        {_.range(Math.max(10 - items.value.length)).map(row =>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
        )}
        </tbody>
    return genScopeId(() => <>
          <div class="row-flex h-100">
            <div class="image col-6"></div>
            <div class="customer-order col-6">
              <div class="customer-order__top">
                <div class="customer-order__top--title">
                  {companyName.value}
                </div>
                <div>
                  <p>
                    {date.value}
                  </p>
                  <p class="ta-right" style="font-weight: normal">
                    {time.value}
                  </p>
                </div>
              </div>
              <div class="customer-order__table">
                <g-simple-table striped fixed-header style="height: 100%">
                  <thead>
                  <tr>
                    <th>
                      Name
                    </th>
                    <th>
                      Quantity
                    </th>
                    <th>
                      Each (€)
                    </th>
                    <th>
                      Total (€)
                    </th>
                  </tr>
                  </thead>
                  {renderItems()}
                </g-simple-table>
              </div>
              <div class="customer-order__bottom">
                <div class="customer-order__bottom--left">
                  <p> Discount (€) </p>
                  <p class="ta-right">- {$filters.formatCurrency(discount.value)} </p>
                  <p> Tax (€) </p>
                  <p class="ta-right"> {$filters.formatCurrency(tax.value)} </p>
                  <p> Sub-total (€) </p>
                  <p class="fw-700 ta-right"> {$filters.formatCurrency(subTotal.value)} </p>
                  <p class="fw-700"> Total (€) </p>
                  <p class="fw-700 fs-large-3 ta-right" style="color: #1271FF"> {$filters.formatCurrency(total.value)} </p>
                </div>
                <g-divider vertical/>
                <div class="customer-order__bottom--right">
                  <div class="row-flex justify-between align-items-center">
                    <p> Payment method: </p>
                    <p class="fw-700"> {payment.value} </p>
                  </div>
                  <div class="row-flex justify-between align-items-center">
                    <p> Received (€) </p>
                    <p class="fw-700"> {$filters.formatCurrency(receive.value)} </p>
                  </div>
                  <div class="row-flex justify-between align-items-center">
                    <p> Tip (€) </p>
                    <p class="fw-700"> {$filters.formatCurrency(tip.value)} </p>
                  </div>
                  <div class="row-flex justify-between align-items-center">
                    <p> Change due (€) </p>
                    <p class="fw-700 fs-large-3" style="color: #1271FF"> {$filters.formatCurrency(change.value)} </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
    )
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
