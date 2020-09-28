<template>
  <div style="height: 100%">
    <room v-if="room"
          :name="room.name"
          :room-objects="room.roomObjects"
          :in-progress-table="inProgressTable"
          :transfer-table-from="transferTableFrom"
          @selectRoomObject="selectRoomObj"
          @setTransferTableFrom="setTransferTableFrom"
          @setTransferTableTo="setTransferTableTo">
      <template #room-object="{roomObject}">
        <div v-if="isTable(roomObject) || !isWall(roomObject)">
          <div>{{ roomObject.name }}</div>
        </div>
      </template>
    </room>
  </div>
</template>
<script>
  import _ from 'lodash'

  export default {
    name: 'RestaurantRoom',
    injectService:['PosStore:isMobile'],
    components: { },
    props: {
      id: String
    },
    data() {
      return {
        room: null,
        roomObj: null,
        //
        inProgressTable: [],
        transferTableFrom: null,
      }
    },
    async created() {
      await this.loadRoom()
      await this.loadTableStatus()
      cms.socket.emit('join-room')
      cms.socket.on('update-table-status', ({table, status}) => {
        if (_.includes(this.tableNames, table)) {
          if (status === 'inProgress') {
            if (!_.includes(this.inProgressTable, table))
              this.inProgressTable.push(table)
          } else {
            let indexOfTable = _.findIndex(this.inProgressTable, table)
            if (indexOfTable >= 0)
              this.inProgressTable.splice(indexOfTable, 1)
          }
        }
      })
    },
    activated() {
      setTimeout(async () => {
        await this.loadTableStatus()
      }, 500)
    },
    destroyed() {
      cms.socket.off('update-table-status')
    },
    watch: {
      id() {
        this.loadRoom();
      },
      room(val) {
        if (val) {
          this.loadTableStatus()
        }
      }
    },
    computed: {
      tableNames() {
        return _.map(_.filter(this.room.roomObjects, rObj => rObj.type === 'table'), rO => rO.name)
      }
    },
    methods: {
      async loadRoom() {
        this.$set(this, 'room', await cms.getModel('Room').findOne({_id: this.id}))
      },
      async loadTableStatus() {
        const inProgressOrders = await cms.getModel('Order').find({ table: { $in: this.tableNames }, status: 'inProgress' })
        this.inProgressTable = inProgressOrders.map(o => o.table)
      },
      isTable(roomObj) {
        return roomObj.type === 'table'
      },
      isWall(roomObj) {
        return roomObj.type === 'wall'
      },
      isTableBusy(roomObj) {
        return this.inProgressTable.includes(roomObj.name)
      },
      selectRoomObj(roomObj) {
        // if (!this.isTableBusy(roomObj)) {
          this.roomObj = roomObj;
          setTimeout(() => {
            if (this.isMobile) {
              this.$router.push(`/pos-order-3/${roomObj.name}`)
            } else {
              this.$router.push(`/pos-order-2/${roomObj.name}`)
            }
          }, 300)
        // }
      },
      setTransferTableFrom(roomObj) {
        if (this.transferTableFrom && roomObj.name === this.transferTableFrom.name) return this.transferTableFrom = null
        if (this.isTable(roomObj) && this.isTableBusy(roomObj)) this.transferTableFrom = roomObj
      },
      async setTransferTableTo(roomObj) {
        if (!roomObj || !this.isTable(roomObj) || this.isTableBusy(roomObj)) return
        const order = await cms.getModel('Order').findOne({ table: this.transferTableFrom.name, status: 'inProgress' })

        // todo transfer table:
        // create $set table commit
        // update current order commits -> new table
        // update current order -> new table
        await this.loadRoom()
        await this.loadTableStatus()
        this.transferTableFrom = null
      }
    }
  }
</script>
<style scoped lang="scss">
  /*
  &:before {
    content: '';
    width: 50px;
    height: 50px;
    position: absolute;
    top: 0;
    right: 0;
    background-color: #0ECBEE;
    transform: translate(50%, -50%) rotate(45deg);
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1398);
  }*/
</style>
