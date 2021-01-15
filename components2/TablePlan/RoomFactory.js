import { updateRoomObjects, viewH, viewW } from './room-logic'
import Hooks from 'schemahandler/hooks/hooks'
import { onMounted, reactive, ref, watch, withModifiers } from 'vue'
import { getScopeAttrs } from '../../utils/helpers';
import RoomStyleFactory from './RoomStyles';
import { objectsInSelectingRoom, selectingRoomStates } from './room-state';

const RoomFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'Room',
    props: {
      roomObjects: {
        type: Array
      }
    },
    setup(props, { slots }) {
      const { roomContainerStyle } = RoomStyleFactory()
      const roomContainer = ref(null)
      onMounted(() => {
        viewW.value = roomContainer.value.offsetWidth * 0.9
        viewH.value = roomContainer.value.offsetHeight * 0.9
      })
      const preventStop = withModifiers(() => {}, ['prevent', 'stop'])
      return () => <div id="room" class={['room']} ref={roomContainer} style={roomContainerStyle.value}
             onMousemove={preventStop}
             onMouseup={preventStop}
             onTouchmove={preventStop}
             onTouchend={preventStop}
             {...getScopeAttrs()}>
          {objectsInSelectingRoom.value.map((obj) => {
            return slots['room-object'] && slots['room-object'](obj)
          })
          }
        </div>
    }
  })
  return { hooks, fn }
}

// const NewRoomFactory = ({roomObjectSlot}) => {
//   const renderFn = () => {
//     const roomContainer = ref(null)
//     const preventStop = withModifiers(() => {}, ['prevent', 'stop'])
//     const { roomContainerStyle } = RoomStyleFactory()
//     return <div id="room" className={['room']} ref={roomContainer} style={roomContainerStyle(selectingRoomStates.value.zoom)}
//                 onMouseMove={preventStop}
//                 onMouseUp={preventStop}
//                 onTouchMove={preventStop}
//                 onTouchEnd={preventStop}
//                 {...getScopeAttrs()}>
//       {selectingObject.value.map((obj) => {
//         return roomObjectSlot ? roomObjectSlot(obj) : null
//       })
//       }
//     </div>
//   }
//
//   return { renderFn }
// }

export default RoomFactory
