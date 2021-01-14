import { computed, ref, watch } from 'vue';
import {
  addNewRoom,
  objectsInSelectingRoom, onSelectRoom, removeSelectingRoom,
  selectingRoom,
  rooms, updateSelectingRoomName, swapSelectingRoomOrderWithTheRoomBefore, swapSelectingRoomOrderWithTheRoomBehind
} from './room-state';
import _ from 'lodash';
import cms from 'cms';
import { ObjectID} from 'bson';
import { addRoomObject, removeRoomObject, updateRoomObject } from '../../TablePlan/room-logic';

export const selectingObject = ref(null)

export const currentInputValue = ref('')

export const onSelectObject = function (item) {
  const isSelected = selectingObject._id === item._id
  if (!isSelected) {
    selectingObject.value = item
    currentInputValue.value = item.name
  }
}

watch(() => objectsInSelectingRoom.value, (newV) => {
  if (selectingObject.value && selectingRoom.value) {
    selectingObject.value = _.find(objectsInSelectingRoom.value, i => i._id === selectingObject.value._id)
  }

}, { deep: true })


export const addNewRoomObjectToSelectingRoom = async function (object) {
  if (selectingRoom.value) {

    const editedRoom = await cms.getModel('Room').findOneAndUpdate({ _id: selectingRoom.value._id },
      { $push: { roomObjects: object } },
      { new: true })
    const createdObject = _.last(editedRoom.roomObjects)
    addRoomObject(selectingRoom.value, createdObject)
    return createdObject
  }
}

export const onChangeObjectName = async function (newName) {
  await updateSelectingObjectInSelectingRoom({ name: newName })
}

export const removeAnObjectFromSelectingRoom = async function (object) {
  if (selectingRoom.value) {
    removeRoomObject(selectingRoom.value, object)
    await cms.getModel('Room').findOneAndUpdate({ _id: selectingRoom.value._id },
      {
        $pull: { roomObjects: { _id: object._id } }
      })
  }
}

export const updateObjectInSelectingRoom = async function (object, newObject) {
  if (selectingRoom.value) {
    const updatedObject = updateRoomObject(selectingRoom.value, object, newObject)
    if (object._id === (selectingObject.value || {})._id) {
      selectingObject.value = updatedObject
    }
    const _object = _.cloneDeep(newObject)
    delete _object['realLocation']
    delete _object['realSize']
    const qry = { 'roomObjects._id': object._id }
    const setObj = {}
    _.each(_.keys(_object), k => setObj[`roomObjects.$.${k}`] = _object[k]);
    const set = { $set: setObj }
    await cms.getModel('Room').findOneAndUpdate(qry, set)
  }
}

export const createAndAddNewTableToSelectingRoom = async function () {
  const newObject = {
    type: 'table',
    _id: new ObjectID(),
    location: {
      x: 5,
      y: 5
    },
    size: {
      width: 100,
      height: 100
    },
    bgColor: 'white',
    takeAway: false,
    name: newObjectName.value,
  }

  await addNewRoomObjectToSelectingRoom(newObject)
}

export const createAndAddNewWallToSelectingRoom = async function () {
  const newObject = {
    type: 'wall',
    _id: new ObjectID(),
    location: {
      x: 5,
      y: 5
    },
    size: {
      width: 300,
      height: 10
    },
    bgColor: 'black',
  }

  await addNewRoomObjectToSelectingRoom(newObject)
}

export const removeSelectingObjectFromSelectingRoom = async function () {
  if (selectingRoom.value) {
    await removeAnObjectFromSelectingRoom(selectingObject.value)
  }
}

export const updateSelectingObjectInSelectingRoom = async function (newObject) {

  //todo: validate new object 's name
  if (selectingRoom.value) {
    await updateObjectInSelectingRoom(selectingObject.value, newObject)
  }
}

const newObjectName = computed(() => {
  let allObjects = []
  rooms.value.forEach(r => {
    allObjects = allObjects.concat(r.roomObjects)
  })
  const allObjectsName = allObjects.map(object => object.name)
  let res = 1
  while (allObjectsName.includes('' + res)) res++
  return '' + res
})

export const isSelectingObject = function (object) {
  return selectingObject.value ? object._id === selectingObject.value._id : false
}

export const tableColors = ['#FFFFFF', '#F8BBD0', '#D1C4E9', '#B3E5FC', '#FFF9C4', '#C8E6C9', '#D7CCC8', '#EEEEEE']

export const wallColors = ['#FFFFFF', '#CCCCCC', '#4D0019', '#404040', '#86592D', '#A6A6A6', '#FFD480', '#E4E4E4']

export const showAddNewRoomBtn = ref(false)

export const isSelectingARoom = computed(() => !!selectingRoom.value)
export const isSelectingARoomObject = computed(() => !!selectingObject.value)
export const isSelectingRoomOnly = computed(() => {
  return isSelectingARoom.value && !isSelectingARoomObject.value
})

export const updateTableName = async function (newName) {
  await updateSelectingObjectInSelectingRoom({ name: newName })
}

export const onAddNewRoom = async function () {
  await addNewRoom()
}

export const onRemoveRoom = async function () {
  await removeSelectingRoom()
}

export const sidebarData = computed(() => [{
  title: 'Restaurant', icon: 'icon-restaurant',
  items: _.map(rooms.value, r => ({
    title: r.name,
    icon: 'radio_button_unchecked',
    iconType: 'small',
    onClick: () => {
      onSelectRoom(r)
      selectingObject.value = null
    }
  }))
}])

export const toggle = function() {
  showAddNewRoomBtn.value = !showAddNewRoomBtn.value
}

export const onUpdateSelectingRoomName = async function(newRoomName) {
  await updateSelectingRoomName(newRoomName)
}

export const onMoveRoomUp = async function() {
  await swapSelectingRoomOrderWithTheRoomBefore()
}

export const onMoveRoomDown = async function() {
  await swapSelectingRoomOrderWithTheRoomBehind()
}

export const dialog = ref({
  showRoomNameKdb: false,
  showTableNameKbd: false,
})


export const duplicateRoomObj = async function() {
  const newObj = _.cloneDeep(selectingObject.value)
  delete newObj._id
  newObj.name = newObjectName.value
  newObj.location = {
    x: 5,
    y: 5
  }
  await addNewRoomObjectToSelectingRoom(newObj)
}

export const onDuplicateRoomObj = async function() {
  await duplicateRoomObj(selectingObject.value)
}

export const onRemoveRoomObj = async function() {
  await removeSelectingObjectFromSelectingRoom()
}

export const onAddNewWall = async function() {
  await createAndAddNewWallToSelectingRoom()
}

export const onAddNewTable = async function() {
  await createAndAddNewTableToSelectingRoom()
}


export const onBack = function() {

}

const tableNameExistedErrorMsg = ref('')

export const globalZoom = ref(1)
