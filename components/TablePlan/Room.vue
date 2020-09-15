<template>
  <div class="room"
       @mousemove.prevent.stop="onMouseMove"
       @mouseup.prevent.stop="e => onMouseUp(e)"
       @touchmove.prevent.stop="onMouseMove"
       @touchend.prevent.stop="e => onMouseUp(e)"
       ref="room">
    <div v-for="(roomObject, index) in roomObjects"
         :key="index"
         @mousedown.prevent.stop="e => onMouseDown(e, roomObject, actions.move)"
         @touchstart.prevent.stop="e => onMouseDown(e, roomObject, actions.move)"
         :style="getRoomObjectContainerStyle(roomObject)">
      <div :style="getRoomObjectStyle(roomObject)">
        <slot name="room-object" v-bind:roomObject="roomObject"/>
      </div>
      <div v-if="editable && isSelected(roomObject)"
           @mousedown.prevent.stop="e => onMouseDown(e, roomObject, actions.resize)"
           @touchstart.prevent.stop="e => onMouseDown(e, roomObject, actions.resize)"
           class="room__object__resizer" >
        <img src="/plugins/pos-plugin/assets/resize.svg" draggable="false"/>
      </div>
    </div>
  </div>
</template>
<script>
  import _ from 'lodash'
  import * as mouseEventUtil from '../../utils/mouseEventUtil'

  export default {
    name: 'Room',
    props: {
      name: String,
      editable: Boolean,
      edge: {
        type: Number,
        default: 6
      },
      roomObjects: Array, // table and wall
    },
    data: function () {
      return {
        selectedObjectId: null,
        // define a list of action available
        actions: {
          move: this.moveAction,
          resize: this.resizeAction,
        },
        action: null, // current action -- see list of available action above
        lastPos: null, // store last mouse clientX, Y position which already handled by "applyChange throttle"
      }
    },
    computed: {
      selectingObj() {
        if (this.selectedObjectId)
          return _.find(this.roomObjects, ro => ro._id === this.selectedObjectId)
      }
    },
    created() {
      this.applyChange = _.throttle(e => {
        const change = {
          offsetX: e.clientX - this.lastPos.x,
          offsetY: e.clientY - this.lastPos.y };

        if (change.offsetX === 0 && change.offsetY === 0)
          return;

        this.action && this.action(change);

        // update last position
        this.lastPos = { x: e.clientX, y: e.clientY }
      }, 20)
    },
    watch: {
      roomObjects: {
        handler() {
          this.$nextTick(() => {
            const roomEl = this.$refs['room']

            const zoomVerticalRatio = roomEl.clientHeight / roomEl.scrollHeight
            const zoomHorizontalRatio = roomEl.clientWidth / roomEl.scrollWidth
            console.log(zoomVerticalRatio, zoomHorizontalRatio)

            if (zoomHorizontalRatio >= 1 || zoomVerticalRatio >= 1) return
            roomEl.style.zoom = (Math.min(zoomVerticalRatio, zoomHorizontalRatio) - 0.05).toFixed(1)
          })
        },
        immediate: true
      }
    },
    methods: {
      // styling stuff
      getRoomObjectContainerStyle(roomObj) {
        let style = {
          position: 'absolute',
          left: `${roomObj.location.x}px`,
          top: `${roomObj.location.y}px`,
          width: `${roomObj.size.width}px`,
          height: `${roomObj.size.height}px`,
          transform: `rotate(${roomObj.rotate}deg)`,
          transformOrigin: '50% 50%',
          border: '1px solid transparent',
          fontSize: '20px',
          fontWeight: '700'
        };

        if (this.editable || (!this.editable && roomObj.type !== 'wall'))
          style.cursor = 'pointer'

        if (this.editable && this.isSelected(roomObj)) {
          style.border = '1px solid #1271FF'
        }

        if (this.isTable(roomObj)) {
          style.borderRadius = `4px`;
          style.boxShadow = '0px 2px 4px rgba(131, 146, 167, 0.2)';
        }

        return style
      },
      getRoomObjectStyle(roomObj) {
        const style = {
          backgroundColor: roomObj.bgColor,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        };

        if (this.isTable(roomObj)) {
          style.borderRadius = `4px`;
        }

        return style
      },
      isTable(roomObj) {
        return roomObj.type === 'table'
      },
      isSelected(roomObj) {
        return this.selectingObj && this.selectingObj._id === roomObj._id
      },

      // action trigger
      onMouseDown(e, roomObject, action) {
        if (this.editable) {
          this.selectedObjectId = roomObject._id
          mouseEventUtil.normalizeEvent(e);
          this.action = action;
          this.lastPos = { x: e.clientX, y: e.clientY };
        }

        if (this.editable || (!this.editable && roomObject.type !== 'wall'))
          this.$emit('selectRoomObject', roomObject)
      },
      onMouseMove(e) {
        if (this.action) {
          mouseEventUtil.normalizeEvent(e);
          this.applyChange(e)
        }
      },
      onMouseUp(e) {
        // clear the action
        if (this.action) {
          this.$emit('roomObjectChanged', this.selectingObj);
          this.action = null
        }
      },
      // actions
      moveAction(change) {
        this.selectingObj.location.x += change.offsetX;
        this.selectingObj.location.y += change.offsetY;
        // prevent out of bound
        if (this.selectingObj.location.x < 0)
          this.selectingObj.location.x = 0;
        if (this.selectingObj.location.y < 0)
          this.selectingObj.location.y = 0;
        const viewportRect = this.$refs['room'].getBoundingClientRect();
        if (this.selectingObj.location.x + this.selectingObj.size.width > viewportRect.width)
          this.selectingObj.location.x = viewportRect.width - this.selectingObj.size.width;
        if (this.selectingObj.location.y + this.selectingObj.size.height > viewportRect.height)
          this.selectingObj.location.y = viewportRect.height - this.selectingObj.size.height
      },
      resizeAction(change) {
        this.selectingObj.size.width += change.offsetX;
        this.selectingObj.size.height += change.offsetY;
      }
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
      width: 16px;
      height: 16px;
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
