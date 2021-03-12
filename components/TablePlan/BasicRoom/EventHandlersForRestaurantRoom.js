import {
  chooseTable,
  isTransferringTable,
  moveOrderToNewTable,
  swiping,
  transferTableFrom
} from './RestaurantRoomLogics';
import { isBusyTable, isWall } from '../RoomShared';
import { isSameId } from '../../utils';

const RestaurantRoomEventHandlers = (props) => {
  const touchHandlers = function (item) {
    return {
      right: () => {
        if (isBusyTable(item)) transferTableFrom.value = item
      },
      move: () => {
        if (!transferTableFrom.value) swiping.value = true
      },
      end: async () => {
        if (transferTableFrom.value) {
          if (!isBusyTable(item) && !isSameId(item, transferTableFrom.value)) {
            await moveOrderToNewTable(transferTableFrom.value, item)
            transferTableFrom.value = null
          }
          if (isTransferringTable(item)) {
            transferTableFrom.value = null //unselect transferring table
          }
          return
        }
        if (!isWall(item)) {
          if (swiping.value) {
            swiping.value = false
          } else {
            //todo: check table is disable or not
            await (props.chooseTable ? props.chooseTable(item) : chooseTable(item))
            //await chooseTable(item)
          }
        }
      }
    }
  }
  return { touchHandlers }
}

export default RestaurantRoomEventHandlers
