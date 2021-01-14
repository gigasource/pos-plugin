import { ref, computed, watch } from 'vue';
import _ from 'lodash';
import { createRoom} from '../../TablePlan/room-logic';
import cms from 'cms';

export const rooms = ref([]);

export const fetchRooms = async function () {
  let _rooms = await cms.getModel('Room').find({})
  _rooms = _.sortBy(_rooms.map(r => createRoom(r).room), r => r.order)
  rooms.value = _rooms;
}

export const addRoom = async function (room) {
  const createdRoom = await cms.getModel('Room').create(room)
  rooms.value.push(createRoom(createdRoom).room)
  return createdRoom
}

export const removeRoom = async function (room) {
  const idx = _.findIndex(rooms.value, r => r._id ===room._id)
  if (idx !== -1) {
    rooms.value.splice(idx, 1)
    await cms.getModel('Room').remove({ _id: room._id })
  }
}

//w

export const removeSelectingRoom = async function() {
  await removeRoom(selectingRoom.value)
  //todo: auto change selecting room
  if (rooms.value.length > 0) {
    selectingRoom.value = rooms.value[0]
  }
}
export const selectingRoom = ref(null);

watch(() => rooms.value, (newV) => {
  if (selectingRoom.value) {
    selectingRoom.value = _.find(rooms.value, r => r._id === selectingRoom.value._id)
  }
}, { deep: true})

export const onSelectRoom = function (newSelectingRoom) {
  selectingRoom.value = newSelectingRoom
}

export const objectsInSelectingRoom = computed(() => (selectingRoom && selectingRoom.value) ? selectingRoom.value.roomObjects : [])

const roomsName = computed(() => {
  return rooms.value.map(r => r.name)
})


export const newRoomName = computed(() => {
  let res = 1
  while (roomsName.value.includes('' + res)) res++
  return res
})

const nextOrder = computed(() => {
  return _.maxBy(rooms.value, r => r.order) + 1
})
export const addNewRoom = async function() {
  const newName = newRoomName.value

  const newRoom = {name: newName , order: nextOrder.value}
  await addRoom(newRoom)
}

export const updateRoomName = async function(room) {
  await cms.getModel('Room').findOneAndUpdate({_id: room._id}, {$set: {name: room.name}})
}

export const updateSelectingRoomName = async function(newName) {
  selectingRoom.value.name = newName
  await updateRoomName(selectingRoom.value)
}


export const swapSelectingRoomOrderWithTheRoomBefore = async function() {
  const idx = _.findIndex(rooms.value, r => r._id === selectingRoom.value._id)
  if (idx > 0) {
    const order = (await cms.getModel('Room').findOne({_id: rooms.value[idx - 1]._id})).order
    const order1 = (await cms.getModel('Room').findOne({_id: rooms.value[idx]._id})).order
    await cms.getModel('Room').findOneAndUpdate({_id: rooms.value[idx - 1]._id}, {$set: {order: order1}})
    await cms.getModel('Room').findOneAndUpdate({_id: rooms.value[idx]._id}, {$set: {order: order}})
    await fetchRooms()
  }
}

export const swapSelectingRoomOrderWithTheRoomBehind = async function() {
  const idx = _.findIndex(rooms.value, r => r._id === selectingRoom.value._id)
  if (idx < rooms.value.length - 1 && idx !== -1) {
    const order = (await cms.getModel('Room').findOne({_id: rooms.value[idx]._id})).order
    const order1 = (await cms.getModel('Room').findOne({_id: rooms.value[idx + 1]._id})).order
    await cms.getModel('Room').findOneAndUpdate({_id: rooms.value[idx]._id}, {$set: {order: order1}})
    await cms.getModel('Room').findOneAndUpdate({_id: rooms.value[idx + 1]._id}, {$set: {order: order}})
    await fetchRooms()
  }
}
