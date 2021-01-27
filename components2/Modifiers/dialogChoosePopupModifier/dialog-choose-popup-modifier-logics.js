import { modifierGroups } from '../dialogEditPopupModifier/modifier-ui-logics';
import { computed, ref, watch } from 'vue';
import { internalValueFactory, intervalLog, isSameId } from '../../utils';
import _ from 'lodash'

const dialogChoosePopupModifierLogicsFactory = function (props, { emit }) {
  const internalValue = internalValueFactory(props, { emit })
  const categories = computed(() => {
    if (!modifierGroups.value || !modifierGroups.value.groups) return []
    const group = _.find(modifierGroups.value.groups, i => i._id.toString() === props.product.activePopupModifierGroup.toString())
    return (group && group.categories) ? group.categories : []
  })
  const countItems = ref({})
  const countItemsByCategory = ref({})

  const activeItem = (category) => {
    return computed(() => {
      const res = category.items.filter(item => countItemsByCategory.value[category._id] && countItemsByCategory.value[category._id][item._id] % ((item.max || 1) + 1) > 0)
      if (category.selectOne) {
        if (res.length === 1) return res[0]
        else return null
      }
      return res
    })
  }

  setInterval(() => {
    if (!categories.value || categories.value.length === 0) return
    console.log(activeItem(categories.value[0]).value)
  }, 1000)

  watch(() => categories.value, () => {
    countItemsByCategory.value = {}
    _.forEach(categories.value, category => countItemsByCategory.value[category._id] = {})
  }, { deep: true })

  const enableSaveBtn = computed(() => {
    if (!categories.value) return false
    // mandatory category => should choose at least one item
    const mandatoryCategories = _.filter(categories.value, category => category.mandatory)
    return _.every(mandatoryCategories, category =>
      _.some(category.items, item => countItemsByCategory.value[category._id] && countItemsByCategory.value[category._id][item._id] % ((item.max || 1) + 1) > 0))
  })


  const onClickModifier = function (item, category) {
    if (category.selectOne) {
      _.forEach(category.items, _item => {
        if (!isSameId(_item, item)) {
          countItems.value[_item._id] = 0
          if (countItemsByCategory.value[category._id]) countItemsByCategory.value[category._id][_item._id] = 0
        }
      })
    }
    countItems.value[item._id] = countItems.value[item._id] ? countItems.value[item._id] + 1 : 1
    countItemsByCategory.value[category._id][item._id] = countItems.value[item._id]
  }

  const getModifierQty = function (item) {
    return countItems.value[item._id] % ((item.max || 1) + 1)
  }

  const onSave = function () {
    //todo: emit selected modifier list here
    // consider category's no.free items here
  }

  return {
    categories,
    internalValue,
    enableSaveBtn,
    activeItem,
    onClickModifier,
    getModifierQty,
    onSave
  }
}

export default dialogChoosePopupModifierLogicsFactory
