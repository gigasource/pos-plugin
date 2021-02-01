import { computed } from 'vue';
import { activeOrders } from '../AppSharedStates';
import _ from 'lodash';
import { roomsStates } from './RoomState';

export const tables = computed(() => {
  return roomsStates.value.map(roomState => roomState.room.roomObjects.filter(isTable)).flat()
})

export const inProgressTables = computed(() => {
  return _.compact(activeOrders.value.map(order => order.table))
})

window.inProgressTables = inProgressTables;

export const getTableName = function (table) {
  return (typeof table === 'object') ? table.name : table
}
const _isBusyTable = function (tableName) {
  return (inProgressTables.value || []).includes(tableName)
}
export const isBusyTable = function (table) {
  return _isBusyTable(getTableName(table))
}
export const _isAnExistingTable = (tableName) => {
  return _.some(tables.value, i => i === tableName)
}
export const isAnExistingTable = (table) => {
  return _.some(tables.value, i => i === getTableName(table))
}
export const isTable = (item) => {
  return item.type === 'table'
}
export const isWall = (item) => {
  return item.type === 'wall'
}
const _getTableOrderInfo = function (tableName) {
  const idx = _.findIndex(activeOrders.value, order => order.table === tableName)
  return idx === -1 ? null : activeOrders.value[idx]
}
export const getTableOrderInfo = function (table) {
  return _getTableOrderInfo(getTableName(table))
}
