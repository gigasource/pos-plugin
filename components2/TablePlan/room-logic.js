import { reactive, watchEffect, ref } from 'vue'
import _ from 'lodash'
import { computed } from 'vue';

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


  return { room, viewH, viewW, zoom, w1, h1}
}

export const updateObjectLocation = function(room, object, newLocation, zoom) {
  const idx = _.findIndex(room.roomObjects, i => i._id === object._id)
  if (zoom.value && idx !== -1) {
    room.roomObjects[idx].location.x = newLocation.x / zoom.value
    room.roomObjects[idx].location.y = newLocation.y / zoom.value
  }
}

export const updateObjectSize = function(room, object, newSize, zoom) {
  const idx = _.findIndex(room.roomObjects, i => i._id === object._id)
  if (zoom.value && idx !== -1) {
    room.roomObjects[idx].size.width = newSize.width / zoom.value
    room.roomObjects[idx].size.height = newSize.height / zoom.value
  }
}

const addRoomObject = function (room, obj) {
  const _obj = _.cloneDeep(obj)
  room.roomObjects.push(_obj)
}

const removeRoomObject = function (room, obj) {
  const idx = _.findIndex(room.roomObjects, i => i._id === obj._id)
  if (idx !== -1) room.roomObjects.splice(idx, 1);
}

const updateRoomObject = function (room, obj, newObj) {
  const idx = _.findIndex(room.roomObjects, i => i._id === obj._id)
  if (idx !== -1) {
    room.roomObjects[idx] = _.assign(room.roomObjects[idx], newObj)
    return room.roomObjects[idx]
  } else return null
}

const updateRoomObjects = function(room, newRoomObjects) {
  room.roomObjects = newRoomObjects
}

export const isTable = (item) => {
  return item.type === 'table'
}

export const isWall = (item) => {
  return item.type === 'wall'
}

export {
  createRoom,
  addRoomObject,
  removeRoomObject,
  updateRoomObject,
  updateRoomObjects,
}
