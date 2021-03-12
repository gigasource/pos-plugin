import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { onRemoveSelectingPrinterGroup, onSelectPrinterGroup, printerGroups, printerHooks } from './pos-print-shared';
import { entireReceipt } from './printer-general-setting-shared';

export const SidebarFactory = () => {
  const { messages, locale, fallbackLocale } = useI18n()
  const sidebar = computed(() => {
    return (messages.value[locale.value] && messages.value[locale.value].sidebar) || messages.value[fallbackLocale.value].sidebar
  })
  const selectingItem = ref(null)
  const sidebarData = computed(() => {
    const kitchenGroup = ref({
      title: sidebar.value.receiptCategory,
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
    })
    const invoiceGroup = ref({
      title: sidebar.value.invoiceReport,
      icon: 'icon-invoice_report',
      target: 'PrinterSettingView',
      data: (printerGroups.value.invoice || [null])[0]
    })
    const entireGroup = ref({
      title: sidebar.value.entireReceipt,
      icon: 'icon-receipt',
      displayChild: true,
      type: 'entire',
      key: 'entireReceipt',
      items: (printerGroups.value.entire || []).slice(0, entireReceipt.value).map(i => ({
        title: i.name,
        icon: 'radio_button_unchecked',
        target: 'PrinterSettingView',
        data: i,
        groupKey: 'entire'
      }))
    })
    const printerGeneralSettingGroup = ref({
      title: sidebar.value.generalSettings,
      icon: 'icon-general_setting',
      target: 'PrinterGeneralSettingView'
    })
    return [
      kitchenGroup,
      invoiceGroup,
      entireGroup,
      printerGeneralSettingGroup
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
