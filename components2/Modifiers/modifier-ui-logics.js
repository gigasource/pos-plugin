import { ObjectID } from 'bson';
import cms from 'cms'
import { reactive, computed, ref, watch } from 'vue'
import { CRUdDbFactory } from './CRUD/crud-db';

export const currentGroup = ref(null)
export const categories = ref(null)
export const selectingModifier = ref(null)
export const activeItem = ref(null)

export const modifiers = ref()


watch(() => currentGroup.value, () => {
  if (currentGroup.value) categories.value = currentGroup.value.categories
}, { deep: true})

export const currentGroupIdx = computed(() => {
  return _.findIndex(modifiers.value, i => i._id.toString() === currentGroup.value._id.toString())
})


export const fetchModifiers = async function() {
  modifiers.value = reactive(await cms.getModel('Modifier').findOne({}))
}

export const onCreateItem = async function(path, type) { // types: [modifier, category, group]
  const { create } = CRUdDbFactory(modifiers.value, path, 'Modifier')
  //todo: set selecting item
  if (type === 'modifier') {
    currentGroup.value = await create({
      name: 'New Modifier',
      _id: new ObjectID(),
      price: 0,
      max: 1
    })
    activeItem.value = {...currentGroup.value, type: 'group'}
  }
  if (type === 'category') {
    activeItem.value = await create( {
      name: 'New Category',
      _id: new ObjectID(),
      mandatory: true,
      selectOne: true,
      freeItems: 0
    })
    _.assign(activeItem.value, { type: 'category'})
  }
  if (type === 'group') {
    activeItem.value = await create( {
      name: 'New Group',
      _id: new ObjectID(),
    })
    _.assign(activeItem.value, {type: 'group'})
  }
}

export const isSelecting = function(item) {
  return activeItem.value && activeItem.value._id.toString() === item._id.toString()
}

export const onRemoveItem = async function(path, type, item) { // types: [modifier, category, group]
  const { remove } = CRUdDbFactory(modifiers.value, path, 'Modifier')
  await remove(item)
}

export const onSelectModifierCategory = async function(path, item, newV) {
  const { update } = CRUdDbFactory(modifiers.value, path, 'Modifier')
  await update(item, newV)
}

export const onSelect = function (item, type) {

}

export const duplicate = function() {

}

export const deleteItem = function() {

}
