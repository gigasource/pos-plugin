<script>

import RoomFactory from '../RoomFactory'

const { hooks, fn } = RoomFactory()

import { getTableOrderInfo, isBusyTable } from './RestaurantRoomLogics'
import { isTable } from '../room-logic'
import { getDiffTime } from '../../../utils/commons'
import { ref, watch } from 'vue';
import { globalZoom } from '../../View/EditTablePlan/EditTablePlanLogics';
import RoomStyleFactory from '../RoomStyles'
import { getScopeAttrs } from '../../../utils/helpers';
const curTime = ref(new Date())

const timerInterval = setInterval(() => {
  curTime.value = new Date()
}, 30000)

const { roomObjectStyle, roomObjectContainerStyle } = RoomStyleFactory()
hooks.on('provideZoom', ({ zoom }) => {
  watch(() => zoom.value, () => {
    globalZoom.value = zoom.value
  })
})


const _roomObjectContainerStyle = (obj) => {
  const style = roomObjectContainerStyle(obj)
  if (isBusyTable(obj)) Object.assign(style, { background: '#fec8c8', border: '1px solid #d2691e' })
  return style
}

const Component = fn()


export default {
  setup() {

    const objectRenderFn = (obj) => {
      const isActiveTable = obj.type === 'table' && isBusyTable(obj)
      const tableOrderInfo = getTableOrderInfo(obj)
      return <div style={roomObjectStyle(obj)}>
        {isTable(obj) ? <>
          <div style={`font-size: ${10 * globalZoom.value}px ;position: absolute; top: 2px`}> </div>
          <div>
            <div> {obj.name} </div>
          </div>
          {isActiveTable ?
              <div style={`font-size: ${10 * globalZoom.value}px; position: absolute; bottom: 2px`}>
                {`${getDiffTime(tableOrderInfo.date, curTime.value)} mins`} </div> : null}
        </> : null}
      </div>
    }

    const classes = (obj) => isTable(obj) ? ['waves-effect', 'waves-red'] : []
    return () => <Component v-slots={
      {
        'room-object': (obj) => {
          return <div key={obj._id} id={obj.name}
                      style={_roomObjectContainerStyle(obj)}
                      class={classes(obj)}>
            {objectRenderFn(obj)}
          </div>
        }
      }
    }>

    </Component>
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
