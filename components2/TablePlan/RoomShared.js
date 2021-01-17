import { computed } from 'vue';
import { activeOrders } from '../AppSharedStates';

export const inProgressTables = computed(() => {
  return _.compact(activeOrders.value.map(order => order.table))
})

export const isBusyTable = function (table) {
  return (inProgressTables.value || []).includes(table.name)
}

export const isTable = (item) => {
  return item.type === 'table'
}

export const isWall = (item) => {
  return item.type === 'wall'
}
