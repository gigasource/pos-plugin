<script>
import {genScopeId, internalValueFactory} from '../../utils'
import {computed, withModifiers, ref, watchEffect, KeepAlive} from 'vue';
import {selectingObject} from '../../TablePlan/EditableRoom/EditTablePlanLogics';
import {isTable, inProgressTables, isWall} from '../../TablePlan/RoomShared';
import {useI18n} from 'vue-i18n';
import {activeOrders} from "../../AppSharedStates";
import RestaurantRoom from "../../TablePlan/BasicRoom/RestaurantRoom";
import {fetchRooms, rooms} from "../../TablePlan/RoomState";


export default {
  props: {
    modelValue: Boolean,
    table: String,
    activeOrders: Array
  },
  components: {RestaurantRoom, KeepAlive},
  setup(props, {emit}) {
    const {t} = useI18n()
    const chooseTableInput = ref('')
    const tabs = ref([])
    const tab = ref(null)
    const internalValue = internalValueFactory(props, {emit})
    const disabledTables = computed(() => {
      return (selectingObject.value && isTable(selectingObject.value)) ? [selectingObject.value] : []
    })
    const submit = function () {
      emit('submit', chooseTableInput.value)
    }

    //fill table:
    watchEffect(async () => {
      if (internalValue.value) {
        if (rooms.value.length === 0) await fetchRooms();
        //const rooms = await cms.getModel('Room').find();
        tabs.value = [
          ...rooms.value
              .sort((cur, next) => cur.order - next.order)
              .map(i => ({title: i.name, room: i.roomObjects, _id: i._id})),
          {title: 'Manual'}
        ]
        console.log(tabs.value);
        tab.value = tabs[0];
      }
    })
    const inProgressTable = computed(() => {
      return activeOrders.value.map(o => o.table);
    })

    function chooseTable(obj) {
      emit('submit', obj.name);
      internalValue.value = false;
    }

    //todo: refactor room
    return () =>
        <g-dialog v-model={internalValue.value} fullscreen content-class="choose-table-dialog">
          {genScopeId(() => <>
          <g-card style="display: flex; flex-direction: column">
            <div style="flex: 1 0 0">
              <g-tabs v-model={tab.value} items={tabs.value} vertical style="height: 100%"
                      text-color="#1d1d26" color="white" active-text-color="#1d1d26"
                      slider-color="#1471ff" slider-size="3">
                {tabs.value.map(item => {
                  console.log(item);
                  return <g-tab-item item={item} class="pl-0 h-100" key={item.title}>
                    {item.title === 'Manual' ?
                        <>
                          <pos-textfield-new v-model={chooseTableInput.value} label="Table" class="mb-5"/>
                          <g-spacer/>
                          <div class="keyboard">
                            <pos-keyboard-full onEnterPressed={submit}/>
                          </div>
                        </> :
                        tab.value === item &&
                        <restaurant-room
                            roomId={item._id}
                            disabledTables={disabledTables.value}
                            choose-table={chooseTable}
                            >
                          {{
                            'room-object': (obj) => (isTable(obj) || !isWall(obj)) && <div>
                              <div>{obj.name}</div>
                            </div>
                          }}
                        </restaurant-room>
                    }
                  </g-tab-item>;
                })}
              </g-tabs>
            </div>
            <g-btn-bs style="position: absolute; left: 0; bottom: 0"
                      class="ml-3 mb-2"
                      icon="icon-back"
                      onClick={() => internalValue.value = false}>
              {t('ui.back')}
            </g-btn-bs>
          </g-card>
          </>)()}
        </g-dialog>
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
