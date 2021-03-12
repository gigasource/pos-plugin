<script>
import { roomUiFactory } from '../../TablePlan/RoomUi'
import { computed } from 'vue'
import EditableRoomEventHandlersFactory from './EventHandlersForEditableRoom'
import { isSelectingObject } from './EditTablePlanLogics';
import RoomStyleFactory from '../../TablePlan/RoomStyles';
import { objectsInSelectingRoom, selectingRoomStates } from '../../TablePlan/RoomState';
import { isTable } from '../../TablePlan/RoomShared';
import Touch from '../../../../../backoffice/pos-vue-framework/src/directives/touch/touch';

export default {
  name: 'RestaurantRoom',
  directives: { Touch },
  setup() {
    const { roomObjectContainerStyle, roomObjectStyle } = RoomStyleFactory(selectingRoomStates)

    const { resizeRoomObjectEvenHandler, touchHandlers } = EditableRoomEventHandlersFactory({})

    const _roomObjectContainerStyle = (obj) => {
      const style = roomObjectContainerStyle(obj)
      if (isSelectingObject(obj)) {
        style.border = '1px solid #1271FF'
        style.zIndex = 50
      }
      return style
    }

    const objectRenderFn = (obj) => <div style={roomObjectStyle(obj)}>
      {isTable(obj) ? obj.name : ''}
    </div>

    const style = computed(() => ({
      width: `${(selectingRoomStates.value ? selectingRoomStates.value.zoom : 1) * 20}px`,
      height: `${(selectingRoomStates.value ? selectingRoomStates.value.zoom : 1) * 20}px`,
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
      width: `${13 * selectingRoomStates.value.zoom}px`,
      height: `${13 * selectingRoomStates.value.zoom}px`,
    }))

    const resizeButtonRenderFn = obj => isSelectingObject(obj) &&
        <div style={style.value} {...resizeRoomObjectEvenHandler(obj)}>
          <img alt style={arrowStyle.value} src="/plugins/pos-plugin/assets/resize.svg" draggable="false"/>
        </div>

    const roomObjectRenderFn = (obj) => {
      return <div key={obj._id} id={obj.name}
                  v-touch={touchHandlers(obj)}
                  style={_roomObjectContainerStyle(obj)}
      >
        {objectRenderFn(obj)}
        {resizeButtonRenderFn(obj)}
      </div>
    }

    const { renderRoom } = roomUiFactory(roomObjectRenderFn, selectingRoomStates, objectsInSelectingRoom);
    return () => renderRoom();
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
