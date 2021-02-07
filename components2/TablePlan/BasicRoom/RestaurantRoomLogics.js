import cms from 'cms';
import _ from 'lodash';

import {getTableName, isBusyTable, isTable} from '../RoomShared';
import {activeOrders, appHooks, tseConfig} from '../../AppSharedStates';
import {useRouter} from 'vue-router'
import {isSameId} from '../../utils';
import {ref} from 'vue'

export const showNumberOfCustomersDialog = ref(false)

const selectingTable = ref(null)


export const moveOrderToNewTable = async function (fromTable, toTable) {
  if (isBusyTable(toTable) || !isBusyTable(fromTable)) {
    return
  }
  const order = _.find(activeOrders.value, i => i.table === fromTable.name)
  await cms.getModel('Order').updateOne({_id: order._id}, {$set: {table: toTable.name}})
  appHooks.emit('orderChange')
}

export let router

export function initRouter() {
  router = useRouter()
}

export function routeToOrder(table) {
  setTimeout(() => router.push(`/pos-order/${getTableName(table)}`), 150) // wave effect
}

export async function chooseTable(obj) {
  if (!isTable(obj)) return
  if (tseConfig.value && tseConfig.value.tseEnable && tseConfig.value.numberOfCustomersDialog) {
    showNumberOfCustomersDialog.value = true
    selectingTable.value = obj
  } else {
    routeToOrder(obj)
  }
}

export const transferTableFrom = ref(null)
export const transferTableTo = ref(null)
export const swiping = ref(false)
export const isTransferringTable = (item) => {
  return transferTableFrom.value && isSameId(transferTableFrom.value, item)
}

export function onCustomerDialogSubmit({numberOfCustomers, tseMethod}, emit) {
  showNumberOfCustomersDialog.value = false
  emit('setInitOrderProps', {
    ...numberOfCustomers && {numberOfCustomers: +numberOfCustomers},
    tseMethod: tseMethod || 'auto'
  })
  routeToOrder(obj)
}
