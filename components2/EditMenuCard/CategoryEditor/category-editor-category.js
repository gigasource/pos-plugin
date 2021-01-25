import { computed, ref, watch } from 'vue';
import { showNotify } from '../../AppSharedStates';
import _ from 'lodash'
import orderLayoutApi from '../orderLayoutApi';
import {
  loadOrderLayout,
  orderLayout, selectCategoryLayout,
  selectedCategoryLayout,
  updateSelectedCategoryLayout
} from '../../OrderView/pos-ui-shared'

// provide methods to modify specified category layout
export const productRows = computed(() => selectedCategoryLayout.value && selectedCategoryLayout.value.rows)
export const productCols = computed(() => selectedCategoryLayout.value && selectedCategoryLayout.value.columns)
export const categoryName = computed(() => selectedCategoryLayout.value && selectedCategoryLayout.value.name)
export const categoryColor = computed(() => selectedCategoryLayout.value && selectedCategoryLayout.value.color)

export const debouncedUpdateCategory = _.debounce(change => {
  _updateCategory(change, !selectedCategoryLayout.value._id).then(() => {})
}, 300)

async function _updateCategory(change, forceCreate) {
  // assign change
  updateSelectedCategoryLayout({...selectedCategoryLayout.value, ...change})

  // if selected product layout is not empty then update it
  // in case of update, because we already update the selectCategoryLayout so we don't need
  // emit any events.
  if (selectedCategoryLayout.value._id) {
    await orderLayoutApi.updateCategoryLayout(selectedCategoryLayout.value._id, change)
    showNotify();
  } else if (forceCreate)  {
    // otherwise, create new if forceCreate
    // in case of create new, we need to emit an event to update category layout _id
    await orderLayoutApi.createCategoryLayout(orderLayout.value._id, _.omit(selectedCategoryLayout.value, 'products'))
    showNotify();
    await loadOrderLayout()
  }
}

// delete
export const canDelete = computed(() => {
  const cateExist = selectedCategoryLayout.value && selectedCategoryLayout.value._id
  const cateHasItem = cateExist && _.filter(selectedCategoryLayout.value.products, pLayout => pLayout.product && pLayout.product._id).length > 0
  return cateExist && !cateHasItem
})
export async function deleteCategory() {
  await orderLayoutApi.deleteCategory(orderLayout.value._id, selectedCategoryLayout.value._id)
  showNotify()
  selectCategoryLayout({top: 0, left: 0})
  await loadOrderLayout()
}

// actions
const supportedActions = ['switch']
let _action = null
let actionTarget = null // selectedCategoryLayout at the time set action is called
export function setAction(action) {
  if (!_.includes(supportedActions, action))
    throw `Action ${action} is not supported!`
  _action = action
  actionTarget = selectedCategoryLayout.value
}
function _clearAction() {
  _action = null
  actionTarget = null
}
async function _execAction() {
  if (_action === 'switch') {
    await switchCategory()
  } else {
    console.log('_execAction unsupported:', _action)
  }
}

// watch category layout change then trigger category layout action automatically
watch(() => selectedCategoryLayout.value, async () => {
  if (_action) {
    await _execAction()
  }
})

// actions implement
// switch
export const canSwitch = computed(() => selectedCategoryLayout.value && selectedCategoryLayout.value._id)
async function switchCategory() {
  await orderLayoutApi.switchCategory(actionTarget, selectedCategoryLayout.value)
  _clearAction()
  await loadOrderLayout()
}
