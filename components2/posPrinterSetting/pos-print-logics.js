import { useI18n } from 'vue-i18n';
import { posSettings } from '../AppSharedStates';
import Hooks from 'schemahandler/hooks/hooks'
import { CRUdDbFactory } from '../../utils/CRUD/crud-db';
import { ObjectID } from 'bson';
import { ref, computed, watch, toRaw } from 'vue'
import { isSameId } from '../utils';
import cms from 'cms'
import _ from 'lodash'

export const GROUP_PRINTER_COLLECTION_NAME = 'GroupPrinter'



export const printerGroupsList = ref([])

export const printerGroups = computed(() => {
  const res = {}
  printerGroupsList.value.forEach(printerGroup => {
    const { type } = printerGroup
    if (!res[type]) res[type] = []
    res[type].push(printerGroup)
  })
  return res
})

export const printerList = computed(() => {
  const concat = (acc, obj) => acc.concat(obj)
  return printerGroupsList.value.map(printerGroup => printerGroup.printers).reduce(concat, [])
})

export const printerHooks = new Hooks()

export const currentViewTarget = ref('PrinterSettingView')
printerHooks.on('changeViewTarget', (newViewTarget) => {
  currentViewTarget.value = newViewTarget
})

//todo: use new mongo document

export const selectingPrinterGroup = ref(null)

export const selectingPrinterGroupIndex = computed(() => {
  if (!selectingPrinterGroup.value) return -1
  return _.findIndex(printerGroupsList.value, i => isSameId(i, selectingPrinterGroup.value))
})

//return kitchen / invoice / entire
export const selectingPrinterGroupType = computed(() => {
  return selectingPrinterGroup.value ? selectingPrinterGroup.value.type : ''
})

export async function fetchPrinterGroups() {
  return await cms.getModel(GROUP_PRINTER_COLLECTION_NAME).find({})
}

printerHooks.on('printerGroupsListChange', async() => {
  printerGroupsList.value = await fetchPrinterGroups()
})

const newPrinterGroupName = computed(() => {
  if (!printerGroupsList.value) return ''
  if (!_.some(printerGroupsList.value, i => i.name === `New Printer`)) return `New Printer`
  let res = 1
  while (_.some(printerGroupsList.value, i => i.name === `New Printer (${res})`)) res ++
  return `New Printer (${res})`
})

export async function onCreateNewPrinterGroup (type = 'kitchen', _newPrinterGroup = {}) {
  const { create } = CRUdDbFactory(printerGroupsList.value, '', GROUP_PRINTER_COLLECTION_NAME)
  //todo: check name
  const newPrinterGroup = {
    name: newPrinterGroupName.value
  }
  newPrinterGroup._id = new ObjectID()
  newPrinterGroup.type = type
  Object.assign(newPrinterGroup, _newPrinterGroup)
  const createdPrinterGroup = await create(newPrinterGroup);
  await onCreateNewPrinter({}, createdPrinterGroup._id)
}

export async function onRemovePrinterGroup (printerGroup) {
  const { remove } = CRUdDbFactory(printerGroupsList.value, '', GROUP_PRINTER_COLLECTION_NAME)
  await remove(printerGroup)
}

export async function onUpdatePrinterGroup (oldPrinterGroupInfo, newPrinterGroupInfo) {
  const { update } = CRUdDbFactory(printerGroupsList.value, '', GROUP_PRINTER_COLLECTION_NAME)
  await update(oldPrinterGroupInfo, newPrinterGroupInfo)
}

export function onSelectPrinterGroup(printerGroup) {
  selectingPrinterGroup.value = printerGroup
  onSelectPrinter(printerGroup.printers[0])
}

export async function onRemoveSelectingPrinterGroup() {
  await onRemovePrinterGroup(selectingPrinterGroup.value, selectingPrinterGroup.type)
}

export async function onUpdateSelectingPrinterGroup() {
  await onUpdatePrinterGroup(selectingPrinterGroup.value, selectingPrinterGroup.value)
}


export const printerGeneralSetting = computed(() => {
  return posSettings.value.printerGeneralSetting || {}
})

export const  printerTypes = [
  {name: 'networkPrinter', value: 'ip'},
  {name: 'usb', value: 'usb'},
  {name: 'Integrate', value: 'integrate'}
]


export const selectingPrinter = ref(null)
export function onSelectPrinter(printer) {
  selectingPrinter.value = printer
}

watch(() => selectingPrinterGroup, async(oldV, newV) => {
  await onUpdateSelectingPrinterGroup()
}, { deep: true } )

