<template>
  <div style="display: flex; height: 100vh; width: 100vw">
    <!-- side bar -->
    <pos-dashboard-sidebar
        :items="sidebarData"
        :title="user.username"
        @toggle="onSidebarToggle"
        :default-path="defaultPath"
        :after-mount-fn="selectFirstRoom">
      <template v-slot:above-spacer>
        <!-- Add more room -->
        <div v-if="showAddNewRoomBtn"
             class="edit-table-plan__add-new-room-btn-wrapper">
          <g-btn @click="addNewRoom"
                 outlined
                 flat dashed
                 border-radius="4"
                 text-color="#2979FF"
                 class="edit-table-plan__add-new-room-btn">+ {{$t('restaurant.addRoom')}}
          </g-btn>
        </div>

        <!-- Room info -->
        <div v-if="room && !roomObj" class="card-info">
          <g-text-field-bs :model-value="room.name" label="Room name *:" @update:modelValue="changeRoomName">
            <template v-slot:append-inner>
              <g-icon style="cursor: pointer" @click="dialog.showRoomNameKbd = true">icon-keyboard</g-icon>
            </template>
          </g-text-field-bs>
          <div style="display: flex; margin-left: 5px; margin-right: 5px; justify-content: space-between;">
            <g-btn @click="moveRoomUp" style="width: 20px; min-width: 20px !important">
              <g-icon small>icon-arrow-up</g-icon>
            </g-btn>
            <g-btn @click="moveRoomDown" style="width: 20px; min-width: 20px !important">
              <g-icon small>icon-arrow-down</g-icon>
            </g-btn>
            <g-btn @click="removeRoom" background-color="#FF4452" text-color="#FFF"><g-icon>delete</g-icon>{{$t('ui.delete')}}</g-btn>
          </div>
        </div>

        <!-- Room object info -->
        <div v-if="roomObj" class="card-info">
          <!-- table -->
          <template v-if="isTable(roomObj)">
            <g-text-field-bs
                label="Table name: "
                :model-value="roomObj.name"
                @update:modelValue="changeTableName"
                @click="dialog.showTableNameKbd = true">
              <template v-slot:append-inner>
                <g-icon svg color="#F00">icon-keyboard-red</g-icon>
              </template>
            </g-text-field-bs>
            <div style="margin: 5px">
              <div> {{$t('ui.color')}}:</div>
              <color-selector key="table" :model-value="roomObj.bgColor" :colors="tableColors" @update:modelValue="_updateRoomObject({ bgColor: $event || '#FFFFFF' })" :item-size="18" :badge-size="12"/>
              <div style="display: flex; align-items: center">
                <span style="margin-right: 10px">{{$t('restaurant.takeAway')}}:</span>
                <g-switch :model-value="roomObj.takeAway" @update:modelValue="_updateRoomObject({ takeAway: $event })"/>
              </div>
            </div>
          </template>

          <!-- wall -->
          <template v-else-if="isWall(roomObj)">
            <div style="margin: 5px">
              <div> {{$t('ui.color')}}:</div>
              <color-selector key="wall" :model-value="roomObj.bgColor" :colors="wallColors" @update:modelValue="_updateRoomObject({ bgColor: $event || 'black' })" :item-size="18" :badge-size="12"/>
            </div>
          </template>
          <div style="display: flex; margin: 5px; justify-content: space-between">
            <g-btn @click="duplicateRoomObj" width="48%" style="font-size: 13px" outlined flat text-color="#2979FF">
              <g-icon size="13">fas fa-clone</g-icon>
              {{$t('ui.duplicate')}}
            </g-btn>
            <g-btn @click="removeRoomObj" width="48%" background-color="#FF4452" text-color="#FFF" style="margin-left: 5px; font-size: 13px">
              <g-icon size="13">delete</g-icon>
              {{$t('ui.delete')}}
            </g-btn>
          </div>
        </div>
      </template>

      <template v-slot:footer>
        <!-- Add new room object -->
        <div style="display: flex; margin: 5px; justify-content: space-between; flex-shrink: 0" v-if="room">
          <g-btn outlined flat @click="addNewWall" width="48%" text-color="#2979FF">+ {{$t('restaurant.wall')}}</g-btn>
          <g-btn flat @click="addNewTable" width="48%" background-color="#2979FF" text-color="#FFF">+ {{$t('restaurant.table')}}</g-btn>
        </div>

        <!-- Go back -->
        <div style="display: flex; margin: 5px; justify-content: space-between">
          <g-btn :uppercase="false" background-color="white" text-color="#1d1d26" @click="back" style="flex: 1">
            <g-icon class="mr-2" svg>
              icon-back
            </g-icon>
            {{$t('ui.back')}}
          </g-btn>
        </div>
      </template>
    </pos-dashboard-sidebar>

    <!-- room view -->
    <room v-if="room"
          :name="room.name"
          :room-objects="room.roomObjects"
          editable
          @selectRoomObject="selectRoomObj"
          @roomObjectChanged="changeRoomObjUI">
      <template #room-object="{roomObject}">
        <div v-if="isTable(roomObject) || !isWall(roomObject)">
          <div>{{ roomObject.name }}</div>
        </div>
      </template>
    </room>
    <template>
      <dialog-text-filter label="Room name" v-if="room" :default-value="room.name" v-model="dialog.showRoomNameKbd" @submit="changeRoomName"/>
      <dialog-text-filter label="Table name" v-if="roomObj" :default-value="roomObj.name" v-model="dialog.showTableNameKbd" @submit="changeTableName"/>
      <g-snackbar v-model="showSnackBar" time-out="3000">{{tableNameExistedErrorMsg}}</g-snackbar>
    </template>
  </div>
