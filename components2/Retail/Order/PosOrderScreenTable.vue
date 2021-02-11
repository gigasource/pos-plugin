<script>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import _ from 'lodash'
import { genScopeId } from '../../utils';
import { storeLocale } from '../../AppSharedStates';
import {
  removeItemQuantity as _removeItemQuantity
} from './temp-logic';
import {
  getCurrentOrder
} from '../../OrderView/pos-logic-be'
import { useI18n } from 'vue-i18n'
import { appHooks } from '../../AppSharedStates';

export default {
  name: 'PosOrderScreenTable',
  setup() {
    appHooks.emit('settingChange')
    const { t } = useI18n()
    const viewportRows = ref(0)
    const tableWrapper = ref(null)
    // This is product which is being selected among all products
    const selectedTableProduct = ref(null)
    const order = getCurrentOrder()
    const formattedProducts = computed(() => {
      if (!order.value) return null
      return order.value.items.map(item => ({
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
      if (index === selectedTableProduct.value) {
        selectedTableProduct.value = undefined
      } else if (!_.isNil(index)) {
        selectedTableProduct.value = index
      }
    }

    function addItemQuantity(index) {
    }

    function removeItemQuantity(index, removeAll) {
    }

    watch(() => order, ({ items }, { items: oldItems }) => {
      if (items && items.length > oldItems.length) {
        tableWrapper.scrollTop = items.length >= viewportRows.value
            ? tableWrapper.scrollHeight
            : 0
      }
    })

    // watch(() => selectedTableProduct.value, (newValue, oldValue) => {
    //   // TODO: refs array
    //   if (!_.isNil(newValue) && newValue > -1 && this.$refs[`row_${newValue}`].length > 0) {
    //     this.$refs[`row_${newValue}`][0].$el.classList.add('g-expansion__active')
    //   }
    //   if (!_.isNil(oldValue) && oldValue > -1 && this.$refs[`row_${oldValue}`].length > 0) {
    //     this.$refs[`row_${oldValue}`][0].$el.classList.remove('g-expansion__active')
    //   }
    // })

    onMounted(() => {
      nextTick(() => viewportRows.value = Math.floor(tableWrapper.clientHeight / 44))
    })

    return genScopeId(() => (
        <div>
          <div ref={tableWrapper} class="table-wrapper">
            <g-simple-table striped fixed-header ref="table">
              <thead>
              <tr>
                <th>
                  <div class="row-flex" style="line-height: 1.75">
                    <span class="flex-grow-1 pa-2 ta-left">{t('order.name')}</span>
                    <span class="w-10 pa-2 ta-center">{t('order.unit')}</span>
                    <span class="w-10 pa-2 ta-right">{t('order.quantity')}</span>
                    <span class="w-12 pa-2 ta-right">{t('order.each')}({t('common.currency', storeLocale.value)})</span>
                    <span class="pa-2 ta-right" style="width: 15%; max-width: 15%">{t('common.total')}({t('common.currency', storeLocale.value)})</span>
                  </div>
                </th>
              </tr>
              </thead>
              {formattedProducts.value && formattedProducts.value.map((item, index) =>
                  <table-expansion-row
                      key={index} ref={`row_${index}`} v-bind={item}
                      onToggle={() => toggle(index)}
                      onClick:remove={(v) => removeItemQuantity(index, v)}
                      onClick:add={() => addItemQuantity(index)}>
                  </table-expansion-row>
              )}
              {
              (formattedProducts.value && formattedProducts.value.length < viewportRows.value) && _.range(1, viewportRows.value - formattedProducts.value.length).map((i, index) =>
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
