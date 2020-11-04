<template>
  <g-dialog v-model="internalValue" fullscreen content-class="choose-table-dialog">
    <g-card style="display: flex; flex-direction: column">
      <g-card-text style="flex: 1 0 0">
        <g-tabs v-model="tab" :items="tabs" vertical style="height: 100%">
          <g-tab-item v-for="item in tabs" :item="item" class="pl-2 h-100" :key="item.title">
            <template v-if="item.title === 'Manual'">
              <pos-textfield-new v-model="chooseTableInput" label="Table" class="mb-5"/>
              <g-spacer/>
              <div class="keyboard">
                <pos-keyboard-full @enter-pressed="submit"/>
              </div>
            </template>
            <template v-else>
              <room :room-objects="item.room" v-if="tab === item"
                    :in-progress-table="inProgressTable"
                    :disabled-tables="disabledTables"
                    @selectRoomObject="selectRoomObj">
                <template #room-object="{roomObject}">
                  <div v-if="isTable(roomObject) || !isWall(roomObject)">
                    <div>{{ roomObject.name }}</div>
                  </div>
                </template>
              </room>
            </template>
          </g-tab-item>
        </g-tabs>
      </g-card-text>
      <g-btn-bs style="position: absolute; left: 0; bottom: 0"
                class="ml-3 mb-2"
                icon="icon-back" @click.stop="close">{{$t('ui.back')}}</g-btn-bs>
    </g-card>
  </g-dialog>
</template>

<script>
  export default {
    name: 'ChooseTableDialog',
    props: {
      value: Boolean,
      table: String,
      activeOrders: Array
    },
    data() {
      return {
        chooseTableInput: '',
        tabs: [],
        tab: null
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        }
      },
      disabledTables() {
        if (this.table) return [this.table]
        return []
      }
    },
    methods: {
      isTable(roomObj) {
        return roomObj.type === 'table'
      },
      isWall(roomObj) {
        return roomObj.type === 'wall'
      },
      selectRoomObj(room) {
        this.$emit('submit', room.name)
      },
      isTableBusy(roomObj) {
        return this.inProgressTable.includes(roomObj.name)
      },
      submit() {
        this.$emit('submit', this.chooseTableInput)
      },
      close() {
        this.internalValue = false
      }
    },
    watch: {
      value: {
        async handler(val) {
          if (val) {
            this.chooseTableInput = ''
            const rooms = await cms.getModel('Room').find().lean()
            this.tabs = [
              ...rooms
                .sort((cur, next) => cur.order - next.order)
                .map(i => ({ title: i.name, room: i.roomObjects })),
              { title: 'Manual' }
            ]
            this.tab = this.tabs[0]
          }
        },
        immediate: true
      },
      activeOrders: {
        handler(val) {
          if (val) {
            this.inProgressTable = val.map(o => o.table)
          }
        },
        immediate: true,
        deep: true
      }
    }
  }
</script>

<style scoped lang="scss">
  .keyboard {
    background-color: #bdbdbd;
    padding: 0.5rem;

    ::v-deep .key {
      border: 1px solid #BDBDBD;
      border-radius: 2px;
      box-shadow: unset;
      padding-top: 8px;
      padding-bottom: 8px;
    }
  }

</style>
