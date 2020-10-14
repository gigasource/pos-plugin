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
    <number-of-customers-dialog v-model="showNumberOfCustomersDialog" @submit="onCustomerDialogSubmit"/>
  </div>
</template>
<script>
  import _ from 'lodash'

  export default {
    name: 'RestaurantRoom',
    injectService: ['PosStore:isMobile'],
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
        showNumberOfCustomersDialog: false
      }
    },
    async created() {
      await this.loadRoom()
      await this.loadTableStatus()
      cms.socket.on('update-table-status', () => {
        setTimeout(async () => {
          await this.loadTableStatus()
        }, 500)
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
        this.$set(this, 'room', await cms.getModel('Room').findOne({ _id: this.id }))
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
      async selectRoomObj(roomObj) {
        // if (!this.isTableBusy(roomObj)) {
        this.roomObj = roomObj;
        const tseConfig = await cms.getModel('TseConfig').findOne()
        if (tseConfig && tseConfig.tseEnable && tseConfig.numberOfCustomersDialog && !this.isTableBusy(roomObj)) {
          this.showNumberOfCustomersDialog = true
        } else {
          setTimeout(() => {
            if (this.isMobile) {
              this.$router.push(`/pos-order-3/${roomObj.name}`)
            } else {
              this.$router.push(`/pos-order-2/${roomObj.name}`)
            }
          }, 200)
        }
        // }
      },
      onCustomerDialogSubmit({ numberOfCustomers, tseMethod }) {
        this.showNumberOfCustomersDialog = false
        setTimeout(() => {
          if (this.isMobile) {
            this.$router.push(`/pos-order-3/${this.roomObj.name}?numberOfCustomers=${numberOfCustomers}&tseMethod=${tseMethod}`)
          } else {
            this.$router.push(`/pos-order-2/${this.roomObj.name}?numberOfCustomers=${numberOfCustomers}&tseMethod=${tseMethod}`)
          }
        }, 200)
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
        const currentCommits = await cms.getModel('OrderCommit').find({ orderId: order.id })
        const table = roomObj.name;
        await cms.getModel('OrderCommit').create(['order', 'changeTable'].map(type => {
          return {
            type,
            where: { _id: order._id },
            table: order.table,
            update: {
              set: {
                key: 'table',
                value: table
              }
            }
          }
        }))
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
