import { fetchPrinterGeneralSetting } from './pos-printer-be';
import { printerGeneralSetting } from './pos-printer-be';
import { watch } from 'vue';
import { attrComputed } from '../utils';
import _ from 'lodash';
import { updateSetting } from '../Settings/settings-shared-logics';

export async function loadPrinterGeneralSetting() {
  printerGeneralSetting.value = await fetchPrinterGeneralSetting() || {}
}
const debounceUpdateSetting = _.debounce(updateSetting, 100)

watch(() => printerGeneralSetting.value, () => {
  if (!printerGeneralSetting.value) return
  debounceUpdateSetting({
    printerGeneralSetting: printerGeneralSetting.value
  })
}, { deep: true })

export const listNoEntireReceipt = [0, 1, 2, 3, 4]
export const useMultiPrinterForKitchenPrinter = attrComputed(printerGeneralSetting, 'useMultiPrinterForKitchenPrinter', false)
export const useMultiPrinterForInvoicePrinter = attrComputed(printerGeneralSetting, 'useMultiPrinterForInvoicePrinter', false)
export const useMultiPrinterForEntirePrinter = attrComputed(printerGeneralSetting, 'useMultiPrinterForEntirePrinter', false)
export const mergeAfterPrint = attrComputed(printerGeneralSetting, 'mergeAfterPrint', false)
export const showDineInTax = attrComputed(printerGeneralSetting, 'showDineInTax', false)
export const entireReceipt = attrComputed(printerGeneralSetting, 'entireReceipt', 0)
export function _updateNoEntireReceipt(number) {
  entireReceipt.value = number
}
