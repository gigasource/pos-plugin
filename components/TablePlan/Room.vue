<template>
  <div class="room"
       @mousemove.prevent.stop="onMouseMove"
       @mouseup.prevent.stop="e => onMouseUp(e)"
       @touchmove.prevent.stop="onMouseMove"
       @touchend.prevent.stop="e => onMouseUp(e)"
       ref="room">
    <div v-for="(roomObject, index) in rooms"
         :key="roomObject._id"
         :style="getRoomObjectContainerStyle(roomObject)"
         @click.prevent.stop="e => onMouseDown(e, roomObject, actions.move)"
         v-touch="getTouchHandlers(roomObject)"
         :class="[
           ...!editable && !isTableDisabled(roomObject) && ['waves-effect', 'waves-red'],
           ...transferTableFrom && transferTableFrom.name === roomObject.name &&
           ['animated', 'bounce', 'infinite']
         ]"
    >
      <div :style="getRoomObjectStyle(roomObject)">
        <slot name="room-object" v-bind:roomObject="roomObject"/>
        <g-icon v-if="isTableBusy(roomObject) && isUserTable(roomObject)" style="position: absolute; top: 0; right: 0; height: 18px; width: 21px">icon-room-border</g-icon>
      </div>
      <div v-if="editable && isSelected(roomObject)"
           @mousedown.prevent.stop="e => onMouseDown(e, roomObject, actions.resize)"
           @touchstart.prevent.stop="e => onMouseDown(e, roomObject, actions.resize)"
           class="room__object__resizer" >
        <img alt style="width: 16px; height: 16px" src="/plugins/pos-plugin/assets/resize.svg" draggable="false"/>
      </div>
    </div>
  </div>
</template>
<script>
  import _ from 'lodash'
  import * as mouseEventUtil from '../../utils/mouseEventUtil'
  import {Touch} from 'pos-vue-framework';

  export default {
    name: 'Room',
    directives: {
      Touch
    },
    props: {
      name: String,
      editable: Boolean,
      edge: {
        type: Number,
        default: 6
      },
      roomObjects: Array, // table and wall
      transferTableFrom: null,
      inProgressTable: Array,
      userTables: Array,
      disabledTables: Array
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
        swiping: false,
        zoom: 0
      }
    },
    computed: {
      selectingObj() {
        if (this.selectedObjectId)
          return _.find(this.rooms, ro => ro._id === this.selectedObjectId)
      },
      transferringTable() {
        return !!this.transferTableFrom
      },
      rooms() {
        if(this.editable || this.zoom === 0) {
          return this.roomObjects
        } else {
          return this.roomObjects.map(obj => ({
            ...obj,
            location: {
              x: obj.location.x * this.zoom,
              y: obj.location.y * this.zoom,
            },
            size: {
              width: obj.size.width * this.zoom,
              height: obj.size.height * this.zoom
            }
          }))
        }
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

            if (zoomHorizontalRatio >= 1 || zoomVerticalRatio >= 1) return
            const zoom = (Math.min(zoomVerticalRatio, zoomHorizontalRatio) - 0.05).toFixed(1)
            if(this.editable)
              roomEl.style.zoom = zoom
            else
              this.zoom = zoom
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
          fontSize: `${this.zoom ? this.zoom * 20 : 20}px`,
          fontWeight: '700',
          transition: 'none'
        };

        if (this.editable || (!this.editable && roomObj.type !== 'wall'))
          style.cursor = 'pointer'

        if (this.editable && this.isSelected(roomObj)) {
          style.border = '1px solid #1271FF'
        }

        if (this.isTable(roomObj)) {
          style.borderRadius = `5px`;
          style.boxShadow = '0px 2px 4px rgba(131, 146, 167, 0.2)';
        }

        if (this.isTableBusy(roomObj)) {
          const addStyle = this.transferringTable && roomObj.name !== this.transferTableFrom.name
              ? { background: '#fec8c8', opacity: 0.2 }
              : { background: '#fec8c8', border: '1px solid #d2691e' }
          Object.assign(style, addStyle)
        } else {
          Object.assign(style, { background: roomObj.bgColor })
        }

        if (this.isTableDisabled(roomObj)) {
          Object.assign(style, { opacity: 0.2 })
        }

        return style
      },
      getRoomObjectStyle(roomObj) {
        const style = {
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
      isTableBusy(roomObj) {
        if(!this.editable)
          return this.inProgressTable.includes(roomObj.name)
        return false
      },
      isUserTable(roomObj) {
        if (!this.userTables) return
        if (!this.editable)
          return this.isTable(roomObj) && this.userTables.includes(roomObj.name)
        return false
      },
      isTableDisabled(roomObj) {
        if (!this.disabledTables || !this.disabledTables.length) return
        return this.disabledTables.includes(roomObj.name)
      },

      // action trigger
      onMouseDown(e, roomObject, action) {
        if (this.editable) {
          this.selectedObjectId = roomObject._id
          mouseEventUtil.normalizeEvent(e);
          this.action = action;
          this.lastPos = { x: e.clientX, y: e.clientY };
        }

        if (this.transferringTable) {
          if (!this.isTableBusy(roomObject) && roomObject !== this.transferTableFrom) {
            this.$emit('setTransferTableTo', roomObject)
          }
        }

        if (this.editable || (!this.editable && roomObject.type !== 'wall')) {
          if (this.isTableDisabled(roomObject)) return
          this.$emit('selectRoomObject', roomObject)
        }
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
      getTouchHandlers(item) {
        if (this.editable) {
          const action = this.actions.move
          return {
            start: e => this.onMouseDown(e, item, action),
            move: e => this.onMouseMove(e),
            end: e => this.onMouseUp(e)
          }
        }
        if (!this.isTable(item)) return {}

        return {
          right: () => {
            this.$emit('setTransferTableFrom', item)
          },
          move: () => {
            if (!this.transferTableFrom) this.swiping = true
          },
          end: () => {
            if (this.transferringTable) {
              if (!this.isTableBusy(item) && item !== this.transferTableFrom) {
                this.$emit('setTransferTableTo', item)
              }
              return
            }
            if (this.editable || (!this.editable && item.type !== 'wall')) {
              if (this.isTableDisabled(item)) return

              if (this.swiping) {
                this.swiping = false
              } else {
                this.$emit('selectRoomObject', item)
              }
            }
          }
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
