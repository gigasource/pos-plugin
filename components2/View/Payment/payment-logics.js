import { ref, computed } from 'vue'
import _ from 'lodash';
import { getCurrentOrder } from '../../OrderView/pos-logic-be';
import {
  addMultiPayment,
  addPayment,
  addSinglePayment,
  clearPayment, getPaymentTotal,
  updateOrderWithHooks,
  updatePayment,
  updateSinglePayment
} from '../../OrderView/pos-logic';

// todo: singleton stuffs should be out of factory
const PaymentLogicsFactory = () => {
  const showMultiPaymentDialog = ref(false)
  const showAddTipDialog = ref(false)
  const tipEditValue = ref(0)
  const cashEditValue = ref(0)
  const cardEditValue = ref(0)
  const currentOrder = getCurrentOrder()
  const defaultPaymentList = ref([
    { type: 'cash', icon: 'icon-cash' },
    { type: 'card', icon: 'icon-credit_card' },
    { type: 'multi', icon: 'icon-multi_payment'}
  ])

  const paidValue = computed(() => {
    return getPaymentTotal(currentOrder)
  })

  const currentOrderTip = computed(() => {
    return currentOrder && currentOrder.tip || 0
  })

  const currentOrderPaymentList = computed(() => {
    return currentOrder && currentOrder.payment || []
  })

  const selectedPayment = computed(() => {
    if (currentOrder.multiPayment) return 'multi'
    if (currentOrderPaymentList.value.length > 0) return currentOrderPaymentList.value[0].type //
    return ''
  })

  const currentOrderChange = computed(() => {
    let diff = currentOrder.cashback
    if (diff < 0) diff = 0;
    return diff;
  })

  const onOpenMultiPaymentDialog = function() {
    showMultiPaymentDialog.value = true
  }

  const onOpenTipDialog = function() {
    showAddTipDialog.value = true
  }

  const onSaveTip = function() {
    if (tipEditValue.value < currentOrder.vSum) {
      return
    }
    clearPayment(currentOrder)
    addSinglePayment(currentOrder, {
      type: 'card',
      value: tipEditValue.value
    })
    showAddTipDialog.value = false
    tipEditValue.value = 0
  }

  const onSaveMulti = function({ card, cash }) {
    cardEditValue.value = card
    cashEditValue.value = cash
    addMultiPayment(currentOrder, {
      type: 'cash', value: +cashEditValue.value
    })
    addMultiPayment(currentOrder, {
      type: 'card', value: +cardEditValue.value
    })
    showMultiPaymentDialog.value = false
  }

  const getBadgeCount = function(item) {
    if (item.type === 'tip') return 0
    if (!currentOrderPaymentList.value) return 0
    return currentOrderPaymentList.value.filter(i => i.type === item.type).length
  }

  const onAddPaymentMethod = function(item) {
    clearPayment(currentOrder)
    if (item.type === 'multi') {
      onOpenMultiPaymentDialog()
      return
    }
    const newItem = {
      type: item.type,
      value: (+item.value)
    }
    addSinglePayment(currentOrder, newItem)
  }

  const onAddFixedItem = function(item) {
    if (item.type === 'tip') {
      return onOpenTipDialog()
    }
    addPayment(currentOrder, item)
  }

  const getRemainingValue = function() {
    if (cashEditValue.value && cardEditValue.value) return 0
    if (+cashEditValue.value > currentOrder.vSum || +cardEditValue.value > currentOrder.vSum) return 0
    if (cashEditValue.value && !isNaN(+cashEditValue.value)) return cardEditValue.value = currentOrder.vSum - (+cashEditValue.value)
    if (cardEditValue.value && !isNaN(+cardEditValue.value)) cashEditValue.value = currentOrder.vSum - (+cardEditValue.value)
  }

  const moreDiscount = computed(() => {
    return currentOrder.items.some(i => i.price !== i.originalPrice && !currentOrder.hasOrderWideDiscount)
  })
  return {
    currentOrder,
    showMultiPaymentDialog,
    tipEditValue,
    cashEditValue,
    cardEditValue,
    defaultPaymentList,
    paidValue,
    currentOrderTip,
    currentOrderPaymentList,
    selectedPayment,
    currentOrderChange,
    onOpenMultiPaymentDialog,
    onOpenTipDialog,
    onSaveMulti,
    onSaveTip,
    getBadgeCount,
    onAddFixedItem,
    onAddPaymentMethod,
    getRemainingValue,
    showAddTipDialog,
    moreDiscount
  }
}

export default PaymentLogicsFactory
