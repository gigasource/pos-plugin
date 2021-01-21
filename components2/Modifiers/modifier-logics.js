export const createModifierItem = function (_item) {
  const item = _.cloneDeep(item)
  return item
}

export const createModifierCategory = function (_category) {
  const category = _.assign(_category, { items: (_category && _category.items) || [] })
  return category
}

export const addModifierItem = function (modifierGroup, item) {
  modifierGroup.items.push(item)
}

export const removeModifierItem = function (modifierCategory, item) {
  const idx = _.findIndex(modifierCategory.items, i => i._id.toString() === item._id.toString())
  modifierCategory.items.splice(idx, 1)
}

export const updateModifierItem = function (modifierCategory, item, value) {
  const idx = _.findIndex(modifierCategory.items, i => i._id.toString() === item._id.toString())
  _.assign(modifierCategory.items, value)
}

export const createModifierGroup = function (_modifierGroup) {
  const modifierGroup = _.assign(_modifierGroup, { categories: (_modifierGroup && _modifierGroup.categories) || [] })
  return modifierGroup
}

export const addModifierCategory = function (modifierGroup, modifierCategory) {
  modifierGroup.categories.push(modifierGroup)
}

export const removeModifierCategory = function (modifierGroup, modifierCategory) {
  const idx = _.findIndex(modifierGroup.categories, i => i._id.toString() === modifierCategory._id.toString())
  modifierGroup.categories.splice(idx, 1)
}

export const updateModifierCategory = function (modifierGroup, modifierCategory, value) {
  const idx = _.findIndex(modifierGroup.categories, i => i._id.toString() === modifierCategory._id.toString())
  _.assign(modifierGroup.categories, value)
}
