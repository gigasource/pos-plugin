import {computed, nextTick, ref} from 'vue';
import {activeOrders} from '../../../AppSharedStates';
import {getDiffTime} from '../../../../utils/commons';
import {routeToOrder} from '../RestaurantRoomLogics';
import {getTableOrderInfo, isBusyTable} from '../../RoomShared';
import _ from 'lodash'

export const textFieldRef = ref(null)
export const tableNameInput = ref('')
export const showNumberOfCustomersDialog = ref(false)

export const manualTables = computed(() => {
  return _(activeOrders.value).filter(o => o.manual).map(o => o.table).uniq().value()
})

export function tableExists() {
  if (!tableNameInput.value) return
  return manualTables.value.includes(_.trim(tableNameInput.value));
}

export function getOrderTime(tableName) {
  const startTime = getTableOrderInfo(tableName)
  return getDiffTime(startTime, new Date())
}

export async function addTable() {
  if (!tableNameInput.value || tableExists()) return
  routeToOrder(tableNameInput.value)
}

export function focusTextField() {
  setTimeout(() => {
    textFieldRef.value && textFieldRef.value.$el && textFieldRef.value.$el.click()
  }, 500)
}
