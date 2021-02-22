<script>
import { useI18n } from 'vue-i18n';
import {
  isMultiple,
  onCreateNewPrinter,
  onRemoveSelectingPrinter,
  onSelectPrinter,
  PrinterSettingFactory,
  selectingPrinter,
  selectingPrinterGroup
} from './pos-print-logics';
import { genScopeId, isSameId } from '../utils';
import { computed, watch } from 'vue'
import { getScopeAttrs } from '../../utils/helpers';
import PosPrinterSetting from './PosPrinterSetting';
import _ from 'lodash'

export default {
  components: { PosPrinterSetting },
  setup() {
    const { t } = useI18n()
    const { tabs, hardwares, showDeleteDialog, tab } = PrinterSettingFactory()
    watch(() => tab.value, () => {
      const newPrinterId = tab.value._id
      const newPrinter = _.find(selectingPrinterGroup.value.printers, i => i._id.toString() === newPrinterId.toString())
      onSelectPrinter(newPrinter)
    }, { deep: true })

    const hardwaresComputed = computed(() => {
      return (selectingPrinter.value && selectingPrinter.value.hardwares) || []
    })

    watch(() => hardwaresComputed.value, () => {
      if (selectingPrinter.value) selectingPrinter.value.hardwares = hardwaresComputed.value
    }, { deep: true })

    watch(() => tabs.value, () => {
      if (tab.value) {
        tab.value = _.find(tabs.value, _tab => isSameId(_tab, tab.value)) || tabs.value[0]
      }
    }, { deep: true })
    return genScopeId(() =>
        <div class="setting">
          {isMultiple.value ? <>
                <g-tabs items={tabs.value} v-model={tab.value} addable onAdd={onCreateNewPrinter} deletable onDelete={() => showDeleteDialog.value = true}>
                  {tabs.value.map(tabItem =>
                      <g-tab-item key={tabItem._id} item={tabItem}>
                        <div style="margin-top: 12px; margin-left: 12px; font-weight: 700">
                          {t('settings.useFor')} </div>
                        <g-grid-select multiple items={hardwares.value} v-model={hardwaresComputed.value} item-cols="auto" v-slots={{
                          'default': genScopeId(({ toggleSelect, item }) =>
                              <div class="hardware" onClick={e => {
                                toggleSelect(item);
                              }}>
                                {item}
                              </div>)
                          ,
                          'selected': genScopeId(({ toggleSelect, item }) =>
                              <div class="hardware hardware--selected" onClick={e => {
                                toggleSelect(item);
                              }}>
                                {item}
                              </div>)
                        }}>
                        </g-grid-select>
                        <PosPrinterSetting {...getScopeAttrs()}></PosPrinterSetting>
                      </g-tab-item>
                  )}
                </g-tabs>
                <dialog-confirm-delete v-model={showDeleteDialog.value} type=" printer setting " onSubmit={onRemoveSelectingPrinter}></dialog-confirm-delete>
              </>
              :
              <PosPrinterSetting> </PosPrinterSetting>
          }
        </div>)
  }
}
</script>

<style scoped lang="scss">
.setting {
  padding: 8px 32px;

  ::v-deep .g-tab:before {
    display: none;
  }
}

.hardware {
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F0F0F0;
  border: 1px solid #979797;
  border-radius: 2px;
  color: #4D4D4E;
  font-size: 13px;
  line-height: 16px;
  cursor: pointer;

  &--selected {
    border-color: #1271ff;
    background: #E3F2FD;
  }
}

.configuration ::v-deep {
  padding-left: 0;

  .config {
    padding-top: 8px;
    padding-bottom: 4px;
  }
}

@media screen and (max-width: 1023px) {
  .setting {
    padding: 8px 16px;
  }
}
</style>
