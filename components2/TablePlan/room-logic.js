import { reactive, watchEffect, ref } from 'vue'
import _ from 'lodash'

import { computed } from 'vue';

const cms = {
  getModel(col) {
    return orm(col)
  }
}

const createRoom = function (_roomObjects) {
  let room = _.assign({
    items: _roomObjects || [],
  })

  room = reactive(room)
  const zoom = ref(1);

  let viewW = ref(0), viewH = ref(0);

  const maxX = computed(() => {
    const item = _.maxBy(room.items, (item) => item.location.x + item.size.width)
    return item.location.x + item.size.width
  })
  const maxY = computed(() => {
    const item =  _.maxBy(room.items, (item) => item.location.y + item.size.height)
    return item.location.y + item.size.height
  })

  const w1 = computed(() => {
    return maxX.value
  });

  const h1 = computed(() => {
    return maxY.value
  });
  //viewW, viewH, w1, h1 => zoom
  watchEffect(() => {
    const isRoomElInitialized = (viewW.value > 0 && viewH.value > 0)
    if (isRoomElInitialized) {
      const zoomVerticalRatio = viewH.value / h1.value
      const zoomHorizontalRatio = viewW.value / w1.value
      zoom.value = Math.min(zoomVerticalRatio, zoomHorizontalRatio)
    } else zoom.value = 1
  })

  //room.zoom => item.realLocation & item.realSize
  watchEffect(() => {
    for (const item of room.items) {
      item.realLocation = {
        x: item.location.x * zoom.value,
        y: item.location.y * zoom.value
      }
      item.realSize = {
        x: item.size.width * zoom.value,
        y: item.size.height * zoom.value
      }
    }
  })

  return { room, viewH, viewW, zoom, w1, h1 }
}

const addRoomItem = function (room, item) {
  const _item = _.cloneDeep(item)
  room.items.push(_item)
}

const removeRoomItem = function (room, _item) {
  const __item = room.items.find(i => i.name === _item.name);
  room.items.splice(room.items.indexOf(__item), 1);
}

const moveOrderToNewTable = async function (fromTable, toTable) {
  // todo: swap order
  await fetchInProgressTables()
  if (isBusyTable(toTable) || !isBusyTable(fromTable)) {
    // invalid action
    return
  }
  const order = await cms.getModel('Order').findOne({table: fromTable.name})
  await cms.getModel('Order').updateOne({ _id: order._id }, { $set: { table: toTable.name } })
}

const activeOrders = reactive([]);

const activeTables = computed(() => {
  return activeOrders.value.map(order => order.table)
})

const fetchInProgressTables = async function () {
  activeOrders.value = await cms.getModel('Order').find({status: 'inProgress'})
}

const isBusyTable = function (table) {
  return activeTables.value.includes(table.name)
}

module.exports = {
  createRoom,
  addRoomItem,
  removeRoomItem,
  moveOrderToNewTable,
  activeTables,
  isBusyTable,
  fetchInProgressTables
}
