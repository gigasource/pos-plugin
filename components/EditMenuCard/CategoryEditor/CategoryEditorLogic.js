import { computed, reactive, toRefs } from 'vue';

export default function(props, context) {
  const state = reactive({
    showSnackbar: false,
    notifyContent: null,
    dialog: {
      showCategoryNameKbd: false
    },
  })

  // order layout
  async function changeOrderLayoutColumn(columns) {
    const result = await cms.getModel('OrderLayout').findOneAndUpdate({_id: props.orderLayout._id}, { columns }, { new: true })
    showNotify()
    context.emit('update:orderLayout', result)
  }
  async function changeOrderLayoutRow(rows) {
    const result = await cms.getModel('OrderLayout').findOneAndUpdate({_id: props.orderLayout._id}, { rows }, { new: true })
    showNotify()
    context.emit('update:orderLayout', result)
  }

  // category product layout
  const cateRows = computed(() => props.selectedCategoryLayout.rows)
  const cateCols = computed(() => props.selectedCategoryLayout.columns)
  const debouncedUpdateCategory = _.debounce(async change => {
    await updateCategory(change, !props.selectedCategoryLayout._id)
  }, 300)
  async function updateCategory(change, forceCreate) {
    _.assign(props.selectedCategoryLayout, change)

    if (props.selectedCategoryLayout._id) {
      const qry = { 'categories._id': props.selectedCategoryLayout._id }
      const set = _.reduce(change, (result, value, key) => {
        result[`categories.$.${key}`] = value;
        return result
      }, {}) ;
      await cms.getModel('OrderLayout').findOneAndUpdate(qry, { $set: set });
      showNotify();
    } else {
      if (forceCreate) {
        const orderLayout = await cms.getModel('OrderLayout').findOneAndUpdate(
            { _id: props.orderLayout._id },
            { $push: { categories: props.selectedCategoryLayout } },
            { new: true });
        showNotify();
        context.emit('update:orderLayout', orderLayout)
      } else {
        console.log('CategoryLayout is not existed. Skip.')
      }
    }
  }

  let showNotify = (content) => {
    state.notifyContent = content || 'Saved'
    state.showSnackbar = true
  }

  return {
    state,
    cateRows,
    cateCols,
    debouncedUpdateCategory,
    changeOrderLayoutColumn,
    changeOrderLayoutRow,
    updateCategory,
    showNotify
  }
}
