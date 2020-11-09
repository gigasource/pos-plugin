<template>
  <div class="wrapper col-flex">
    <div class="room-container flex-grow-1" ref="room">
      <div class="table waves-effect waves-red" v-for="table in manualTables" @click.stop="routeToOrder(table)">
        {{table}}
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
  export default {
    name: 'PosOrderManualTable',
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
          if (this.isMobile) {
            this.$router.push(`/pos-order-3/${table || this.trimmedText}`)
          } else {
            this.$router.push(`/pos-order-2/${table || this.trimmedText}`)
          }
          this.text = ''
        }, 200)
      },
      focusTf() {
        this.$nextTick(() => {
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
