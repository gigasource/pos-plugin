import {
  chooseTable,
  isTransferringTable,
  moveOrderToNewTable,
  swiping,
  transferTableFrom
} from './RestaurantRoomLogics';
import { isBusyTable, isWall } from '../RoomShared';
import { isSameId } from '../../utils';

const RestaurantRoomEventHandlers = () => {
  const touchHandlers = function (item) {
    return {
      right: () => {
        if (isBusyTable(item)) transferTableFrom.value = item
      },
      move: () => {
        if (!transferTableFrom.value) swiping.value = true
      },
      end: async() => {
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
            chooseTable(item.name)
          }
        }
      }
    }
  }
  return { touchHandlers }
}

export default RestaurantRoomEventHandlers
