import { computed, nextTick, ref } from 'vue';
import { activeOrders } from '../../../AppSharedStates';
import { getDiffTime } from '../../../../utils/commons';
import { routeToOrder } from '../RestaurantRoomLogics';
import { getTableOrderInfo, isBusyTable } from '../../RoomShared';
import _ from 'lodash'
export const textFieldRef = ref(null)
export const tableNameInput = ref('')
export const showNumberOfCustomersDialog = ref(false)

export const manualTables = computed(() => {
  return _(activeOrders.value).filter(o => o.manual).map(o => o.table).uniq().value()
})

export function tableExists() {
  if (!this.text) return
  return this.manualTables.includes(this.trimmedText)
}

export function getOrderTime(tableName) {
  const startTime = getTableOrderInfo(tableName)
  return getDiffTime(startTime, new Date())
}

export async function addTable() {
  //todo:
  if (!tableNameInput.value || this.tableExists) return
  if (isBusyTable(tableNameInput.value.trim())) {
    routeToOrder(tableNameInput.value)
    return
  }
}

export function focusTextField() {
  setTimeout(() => {
    textFieldRef.value && textFieldRef.value.$el && textFieldRef.value.$el.click()
  }, 500)
}
