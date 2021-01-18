import { viewH, viewW } from './RoomLogics'
import Hooks from 'schemahandler/hooks/hooks'
import { onMounted, ref, withModifiers } from 'vue'
import { getScopeAttrs } from '../../utils/helpers';
import RoomStyleFactory from './RoomStyles';
import { objectsInSelectingRoom } from './RoomState';
import Touch from '../../../../backoffice/pos-vue-framework/src/directives/touch/touch'

const RoomUI = ({ roomObjectRenderFn }) => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'Room',
    props: {
      roomObjects: {
        type: Array
      }
    },
    directives: { Touch },
    setup() {
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
          return roomObjectRenderFn && roomObjectRenderFn(obj)
        })
        }
      </div>
    }
  })
  return { hooks, fn }
}

export default RoomUI