watch(() => selectingPrinter, async(oldV, newV) => {
  await onUpdateSelectingPrinter()
}, { deep: true})

export async function onCreateNewPrinter(_newPrinter, groupId = null) {
  const { create } = CRUdDbFactory(printerGroupsList.value, `printers`, GROUP_PRINTER_COLLECTION_NAME, groupId || selectingPrinterGroup.value._id)
  return create(Object.assign({

  }, _newPrinter))
}

export async function onRemovePrinter(printer) {
  const { remove } = CRUdDbFactory(printerGroupsList.value, `printers`, GROUP_PRINTER_COLLECTION_NAME, selectingPrinterGroup.value._id)
  return remove(printer)
}

export async function onUpdatePrinter(printer) {
  const { update } = CRUdDbFactory(printerGroupsList.value, `printers`, GROUP_PRINTER_COLLECTION_NAME, selectingPrinterGroup.value._id)
  return update(printer, printer)
}

export async function onUpdateSelectingPrinter() {
  return onUpdatePrinter(selectingPrinter.value)
}

export async function onRemoveSelectingPrinter() {
  return onRemovePrinter(selectingPrinter.value)
}
export const isMultiple = computed(() => {
  if (!selectingPrinterGroupType.value) return false
  if (selectingPrinterGroupType.value === 'kitchen') return printerGeneralSetting.value.useMultiPrinterForKitchenPrinter
  if (selectingPrinterGroupType.value === 'invoice') return printerGeneralSetting.value.useMultiPrinterForInvoicePrinter
  if (selectingPrinterGroupType.value === 'entire') return printerGeneralSetting.value.useMultiPrinterForEntirePrinter
  return false
})

export const PrinterSettingFactory = () => {
  const { t } = useI18n()
  const nameInputRef = ref('')
  const ipInputRef = ref('')
  //todo: auto select first printer
  // const selectingPrinterIndex = computed(() => {
  //   if (!selectingPrinter.value) return -1
  //   return _.findIndex(selectingPrinterGroup.value.printers,  i => isSameId(i, selectingPrinter.value))
  // })
  const fontSizeList = [1, 2, 3]
  const marginSizeList = [0, 1, 2, 3, 4]
  const showDialog = ref(false)
  const showDeleteDialog = ref(false)

  //todo: listReceipt, updateSetting
  const listReceipt = ref([])

  function updateSettings() {

  }
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

  function testPrinter() {

  }

  const usbPrinters = ref([])
  async function loadUsbPrinters() {
    try {
      cms.socket.emit('load-usb-printers', deviceList => {
        usbPrinters.value = deviceList
      })
    } catch(e) {
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
    testPrinter,
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

export const SidebarFactory = () => {
  const { messages, locale, fallbackLocale } = useI18n()
  const { sidebar } = messages.value[locale.value] || messages.value[fallbackLocale.value]
  const selectingItem = ref(null)

  const sidebarData = computed(() => {
    return [
      ref({
        title: sidebar.receiptCategory,
        icon: 'icon-restaurant',
        key: 'receiptCategory',
        displayChild: true,
        items: [...(printerGroups.value.kitchen || []).map(i => ({
          title: i.name,
          icon: 'radio_button_unchecked',
          target: 'PrinterSettingView',
          data: i,
          groupKey: 'kitchen'
        })), {
          type: 'edit',
          groupKey: 'kitchen'
        }]
      }),
      ref({
        title: sidebar.invoiceReport,
        icon: 'icon-invoice_report',
        target: 'PrinterSettingView',
        data: (printerGroups.value.invoice || [null])[0]
      }),
      // ref({
      //   title: sidebar.entireReceipt,
      //   icon: 'icon-receipt',
      //   displayChild: false,
      //   type: 'entire',
      //   key: 'entireReceipt'
      // }),
      ref({
        title: sidebar.generalSettings,
        icon: 'icon-general_setting',
        target: 'PrinterGeneralSettingView'
      })
    ]
  })

  function onSelect(item) {
    if (item.items) {
      item.displayChild = !item.displayChild
    } else {
      selectingItem.value = item
      if (item.target) {
        printerHooks.emit('changeViewTarget', item.target)
      }
      if (item.data) {
        onSelectPrinterGroup(item.data)
      }
    }
  }

  function isSelecting(item) {
    return selectingItem.value === item
  }

  async function onDeleteMenu() {
    await onRemoveSelectingPrinterGroup()
    onSelect(sidebarData.value[0].value.items[0] || null)
  }
  return { sidebarData, onSelect, isSelecting, selectingItem, onDeleteMenu }
}
