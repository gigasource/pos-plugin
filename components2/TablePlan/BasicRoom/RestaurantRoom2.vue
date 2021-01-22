<script>

import {roomUiFactory} from '../RoomUi'
import {getTableOrderInfo} from './RestaurantRoomLogics'
import {getDiffTime} from '../../../utils/commons'
import {onBeforeUnmount, ref} from 'vue';
import RoomStyleFactory from '../RoomStyles'
import {roomsFactory} from '../RoomState';
import {isBusyTable, isTable} from '../RoomShared';
import Touch from "../../../../../backoffice/pos-vue-framework/src/directives/touch/touch";
import {useRouter} from 'vue-router';

export default {
  name: 'RestaurantRoom2',
  props: {
    roomId: String
  },
  directives: {Touch},
  setup(props) {

    const {selectingRoomStates, objectsInSelectingRoom} = roomsFactory(props);

    const {roomObjectContainerStyle, roomObjectStyle} = RoomStyleFactory(selectingRoomStates)

    const curTime = ref(new Date())

    //todo: clear timer
    const clearTimerInterval = setInterval(() => curTime.value = new Date(), 30000)
    onBeforeUnmount(() => clearTimerInterval());

    const objectContentRender = (obj) => {
      const isActiveTable = obj.type === 'table' && isBusyTable(obj)
      const tableOrderInfo = getTableOrderInfo(obj)
      const zoom = selectingRoomStates.value ? selectingRoomStates.value.zoom : 1
      return <div style={roomObjectStyle(obj)}>
        {isTable(obj) && <>
          <div style={`font-size: ${10 * zoom}px ;position: absolute; top: 2px`}></div>
          <div>
            <div> {obj.name} </div>
          </div>
          {isActiveTable ?
              <div style={`font-size: ${10 * zoom}px; position: absolute; bottom: 2px`}>
                {`${getDiffTime(tableOrderInfo.date, curTime.value)} mins`} </div> : null}
        </>}
      </div>
    }

    const classes = (obj) => isTable(obj) ? ['waves-effect', 'waves-red'] : []

    const _roomObjectContainerStyle = (obj) => {
      const style = roomObjectContainerStyle(obj)
      if (isBusyTable(obj)) Object.assign(style, {background: '#fec8c8', border: '1px solid #d2691e'})
      return style
    }

    const router = useRouter();
    function chooseTable(name) {
      console.log('name');
      router.push(`/pos-order/${name}`)
    }

    const objectRender = (obj) => {
      return <div key={obj._id} id={obj.name}
                  style={_roomObjectContainerStyle(obj)}
                  class={classes(obj)}
                  onClick={() => chooseTable(obj.name)}>
        {objectContentRender(obj)}
      </div>
    }

    const {renderRoom} = roomUiFactory(objectRender, selectingRoomStates, objectsInSelectingRoom);
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

  &__object__resizer {
    width: 24px;
    height: 24px;
    border-radius: 100%;
    background-color: #2979FF;
    position: absolute;
    right: 0;
    bottom: 0;
    transform: translate(100%, 100%);
    display: flex;
    justify-content: center;
    align-items: center;
  }

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
