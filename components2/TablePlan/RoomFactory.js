import { createRoom, updateRoomObjects } from './room-logic'
import Hooks from 'schemahandler/hooks/hooks'
import { ref, onMounted, watch, Fragment, onBeforeUnmount } from 'vue'
import { isTable } from './room-logic'
import { getScopeAttrs } from '../../utils/helpers';
import RoomStyleFactory from './RoomStyles';
const RoomFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'Room',
    props: {
      roomObjects: {
        type: Array
      }
    },
    components: [Fragment],
    setup(props, { slots }) {
      const { room, viewW, viewH, zoom} = createRoom({ roomObjects: props.roomObjects })
      hooks.emit('provideZoom', { zoom })
      const { roomObjectContainerStyle, roomObjectStyle, roomContainerStyle } = RoomStyleFactory()
      watch(() => props.roomObjects, (newV, oldV) => {
        updateRoomObjects(room, newV)
      }, { deep: true })
      const roomContainer = ref(null)
      onMounted(() => {
        viewW.value = roomContainer.value.offsetWidth * 0.9
        viewH.value = roomContainer.value.offsetHeight * 0.9
      })

      const renderOrderInfo = (obj) => null
      const roomObjectRenderFn = (obj) => {
        return <div style={roomObjectStyle(obj)}>
          {isTable(obj) ? <>
            <div>
              <div> {obj.name} </div>
            </div>
            {renderOrderInfo(obj)}
          </> : null}
        </div>
      }
      const roomContainerEventHandlers = {
        onMousemove(e) {
          e.preventDefault()
          e.stopPropagation()
        },
        onMouseup(e) {
          e.preventDefault()
          e.stopPropagation()
        },
        onTouchmove(e) {
          e.preventDefault()
          e.stopPropagation()
        },
        onTouchend(e) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
      const roomRenderFn = () =>
        <div id="room" class={['room']} ref={roomContainer} style={roomContainerStyle(zoom)} {...roomContainerEventHandlers} {...getScopeAttrs()}>
          {room.roomObjects.map((obj) => {
            return slots['room-object'] ? slots['room-object'](obj) : null
          })
          }
        </div>
      return roomRenderFn
    }
  })
  return { hooks, fn }
}

export default RoomFactory
