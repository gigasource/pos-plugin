import { computed } from 'vue';
import cms from 'cms';
import _ from 'lodash';
import { activeOrders } from '../../AppSharedStates';

const inProgressTables = computed(() => {
  return _.compact(activeOrders.value.map(order => order.table))
})

export const isBusyTable = function (table) {
  return (inProgressTables.value || []).includes(table.name)
}

export const getTableOrderInfo = function (table) {
  const idx = _.findIndex(activeOrders.value, order => order.table === table.name)
  return idx === -1 ? null : activeOrders.value[idx]
}

export const moveOrderToNewTable = async function (fromTable, toTable) {
  if (isBusyTable(toTable) || !isBusyTable(fromTable)) {
    return
  }
  const order = await cms.getModel('Order').findOne({table: fromTable.name})
  await cms.getModel('Order').updateOne({ _id: order._id }, { $set: { table: toTable.name } })
}