</template>
<script>
  import _ from 'lodash';
  import Room from '../TablePlan/Room';
  import PosDashboardSidebar from '../Dashboard/PosDashboardSidebar';
  import DialogChangeValue from '../pos-shared-components/dialogChangeValue';
  import GButtonMerger from '../FnButton/components/GButtonMerger';
  import ColorSelector from '../common/ColorSelector';
  import PosTextField from '../pos-shared-components/POSInput/PosTextField';
  import DialogTextFilter from '../pos-shared-components/dialogFilter/dialogTextFilter';
  import { reloadRooms } from '../../composition/useRoomLogic';

  const BSON = require('bson')

  export default {
    name: 'EditTablePlan',
    components: { DialogTextFilter, PosTextField, ColorSelector, GButtonMerger, DialogChangeValue, PosDashboardSidebar, Room },
    // injectService: ['PosStore:user'],
    props: {},
    data: function () {
      return {
        rooms: [],     // entire rooms
        selectedRoomId: null,
        selectedRoomObjectId: null,
        tableColors: ['#FFFFFF', '#F8BBD0', '#D1C4E9', '#B3E5FC', '#FFF9C4', '#C8E6C9', '#D7CCC8', '#EEEEEE'],
        wallColors: ['#FFFFFF', '#CCCCCC', '#4D0019', '#404040', '#86592D', '#A6A6A6', '#FFD480', '#E4E4E4'],
        showAddNewRoomBtn: false,
        dialog: {
          showRoomNameKbd: false,
          showTableNameKbd: false,
        },
        defaultPath: 'item.0.item.0',
        tableNameExistedErrorMsg: '',
        showSnackBar: false,
        user: { username: 'admin' }
      }
    },
    computed: {
      sidebarData() {
        return [{
          title: 'Restaurant', icon: 'icon-restaurant',
          items: _.map(this.rooms, this.convertRoomToSideBarItem)
        }]
      },
      roomNames() {
        const roomNames = {}
        _.each(this.rooms, room => roomNames[room.name] = room._id)
        return roomNames
      },
      tableNames() {
        const tableNames = {}
        _.each(this.rooms, room => {
          _.each(room.roomObjects, ro => {
            if (ro.name)
              tableNames[ro.name] = ro._id
          })
        })
        return tableNames
      },
      room() {
        if (this.selectedRoomId)
          return _.find(this.rooms, r => r._id === this.selectedRoomId)
      },
      roomObj() {
        if (this.selectedRoomId && this.selectedRoomObjectId)
          return _.find(this.room.roomObjects, ro => ro._id === this.selectedRoomObjectId)
      }
    },
    methods: {
      async loadRooms() {
        this.rooms.splice(0, this.rooms.length, ..._.orderBy(await cms.getModel('Room').find({}), ['order'], ['asc']))
      },
      onSidebarToggle(path, toggled) {
        this.showAddNewRoomBtn = toggled
      },
      selectFirstRoom() {
        const firstRoom = cms.getList('Room')[0]
        if (firstRoom)
          this.selectedRoomId = firstRoom._id
      },
      convertRoomToSideBarItem(room) {
        return {
          title: room.name,
          icon: 'radio_button_unchecked',
          iconType: 'small',
          onClick: () => {
            this.selectedRoomId = room._id
            this.selectedRoomObjectId = null
          }
        }
      },
      getUniqueRoomName(baseName) {
        const init = baseName || 1
        let name = init
        let ctr = 1
        while(_.has(this.roomNames, `${name}`)) {
          name = init + ctr
          ctr++
        }
        return name
      },
      getUniqueTableName(baseName) {
        const init = baseName || 1
        let name = init
        let ctr = 1
        while(_.has(this.tableNames, `${name}`)) {
          name = init + ctr
          ctr++
        }
        return name
      },
      async addNewRoom() {
        const largestOrder = this.rooms.length > 0 ? _.maxBy(this.rooms, r => r.order).order : 0;
        const newName = this.getUniqueRoomName('Room ')
        const created = await cms.getModel('Room').create({ name: newName, order: largestOrder + 1 });
        await this.loadRooms()
      },
      async removeRoom() {
        await cms.getModel('Room').remove({ _id: this.room._id })
        const roomIndex = _.findIndex(this.rooms, r => r === this.room)
        await this.loadRooms()
      },
      async changeRoomName(name) {
        await cms.getModel('Room').findOneAndUpdate({ _id: this.room._id }, { name });
        this.room.name = name
      },
      async moveRoomUp() {
        const i = _.findIndex(this.rooms, r => r._id === this.room._id)
        await this._moveRoomUp(i)
      },
      async moveRoomDown() {
        const i = _.findIndex(this.rooms, r => r._id === this.room._id)
        if (i < this.rooms.length - 1)
          await this._moveRoomUp(i + 1, 1)
      },
      async _moveRoomUp(i, down = 0) {
        if (i > 0) {
          const curRoom = this.rooms[i]
          const preRoom = this.rooms[i - 1]
          // console.log(`Move room ${curRoom.name} from order ${curRoom.order} to order ${preRoom.order}`)
          // console.log(`Move room ${preRoom.name} from order ${preRoom.order} to order ${curRoom.order}`)
          await cms.getModel('Room').updateOne({ _id: curRoom._id }, { order: preRoom.order });
          await cms.getModel('Room').updateOne({ _id: preRoom._id }, { order: curRoom.order });
          await this.loadRooms()
        }
        this.defaultPath = `item.0.item.${i - 1 + down}`
      },

      // room object helper methods
      isTable(roomObj) {
        return roomObj.type === 'table'
      },
      isWall(roomObj) {
        return roomObj.type === 'wall'
      },

      selectRoomObj(roomObj) {
        this.selectedRoomObjectId = roomObj._id
      },

      // add room object
      async addNewWall() {
        await this._addRoomObj({
          size: { width: 300, height: 10 },
          location: { x: 0, y: 0 },
          type: 'wall',
          bgColor: 'black',
          _id: new BSON.ObjectID()
        })
      },
      async addNewTable() {
        await this._addRoomObj({
          size: { width: 100, height: 100 },
          location: { x: 0, y: 0 },
          type: 'table',
          bgColor: 'white',
          name: this.getUniqueTableName(),
          takeAway: false,
          _id: new BSON.ObjectID()
        })
      },
      async duplicateRoomObj() {
        const newRoomObj = {
          ..._.cloneDeep(this.roomObj),
          name: this.getUniqueTableName(),
          _id: null,
          location: { x:0, y: 0 }
        }
        delete newRoomObj._id
        await this._addRoomObj(newRoomObj)
      },
      async removeRoomObj() {
        const idOfRoomObj = _.findIndex(this.room.roomObjects, ro => ro === this.roomObj);
        this.room.roomObjects.splice(idOfRoomObj, 1)
        await cms.getModel('Room').findOneAndUpdate({ _id: this.room._id }, { roomObjects: this.room.roomObjects })
        await this.loadRooms()
      },
      async _addRoomObj(ro) {
        const result = await cms.getModel('Room').findOneAndUpdate(
            { _id: this.room._id },
            { $push: { roomObjects: ro } },
            { new : true });
        await this.loadRooms()
      },
      async changeRoomObjUI(roomObj) {
        await this._updateRoomObject(_.pick(roomObj, ['location', 'size', 'bgColor']));
      },
      async changeTableName(name) {
        const availName = this.getUniqueTableName(name)
        if (availName === name) {
          await this._updateRoomObject({name});
        } else {
          if (this.roomObj._id !== this.tableNames[name]) {
            this.tableNameExistedErrorMsg = `Table "${name}" already existed, please select another name! E.g: "${availName}"`
            this.showSnackBar = true
          }
        }
      },
      async _updateRoomObject(change) {
        const qry = { 'roomObjects._id': this.roomObj._id }

        const setObj = {}
        _.each(_.keys(change), k => setObj[`roomObjects.$.${k}`] = change[k]);
        const set =  { $set: setObj }

        // console.log('update', qry, 'set', set)
        await cms.getModel('Room').findOneAndUpdate(qry, set)

        await this.loadRooms()
      },

      async back() {
        await reloadRooms()
        this.$router.push('/pos-dashboard')
      }
    },
    async created() {
      await this.loadRooms()
      this.showAddNewRoomBtn = true
      this.timeInterval = setInterval(() => this.now = dayjs().format('HH:mm'), 1000)
      cms.socket.on('updateRooms', async () => {
        await this.loadRooms()
      })
    },
    beforeUnmount() {
      cms.socket.off('updateRooms');
      clearInterval(this.timeInterval)
    },
  }
</script>
<style scoped lang="scss">
  .edit-table-plan {
    &__add-new-room-btn {
      border: 1px dashed;
      width: 100%;

      &-wrapper {
        padding: 7px;
        background-color: #F7F7F7;
      }
    }
  }

  .card-info {
    margin: 5px;
    padding-bottom: 13px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1398);
    border-radius: 4px;
  }

  .keyboard {
    position: absolute;
    bottom: 0;
    background-color: #efefef;
    padding: 8px;
    width: 100%;
    box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.15);
    z-index: 1;
  }

  @media screen and (max-width: 1023px) {
    .g-btn {
      padding: 0 8px !important;
    }
  }
</style>
