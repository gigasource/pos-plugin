import { createRoom, isTable, updateRoomObjects } from './room-logic'
import Hooks from 'schemahandler/hooks/hooks'
import { Fragment, onMounted, ref, watch, withModifiers } from 'vue'
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
      const { roomContainerStyle } = RoomStyleFactory()
      watch(() => props.roomObjects, (newV, oldV) => {
        updateRoomObjects(room, newV)
      }, { deep: true })
      const roomContainer = ref(null)
      onMounted(() => {
        viewW.value = roomContainer.value.offsetWidth * 0.9
        viewH.value = roomContainer.value.offsetHeight * 0.9
      })

      const preventStop = withModifiers(()=>{}, ['prevent', 'stop'])
      return () =>
        <div id="room" class={['room']} ref={roomContainer} style={roomContainerStyle(zoom)}
             onMousemove={preventStop}
             onMouseup={preventStop}
             onTouchmove={preventStop}
             onTouchend={preventStop}
             {...getScopeAttrs()}>
          {room.roomObjects.map((obj) => {
            return slots['room-object'] ? slots['room-object'](obj) : null
          })
          }
        </div>
    }
  })
  return { hooks, fn }
}

export default RoomFactory
