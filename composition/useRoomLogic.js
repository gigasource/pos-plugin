import { reactive } from 'vue'
import _ from 'lodash'

export const state = reactive({
  rooms: []
})

function orderRooms(rooms) {
  return _.orderBy(rooms, ['order'], ['asc']);
}

export async function reloadRooms() {
  state.rooms.splice(0, this.rooms.length, ...orderRooms(await cms.getModel('Room').find({})))
}
