import {computed, ref} from 'vue';
import _ from 'lodash';
import {createRoom} from './RoomLogics';
import cms from 'cms';

export const roomsStates = ref([]);

let Room = cms.getModel('Room');

export const fetchRooms = async function () {
  let _rooms = await Room.find({})
  _rooms = _.sortBy(_rooms.map(r => createRoom(r)), r => r.room.order)
  roomsStates.value = _rooms;
}

export async function addRoom(room) {
  const createdRoom = await Room.create(room)
  roomsStates.value.push(createRoom(createdRoom))
  return createdRoom
}

export async function removeRoom(room) {
  const idx = _.findIndex(roomsStates.value, r => r.room._id.toString() === room._id.toString())
  if (idx !== -1) {
    roomsStates.value.splice(idx, 1)
    await Room.remove({_id: room._id})
  }
}

export function roomsFactory({roomId} = {}) {
  let selectingRoomStates;
  if (roomId) {
    selectingRoomStates = computed(() => {
      return roomsStates.value.find(s => s.room._id.toString() === roomId);
    });
  } else {
    selectingRoomStates = ref();
  }

  const removeSelectingRoom = async function() {
    await removeRoom(selectingRoomStates.value.room)
    //todo: auto change selecting room
    if (roomsStates.value.length > 0) {
      selectingRoomStates.value = roomsStates.value[0]
    }
  }

  const onSelectRoom = function (newSelectingRoom) {
    selectingRoomStates.value = _.find(roomsStates.value, r => r.room._id.toString() === newSelectingRoom.room._id.toString())
  }

  const objectsInSelectingRoom = computed(() => {
    return (selectingRoomStates.value) ? selectingRoomStates.value.room.roomObjects : [];
  })

  const roomsName = computed(() => {
    return roomsStates.value.map(r => r.room.name)
  })

  const newRoomName = computed(() => {
    let res = 1
    while (roomsName.value.includes('' + res)) res++
    return "" + res
  })

  const nextOrder = computed(() => {
    return (_.maxBy(roomsStates.value, r => r.room.order).room.order + 1)
  })

  const addNewRoom = async function () {
    const newName = newRoomName.value

    const newRoom = {name: newName, order: nextOrder.value}
    await addRoom(newRoom)
  }

  const updateRoomName = async function (room) {
    await Room.findOneAndUpdate({_id: room._id}, {$set: {name: room.name}})
  }

  const updateSelectingRoomName = async function (newName) {
    selectingRoomStates.value.room.name = newName
    await updateRoomName(selectingRoomStates.value.room)
  }


  const swapSelectingRoomOrderWithTheRoomBefore = async function () {
    //todo: check if is selecting an object or not
    const idx = _.findIndex(roomsStates.value, r => r.room._id.toString() === selectingRoomStates.value.room._id.toString())
    if (idx > 0) {
      const order = (await Room.findOne({_id: roomsStates.value[idx - 1].room._id})).order
      const order1 = (await Room.findOne({_id: roomsStates.value[idx].room._id})).order
      await Room.findOneAndUpdate({_id: roomsStates.value[idx - 1].room._id}, {$set: {order: order1}})
      await Room.findOneAndUpdate({_id: roomsStates.value[idx].room._id}, {$set: {order: order}})
      await fetchRooms()
    }
  }

  const swapSelectingRoomOrderWithTheRoomBehind = async function () {
    const idx = _.findIndex(roomsStates.value, r => r.room._id.toString() === selectingRoomStates.value.room._id.toString())
    if (idx < roomsStates.value.length - 1 && idx !== -1) {
      const order = (await Room.findOne({_id: roomsStates.value[idx].room._id})).order
      const order1 = (await Room.findOne({_id: roomsStates.value[idx + 1].room._id})).order
      await Room.findOneAndUpdate({_id: roomsStates.value[idx].room._id}, {$set: {order: order1}})
      await Room.findOneAndUpdate({_id: roomsStates.value[idx + 1].room._id}, {$set: {order: order}})
      await fetchRooms()
    }
  }

  return {
    selectingRoomStates, onSelectRoom,
    objectsInSelectingRoom, newRoomName,
    nextOrder,
    addNewRoom, updateRoomName, updateSelectingRoomName,
    swapSelectingRoomOrderWithTheRoomBefore,
    swapSelectingRoomOrderWithTheRoomBehind,
    removeSelectingRoom
  }
}

export const {
  selectingRoomStates, onSelectRoom,
  objectsInSelectingRoom, newRoomName,
  nextOrder,
  addNewRoom, updateRoomName, updateSelectingRoomName,
  swapSelectingRoomOrderWithTheRoomBefore,
  swapSelectingRoomOrderWithTheRoomBehind,
  removeSelectingRoom
} = roomsFactory();
