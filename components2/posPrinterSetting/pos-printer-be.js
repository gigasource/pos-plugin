import { ref } from 'vue';
import { CRUdDbFactory } from '../../utils/CRUD/crud-db';
import cms from 'cms';
export const GROUP_PRINTER_COLLECTION_NAME = 'GroupPrinter'

export const printerGroupsList = ref([])

export async function fetchPrinterGroups() {
  return await cms.getModel(GROUP_PRINTER_COLLECTION_NAME).find({})
}

export async function createPrinterGroup(printerGroup) {
  const { create } = CRUdDbFactory(printerGroupsList.value, '', GROUP_PRINTER_COLLECTION_NAME)
  return create(printerGroup)
}

export async function removePrinterGroup(printerGroup) {
  const { remove } = CRUdDbFactory(printerGroupsList.value, '', GROUP_PRINTER_COLLECTION_NAME)
  await remove(printerGroup)
}

export async function updatePrinterGroup(oldV, newV) {
  const { update } = CRUdDbFactory(printerGroupsList.value, '', GROUP_PRINTER_COLLECTION_NAME)
  return update(oldV, newV)
}

export async function createPrinter(printer, groupId='') {
  const { create } = CRUdDbFactory(printerGroupsList.value, `printers`, GROUP_PRINTER_COLLECTION_NAME, groupId)
  return create(printer)
}
export async function removePrinter(printer, groupId='') {
  const { remove } = CRUdDbFactory(printerGroupsList.value, `printers`, GROUP_PRINTER_COLLECTION_NAME, groupId)
  await remove(printer)
}
export async function updatePrinter(oldPrinter, newPrinter, groupId='') {
  const { update } = CRUdDbFactory(printerGroupsList.value, `printers`, GROUP_PRINTER_COLLECTION_NAME, groupId)
  await update(oldPrinter, newPrinter)
}

export const printerGeneralSetting = ref({})
export async function fetchPrinterGeneralSetting() {
  const posSetting = await cms.getModel('PosSetting').findOne({})
  return posSetting.printerGeneralSetting
}

