import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import cms from 'cms';
import { posSettings } from '../AppSharedStates';
import { selectingPrinter, selectingPrinterGroup } from './pos-print-shared';

export const PrinterSettingFactory = () => {
  const { t } = useI18n()
  const nameInputRef = ref('')
  const ipInputRef = ref('')
  const fontSizeList = [1, 2, 3]
  const marginSizeList = [0, 1, 2, 3, 4]
  const showDialog = ref(false)
  const showDeleteDialog = ref(false)
  const listReceipt = ref([])

  function openDialog(dialogRef) {
    dialogRef.value.onFocus()
    showDialog.value = true
  }

  function onSelectPrinterType(type) {
    selectingPrinter.value.printerType = type
  }

  function onResetPrinterType() {
    selectingPrinter.value.printerType = ''
  }

  const usbPrinters = ref([])

  async function loadUsbPrinters() {
    try {
      cms.socket.emit('load-usb-printers', deviceList => {
        usbPrinters.value = deviceList
      })
    } catch (e) {
      console.log(e)
    }
  }

  const usbPrinterSelectModel = computed(() => {
    // refer: backend/usb-printer/usb-printer.js
    return (usbPrinters.value || []).map((printer, i) => ({
      text: `Printer ${i + 1} (${printer})`,
      value: printer
    }))
  })

  // multiple

  const hardwares = computed(() => {
    return (posSettings.value.hardwares || []).map(h => h.name)
  })

  const newTabTitle = t('settings.newSetting')

  const tabs = computed(() => {
    if (!selectingPrinterGroup.value || selectingPrinterGroup.value.printers.length === 0) {
      return [{ title: newTabTitle, id: 1, hardwares: [] }]
    } else {
      return selectingPrinterGroup.value.printers.map(p => {
        const hardwares = p.hardwares || []
        return {
          title: hardwares.length === 0 ? newTabTitle : hardwares.sort().join('-'),
          _id: p._id,
          hardwares
        };
      })
    }
  })
  const tab = ref(null)

  return {
    nameInputRef,
    ipInputRef,
    openDialog,
    showDialog,
    showDeleteDialog,
    onSelectPrinterType,
    onResetPrinterType,
    loadUsbPrinters,
    usbPrinterSelectModel,
    usbPrinters,
    fontSizeList,
    marginSizeList,
    listReceipt,
    tabs,
    hardwares,
    tab
  }
}
