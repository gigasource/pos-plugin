<script>
import { internalValueFactory } from '../../utils';

export default {
  setup(props, { emit }) {
    // const chooseTableInput = ref('')
    // const tabs = ref([])
    // const tab = ref(null)
    // const internalValue = internalValueFactory(props, { emit })
    return () =>
        <g-dialog v-model={internalValue} fullscreen content-class="choose-table-dialog">
          <g-card style="display: flex; flex-direction: column">
            <g-card-text style="flex: 1 0 0">
              <g-tabs v-model={tab} items={tabs} vertical style="height: 100%">
                {tabs.map(item =>
                    <g-tab-item item={item} class="pl-2 h-100" key={item.title}>
                      {item.title === 'Manual' ?
                          <>
                            <pos-textfield-new v-model={chooseTableInput} label="Table" class="mb-5"/>
                            <g-spacer/>
                            <div class="keyboard">
                              <pos-keyboard-full onEnterPressed={submit}/>
                            </div>
                          </> :
                          <room roomObjects={item.room} v-if="tab === item"
                                inProgressTable={inProgressTable}
                                disabledTables={disabledTables}
                                onSelectRoomObject={selectRoomObj}>
                            {{
                              'room-object': (obj) => <div v-if="isTable(roomObject) || !isWall(roomObject)">

                                <div>{obj.name}</div>
                              </div>
                            }}
                          </room>}
                    </g-tab-item>)}
              </g-tabs>
            </g-card-text>
            <g-btn-bs style="position: absolute; left: 0; bottom: 0"
                      class="ml-3 mb-2"
                      icon="icon-back"
                      onClick_stop={close}>
              {$t('ui.back')}
            </g-btn-bs>
          </g-card>
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
