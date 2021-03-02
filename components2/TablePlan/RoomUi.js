import {viewH, viewW} from './RoomLogics'
import { nextTick, onMounted, ref, withModifiers } from 'vue'
import RoomStyleFactory from './RoomStyles';
import {genScopeId} from "../utils";

export function roomUiFactory(roomObjectRenderFn, selectingRoomStates, objectsInSelectingRoom) {
  const {roomContainerStyle} = RoomStyleFactory(selectingRoomStates)
  const roomContainer = ref(null)
  onMounted(async() => {
    await nextTick()
    if (!roomContainer.value || roomContainer.value.offsetWidth === 0) {
      setTimeout(() => {
        viewW.value = roomContainer.value ? roomContainer.value.offsetWidth * 0.9 : 1200
        viewH.value = roomContainer.value ? roomContainer.value.offsetHeight * 0.9 : 800
      }, 250)
    } else {
      viewW.value = roomContainer.value ? roomContainer.value.offsetWidth * 0.9 : 1200
      viewH.value = roomContainer.value ? roomContainer.value.offsetHeight * 0.9 : 800
    }
  })
  const preventStop = withModifiers(() => null, ['prevent', 'stop'])
  //fixme: fix code for preventStop to prevent side effect
  const renderRoom = genScopeId(() =>
    <div id="room" class={['room']} ref={roomContainer} style={roomContainerStyle.value}
         // onMousemove={preventStop}
         // onMouseup={preventStop}
         // onTouchmove={preventStop}
         // onTouchend={preventStop}
      >
      {objectsInSelectingRoom.value.map((obj) => {
        return roomObjectRenderFn && roomObjectRenderFn(obj)
      })}
    </div>)

  return {renderRoom}
}
