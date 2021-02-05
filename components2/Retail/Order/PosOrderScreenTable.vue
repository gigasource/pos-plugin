<script>
import { computed, nextTick, onMounted, ref } from 'vue';
import _ from 'lodash'
import { genScopeId } from '../../utils';

export default {
  name: 'PosOrderScreenTable',
  injectService: ['OrderStore:(currentOrder)', 'PosStore:storeLocale'],
  setup() {
    const viewportRows = ref(0)
    const formattedProducts = computed(() => {
      return this.currentOrder.items.map(item => ({
        ..._.omit(item, 'attributes'),
        attributes: getAttributes(item),
        originalTotal: (item.quantity * item.originalPrice).toFixed(2),
        total: (item.quantity * item.price).toFixed(2)
      }))
    })

    function getAttributes(item) {
      if (!item.attributes) return
      const attrStringArr = item.attributes.map(attr => `${attr.key}: ${attr.value}`)
      return attrStringArr.join(', ')
    }

    function toggle(index) {
      // TODO
      const posStore = this.$getService('OrderStore')
      if (index === posStore.activeTableProduct) {
        posStore.activeTableProduct = undefined
      } else if (!_.isNil(index)) {
        posStore.activeTableProduct = index
      }
    }

    function addItemQuantity(index) {
      // TODO
      this.$getService('OrderStore:addItemQuantity')(this.currentOrder.items[index])
    }

    function removeItemQuantity(index, removeAll) {
      // TODO
      this.$getService('OrderStore:removeItemQuantity')(this.currentOrder.items[index], removeAll)
    }

    onMounted(() => {
      const orderStore = this.$getService('OrderStore')

      orderStore.$watch('currentOrder.items', (items, oldItems) => {
        if (this.$el) {
          const tableWrapper = this.$el.querySelector('.table-wrapper')
          if (items && items.length > oldItems.length) {
            tableWrapper.scrollTop = items.length >= this.viewportRows
                ? tableWrapper.scrollHeight
                : 0
          }
        }
      }, { deep: true })

      orderStore.$watch('activeTableProduct', (newValue, oldValue) => {
        if (!_.isNil(newValue) && newValue > -1 && this.$refs[`row_${newValue}`].length > 0) {
          this.$refs[`row_${newValue}`][0].$el.classList.add('g-expansion__active')
        }
        if (!_.isNil(oldValue) && oldValue > -1 && this.$refs[`row_${oldValue}`].length > 0) {
          this.$refs[`row_${oldValue}`][0].$el.classList.remove('g-expansion__active')
        }
      })

      orderStore.updateTableRows = (() =>
          nextTick(() => this.viewportRows = Math.floor(this.$el.querySelector('.table-wrapper').clientHeight / 44)))

      orderStore.updateTableRows()
    })

    return genScopeId(() => (
        <div>
          <div class="table-wrapper">
            <g-simple-table striped fixed-header ref="table">
              <thead>
              <tr>
                <th>
                  <div class="row-flex" style="line-height: 1.75">
                    <span class="flex-grow-1 pa-2 ta-left">{t('order.name')}</span>
                    <span class="w-10 pa-2 ta-center">{t('order.unit')}</span>
                    <span class="w-10 pa-2 ta-right">{t('order.quantity')}</span>
                    <span class="w-12 pa-2 ta-right">{t('order.each')}({t('common.currency', storeLocale)})</span>
                    <span class="pa-2 ta-right" style="width: 15%; max-width: 15%">{t('common.total')}({t('common.currency', storeLocale)})</span>
                  </div>
                </th>
              </tr>
              </thead>
              {formattedProducts.value.map((item, index) =>
                  <table-expansion-row
                      key={index} ref={`row_${index}`} v-bind={item}
                      onToggle={() => toggle(index)}
                      onClick:remove={(v) => removeItemQuantity(index, v)}
                      onClick:add={() => addItemQuantity(index)}>
                  </table-expansion-row>
              )}
              {
              (formattedProducts.value.length < viewportRows.value) && _.range(1, viewportRows.value - formattedProducts.value.length).map((i, index) =>
                  <tr key={`empty_${index}`} class="empty-row">
                    <td></td>
                  </tr>
              )
            }
            </g-simple-table>
          </div>
        </div>
    ))
  }
}
</script>

<style scoped lang="scss">
.table {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
  margin: 6px;
  position: relative;

  .empty-row td {
    height: 44px;
  }

  .table-wrapper {
    position: absolute;
    contain: content;
    width: 100%;
    height: 100%;
    overflow: auto;
    border-radius: inherit;

    ::v-deep .g-data-table__wrapper {
      border-radius: inherit;
      overflow: visible;

      table {
        thead th {
          color: inherit;
          padding: 0;
          background-color: white;
        }
      }
    }
  }
}
</style>
