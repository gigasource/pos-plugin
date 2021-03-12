import {modifierGroups} from '../dialogEditPopupModifier/modifier-ui-logics';
import {computed, ref, watch} from 'vue';
import {internalValueFactory, intervalLog, isSameId} from '../../utils';
import _ from 'lodash'

const dialogChoosePopupModifierLogicsFactory = function (props, {emit}, _categories) {
  const internalValue = internalValueFactory(props, {emit})
  const categories = _categories || computed(() => {
    if (!modifierGroups.value || !modifierGroups.value.groups) return []
    const group = _.find(modifierGroups.value.groups, i => i._id.toString() === _.get(props, 'product.activePopupModifierGroup', '').toString())
    return (group && group.categories) ? group.categories : []
  })

  const countItems = ref({})
  const countItemsByCategory = ref({})

  const categoryMap = new WeakMap();

  const activeItem = (category) => {
    if (categoryMap.has(category)) return categoryMap.get(category);
    categoryMap.set(category, computed(() => {
      const res = category.items.filter(item => countItemsByCategory.value[category._id] && countItemsByCategory.value[category._id][item._id] % ((item.max || 1) + 1) > 0)
      if (category.selectOne) {
        if (res.length === 1) return res[0]
        else return null
      }
      return res
    }))
    return categoryMap.get(category);
  }

  watch([() => internalValue.value, () => props.categories], () => {
    if (internalValue.value || props.categories) {
      countItemsByCategory.value = {}
      countItems.value = {}
      _.forEach(categories.value, category => countItemsByCategory.value[category._id] = {})
    }
  })

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
    const modifiers = []
    for (const category of categories.value) {
      const _modifiers = [];
      if (category.selectOne) {
        _modifiers.push(_.cloneDeep(activeItem(category).value));
      } else {
        _modifiers.push(..._.cloneDeep(activeItem(category).value));
      }
      for (const _modifier of _modifiers) {
        let quantity = getModifierQty(_modifier);
        for (let i = 0; i < quantity; i++) {
          modifiers.push(_modifier);
        }
      }
    }
    if (!props.embed) internalValue.value = false;
    emit('save', props.product, modifiers);
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
