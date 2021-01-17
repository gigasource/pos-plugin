import { computed, ref } from 'vue';
import _ from 'lodash';
import { createRoom } from './RoomLogics';
import cms from 'cms';

export const roomsStates = ref([]);

export const fetchRooms = async function () {
  let _rooms = await cms.getModel('Room').find({})
  _rooms = _.sortBy(_rooms.map(r => createRoom(r)), r => r.room.order)
  roomsStates.value = _rooms;
}

export const addRoom = async function (room) {
  const createdRoom = await cms.getModel('Room').create(room)
  roomsStates.value.push(createRoom(createdRoom))
  return createdRoom
}

export const removeRoom = async function (room) {
  const idx = _.findIndex(roomsStates.value, r => r.room._id.toString() ===room._id.toString())
  if (idx !== -1) {
    roomsStates.value.splice(idx, 1)
    await cms.getModel('Room').remove({ _id: room._id })
  }
}

//w

export const removeSelectingRoom = async function() {
  await removeRoom(selectingRoomStates.value.room)
  //todo: auto change selecting room
  if (roomsStates.value.length > 0) {
    selectingRoomStates.value = roomsStates.value[0]
  }
}
export const selectingRoomStates = ref(null);

export const onSelectRoom = function (newSelectingRoom) {
  selectingRoomStates.value = _.find(roomsStates.value, r => r.room._id.toString() === newSelectingRoom.room._id)
}

export const objectsInSelectingRoom = computed(() => (selectingRoomStates.value) ? selectingRoomStates.value.room.roomObjects : [])

const roomsName = computed(() => {
  return roomsStates.value.map(r => r.room.name)
})


export const newRoomName = computed(() => {
  let res = 1
  while (roomsName.value.includes('' + res)) res++
  return "" + res
})

export const nextOrder = computed(() => {
  return (_.maxBy(roomsStates.value, r => r.room.order).room.order + 1)
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
  selectingRoomStates.value.room.name = newName
  await updateRoomName(selectingRoomStates.value.room)
}


export const swapSelectingRoomOrderWithTheRoomBefore = async function() {
  //todo: check if is selecting an object or not
  const idx = _.findIndex(roomsStates.value, r => r.room._id === selectingRoomStates.value.room._id)
  if (idx > 0) {
    const order = (await cms.getModel('Room').findOne({_id: roomsStates.value[idx - 1].room._id})).order
    const order1 = (await cms.getModel('Room').findOne({_id: roomsStates.value[idx].room._id})).order
    await cms.getModel('Room').findOneAndUpdate({_id: roomsStates.value[idx - 1].room._id}, {$set: {order: order1}})
    await cms.getModel('Room').findOneAndUpdate({_id: roomsStates.value[idx].room._id}, {$set: {order: order}})
    await fetchRooms()
  }
}

export const swapSelectingRoomOrderWithTheRoomBehind = async function() {
  const idx = _.findIndex(roomsStates.value, r => r.room._id === selectingRoomStates.value.room._id)
  if (idx < roomsStates.value.length - 1 && idx !== -1) {
    const order = (await cms.getModel('Room').findOne({_id: roomsStates.value[idx].room._id})).order
    const order1 = (await cms.getModel('Room').findOne({_id: roomsStates.value[idx + 1].room._id})).order
    await cms.getModel('Room').findOneAndUpdate({_id: roomsStates.value[idx].room._id}, {$set: {order: order1}})
    await cms.getModel('Room').findOneAndUpdate({_id: roomsStates.value[idx + 1].room._id}, {$set: {order: order}})
    await fetchRooms()
  }
}
