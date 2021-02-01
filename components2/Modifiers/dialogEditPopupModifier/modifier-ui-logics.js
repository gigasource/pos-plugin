import { ObjectID } from 'bson';
import cms from 'cms'
import { computed, nextTick, ref, watch } from 'vue'
// import { CRUdFactory } from './CRUD/crud';
import { CRUdDbFactory as CRUdFactory } from '../CRUD/crud-db';
import _ from 'lodash'
import { isSameId } from '../../utils';
import { appHooks } from '../../AppSharedStates';

export const currentGroup = ref(null)
export const activeItem = ref(null)
export const modifierGroups = ref({})
export const groups = computed(() => {
  return (modifierGroups.value && modifierGroups.value.groups) || []
})

export const categories = computed(() => {
  return (currentGroup.value && currentGroup.value.categories) || []
})
watch(() => modifierGroups.value, () => {
  if (currentGroup.value && currentGroup.value._id) currentGroup.value = _.find(modifierGroups.value.groups, i => isSameId(i, currentGroup.value))
}, { deep: true })

export const currentGroupIdx = computed(() => {
  return _.findIndex(modifierGroups.value.groups, i => isSameId(i, currentGroup.value))
})

appHooks.on('updateModifiers', async () => {
  await fetchModifiers()
})

export const fetchModifiers = async function () {
  modifierGroups.value = await cms.getModel('Modifiers').findOne({})
  if (!modifierGroups.value) {
    await cms.getModel('Modifiers').create({ groups: [] })
    modifierGroups.value = { groups: [] }
  }
}

export const onCreateItem = async function (path, type, item = null) { // types: [modifier, category, group]
  const { create } = CRUdFactory(modifierGroups.value, path, 'Modifiers')
  if (type === 'modifier') {
    activeItem.value = await create(_.merge({
      name: 'New Modifier',
      _id: new ObjectID(),
      price: 0,
      max: 1,
    }, item))
    _.assign(activeItem.value, { type: 'modifier' })
  }
  if (type === 'category') {
    activeItem.value = await create(_.merge({
      name: 'New Category',
      _id: new ObjectID(),
      mandatory: true,
      selectOne: true,
      freeItems: 0,
      items: []
    }, item))
    _.assign(activeItem.value, { type: 'category' })
  }
  if (type === 'group') {
    currentGroup.value = await create(_.merge({
      name: 'New Group',
      _id: new ObjectID(),
      categories: []
    }, item))
    activeItem.value = { ...currentGroup.value, type: 'group' }
  }
  return activeItem.value
  // appHooks.emit('updateModifiers')
}

export const isSelecting = function (item) {
  return activeItem.value && isSameId(activeItem.value, item)
}

export const onRemoveItem = async function (path, item) { // types: [modifier, category, group]
  const { remove } = CRUdFactory(modifierGroups.value, path, 'Modifiers')
  await remove(item)
}

export const onUpdateItem = async function (path, item, newV) {
  const { update } = CRUdFactory(modifierGroups.value, path, 'Modifiers')
  await update(item, newV)
}

export const onSelect = function (item, type) {
  activeItem.value = { ...item, type }
  if (type === 'group') {
    currentGroup.value = item
  }
}

export const onDuplicate = async function () {
  const _currentGroup = _.cloneDeep(currentGroup.value)
  _currentGroup._id = new ObjectID()
  Object.values(_currentGroup.categories).forEach(category => {
    category._id = new ObjectID()
    Object.values(category.items).forEach(item => {
      item._id = new ObjectID()
    })
  })
  _currentGroup.name = `${_currentGroup.name} copy`
  await onCreateItem(`groups`, 'group', _currentGroup)
  return _currentGroup
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

export const onDeleteActiveItem = async function () {
  let tmp = currentGroupIdx.value
  await onRemoveItem(activeItemPath.value, activeItem.value)
  await nextTick()
  if (activeItem.value.type === 'group') {
    tmp = Math.min(groups.value.length - 1, tmp)
    if (tmp >= 0) {
      currentGroup.value = groups.value[tmp]
      activeItem.value = { ...currentGroup.value, type: 'group' }
      return
    } else currentGroup.value = null
  }
  activeItem.value = null
}

export const onUpdateActiveItem = async function () {
  await onUpdateItem(activeItemPath.value, activeItem.value, activeItem.value)
}
