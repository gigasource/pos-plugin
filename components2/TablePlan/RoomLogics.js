import { computed, reactive, ref, watchEffect } from 'vue'
import _ from 'lodash'

export const viewW = ref(0)
export const viewH = ref(0);

const createRoom = function (_room) {
  let room = _.assign(_room, {
    roomObjects: (_room && _room.roomObjects) || [],
  })
  room = reactive(room)
  const maxX = computed(() => {
    const obj = _.maxBy(room.roomObjects, (obj) => obj.location.x + obj.size.width)
    return obj ? obj.location.x + obj.size.width : 0
  })
  const maxY = computed(() => {
    const obj = _.maxBy(room.roomObjects, (obj) => obj.location.y + obj.size.height)
    return obj ? obj.location.y + obj.size.height : 0
  })

  const w1 = computed(() => {
    return maxX.value
  });
  const h1 = computed(() => {
    return maxY.value
  });
  //viewW, viewH, w1, h1 => zoom

  const zoom = computed(() => {
    if (viewW.value > 0 && viewH.value > 0 && h1.value > 0 && w1.value > 0) {
      const zoomVerticalRatio = viewH.value / h1.value
      const zoomHorizontalRatio = viewW.value / w1.value
      return Math.min(zoomVerticalRatio, zoomHorizontalRatio, 1)
    }
    return 1
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


  return { room, zoom }
}

export const updateObjectLocation = function (room, object, newLocation, zoom) {
  const idx = _.findIndex(room.roomObjects, i => i._id === object._id)
  if (zoom && idx !== -1) {
    room.roomObjects[idx].location.x = newLocation.x / zoom
    room.roomObjects[idx].location.y = newLocation.y / zoom
  }
}

export const updateObjectSize = function (room, object, newSize, zoom) {
  const idx = _.findIndex(room.roomObjects, i => i._id === object._id)
  if (zoom && idx !== -1) {
    room.roomObjects[idx].size.width = newSize.width / zoom
    room.roomObjects[idx].size.height = newSize.height / zoom
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

export {
  createRoom,
  addRoomObject,
  removeRoomObject,
  updateRoomObject,
}
