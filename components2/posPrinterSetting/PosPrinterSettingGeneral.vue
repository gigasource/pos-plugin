<script>
import { attrComputed, genScopeId } from '../utils';
import { printerGeneralSetting } from './pos-print-logics';
import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const { t } = useI18n()
    const listNoEntireReceipt = [0, 1, 2, 3, 4]
    const useMultiPrinterForKitchenPrinter = attrComputed(printerGeneralSetting, 'useMultiPrinterForKitchenPrinter', false)
    const useMultiPrinterForInvoicePrinter = attrComputed(printerGeneralSetting, 'useMultiPrinterForInvoicePrinter', false)
    const useMultiPrinterForEntirePrinter = attrComputed(printerGeneralSetting, 'useMultiPrinterForEntirePrinter', false)
    const mergeAfterPrint = attrComputed(printerGeneralSetting, 'mergeAfterPrint', false)
    const showDineInTax = attrComputed(printerGeneralSetting, 'showDineInTax', false)
    const entireReceipt = attrComputed(printerGeneralSetting, 'entireReceipt', 0)

    function _updateNoEntireReceipt(number) {
      entireReceipt.value = number
    }

    return genScopeId(() =>
        <div class="setting">
          <div class="checkbox-group">
            <g-checkbox color="#1271FF" label={t('settings.multipleKitchenPrinter')} v-model={useMultiPrinterForKitchenPrinter.value}/>
            <g-checkbox color="#1271FF" label={t('settings.multipleInvoicePrinter')} v-model={useMultiPrinterForInvoicePrinter.value}/>
            <g-checkbox color="#1271FF" label={t('settings.multipleEntirePrinter')} v-model={useMultiPrinterForEntirePrinter.value}/>
            <g-checkbox color="#1271FF" label={t('settings.showDineInTax')} v-model={showDineInTax.value}/>
            <g-checkbox color="#1271FF" label="Merge items after printing to kitchen" v-model={mergeAfterPrint.value}/>
          </div>
          <div class="setting-title">
            {t('settings.entireReceiptNo')}
          </div>
          {<>
            <div class="row-flex flex-wrap">
              {listNoEntireReceipt.map((number, i) =>
                  <div key={i} class={['setting-option', number === entireReceipt.value && 'setting-option--selected']} onClick={() => _updateNoEntireReceipt(number)}>
                    {number}
                  </div>
              )}
            </div>
          </>
          }
        </div>)
  }
}
</script>


<style scoped lang="scss">
.setting {
  padding: 24px 32px;

  &-title {
    color: #1d1d26;
    font-weight: 700;
    margin: 24px 0 12px 4px;
  }

  ::v-deep .g-col {
    padding: 0;
  }

  &-option {
    padding: 2px 8px;
    text-align: center;
    font-size: 13px;
    font-style: italic;
    border-radius: 2px;
    border: 1px solid #E0E0E0;
    min-width: 50px;
    margin-right: 4px;

    &--selected {
      border-color: #90CAF9;
      background-color: #E3F2FD;
    }
  }
}
</style>
