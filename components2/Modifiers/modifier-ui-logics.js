import { ObjectID } from 'bson';
import cms from 'cms'
import { computed, nextTick, ref, watch } from 'vue'

import { CRUdFactory } from './CRUD/crud';
// import { CRUdDbFactory: CRUdFactory } from './CRUD/crud-db';
import _ from 'lodash'
import { intervalLog, isSameId } from '../utils';

export const currentGroup = ref(null)
export const categories = ref([])
export const activeItem = ref(null)
export const modifiers = ref({})

export const groups = ref([])
watch(() => modifiers.value, () => {
  groups.value = (modifiers.value && modifiers.value.groups) || []
  if (currentGroup.value && currentGroup.value._id) currentGroup.value = _.find(modifiers.value.groups, i => isSameId(i, currentGroup.value))
}, { deep: true})

watch(() => currentGroup.value, () => {
  categories.value = (currentGroup.value && currentGroup.value.categories) || []
}, { deep: true})

export const currentGroupIdx = computed(() => {
  return _.findIndex(modifiers.value.groups, i => isSameId(i, currentGroup.value))
})

export const fetchModifiers = async function() {
  modifiers.value = await cms.getModel('Modifier').findOne({})
}

export const onCreateItem = async function(path, type) { // types: [modifier, category, group]
  const { create } = CRUdFactory(modifiers.value, path, 'Modifier')
  //todo: set selecting item
  if (type === 'modifier') {
    activeItem.value = await create({
      name: 'New Modifier',
      _id: new ObjectID(),
      price: 0,
      max: 1,
    })
    _.assign(activeItem.value, {type: 'modifier'})

  }
  if (type === 'category') {
    activeItem.value = await create( {
      name: 'New Category',
      _id: new ObjectID(),
      mandatory: true,
      selectOne: true,
      freeItems: 0,
      items: []
    })
    _.assign(activeItem.value, { type: 'category'})
  }
  if (type === 'group') {
    currentGroup.value = await create( {
      name: 'New Group',
      _id: new ObjectID(),
      categories: []

    })
    activeItem.value = {...currentGroup.value, type: 'group'}
  }
}

export const isSelecting = function(item) {
  return activeItem.value && isSameId(activeItem.value, item)
}

export const onRemoveItem = async function(path, item) { // types: [modifier, category, group]
  const { remove } = CRUdFactory(modifiers.value, path, 'Modifier')
  await remove(item)
}

export const onUpdateItem = async function(path, item, newV) {
  const { update } = CRUdFactory(modifiers.value, path, 'Modifier')
  await update(item, newV)
}

export const onSelect = function (item, type) {
  activeItem.value = { ...item, type}
  if (type === 'group') {
    currentGroup.value = item
  }
}

export const duplicate = function() {

}

const activeItemPath = computed(() => {
  if (!activeItem.value) return ''
  let path = `groups`
  if (activeItem.value.type === 'group') return path
  path = `${path}.${activeItem.value.groupIdx}.categories`
  if (activeItem.value.type === 'category') return path
  path = `${path}.${activeItem.value.categoryIdx}.items`
  return path
})
export const deleteActiveItem = async function() {
  let tmp = currentGroupIdx.value

  console.log('delete', activeItemPath.value, activeItem.value)
  await onRemoveItem(activeItemPath.value, activeItem.value)

  await nextTick()
  console.log(modifiers.value)
  if (activeItem.value.type === 'group') {
    tmp = Math.min(modifiers.value.groups.length - 1, tmp)
    if (tmp >= 0) {
      currentGroup.value = modifiers.value.groups[tmp]
      activeItem.value = { ...currentGroup.value, type: 'group'}
      return
    } else currentGroup.value = null
  }

  activeItem.value = null
}

export const onUpdateActiveItem = async function() {
  await onUpdateItem(activeItemPath.value, activeItem.value, activeItem.value)
}
