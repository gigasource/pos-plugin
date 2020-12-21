<template>
  <div style="height: 100%">
    <room v-if="room"
          :name="room.name"
          :room-objects="room.roomObjects"
          :in-progress-table="inProgressTable"
          :user-tables="userTables"
          :transfer-table-from="transferTableFrom"
          @selectRoomObject="selectRoomObj"
          @setTransferTableFrom="setTransferTableFrom"
          @setTransferTableTo="setTransferTableTo">
      <template #room-object="{roomObject}">
        <div v-if="isTableBusy(roomObject)" style="font-size: 10px; position: absolute; top: 2px">
          {{ $t('common.currency', storeLocale)}}{{getOrderTotal(roomObject.name)}}
        </div>
        <div v-if="isTable(roomObject) || !isWall(roomObject)">
          <div>{{ roomObject.name }}</div>
        </div>
        <div v-if="isTableBusy(roomObject)" style="font-size: 10px; position: absolute; bottom: 2px">
          {{ getOrderTime(roomObject.name) }} mins
        </div>
      </template>
    </room>
    <number-of-customers-dialog v-model="showNumberOfCustomersDialog" @submit="onCustomerDialogSubmit"/>
  </div>
</template>
<script>
  import _ from 'lodash'
  import orderUtil from '../logic/orderUtil';

  export default {
    name: 'RestaurantRoom',
    injectService: ['PosStore:(isMobile, storeLocale)'],
    props: {
      id: null,
      user: null,
      currentOrder: null,
      activeOrders: Array
    },
    emits: ['setInitOrderProps', 'changeTable', 'resetOrderData'],
    data() {
      return {
        room: null,
        roomObj: null,
        //
        inProgressTable: [],
        userTables: [],
        transferTableFrom: null,
        showNumberOfCustomersDialog: false,
        currentTime: new Date()
      }
    },
    async created() {
      await this.loadRoom()
      cms.socket.on('updateRooms', this.loadRoom)
      setInterval(() => this.currentTime = new Date(), 30000)
    },
    unmounted() {
      cms.socket.off('updateRooms');
    },
    watch: {
      id() {
        this.loadRoom();
      },
      activeOrders: {
        handler(val) {
          if (val) {
            this.inProgressTable = val.map(order => order.table)
            this.userTables = val.filter(order => {
              if (order.user && order.user.length) {
                return order.user[0].name === this.user.name
              }
            }).map(order => order.table)
          }
        },
        deep: true,
        immediate: true
      },
      user: {
        handler(val) {
          if (val && this.activeOrders) {
            this.userTables = this.activeOrders.filter(order => order.user && order.user.some(u => u.name === val.name)).map(order => order.table)
          }
        },
        deep: true,
        immediate: true
      }
    },
    computed: {
      tableNames() {
        return _.map(_.filter(this.room.roomObjects, rObj => rObj.type === 'table'), rO => rO.name)
      }
    },
    methods: {
      async loadRoom() {
        this.room = await cms.getModel('Room').findOne({ _id: this.id })
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
        this.$emit('setInitOrderProps', {
          ...numberOfCustomers && { numberOfCustomers: +numberOfCustomers },
          tseMethod: tseMethod || 'auto'
        })
        setTimeout(() => {
          if (this.isMobile) {
            this.$router.push(`/pos-order-3/${this.roomObj.name}`)
          } else {
            this.$router.push(`/pos-order-2/${this.roomObj.name}`)
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
        const table = roomObj.name;
        this.$emit('changeTable', order, table, async () => {
          await this.loadRoom()
          this.transferTableFrom = null
        })
      },
      getOrderTime(table) {
        const order = this.activeOrders.find(o => o.table === table)
        return order && dayjs(this.currentTime).diff(order.date, 'm')
      },
      getOrderTotal(table) {
        const order = this.activeOrders.find(o => o.table === table)
        if(order) {
          const total = orderUtil.calOrderTotal(order.items) + orderUtil.calOrderModifier(order.items)
          if(Number.isInteger(total))
            return total
          return total.toFixed(2)
        }
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
