<template>
  <div class="wrapper col-flex">
    <div class="room-container flex-grow-1" ref="room">
      <div class="table waves-effect waves-red" v-for="table in manualTables" @click.stop="routeToOrder(table)">
        <div>{{table}}</div>
        <div style="font-size: 10px; position: absolute; bottom: 2px">
          {{ getOrderTime(table) }} mins
        </div>
      </div>
    </div>
    <div class="keyboard">
      <pos-textfield-new label="Table" v-model="text" ref="tf"/>
      <pos-keyboard-full @enter-pressed="addTable"/>
    </div>
    <number-of-customers-dialog v-model="showNumberOfCustomersDialog" @submit="onCustomerDialogSubmit"/>
  </div>
</template>

<script>
  import { nextTick } from 'vue'
  import PosTextfieldNew from '../pos-shared-components/POSInput/PosTextfieldNew';
  import PosKeyboardFull from '../pos-shared-components/PosKeyboardFull';
  import NumberOfCustomersDialog from '../Restaurant/NumberOfCustomersDialog';
  
  export default {
    name: 'PosOrderManualTable',
    components: { NumberOfCustomersDialog, PosTextfieldNew, PosKeyboardFull },
    props: {
      isMobile: Boolean,
      activeOrders: Array
    },
    data() {
      return {
        text: '',
        showNumberOfCustomersDialog: false,
        rooms: null
      }
    },
    computed: {
      manualTables() {
        if (!this.activeOrders) return []
        return _(this.activeOrders).filter(o => o.manual).map(o => o.table).uniq().value()
      },
      tableExists() {
        if (!this.text) return
        return this.manualTables.includes(this.trimmedText)
      },
      trimmedText() {
        if (!this.text) return ''
        return this.text.trim()
      }
    },
    mounted() {
      this.focusTf()
    },
    activated() {
      this.focusTf()
    },
    emits: ['setInitOrderProps'],
    methods: {
      async loadRoom() {
        this.rooms = await cms.getModel('Room').find()
      },
      async addTable() {
        if (!this.text || this.tableExists) return
        if (this.isBusyTable(this.trimmedText)) {
          this.routeToOrder(this.trimmedText)
          return
        }

        const tseConfig = await cms.getModel('TseConfig').findOne()
        if (tseConfig && tseConfig.tseEnable && tseConfig.numberOfCustomersDialog) {
          this.showNumberOfCustomersDialog = true
        } else {
          this.$emit('setInitOrderProps', {
            manual: await this.isManualTable(this.trimmedText)
          })
          this.routeToOrder()
        }
      },
      async onCustomerDialogSubmit({ numberOfCustomers, tseMethod }) {
        this.showNumberOfCustomersDialog = false

        this.$emit('setInitOrderProps', {
          ...numberOfCustomers && { numberOfCustomers: +numberOfCustomers },
          tseMethod: tseMethod || 'auto',
          manual: await this.isManualTable(this.trimmedText)
        })
        this.routeToOrder()
      },
      routeToOrder(table) {
        setTimeout(() => {
          this.$router.push(`/pos-order/${table || this.trimmedText}`)
          this.text = ''
        }, 200)
      },
      focusTf() {
        nextTick(() => {
          setTimeout(() => {
            const tfComponent = this.$refs['tf']
            tfComponent && tfComponent.$el && tfComponent.$el.click()
          }, 500)
        })
      },
      isBusyTable(table) {
        return this.activeOrders.some(o => o.table === table)
      },
      async isManualTable(table) {
        await this.loadRoom()
        const tables = this.rooms.map(room => room.roomObjects.filter(i => i.type === 'table')).flat()
        return !tables.includes(table);
      },
      getOrderTime(table) {
        const order = this.activeOrders.find(o => o.table === table)
        return order && dayjs(this.currentTime).diff(order.date, 'm')
      }
    }
  }
</script>

<style scoped lang="scss">
  .wrapper {
    background-image: url('/plugins/pos-plugin/assets/out.png');
    height: 100%;

    .room-container {
      display: flex;
      flex-direction: row;
      padding: 32px;

      .table {
        height: 70px;
        width: 80px;
        background: #fec8c8;
        border: 1px solid #d2691e;
        border-radius: 5px;
        margin-right: 16px;
        margin-bottom: 16px;
        font-weight: 700;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
      }
    }
  }

  .keyboard {
    background-color: #bdbdbd;
    padding: 1rem;
  }

  .g-tf-wrapper ::v-deep {
    margin: 0 0 8px 0;
    width: 100%;

    fieldset {
      background-color: #FFF;
      border: 0;
    }
  }
</style>
