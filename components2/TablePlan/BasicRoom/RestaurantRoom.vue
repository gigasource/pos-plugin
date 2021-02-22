<script>

import { roomUiFactory } from '../RoomUi'
import {
  initRouter,
  isTransferringTable,
  onCustomerDialogSubmit,
  showNumberOfCustomersDialog,
  chooseTable
} from './RestaurantRoomLogics'
import { getDiffTime } from '../../../utils/commons'
import { onActivated, onBeforeUnmount, onDeactivated, ref, watch } from 'vue';
import RoomStyleFactory from '../RoomStyles'
import { roomsFactory } from '../RoomState';
import { getTableOrderInfo, isBusyTable, isTable } from '../RoomShared';
import Touch from '../../../../../backoffice/pos-vue-framework/src/directives/touch/touch';
import { useI18n } from 'vue-i18n';
import RestaurantRoomEventHandlers from './EventHandlersForRestaurantRoom'
import { appHooks, user } from '../../AppSharedStates';
import NumberOfCustomersDialog from './NumberOfCustomersDialog';

export default {
  name: 'RestaurantRoom',
  components: { NumberOfCustomersDialog },
  props: {
    roomId: String
  },
  directives: { Touch },
  setup(props, { emit }) {
    // appHooks.emit('updateTseConfig')
    initRouter()
    onActivated(() => {
      console.log('room activated')
    })
    onDeactivated(() => {
      console.log('room deactivated')
    })
    const { t, locale } = useI18n()
    const { touchHandlers } = RestaurantRoomEventHandlers()
    const { selectingRoomStates, objectsInSelectingRoom } = roomsFactory(props);
    const { roomObjectContainerStyle, roomObjectStyle } = RoomStyleFactory(selectingRoomStates)
    const curTime = ref(new Date())

    const timerInterval = setInterval(() => curTime.value = new Date(), 30000)
    onBeforeUnmount(() => clearInterval(timerInterval));

    const objectContentRender = (obj) => {
      const isActiveTable = obj.type === 'table' && isBusyTable(obj)
      const order = getTableOrderInfo(obj)
      const zoom = selectingRoomStates.value ? selectingRoomStates.value.zoom : 1
      const isUserTable = (order, user) => {
        if (!user) return false
        //todo: check this logic: compare by name is correct ?
        return _.some(order.user, i => i.name === user.name)
      }
      return <div style={roomObjectStyle(obj)}>
        {isTable(obj) && <>
          {isBusyTable(obj) && isUserTable(order, user.value) &&
          <g-icon
              style="position: absolute; top: 0; right: 0; height: 13px; width: 15px">icon-room-border
          </g-icon>
          }
          {isBusyTable(obj) &&
          <div style={`font-size: ${11 * zoom}px ;position: absolute; top: 2px`}>
            {t('common.currency', locale.value)}{order.vSum}
          </div>}
          <div>
            <div> {obj.name} </div>
          </div>
          {isActiveTable ?
              <div style={`font-size: ${11 * zoom}px; position: absolute; bottom: 2px`}>
                {`${getDiffTime(order.date, curTime.value)} mins`} </div> : null}
        </>}
      </div>
    }

    const classes = (obj) => {
      let res = []
      res = isTable(obj) ? ['waves-effect', 'waves-red'] : []
      if (isTransferringTable(obj)) {
        res.push('animated', 'bounce', 'infinite')
      }
      return res
    }

    const _roomObjectContainerStyle = (obj) => {
      const style = roomObjectContainerStyle(obj)
      if (isBusyTable(obj)) Object.assign(style, { background: '#fec8c8', border: '1px solid #d2691e' })
      return style
    }

    const objectRender = (obj) => {
      return <div key={obj._id} id={obj.name}
                  style={_roomObjectContainerStyle(obj)}
                  class={classes(obj)}
                  onClick={() => chooseTable(obj)}
                  v-touch={touchHandlers(obj)}
      >
        {objectContentRender(obj)}
      </div>
    }

    const { renderRoom } = roomUiFactory(objectRender, selectingRoomStates, objectsInSelectingRoom);
    // const numberOfCustomersDialog = () =>
    //     <NumberOfCustomersDialog v-model={showNumberOfCustomersDialog.value}
    //                              onSubmit={({ numberOfCustomers, tseMethod }) => onCustomerDialogSubmit({ numberOfCustomers, tseMethod }, emit)}
    //     >
    //
    //     </NumberOfCustomersDialog>
    return () => <>
      {renderRoom()}

    </>
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
