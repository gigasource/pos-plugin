import { computed, ref, watch } from 'vue';
import { showNotify } from '../../AppSharedStates';
import orderLayoutApi from '../api'
import _ from 'lodash'
import {
  selectedCategoryLayout,
  orderLayout,
  updateOrderLayout
} from '../../OrderView/pos-ui-shared'

export const hasOrderLayout = computed(() => orderLayout.value)

// provide methods to modify OrderLayout
export async function createLayout(columns, rows) {
  const result = orderLayoutApi.createLayout(columns, rows)
  updateOrderLayout(result)
}

export async function changeCategoryColumn(columns) {
  const result = await orderLayoutApi.changeCategoryColumn(orderLayout.value._id, columns)
  showNotify()
  updateOrderLayout(result)
}

export async function changeCategoryRow(rows) {
  const result = await orderLayoutApi.changeCategoryRow(orderLayout.value._id, rows)
  showNotify()
  updateOrderLayout(result)
}

// delete
export const canDelete = computed(() => {
  const cateExist = selectedCategoryLayout.value && selectedCategoryLayout.value._id
  const cateHasItem = cateExist && _.filter(selectedCategoryLayout.value.products, pLayout => pLayout.product && pLayout.product._id).length > 0
  return cateExist && !cateHasItem
})
export async function deleteCategory() {
  const result = await orderLayoutApi.deleteCategory(orderLayout.value._id, selectedCategoryLayout.value._id)
  showNotify()
  context.emit('update:selectedCategoryLayout', null)
  updateOrderLayout(result)
}

// actions
const supportedActions = ['switch']
const action = ref(null)
const actionTarget = ref(null) // selectedCategoryLayout at the time set action is called
export function setAction(action) {
  if (!_.includes(supportedActions, action))
    throw `Action ${action} is not supported!`
  action.value = action
  actionTarget.value = selectedCategoryLayout
}
function _clearAction() {
  action.value = null
  actionTarget.value = null
}
async function _execAction() {
  if (action.value === 'switch') {
    await switchCategory()
  }
  _clearAction()
}
// listen on category change, then execute action if action is set
watch(() => selectedCategoryLayout, async () => {
  if (action.value) {
    await _execAction()
  }
})

// actions implement
// switch
export const canSwitch = computed(() => selectedCategoryLayout.value && selectedCategoryLayout.value._id)
async function switchCategory() {
  const result = await orderLayoutApi.switchCategory(actionTarget.value, selectedCategoryLayout.value)
  updateOrderLayout(result)
}

//
export const categoryRows = computed(() => orderLayout.value && orderLayout.value.rows)
export const categoryColumns = computed(() => orderLayout.value && orderLayout.value.columns)
