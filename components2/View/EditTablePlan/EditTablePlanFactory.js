import { ref, onMounted, nextTick } from 'vue'

import {
  onChangeObjectName,
  rooms,
  fetchRooms,
  selectingRoom,
  objectsInSelectingRoom,
  createAndAddNewRoomObjectToSelectingRoom,
  onSelectRoom,
  removeSelectingObjectFromSelectingRoom,
  selectingObject,
  currentInputValue,
} from './room-state';
import Hooks from 'schemahandler/hooks/hooks'
import Room from './../../TablePlan/Room_new'
import { appHooks } from '../../AppSharedStates'

const EditablePlanFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'EditTablePlan',
    components: [Room],
    setup() {
      appHooks.emit('orderChange')
      const renderRoomList = () => <div id="room-list">
        {rooms.value.map(room =>
          <div onClick={() => onSelectRoom(room)} id={room.name}>
            {room.name}
          </div>
        )}
      </div>

      const renderOperations = () => {
        return <div>
          {renderRoomList()}
          <div>
            <input id="input" type="text" v-model={currentInputValue.value}/>
            <div id="add-object" onClick={createAndAddNewRoomObjectToSelectingRoom}> add Object</div>
            <div id="rem-object" onClick={() => removeSelectingObjectFromSelectingRoom()}> remove Object</div>
            <div id="save" onClick={() => onChangeObjectName(currentInputValue.value)}> save</div>
            {/*  /!*<div id="#copyObject"> copy Object  </div>*!/*/}
          </div>
        </div>;
      }


      const renderFn = () => <div>
        {renderOperations()}

        <Room roomObjects={objectsInSelectingRoom.value}> </Room>
      </div>

      onMounted(async () => {
        let cur = 0
        await fetchRooms()
        selectingRoom.value = rooms.value[0]
        //todo: should update selecting object to null
        selectingObject.value = null
        // setInterval(() => {
        //   selectingRoom.value = rooms.value[cur++]
        //   cur %= rooms.value.length
        // }, 5000)
      })

      return () => renderFn()
    }
  })
  return {
    fn,
    hooks
  }
}

export default EditablePlanFactory
