import ColorSelector from '../../../components/common/ColorSelector';
import InputNumber from '../../../components/EditMenuCard/InputNumber';
import PosKeyboardFull from '../../../components/pos-shared-components/PosKeyboardFull';
import { useI18n } from 'vue-i18n'
import { useCategoryLayoutLogic, useOrderLayoutLogic } from './CategoryEditorLogic'

import Hooks from 'schemahandler/hooks/hooks'
import { computed } from 'vue';

const categoryEditorFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'CategoryEditor',
    components: { PosKeyboardFull, InputNumber, ColorSelector },
    props: {
      orderLayout: Object,
      selectedCategoryLayout: Object,
    },
    emits: ['update:orderLayout'],
    setup(props, context) {
      const { t: $t } = useI18n()

      const {
        categoryRows,
        categoryColumns,
        //
        createLayout,
        changeCategoryColumn,
        changeCategoryRow,
        deleteCategory,
        setAction,
        canSwitch,
      } = useOrderLayoutLogic(props, context)

      const {
        productRows,
        productCols,
        categoryName,
        categoryColor,
        debouncedUpdateCategory
      } = useCategoryLayoutLogic(props, context)

      // table layout setting
      let renderCategoryLayoutSetting = () => (<>
        <div class="category-editor__label">{$t('restaurant.menuEdit.categoriesNo')}</div>
        <div class="row-flex align-items-center justify-between">
          <div class="fw-700 fs-small mr-2">{$t('restaurant.menuEdit.columns')}:</div>
          <input-number
              modelValue={categoryColumns.value} min={1} max={8} width={148}
              onUpdate:modelValue={changeCategoryColumn}/>
        </div>
        <div class="row-flex align-items-center justify-between mt-1">
          <div class="fw-700 fs-small mr-2">{$t('restaurant.menuEdit.rows')}:</div>
          <input-number
              modelValue={categoryRows.value} min={1} max={3} width={148}
              onUpdate:modelValue={changeCategoryRow}/>
        </div>
      </>)
      hooks.emit('renderCategoryLayoutSetting', categoryColumns, categoryRows, changeCategoryColumn, changeCategoryRow, e => eval(e))

      // name setting
      const showCategoryNameKbd = ref(false)
      let renderCateNameSetting = () => (<>
        <div class="category-editor__label">{$t('ui.name')}</div>
        <g-text-field-bs
            border-color="#979797"
            modelValue={categoryName.value}
            onUpdate:modelValue={newName => debouncedUpdateCategory({ name: newName })}>
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" onClick={showCategoryNameKbd.value = true}>icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </>)
      hooks.emit('renderCateNameSetting', props, debouncedUpdateCategory, e => eval(e))

      // color setting
      const colors = ['#FFFFFF', '#CE93D8', '#B2EBF2', '#C8E6C9', '#DCE775', '#FFF59D', '#FFCC80', '#FFAB91']
      let renderCateColorSetting = () => (<>
        <div class="category-editor__label">{$t('ui.color')}</div>
        <color-selector
            modelValue={categoryColor.value}
            colors={colors}
            itemSize={25}
            onUpdate:modelValue={color => debouncedUpdateCategory({color: color})}/>
      </>)
      hooks.emit('renderCateColorSetting', categoryColor, colors, debouncedUpdateCategory, e => eval(e))

      // product layout setting
      let renderRowSetting = () => <>
        <div class="category-editor__label">{$t('restaurant.menuEdit.rowsNo')}</div>
        <input-number
            modelValue={productRows} min={4} max={10}
            width={148}
            onUpdate:modelValue={newRow => debouncedUpdateCategory({rows: newRow})}/>
      </>
      hooks.emit('renderRowSetting', productRows, debouncedUpdateCategory, e => eval(e))
      let renderColsSetting = () => <>
        <div class="category-editor__label">{$t('restaurant.menuEdit.columnsNo')}</div>
        <input-number
            modelValue={productCols} min={3} max={6}
            width={148}
            onUpdate:modelValue={newCol => debouncedUpdateCategory({columns:newCol})}/>
      </>
      hooks.emit('renderColsSetting', productCols, debouncedUpdateCategory, e => eval(e))

      let renderCateProductLayoutSetting = () => <>
        { renderRowSetting() }
        { renderColsSetting() }
      </>
      hooks.emit('renderCateProductLayoutSetting', renderRowSetting, renderColsSetting, e => eval(e))

      // pop-up
      let renderPopUp = () => <>
        <dialog-text-filter
            label={$t('restaurant.menuEdit.categoryName')}
            defaultValue={categoryName.value}
            v-model={showCategoryNameKbd.value}
            onSubmit={newName => debouncedUpdateCategory({ name: newName}, newName /*forceCreate*/)}/>
      </>
      hooks.emit('renderPopUp', categoryName, showCategoryNameKbd, debouncedUpdateCategory, e => eval(e))

      // render toolbar
      const showAddLayoutDialog = ref(null)
      let renderToolbar = () => <>
        {
          !props.orderLayout
            ? <>
                <dialog-form-input v-model={showAddLayoutDialog.value} onSubmit={createLayout}></dialog-form-input>
                <g-btn-bs text-color="#1271FF" elevation="2" icon="add_circle" onClick={showAddLayoutDialog.value = true}>{$t('ui.add')}></g-btn-bs>
              </>
            : null
        }
        <g-btn-bs elevation="2" icon="icon-edit-menu-card-switch" onClick={setAction('switch')} disabled={!canSwitch}>{$t('ui.switch')}</g-btn-bs>
      </>
      hooks.emit('renderToolbar', props.orderLayout, showAddLayoutDialog, createLayout, setAction, switchable, renderToolbar, e => eval(e))

      // entire render
      let renderCategoryEditor = () => <>
        {renderCategoryLayoutSetting()}
        {renderCateNameSetting()}
        {renderCateColorSetting()}
        {renderCateProductLayoutSetting()}
        {renderPopUp()}
        {renderToolbar()}
      </>
      hooks.emit('renderCategoryEditor',
          renderCategoryLayoutSetting,
          renderCateNameSetting,
          renderCateColorSetting,
          renderCateProductLayoutSetting,
          renderPopUp,
          renderToolbar,
          e => eval(e))

      return {
        state,
        cateRows,
        cateCols,
        renderCategoryEditor
      }
    },
    render() {
      return this.renderCategoryEditor()
    }
  })
  return { hooks, fn }
}

export default categoryEditorFactory
