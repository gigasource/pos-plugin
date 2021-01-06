import { reactive, watchEffect, ref } from 'vue'
import _ from 'lodash'

import { computed } from 'vue';

const cms = {
  getModel(col) {
    return orm(col)
  }
}

const createRoom = function (_room) {
  let room = _.assign(_room, {
    roomObjects: (_room && _room.roomObjects) || [],
  })

  room = reactive(room)
  const zoom = ref(1);

  let viewW = ref(0), viewH = ref(0);

  const maxX = computed(() => {
    const obj = _.maxBy(room.roomObjects, (obj) => obj.location.x + obj.size.width)
    return obj.location.x + obj.size.width
  })
  const maxY = computed(() => {
    const obj =  _.maxBy(room.roomObjects, (obj) => obj.location.y + obj.size.height)
    return obj.location.y + obj.size.height
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

  //room.zoom => obj.realLocation & obj.realSize
  watchEffect(() => {
    for (const obj of room.roomObjects) {
      obj.realLocation = {
        x: obj.location.x * zoom.value,
        y: obj.location.y * zoom.value
      }
      obj.realSize = {
        x: obj.size.width * zoom.value,
        y: obj.size.height * zoom.value
      }
    }
  })

  return { room, viewH, viewW, zoom, w1, h1 }
}

const addRoomObject = function (room, obj) {
  const _obj = _.cloneDeep(obj)
  room.roomObjects.push(_obj)
}

const removeRoomObject = function (room, obj) {
  const idx = _.findIndex(room.roomObjects, i => i.name === obj.name)
  if (idx !== -1) room.roomObjects.splice(idx, 1);
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

const makeTakeAway = function (table) {
  table.takeAway = true
}

export {
  createRoom,
  addRoomObject,
  removeRoomObject,
  moveOrderToNewTable,
  activeTables,
  isBusyTable,
  fetchInProgressTables,
  makeTakeAway
}
