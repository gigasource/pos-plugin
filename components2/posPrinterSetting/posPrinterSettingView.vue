<script>

import PosPrinterSettingSidebar from './PosPrinterSettingSidebar';
import {
  currentViewTarget,
  loadPrinterGroups,
  printerHooks
} from './pos-print-shared';
import {
  loadPrinterGeneralSetting
} from './printer-general-setting-shared';
import PosPrinterSetting from './PosPrinterSetting';
import { h, KeepAlive } from 'vue';
import { genScopeId } from '../utils';
import { taxCategoryHooks } from '../Settings/TaxSetting/view-tax-logics';
import PosPrinterSettingForMultiple from './PosPrinterSettingForMultiple';
import { login } from '../Login/LoginLogic';
import PosPrinterSettingGeneral from './PosPrinterSettingGeneral';
import { printerGeneralSetting, printerGroupsList} from './pos-printer-be';

export default {
  components: { PosPrinterSetting, PosPrinterSettingSidebar, PosPrinterSettingGeneral },
  setup() {
    login('0000')
    const PrinterSettingView = <PosPrinterSettingForMultiple class="pos-printer-setting-view__content"/>
    const PrinterGeneralSettingView = <PosPrinterSettingGeneral class="pos-printer-setting-view__content"/>
    loadPrinterGroups()
    loadPrinterGeneralSetting()

    const views = {
      PrinterSettingView,
      PrinterGeneralSettingView
    }
    //todo:
    taxCategoryHooks.emit('updateListTaxCategories')
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
