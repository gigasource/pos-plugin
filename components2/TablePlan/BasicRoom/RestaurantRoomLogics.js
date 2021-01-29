import cms from 'cms';
import _ from 'lodash';

import { isBusyTable } from '../RoomShared';
import { activeOrders, appHooks } from '../../AppSharedStates';
import { useRouter } from 'vue-router'
import { isSameId } from '../../utils';
import { ref } from 'vue'

export const getTableOrderInfo = function (table) {
  const idx = _.findIndex(activeOrders.value, order => order.table === table.name)
  return idx === -1 ? null : activeOrders.value[idx]
}

export const moveOrderToNewTable = async function (fromTable, toTable) {
  if (isBusyTable(toTable) || !isBusyTable(fromTable)) {
    return
  }
  const order = _.find(activeOrders.value, i => i.table === fromTable.name)
  await cms.getModel('Order').updateOne({ _id: order._id }, { $set: { table: toTable.name } })
  appHooks.emit('orderChange')
}

export let router
export function initRouter() {
  router = useRouter()
}
export function chooseTable(name) {
  router.push(`/pos-order/${name}`)
}


export const transferTableFrom = ref(null)
export const transferTableTo = ref(null)
export const swiping = ref(false)

export const isTransferringTable = (item) => {
  return transferTableFrom.value && isSameId(transferTableFrom.value, item)
}
