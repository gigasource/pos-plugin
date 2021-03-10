<script>
import { ref, watch, withModifiers, reactive } from 'vue';
import { genScopeId, internalValueFactory, parseNumber, VModel_number } from '../../utils';

import {
  activeItem,
  categories,
  currentGroup,
  currentGroupIdx,
  groups,
  isSelecting,
  onCreateItem,
  onDeleteActiveItem,
  onDuplicate,
  onSelect,
  onUpdateActiveItem
} from './modifier-ui-logics';

import { modifierHooks } from './modifier-ui-logics';
import cms from 'cms';
import { useI18n } from 'vue-i18n';

export default {
  props: {
    modelValue: Boolean
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    //todo:
    const { t } = useI18n()
    const internalValue = internalValueFactory(props, { emit })

    const groupPrinters = ref([])

    async function loadPrinterGroups() {
      groupPrinters.value = await cms.getModel('GroupPrinter').find({ type: 'kitchen' })
    }

    const groupNameRef = ref(null)
    const categoryNameRef = ref(null)
    const categoryFreeItemsRef = ref(null)
    const itemNameRef = ref(null)
    const itemPriceRef = ref(null)
    const itemMaxRef = ref(null)

    const showDialog = ref(false)
    const formInputData = reactive({
      name: '',
      price: '',
      max: '',
      freeItems: ''
    })
    function openDialog(focusTarget) {
      showDialog.value = true
      formInputData.name = activeItem.value.name
      if (activeItem.value.type === 'category') {
        formInputData.freeItems = activeItem.value.freeItems
      }
      if (activeItem.value.type === 'modifier') {
        formInputData.price = activeItem.value.price
        formInputData.max = activeItem.value.max
      }
      setTimeout(() => {
        focusTarget.value.$el.click()
      }, 200)
    }

    function onSubmit() {
      if (formInputData.name) activeItem.value.name = formInputData.name
      if (formInputData.price) activeItem.value.price = parseNumber(formInputData.price)
      if (formInputData.max) activeItem.value.max = formInputData.max
      if (formInputData.freeItems) activeItem.value.freeItems = parseNumber(formInputData.freeItems)
      showDialog.value = false
    }

    watch(() => activeItem.value, () => {
      onUpdateActiveItem()
    }, { deep: true })

    const close = () => internalValue.value = false;
    watch(() => internalValue.value, () => {
      if (internalValue.value) {
        modifierHooks.emit('updateModifiers')
        loadPrinterGroups()
      }
    })



    const renderHeader = () =>
        <div class="header">
          {groups.value.map(group =>
              <g-btn key={group._id}
                     outlined
                     uppercase={false}
                     background-color="#F0F0F0"
                     class={['mb-2', ...(isSelecting(group)) ? ['active-btn', 'edit-btn'] : []]}
                     onClick={() => onSelect(group, 'group')}>
                {group.name}
              </g-btn>
          )}
          <g-btn class="mb-1"
                 flat
                 background-color="#1271ff"
                 text-color="#fff"
                 uppercase={false}
                 onClick={async () => await onCreateItem(`groups`, 'group')}>
            <g-icon color="#fff"
                    size="18"
                    class="mr-2">
              add
            </g-icon>
            <span> {t('modifier.group')} </span>
          </g-btn>
        </div>

    const renderCategories = () =>
        <div class="content--main col-flex align-items-start">
          {categories.value.map((category, idx) =>
              <>
                <g-btn key={category._id} flat uppercase={false}
                       class={['mb-2', ...(isSelecting(category)) ? ['active-btn', 'edit-btn'] : []]}
                       onClick={() => onSelect({ ...category, groupIdx: currentGroupIdx.value }, 'category')}>
                  {category.name}
                </g-btn>
                <div class="mb-3">
                  <g-icon>
                    keyboard_arrow_right
                  </g-icon>
                  {category.items.map((mod) =>
                      <g-btn key={mod._id} flat uppercase={false}
                             class={(isSelecting(mod)) ? ['active-btn', 'edit-btn'] : []}
                             onClick={() => onSelect({ ...mod, groupIdx: currentGroupIdx.value, categoryIdx: idx }, 'modifier')}>
                        {mod.name}
                      </g-btn>
                  )}
                  <g-btn flat background-color="#1271ff"
                         text-color="#fff" uppercase={false}
                         onClick={() => onCreateItem(`groups.${currentGroupIdx.value}.categories.${idx}.items`, 'modifier')}>
                    <g-icon color="#fff" size="18" class="mr-2">
                      add
                    </g-icon>
                    <span> {t('modifier.item')} </span>
                  </g-btn>
                </div>
              </>
          )}
          <g-btn flat background-color="#1271ff"
                 text-color="#fff" uppercase={false}
                 onClick={() => onCreateItem(`groups.${currentGroupIdx.value}.categories`, 'category')}
                 v-show={currentGroup.value}>
            <g-icon color="#fff" size="18" class="mr-2"> add</g-icon>
            <span> {t('modifier.category')} </span>
          </g-btn>
        </div>


    const renderToolbarForModifierGroup = () =>
        (activeItem.value && activeItem.value.type === 'group') &&
        <>
          <g-text-field-bs label="Name" v-model={activeItem.value.name} required v-slots={{
            'append-inner': genScopeId(() =>
                <g-icon style="cursor: pointer" onClick={withModifiers(() => openDialog(groupNameRef), ['stop'])}>
                  icon-keyboard
                </g-icon>)
          }}/>
          <g-btn uppercase={false} flat background-color="#4FC3F7" text-color="#fff" style="margin: 8px 4px 0 4px" onClick={onDuplicate}>
            <g-icon color="#fff" size="18" class="mr-2">
              file_copy
            </g-icon>
            <span>
              {t('modifier.duplicate')}
            </span>
          </g-btn>
          <g-btn uppercase={false} flat background-color="#FF4452" text-color="#fff" style="margin: 8px 4px 0 4px" onClick={onDeleteActiveItem}>
            <g-icon color="#fff" size="18" class="mr-2">
              delete
            </g-icon>
            <span>
              {t('modifier.deleteGroup')}
            </span>
          </g-btn>
        </>

    const renderToolbarForModifierCategory = () => (activeItem.value && activeItem.value.type === 'category') &&
        <>
          <g-switch label={t('modifier.mandatory')} v-model={activeItem.value.mandatory}/>
          <g-switch label={t('modifier.selectOnlyOne')} v-model={activeItem.value.selectOne}/>
          <g-text-field-bs label={t('modifier.name')} required v-model={activeItem.value.name} v-slots={{
            'append-inner': genScopeId(() =>
                <g-icon style="cursor: pointer" onClick={withModifiers(() => openDialog(categoryNameRef), ['stop'])}>
                  icon-keyboard
                </g-icon>)
          }}/>
          <g-text-field-bs label={t('modifier.noOfFreeItems')} v-model={activeItem.value.freeItems} v-slots={{
            'append-inner': genScopeId(() =>
                <g-icon style="cursor: pointer" onClick={withModifiers(() => openDialog(categoryFreeItemsRef), ['stop'])}>
                  icon-keyboard
                </g-icon>)
          }}/>
          <g-btn uppercase={false} flat background-color="#FF4452" text-color="#fff" style="margin: 8px 4px 0 4px" onClick={onDeleteActiveItem}>
            <g-icon color="#fff" size="18" class="mr-2"> delete</g-icon>
            <span> {t('modifier.deleteCategory')} </span>
          </g-btn>
        </>

    const renderToolbarForModifierItem = () => (activeItem.value && activeItem.value.type === 'modifier') &&
        <>
          <g-text-field-bs label={t('modifier.name')} required v-model={activeItem.value.name} v-slots={{
            'append-inner': () =>
                <g-icon style="cursor: pointer" onClick={withModifiers(() => openDialog(itemNameRef), ['stop'])}>
                  icon-keyboard
                </g-icon>
            ,
          }}/>
          <g-text-field-bs label={t('modifier.price')} v-model={VModel_number(activeItem.value, 'price').value} v-slots={{
            'append-inner': genScopeId(() =>
                <g-icon style="cursor: pointer" onClick={withModifiers(() => openDialog(itemPriceRef), ['stop'])}>
                  icon-keyboard
                </g-icon>)
          }}/>
          <g-text-field-bs label={t('modifier.maxItems')} v-model={VModel_number(activeItem.value, 'max').value} v-slots={{
            'append-inner': genScopeId(() =>
                <g-icon style="cursor: pointer" onClick={withModifiers(() => openDialog(itemMaxRef), ['stop'])}>
                  icon-keyboard
                </g-icon>)
          }}/>
          {
            <div>
              <div style="font-size: 13px; margin: 12px 4px 2px 4px;">
                Group printer
              </div>
              <g-grid-select class="ml-1 mr-1 mb-2"
                             v-model={activeItem.value.printer}
                             grid={false}
                             item-text="name"
                             item-value="_id"
                             items={groupPrinters.value}
                             itemcols="auto" v-slots={{
                default: genScopeId(({ toggleSelect, item }) =>
                    <div class="prop-option" onClick={() => {toggleSelect(item)}}>
                      {item.name} </div>),
                selected: genScopeId(({ toggleSelect, item }) =>
                    <div class="prop-option prop-option--active" onClick={() => {toggleSelect(item)}}>
                      {item.name} </div>)
              }}/>
            </div>}
          <g-btn uppercase={false} flat background-color="#FF4452" text-color="#fff" style="margin: 8px 4px 0 4px" onClick={onDeleteActiveItem}>
            <g-icon color="#fff" size="18" class="mr-2"> delete</g-icon>
            <span> {t('modifier.deleteItem')} </span>
          </g-btn>
        </>
    const renderSidebar = () =>
        <div class="content--sidebar col-flex">
          <div class="pa-2 col-flex">
            {renderToolbarForModifierGroup()}
            {renderToolbarForModifierCategory()}
            {renderToolbarForModifierItem()}
          </div>
          <g-spacer/>
          <div class="row-flex" style="position: sticky; z-index: 1">
            <g-btn flat background-color="#ff4452" text-color="#fff" border-radius="0" onClick={close} style="flex: 1; margin: 0">
              {t('ui.close')}
            </g-btn>
          </div>
        </div>

    const renderInputDialog = () =>
        <dialog-form-input v-model={showDialog.value} onSubmit={onSubmit} v-slots={{
          'input': genScopeId(({ changeKeyboard }) =>
              <div class="mb-4">
                {
                  (activeItem.value && activeItem.value.type === 'group') ?
                      <pos-textfield-new ref={groupNameRef} label={t('modifier.name')} v-model={formInputData.name} required clearable/>
                      :
                      (
                          (activeItem.value && activeItem.value.type === 'category') ?
                              <div class="row-flex flex-wrap justify-between">
                                <pos-textfield-new ref={categoryNameRef} label={t('modifier.name')} required clearable v-model={formInputData.name} onClick={withModifiers(() => changeKeyboard('alpha'), ['native', 'stop'])}/>
                                <pos-textfield-new ref={categoryFreeItemsRef} label={t('modifier.noOfFreeItems')} clearable v-model={formInputData.freeItems} onClick={withModifiers(() => changeKeyboard('numeric'), ['native', 'stop'])}/>
                              </div>
                              :
                              (
                                  (activeItem.value && activeItem.value.type === 'modifier') &&
                                  <div class="row-flex flex-wrap justify-between">
                                    <pos-textfield-new ref={itemNameRef} style="width: 48%" label={t('modifier.name')} required clearable v-model={formInputData.name} onClick={withModifiers(() => changeKeyboard('alphanumeric'), ['native', 'stop'])}/>
                                    <pos-textfield-new ref={itemPriceRef} style="width: 48%" label={t('modifier.price')} clearable v-model={formInputData.price} onClick={withModifiers(() => changeKeyboard('numeric'), ['native', 'stop'])}/>
                                    <pos-textfield-new ref={itemMaxRef} style="width: 48%" label={t('modifier.maxItems')} clearable v-model={formInputData.max} onClick={withModifiers(() => changeKeyboard('numeric'), ['native', 'stop'])}/>
                                  </div>
                              )
                      )
                }
              </div>)
        }}/>
    return genScopeId(() =>
        <div>
          <g-dialog fullscreen v-model={internalValue.value}>
            {genScopeId(() => <div class="col-flex flex-grow-1" style="background: #fff">
              {renderHeader()}
              <div class="content row-flex">
                {renderCategories()}
                {renderSidebar()}
              </div>
            </div>)()}
          </g-dialog>
          {renderInputDialog()}
        </div>)
  }
}
</script>

<style scoped lang="scss">
.header {
  border-bottom: 1px solid #979797;
  padding: 16px;
}

.content {
  flex: 1;
  overflow: scroll;

  &--main {
    flex-grow: 1;
    padding: 16px;
    overflow: scroll;
  }

  &--sidebar {
    border-left: 0.5px solid #979797;
    width: 25%;
    overflow: scroll;
    position: relative;
  }
}

.g-btn {
  margin-right: 16px;
  border: 1px solid #D0D0D0;
  border-radius: 2px;
  font-weight: bold;
}

.active-btn {
  background: #E3F2FD !important;
  border: 1px solid #90CAF9 !important;
}

.edit-btn {
  border: 2px solid #1271FF !important;
}

.prop-option {
  display: inline-block;
  padding: 0 6px;
  margin-right: 4px;
  cursor: pointer;
  border: 1px solid #E0E0E0;
  box-sizing: border-box;
  border-radius: 2px;
  font-size: 13px;

  &--active {
    background: #E3F2FD;
    border: 1px solid #90CAF9;
  }
}
</style>
