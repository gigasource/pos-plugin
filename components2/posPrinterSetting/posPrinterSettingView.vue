<script>

import PosPrinterSettingSidebar from './PosPrinterSettingSidebar';
import {
  currentViewTarget,
  onSelectPrinterGroup,
  printerGroupsList,
  printerHooks,
  selectingPrinterGroup
} from './pos-print-logics';
import PosPrinterSetting from './PosPrinterSetting';
import { h, KeepAlive, watch } from 'vue';
import { genScopeId } from '../utils';
import { taxCategoryHooks } from '../Settings/TaxSetting/view-tax-logics';
import PosPrinterSettingForMultiple from './PosPrinterSettingForMultiple';
import { appHooks } from '../AppSharedStates';
import { login } from '../Login/LoginLogic';
import PosPrinterSettingGeneral from './PosPrinterSettingGeneral';

export default {
  components: { PosPrinterSetting, PosPrinterSettingSidebar, PosPrinterSettingGeneral },
  setup() {
    //todo: remove auto login
    login('0000')
    appHooks.emit('settingChange')
    printerHooks.emit('printerGroupsListChange')
    const PrinterSettingView =
        <PosPrinterSettingForMultiple class="pos-printer-setting-view__content"></PosPrinterSettingForMultiple>
    const PrinterGeneralSettingView =
        <PosPrinterSettingGeneral class="pos-printer-setting-view__content"></PosPrinterSettingGeneral>

    const views = {
      PrinterSettingView,
      PrinterGeneralSettingView
    }

    taxCategoryHooks.emit('updateListTaxCategories')

    // watch(() => printerGroupsList.value, () => {
    //   if (printerGroupsList.value && !selectingPrinterGroup.value) {
    //     onSelectPrinterGroup(printerGroupsList.value[0])
    //   }
    // }, { deep: true })

    return genScopeId(() => <div className="pos-printer-setting-view">
      <PosPrinterSettingSidebar class="pos-printer-setting-view__sidebar"/>
      {
        <KeepAlive>
          {h(views[currentViewTarget.value])}
        </KeepAlive>
      }
    </div>)
  }
}
</script>

<style scoped lang="scss">
.pos-printer-setting-view {
  display: grid;
  grid-template-columns: 256px 1fr;
  grid-template-rows: 100%;
  height: 100%;

  &__sidebar {
    grid-area: 1 / 1 / 2 / 2;
  }

  &__content {
    grid-area: 1 / 2 / 2 / 3;
    height: 100%;
    max-height: 100%;
    overflow: scroll;
  }

}
</style>
