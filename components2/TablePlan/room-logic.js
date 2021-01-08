import { reactive, watchEffect, ref } from 'vue'
import _ from 'lodash'

import { computed } from 'vue';

import { isBusyTable } from '../View/EditTablePlan/room-state'

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
    return obj ? obj.location.x + obj.size.width : 0
  })
  const maxY = computed(() => {
    const obj =  _.maxBy(room.roomObjects, (obj) => obj.location.y + obj.size.height)
    return obj ? obj.location.y + obj.size.height : 0
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
    if (isRoomElInitialized && h1.value > 0 && w1.value > 0) {
      const zoomVerticalRatio = viewH.value / h1.value
      const zoomHorizontalRatio = viewW.value / w1.value
      zoom.value = Math.min(zoomVerticalRatio, zoomHorizontalRatio)
    } else zoom.value = 1
  })

  //room.zoom => obj.realLocation & obj.realSize
  watchEffect(() => {
    for (const obj of room.roomObjects) {
      if (obj.location) obj.realLocation = {
        x: obj.location.x * zoom.value,
        y: obj.location.y * zoom.value
      }
      if (obj.size) obj.realSize = {
        width: obj.size.width * zoom.value,
        height: obj.size.height * zoom.value
      }
    }
  })
  const updateObjectLocation = function(object, newLocation) {
    if (zoom.value) {
      object.location.x = newLocation.x / zoom.value
      object.location.y = newLocation.y / zoom.value
    }
  }

  const updateObjectSize = function(object, newSize) {
    if (zoom.value) {
      object.size.width = newSize.width / zoom.value
      object.size.height = newSize.height / zoom.value
    }
  }

  return { room, viewH, viewW, zoom, w1, h1, updateObjectLocation, updateObjectSize }
}

const addRoomObject = function (room, obj) {
  const _obj = _.cloneDeep(obj)
  room.roomObjects.push(_obj)
}

const removeRoomObject = function (room, obj) {
  const idx = _.findIndex(room.roomObjects, i => i.name === obj.name)
  if (idx !== -1) room.roomObjects.splice(idx, 1);
}

const updateRoomObject = function (room, obj, newObj) {
  const idx = _.findIndex(room.roomObjects, i => i.name === obj.name)
  if (idx !== -1) {
    room.roomObjects[idx] = _.assign({}, room.roomObjects[idx], newObj)
    return room.roomObjects[idx]
  } else return null
}

const moveOrderToNewTable = async function (fromTable, toTable) {
  if (isBusyTable(toTable) || !isBusyTable(fromTable)) {
    // invalid action
    return
  }
  const order = await cms.getModel('Order').findOne({table: fromTable.name})
  await cms.getModel('Order').updateOne({ _id: order._id }, { $set: { table: toTable.name } })
}

const makeTakeAway = function (table) {
  table.takeAway = true
}

const updateRoomObjects = function(room, newRoomObjects) {
  room.roomObjects = newRoomObjects
}

export {
  createRoom,
  addRoomObject,
  removeRoomObject,
  updateRoomObject,
  moveOrderToNewTable,
  makeTakeAway,
  updateRoomObjects
}
