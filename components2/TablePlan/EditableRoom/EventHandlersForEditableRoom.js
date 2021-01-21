import * as mouseEventUtil from '../../../utils/mouseEventUtil';
import {
  onSelectObject,
  selectingObject,
  updateSelectingObjectInSelectingRoom
} from './EditTablePlanLogics'

import _ from 'lodash';
import { ref } from 'vue'
import { updateObjectLocation, updateObjectSize } from '../RoomLogics';
import { selectingRoomStates } from '../RoomState';

const EditableRoomEventHandlersFactory = () => {
  const action = ref('')
  const lastPos = ref({ x: 0, y: 0 })

  const onMouseDown = function (e, roomObject, newAction) {
    action.value = newAction
    mouseEventUtil.normalizeEvent(e)
    lastPos.value = { x: e.clientX, y: e.clientY };
    onSelectObject(roomObject)
  }

  const applyChange = _.throttle(e => {
    if (!selectingObject.value) return
    const change = {
      offsetX: e.clientX - lastPos.value.x,
      offsetY: e.clientY - lastPos.value.y
    }
    if (action.value === 'move') {
      const curPosition = selectingObject.value.realLocation
      updateObjectLocation(selectingRoomStates.value.room, selectingObject.value, {
        x: curPosition.x + change.offsetX,
        y: curPosition.y + change.offsetY
      }, selectingRoomStates.value.zoom)
    } else {
      const curSize = selectingObject.value.realSize
      updateObjectSize(selectingRoomStates.value.room, selectingObject.value, {
        width: curSize.width + change.offsetX,
        height: curSize.height + change.offsetY
      }, selectingRoomStates.value.zoom)
    }
    lastPos.value = { x: e.clientX, y: e.clientY }
  }, 30)

  const onMouseMove = function (e) {
    mouseEventUtil.normalizeEvent(e);
    applyChange(e)
  }
  const onMouseUp = async function (e) {
    if (!selectingObject.value) {
      action.value = null
      return
    }
    if (action.value === 'move') {
      const location = selectingObject.value.location
      await updateSelectingObjectInSelectingRoom({ location })
    } else {
      if (action.value === 'resize') {
        const size = selectingObject.value.size
        await updateSelectingObjectInSelectingRoom( { size })
      }
    }
    action.value = null
  }
  const touchHandlers = function (item) {
    return {
      start: e => onMouseDown(e, item, 'move'),
      move: e => onMouseMove(e),
      end: async(e) => { await onMouseUp(e) }
    }
  }

  const resizeRoomObjectEvenHandler = obj => ({
    onMousedown(e) {
      e.preventDefault()
      e.stopPropagation()
      onMouseDown(e, obj, 'resize')
    },
    onTouchstart(e) {
      e.preventDefault()
      e.stopPropagation()
      onMouseDown(e, obj, 'resize')
    }
  })
  return { touchHandlers, resizeRoomObjectEvenHandler }
}

export default EditableRoomEventHandlersFactory
