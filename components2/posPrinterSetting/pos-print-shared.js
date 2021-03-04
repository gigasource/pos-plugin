import Hooks from 'schemahandler/hooks/hooks'
import { ObjectID } from 'bson';
import { computed, ref, watch } from 'vue'
import { isSameId } from '../utils';
import _ from 'lodash'
import { updateSetting } from '../Settings/settings-shared-logics';
import {
  createPrinter,
  createPrinterGroup,
  fetchPrinterGroups,
  printerGeneralSetting,
  printerGroupsList,
  removePrinter,
  removePrinterGroup,
  updatePrinter, updatePrinterGroup
} from './pos-printer-be';

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
printerHooks.on('changeViewTarget', (newViewTarget) => {
  currentViewTarget.value = newViewTarget
})

export const currentViewTarget = ref('PrinterSettingView')

export const selectingPrinterGroup = ref(null)

export const selectingPrinterGroupIndex = computed(() => {
  if (!selectingPrinterGroup.value) return -1
  return _.findIndex(printerGroupsList.value, i => isSameId(i, selectingPrinterGroup.value))
})

//return kitchen / invoice / entire
export const selectingPrinterGroupType = computed(() => {
  return selectingPrinterGroup.value ? selectingPrinterGroup.value.type : ''
})

export async function loadPrinterGroups() {
  printerGroupsList.value = await fetchPrinterGroups()
  const invoicePrinterGroup = _.find(printerGroupsList.value, i => i.type === 'invoice')
  if (!invoicePrinterGroup) {
    await onCreateNewPrinterGroup('invoice')
  }
}


const newPrinterGroupName = computed(() => {
  if (!printerGroupsList.value) return ''
  if (!_.some(printerGroupsList.value, i => i.name === `New Printer`)) return `New Printer`
  let res = 1
  while (_.some(printerGroupsList.value, i => i.name === `New Printer (${res})`)) res++
  return `New Printer (${res})`
})

export async function onCreateNewPrinterGroup(type = 'kitchen', _newPrinterGroup = {}) {
  const newPrinterGroup = {
    name: newPrinterGroupName.value
  }
  newPrinterGroup._id = new ObjectID()
  newPrinterGroup.type = type
  Object.assign(newPrinterGroup, _newPrinterGroup)
  const createdPrinterGroup = await createPrinterGroup(newPrinterGroup);
  console.log(createdPrinterGroup)
  await onCreateNewPrinter({}, createdPrinterGroup._id)
}

export async function onRemovePrinterGroup(printerGroup) {
  await removePrinterGroup(printerGroup)
}

export async function onUpdatePrinterGroup(oldPrinterGroupInfo, newPrinterGroupInfo) {
  await updatePrinterGroup(oldPrinterGroupInfo, newPrinterGroupInfo)
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

export const printerTypes = [
  { name: 'networkPrinter', value: 'ip' },
  { name: 'usb', value: 'usb' },
  { name: 'Integrate', value: 'integrate' }
]

export const selectingPrinter = ref(null)

export function onSelectPrinter(printer) {
  selectingPrinter.value = printer
}

watch(() => selectingPrinterGroup, async (oldV, newV) => {
  await onUpdateSelectingPrinterGroup()
}, { deep: true })

watch(() => selectingPrinter, async (oldV, newV) => {
  await onUpdateSelectingPrinter()
}, { deep: true })

export async function onCreateNewPrinter(_newPrinter, groupId = null) {
  return createPrinter(Object.assign({}, _newPrinter), groupId)
}

export async function onCreateNewPrinterForSelectingPrinterGroup(_newPrinter, groupId=null) {
  return onCreateNewPrinter(_newPrinter, selectingPrinterGroup.value._id)
}
export async function onRemovePrinter(printer, groupId) {
  return removePrinter(printer, groupId)
}

export async function onUpdatePrinter(printer, groupId) {
  return updatePrinter(printer, printer, groupId)
}

export async function onUpdateSelectingPrinter() {
  return onUpdatePrinter(selectingPrinter.value, selectingPrinterGroup.value._id)
}

export async function onRemoveSelectingPrinter() {
  return onRemovePrinter(selectingPrinter.value, selectingPrinterGroup.value._id)
}

export const isMultiple = computed(() => {
  if (!selectingPrinterGroupType.value) return false
  if (selectingPrinterGroupType.value === 'kitchen') return printerGeneralSetting.value.useMultiPrinterForKitchenPrinter
  if (selectingPrinterGroupType.value === 'invoice') return printerGeneralSetting.value.useMultiPrinterForInvoicePrinter
  if (selectingPrinterGroupType.value === 'entire') return printerGeneralSetting.value.useMultiPrinterForEntirePrinter
  return false
})
