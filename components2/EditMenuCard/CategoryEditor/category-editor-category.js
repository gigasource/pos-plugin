import { computed } from 'vue';
import { showNotify } from '../../AppSharedStates';
import _ from 'lodash'
import orderLayoutApi from '../orderLayoutApi';
import {
  selectedCategoryLayout,
  updateOrderLayout
} from '../../OrderView/pos-ui-shared'

// provide methods to modify specified category layout
export const productRows = computed(() => selectedCategoryLayout.value && selectedCategoryLayout.value.rows)
export const productCols = computed(() => selectedCategoryLayout.value && selectedCategoryLayout.value.columns)
export const categoryName = computed(() => selectedCategoryLayout.value && selectedCategoryLayout.value.name)
export const categoryColor = computed(() => selectedCategoryLayout.value && selectedCategoryLayout.value.color)

export const debouncedUpdateCategory = _.debounce(change => {
  _updateCategory(change, !selectedCategoryLayout.value._id).then()
}, 300)

async function _updateCategory(change, forceCreate) {
  // assign change
  _.assign(selectedCategoryLayout.value, change)

  // if selected product layout is not empty then update it
  // in case of update, because we already update the selectCategoryLayout so we don't need
  // emit any events.
  if (selectedCategoryLayout.value._id) {
    await orderLayoutApi.updateCategoryLayout(selectedCategoryLayout.value._id, change)
    showNotify();
  } else if (forceCreate)  {
    // otherwise, create new if forceCreate
    // in case of create new, we need to emit an event to update category layout _id
    const orderLayout = await orderLayoutApi.createCategoryLayout(orderLayout.value._id, selectedCategoryLayout.value)
    showNotify();
    updateOrderLayout(orderLayout)
  }
}
