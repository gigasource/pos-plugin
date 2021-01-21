import { ObjectID } from 'bson';
import cms from 'cms'
import { reactive } from 'vue'
import { CRUdDbFactory } from './crud-db';

export const selectingGroup = ref(null)
export const selectingCategory = ref(null)
export const selectingModifier = ref(null)

export const modifiers = ref()

export const fetchModifiers = async function() {
  modifiers.value = reactive(await cms.getModel('Modifier').findOne({}))
}

export const onCreateItem = async function(path, type) { // types: [modifier, category, group]
  const { create } = CRUdDbFactory(modifiers.value, path, 'Modifier')
  //todo: set selecting item
  if (type === 'modifier') {
    selectingModifier.value = await create({
      name: 'New Modifier',
      _id: new ObjectID(),
      price: 0,
      max: 1
    })
  }
  if (type === 'category') {
    selectingCategory.value = await create( {
      name: 'New Category',
      _id: new ObjectID(),
      mandatory: true,
      selectOne: true,
      freeItems: 0
    })
  }
  if (type === 'group') {
    selectingGroup.value = await create( {
      name: 'New Group',
      _id: new ObjectID(),
    })
  }
}

export const isSelecting = function(item) {
  const selectingItems = [selectingModifier, selectingCategory, selectingGroup]
  return _.some(selectingItems, i => (i.value && i.value._id.toString() === item._id.toString()))
}

export const onRemoveItem = async function(path, type, item) { // types: [modifier, category, group]
  const { remove } = CRUdDbFactory(modifiers.value, path, 'Modifier')
  await remove(item)
}

export const onSelectModifierCategory = async function(path, item, newV) {
  const { update } = CRUdDbFactory(modifiers.value, path, 'Modifier')
  await update(item, newV)
}
