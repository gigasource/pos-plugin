import { reactive, ref, watchEffect, watch, computed } from 'vue';
import _ from 'lodash';
import { createRoom, addRoomObject, removeRoomObject, updateRoomObject } from '../../TablePlan/room-logic';
import { appHooks } from '../../AppSharedStates';

import cms from 'cms';

const rooms = ref([]);

const selectingObject = ref(null)

const currentInputValue = ref("")

const onSelectObject = function(item) {
  const isSelected = false  //todo: check if this object is selected or not
  if (!isSelected) {
    selectingObject.value = item
    currentInputValue.value = item.name
  }
}


const fetchRooms = async function() {
  let _rooms = await cms.getModel('Room').find({})
  _rooms =  _rooms.map(r => createRoom(r).room);
  rooms.value = _rooms;
}

const addRoom = function(room) {
  rooms.value.push(room)
  //todo: add new Room to db
}

const removeRoom = function(room) {
  const idx = _.findIndex(rooms.value, r => r.name === room.name)
  if (idx !== -1) rooms.value.splice(idx, 1)
  //todo: remove room in db
}

const selectingRoom = ref(null);

const onSelectRoom = function(newSelectingRoom) {
  console.log('select room', newSelectingRoom)
  if (selectingRoom.value && selectingRoom.value.name !== newSelectingRoom.name) {
    console.log('assign selectingObject')
    selectingObject.value = null //should reset selecting object when change room
  }
  selectingRoom.value = newSelectingRoom
}

const objectsInSelectingRoom = computed(() => (selectingRoom && selectingRoom.value) ? selectingRoom.value.roomObjects : [])

const addNewRoomObjectToSelectingRoom = async function(object) {
  if (selectingRoom.value) {
    addRoomObject(selectingRoom.value, object)
    //todo: add room object to db
  }
}
const onChangeObjectName = async function (newName) {
  await updateSelectingObjectInSelectingRoom({name: newName})
}

const removeAnObjectFromSelectingRoom = async function(object) {
  if (selectingRoom.value) {
    removeRoomObject(selectingRoom.value, object)
    //todo: remove object in db
  }
}

const updateObjectInSelectingRoom = async function(object, newObject) {
  if (selectingRoom.value) {
    updateRoomObject(selectingRoom.value, object, newObject)
    //todo: update object in db
  }
}

const createAndAddNewRoomObjectToSelectingRoom = async function() {
  const newObject = {
    location: {
      x: 0,
      y: 0
    },
    size: {
      width: 30,
      height: 30
    },
    name: newObjectName.value,
    // bgColor: '' todo: add remain attribute: bgColor, takeAway, type, rotate
  }

  await addNewRoomObjectToSelectingRoom(newObject)
}

const removeSelectingObjectFromSelectingRoom = async function() {
  if (selectingRoom.value) {
    removeRoomObject(selectingRoom.value, selectingObject.value)
    //todo: remove object in db
  }
}

const updateSelectingObjectInSelectingRoom = async function(newObject) {

  //todo: validate new object 's name
  if (selectingRoom.value) {
    selectingObject.value = updateRoomObject(selectingRoom.value, selectingObject.value, newObject)
    //todo: update object in db
  }
}

const activeOrders = ref([]);


appHooks.on('orderChange', async function () {
  activeOrders.value = await cms.getModel('Order').find({status: 'inProgress'});
})

const inProgressTables = computed(() => {
  return _.compact(activeOrders.value.map(order => order.table))
})

const isBusyTable = function(table) {
  return inProgressTables.value ? inProgressTables.value.includes(table.name) : false
}

const getTableOrderInfo = function(table) {
  const idx = _.findIndex(activeOrders.value, order => order.table === table.name)
  return idx === -1 ? null : activeOrders.value[idx]
}

//objects 's name

const newObjectName = computed(() => {
  if (objectsInSelectingRoom.value) {
    const curObjectsName = objectsInSelectingRoom.value.map(object => object.name)
    let res = 1
    while (curObjectsName.includes("" + res)) res++
    return ""+res
  }
  return 0
})

const isSelectingObject = function(object) {
  return selectingObject.value ? object.name === selectingObject.value.name : false
}

const isTable = (item) => {
  return item.type === 'table'
}

export {
  rooms,
  selectingRoom,
  objectsInSelectingRoom,
  createAndAddNewRoomObjectToSelectingRoom,
  addNewRoomObjectToSelectingRoom,
  removeAnObjectFromSelectingRoom,
  updateObjectInSelectingRoom,
  inProgressTables,
  isBusyTable,
  isTable,
  fetchRooms,
  activeOrders,
  addRoom,
  removeRoom,
  getTableOrderInfo,
  selectingObject,
  onSelectObject,
  onSelectRoom,
  removeSelectingObjectFromSelectingRoom,
  updateSelectingObjectInSelectingRoom,
  onChangeObjectName,
  newObjectName,
  currentInputValue,
  isSelectingObject
}
