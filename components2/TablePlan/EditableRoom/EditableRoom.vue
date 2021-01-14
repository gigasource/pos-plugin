<script>

import RoomFactory from '../RoomFactory'
import { computed, watch } from 'vue'
import EditableRoomEventHandlersFactory from './EventHandlersForEditableRoom'
import { globalZoom, isSelectingObject } from '../../View/EditTablePlan/EditTablePlanLogics';
import { getScopeAttrs } from '../../../utils/helpers';
import RoomStyleFactory from '../RoomStyles';
import Touch from '../../../../../../pos-vue-framework/src/directives/touch/touch'
import { isTable } from '../room-logic';

const { hooks, fn } = RoomFactory()

const { roomObjectContainerStyle, roomObjectStyle } = RoomStyleFactory()

const { resizeRoomObjectEvenHandler: e, roomContainerEventHandlers:r, touchHandlers:t } = EditableRoomEventHandlersFactory()

hooks.on('provideZoom', ({ zoom }) => {
  watch(() => zoom.value, () => {
    globalZoom.value = zoom.value
  })
})
const Component = fn()
const _roomObjectContainerStyle = (obj) => {
  const style = roomObjectContainerStyle(obj)
  if (isSelectingObject(obj)) {
    style.border = '1px solid #1271FF'
    style.zIndex = 50
  }
  return style
}

export default {
  directives: {Touch},
  setup() {

    const roomObjectRenderFn = (obj) => <div style={roomObjectStyle(obj)}>

      {isTable(obj) ? obj.name : ''}
    </div>

    const style = computed(() => ({
      width: `${globalZoom.value * 20}px`,
      height: `${globalZoom.value * 20}px`,
      'border-radius': '100%',
      'background-color': '#2979FF',
      position: 'absolute',
      right: 0,
      bottom: 0,
      transform: `translate(100%, 100%)`,
      display: 'flex',
      'justify-content': 'center',
      'align-items': 'center',
      zIndex: 100
    }))

    const arrowStyle = computed(() => ({
      width: `${13 * globalZoom.value}px`,
      height: `${13 * globalZoom.value}px`,
    }))

    const resizeButtonRenderFn = obj => isSelectingObject(obj) ?
        <div style={style.value} {...getScopeAttrs()}
             {...e(obj)}
        >
          <img alt style={arrowStyle.value} src="/plugins/pos-plugin/assets/resize.svg" draggable="false"/>
        </div>
        : null
    return () => <Component v-slots={
      {
        'room-object': (obj) => {
          return <div key={obj._id} id={obj.name}
                      v-touch={t(obj)}
                      style={_roomObjectContainerStyle(obj)}
          >
            {roomObjectRenderFn(obj)}
            {resizeButtonRenderFn(obj, getScopeAttrs())}
          </div>
        }
      }
    }> </Component>
  }
}
</script>
<style scoped lang="scss">
.room {
  position: relative;
  width: 100%;
  height: 100%;
  background-image: url('/plugins/pos-plugin/assets/out.png');

  &__object__rotate {
    width: 16px;
    height: 16px;
    border-radius: 100%;
    background-color: #2979FF;
    position: absolute;
    right: 0;
    bottom: 0;
    transform: translateX(100%);
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
