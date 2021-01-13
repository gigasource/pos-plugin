import { computed, watch } from 'vue';
import { showNotify } from '../../AppSharedStates';
import orderLayoutApi from '../api'
import _ from 'lodash'

// provide methods to modify OrderLayout
export function useOrderLayoutLogic(props, context) {
  function emitUpdateOrderLayout(newLayout) {
    context.emit('update:orderLayout', orderLayout)
  }

  async function createLayout(columns, rows) {
    const result = orderLayoutApi.createLayout(columns, rows)
    emitUpdateOrderLayout(result)
  }

  async function changeCategoryColumn(columns) {
    const result = await orderLayoutApi.changeCategoryColumn(props.orderLayout._id, columns)
    showNotify()
    emitUpdateOrderLayout(result)
  }

  async function changeCategoryRow(rows) {
    const result = await orderLayoutApi.changeCategoryRow(props.orderLayout._id, rows)
    showNotify()
    emitUpdateOrderLayout(result)
  }

  // delete
  const canDelete = computed(() => {
    const cateExist = props.selectedCategoryLayout && props.selectedCategoryLayout._id
    const cateHasItem = cateExist && _.filter(props.selectedCategoryLayout.products, pLayout => pLayout.product && pLayout.product._id).length > 0
    return cateExist && !cateHasItem
  })
  async function deleteCategory() {
    const result = await orderLayoutApi.deleteCategory(props.orderLayout._id, props.selectedCategoryLayout._id)
    showNotify()
    context.emit('update:selectedCategoryLayout', null)
    emitUpdateOrderLayout(result)
  }

  // actions
  const supportedActions = ['switch']
  const action = ref(null)
  const actionTarget = ref(null) // selectedCategoryLayout at the time set action is called
  function setAction(action) {
    if (!_.includes(supportedActions, action))
      throw `Action ${action} is not supported!`
    action.value = action
    actionTarget.value = props.selectedCategoryLayout
  }
  function clearAction() {
    action.value = null
    actionTarget.value = null
  }
  async function execAction() {
    if (action.value === 'switch') {
      await switchCategory()
    }

    clearAction()
  }
  // listen on category change, then execute action if action is set
  watch(() => props.selectedCategoryLayout, async () => {
    if (action.value) {
      await execAction()
    }
  })

  // actions implement
  // switch
  const canSwitch = computed(() => this.selectedCategoryLayout && this.selectedCategoryLayout._id)
  async function switchCategory() {
    const result = await orderLayoutApi.switchCategory(actionTarget.value, props.selectedCategoryLayout)
    emitUpdateOrderLayout(result)
  }


  //
  const categoryRows = computed(() => props.orderLayout && props.orderLayout.rows)
  const categoryColumns = computed(() => props.orderLayout && props.orderLayout.columns)

  return {
    categoryRows,
    categoryColumns,
    //
    createLayout,
    changeCategoryColumn,
    changeCategoryRow,
    deleteCategory,
    setAction,
    // impl act
    canSwitch,
    canDelete
  }
}

// provide methods to modify specified category layout
export function useCategoryLayoutLogic(props, context) {

  const productRows = computed(() => props.selectedCategoryLayout && props.selectedCategoryLayout.rows)
  const productCols = computed(() => props.selectedCategoryLayout && props.selectedCategoryLayout.columns)
  const categoryName = computed(() => props.selectedCategoryLayout && props.selectedCategoryLayout.name)
  const categoryColor = computed(() => props.selectedCategoryLayout && props.selectedCategoryLayout.color)

  const debouncedUpdateCategory = _.debounce(async change => {
    await updateCategory(change, !props.selectedCategoryLayout._id)
  }, 300)

  async function updateCategory(change, forceCreate) {
    // assign change
    _.assign(props.selectedCategoryLayout, change)

    // if selected product layout is not empty then update it
    // in case of update, because we already update the selectCategoryLayout so we don't need
    // emit any events.
    if (props.selectedCategoryLayout._id) {
      const qry = { 'categories._id': props.selectedCategoryLayout._id }
      const set = _.reduce(change, (result, value, key) => {
        result[`categories.$.${key}`] = value;
        return result
      }, {}) ;
      await cms.getModel('OrderLayout').findOneAndUpdate(qry, { $set: set });
      showNotify();
    } else if (forceCreate)  {
      // otherwise, create new if forceCreate
      // in case of create new, we need to emit an event to update category layout _id
      const orderLayout = await cms.getModel('OrderLayout').findOneAndUpdate(
          { _id: props.orderLayout._id },
          { $push: { categories: props.selectedCategoryLayout } },
          { new: true });
      showNotify();
      context.emit('update:orderLayout', orderLayout)
    }
  }

  return {
    productRows,
    productCols,
    categoryName,
    categoryColor,
    //
    debouncedUpdateCategory
  }
}
