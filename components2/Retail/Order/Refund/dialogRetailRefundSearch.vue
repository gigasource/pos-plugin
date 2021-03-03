<script>
import { ref, watch, nextTick } from 'vue'
import { genScopeId, internalValueFactory } from '../../../utils';
import { useRouter } from 'vue-router'
import { searchOrderByDateRange } from '../../../OrderView/pos-logic-be'
import dayjs from 'dayjs'
import { refundOrder } from '../../pos-retail-shared-logic'
import { isMobile } from '../../../AppSharedStates';
import {makeRefundOrder} from "../../../OrderView/pos-logic";

export default {
  name: 'dialogRetailRefundSearch',
  props: {
    modelValue: Boolean
  },
  setup(props, { emit }) {
    const internalValue = internalValueFactory(props, { emit })
    const searchTerms = [
      { text: 'Order No', value: 0 },
      { text: 'Item Name', value: 1 },
      { text: 'Customer name/phone', value: 2 },
    ]
    const searchTerm = ref(searchTerms[0])
    const searchResult = ref([])
    const searchValue = ref('')
    const searchTimes = [
      { text: 'Today', value: 0 },
      { text: 'Yesterday', value: 1 },
      { text: 'Last 7 days', value: 2 },
      { text: 'Last 30 days', value: 3 },
      { text: 'Last 90 days', value: 4 },
      { text: 'All time', value: 5 },
    ]
    const searchTime = ref(null)
    watch(() => searchTime.value, async (newVal, oldVal) => {
      if (newVal === oldVal) return
      const startOfToday = dayjs().startOf('day')
      let to = dayjs().endOf('day')
      let from
      switch (searchTime.value) {
        case searchTimes[0].value:
          from = startOfToday
          break
        case searchTimes[1].value:
          from = startOfToday.subtract(1, 'day')
          break
        case searchTimes[2].value:
          from = startOfToday.subtract(6, 'day')
          break
        case searchTimes[3].value:
          from = startOfToday.subtract(29, 'day')
          break
        case searchTimes[4].value:
          from = startOfToday.subtract(89, 'day')
          break
        case searchTimes[5].value:
          to = null
          from = null
          break
        default:
          from = startOfToday
          break
      }
      searchResult.value = await searchOrderByDateRange(from, to)
    })
    searchTime.value = searchTimes[0].value

    const router = useRouter()

    function showRefundForOrder(order) {
      // 2 way design:
      //  - passing order id as route params
      //  - store order in singleton variable
      // router.push({path: `retail--order-refund/{:${order}`})
      internalValue.value = false
      refundOrder.value = order
      router.push({path: 'retail--order-refund'})
    }
    return genScopeId(() => <>
      <g-dialog v-model={internalValue.value} fullscreen={isMobile.value}>
        <div style="background-color: #FFF; padding: 15px 15px 30px 15px" class="col-flex">
          <div class="row-flex justify-between mb-3">
            <b>Refund order lookup</b>
            <g-icon onClick={() => internalValue.value = false}>close</g-icon>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 2fr 1fr" class="mb-3">
            <g-select text-field-component="g-text-field-bs" class="refund-g-select" items={searchTerms} v-model={searchTerm.value}></g-select>
            <g-text-field-bs v-model={searchValue.value}></g-text-field-bs>
            <g-select text-field-component="g-text-field-bs" items={searchTimes} v-model={searchTime.value}></g-select>
          </div>

          {/*TODO: fix title scroll bug */}
          <g-table striped fixed-header dense class="mb-3" style="overflow: hidden">
            <thead>
            <tr>
              <th class="ta-left" style="width: 15%; border-bottom: 1px solid #979797">Order No.</th>
              <th class="ta-left" style="width: 15%; border-bottom: 1px solid #979797">Date & Time</th>
              <th class="ta-left" style="width: 15%; border-bottom: 1px solid #979797">Cashier</th>
              <th class="ta-left" style="width: 15%; border-bottom: 1px solid #979797">Customer</th>
              <th class="ta-left" style="width: 15%; border-bottom: 1px solid #979797">Items</th>
              <th class="ta-left" style="width: 25%; border-bottom: 1px solid #979797">Order Value</th>
            </tr>
            </thead>
            <tbody style="overflow: scroll">
            {
              searchResult.value.map((order, index) =>
                  <tr key={index}>
                    <td>{order.id}</td>
                    <td>{dayjs(order.date).format('YYYY-MM-DD HH:MM')}</td>
                    <td>{order.user.map(user => <span>{user.name}</span>)}</td>
                    <td>{order.customer}</td>
                    <td>{order.items.length}</td>
                    <td>
                      <div class="row-flex justify-between">
                        <span>{order.vSum}</span>
                        <g-btn elevation="1" class="mr-2" background-color="#2979FF" text-color="#FFF" style="height: 26px" onClick={() => showRefundForOrder(order)}>Select</g-btn>
                      </div>
                    </td>
                  </tr>
              )
            }
            </tbody>
          </g-table>

          <div class="row-flex justify-end">
            <g-btn elevation="0" background-color="#4CAF50" text-color="#FFF" style="border-radius: 2px" onClick={showRefundForOrder}>Quick refund</g-btn>
          </div>
        </div>
      </g-dialog>
    </>)
  }
}
</script>
<style scoped lang="scss">
</style>
