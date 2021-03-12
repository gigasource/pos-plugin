<script>
import { GBtn, GSwitch, GTextFieldBs } from '../../../../backoffice/pos-vue-framework';
import PosDashboardSidebar from '../Dashboard/DashboardSidebar/PosDashboardSidebar';
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'
import {
  dialog,
  isSelectingARoom,
  isSelectingARoomObject,
  isSelectingRoomOnly,
  onAddNewRoom,
  onAddNewTable,
  onAddNewWall,
  onDuplicateRoomObj,
  onMoveRoomDown,
  onMoveRoomUp,
  onRemoveRoom,
  onRemoveRoomObj,
  onUpdateSelectingRoomName,
  selectingObject,
  showAddNewRoomBtn,
  sidebarData,
  tableColors,
  toggle,
  updateSelectingObjectInSelectingRoom,
  updateTableName,
  wallColors
} from './EditableRoom/EditTablePlanLogics';
import { roomsStates, selectingRoomStates } from '../TablePlan/RoomState';
import { isTable } from '../TablePlan/RoomShared';
import { genScopeId, isSameId } from '../utils';
import { useRouter } from 'vue-router'

export default {
  name: 'EditTablePlanSidebar',
  components: [PosDashboardSidebar, GBtn, GTextFieldBs, GSwitch],
  setup() {
    const { t } = useI18n()
    const router = useRouter()

    function onBack() {
      router.go(-1)
    }

    const addRoomBtnRenderFn = () =>
        showAddNewRoomBtn.value &&
        <div class="edit-table-plan__add-new-room-btn-wrapper">
          <g-btn onClick={onAddNewRoom}
                 outlined
                 flat dashed
                 border-radius="4"
                 text-color="#2979FF"
                 class="edit-table-plan__add-new-room-btn"
          >
            + {t('restaurant.addRoom')}
          </g-btn>
        </div>
    const roomToolbarRenderFn = () => isSelectingRoomOnly.value && <div class="card-info">
      <g-text-field-bs modelValue={selectingRoomStates.value.room.name} label={t('restaurant.roomName')} onUpdate:modelValue={onUpdateSelectingRoomName} v-slots=
          {{
            'append-inner': () =>
                <g-icon style="cursor: pointer"
                        onClick={() => dialog.showRoomNameKbd = true}>icon-keyboard
                </g-icon>
          }}
      />
      <div style="display: flex; margin-left: 5px; margin-right: 5px; justify-content: space-between;">
        <g-btn onClick={onMoveRoomUp} style="width: 20px; min-width: 20px !important">
          <g-icon small>icon-arrow-up</g-icon>
        </g-btn>
        <g-btn onClick={onMoveRoomDown} style="width: 20px; min-width: 20px !important">
          <g-icon small>icon-arrow-down</g-icon>
        </g-btn>
        <g-btn onClick={onRemoveRoom} background-color="#FF4452" text-color="#FFF">
          <g-icon>delete</g-icon>
          {t('ui.delete')}
        </g-btn>
      </div>
    </div>
    const objectToolbarRenderFn = () => isSelectingARoomObject.value &&
        <div class='card-info'>
          {isTable(selectingObject.value) ? <>
                <g-text-field-bs
                    label="Table name: "
                    modelValue={selectingObject.value.name}
                    onUpdate:modelValue={updateTableName}
                    onClick={() => dialog.showTableNameKbd = true}
                    v-slots={{
                      'append-inner': () => <g-icon svg color="#F00">icon-keyboard-red</g-icon>
                    }}/>
                <div style="margin: 5px">
                  <div> {t('ui.color')}:</div>
                  <color-selector key="table"
                                  modelValue={selectingObject.value.bgColor}
                                  colors={tableColors}
                                  onUpdate:modelValue={(v) => updateSelectingObjectInSelectingRoom({ bgColor: v || '#FFFFFF' })}
                                  item-size={18}
                                  badge-size={12}
                  />
                  <div style="display: flex; align-items: center">
                    <span style="margin-right: 10px">{t('restaurant.takeAway')}:</span>
                    <g-switch modelValue={selectingObject.value.takeAway}
                              onUpdate:modelValue={v => updateSelectingObjectInSelectingRoom({ takeAway: v })}/>
                  </div>
                </div>
              </> :
              <div style="margin: 5px">
                <div> {t('ui.color')}:</div>
                <color-selector key="wall"
                                modelValue={selectingObject.value.bgColor}
                                colors={wallColors}
                                onUpdate:modelValue={(v) => updateSelectingObjectInSelectingRoom({ bgColor: v || 'black' })}
                                item-size={18}
                                badge-size={12}/>
              </div>
          }
          <div style="display: flex; margin: 5px; justify-content: space-between">
            <g-btn onClick={onDuplicateRoomObj} width="48%" style="font-size: 13px" outlined flat text-color="#2979FF">
              <g-icon size="13">fas fa-clone</g-icon>
              {t('ui.duplicate')}
            </g-btn>
            <g-btn onClick={onRemoveRoomObj} width="48%" background-color="#FF4452" text-color="#FFF" style="margin-left: 5px; font-size: 13px">
              <g-icon size="13">delete</g-icon>
              {t('ui.delete')}
            </g-btn>
          </div>
        </div>

    const footerSlot = () => <>
      {isSelectingARoom.value &&
      <div style="display: flex; margin: 5px; justify-content: space-between; flex-shrink: 0">
        <g-btn outlined flat onClick={onAddNewWall} width="48%" text-color="#2979FF">+ {t('restaurant.wall')}</g-btn>
        <g-btn flat onClick={onAddNewTable} width="48%" background-color="#2979FF" text-color="#FFF">+ {t('restaurant.table')}</g-btn>
      </div>}

      <div style="display: flex; margin: 5px; justify-content: space-between">
        <g-btn uppercase={false} background-color="white" text-color="#1d1d26" onClick={onBack} style="flex: 1">
          <g-icon class="mr-2" svg>
            icon-back
          </g-icon>
          {t('ui.back')}
        </g-btn>
      </div>
    </>

    const slots = {
      'above-spacer': genScopeId(() => <>
        {addRoomBtnRenderFn()}
        {roomToolbarRenderFn()}
        {objectToolbarRenderFn()}
      </>),
      'footer': genScopeId(() => footerSlot())
    }

    const sidebarSelectingPath = ref('items.0.items.0') // select first foom

    watch(() => [selectingRoomStates.value, roomsStates.value], () => {
      if (selectingRoomStates.value) {
        const idx = roomsStates.value.findIndex(i => isSameId(selectingRoomStates.value.room, i.room))
        if (idx !== -1) {
          sidebarSelectingPath.value = `items.0.items.${idx}`
        }
      }
    }, { deep: true })

    return () =>
        <PosDashboardSidebar v-model={sidebarSelectingPath.value} onToggle={toggle} items={sidebarData.value} v-slots={slots}/>
  }
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

