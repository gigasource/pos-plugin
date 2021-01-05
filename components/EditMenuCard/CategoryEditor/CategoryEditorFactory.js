import ColorSelector from '../../common/ColorSelector';
import InputNumber from '../InputNumber';
import PosKeyboardFull from '../../pos-shared-components/PosKeyboardFull';
import useCategoryEditorLogic from './CategoryEditorLogic'
import { useI18n } from 'vue-i18n'

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
        state,
        cateRows,
        cateCols,
        debouncedUpdateCategory,
        changeOrderLayoutColumn,
        changeOrderLayoutRow,
        updateCategory,
      } = useCategoryEditorLogic(props, context)

      hooks.emit('init',
          props,
          context,
          state,
          cateRows,
          cateCols,
          debouncedUpdateCategory,
          changeOrderLayoutColumn,
          changeOrderLayoutRow,
          updateCategory,
          e => eval(e))

      // table layout setting
      let renderCategoryLayoutSetting = () => (<>
        <div class="category-editor__label">{$t('restaurant.menuEdit.categoriesNo')}</div>
        <div class="row-flex align-items-center justify-between">
          <div class="fw-700 fs-small mr-2">{$t('restaurant.menuEdit.columns')}:</div>
          <input-number
              modelValue={props.orderLayout.columns} min={1} max={8} width={148}
              onUpdate:modelValue={changeOrderLayoutColumn}/>
        </div>
        <div class="row-flex align-items-center justify-between mt-1">
          <div class="fw-700 fs-small mr-2">{$t('restaurant.menuEdit.rows')}:</div>
          <input-number
              modelValue={props.orderLayout.rows} min={1} max={3} width={148}
              onUpdate:modelValue={changeOrderLayoutRow}/>
        </div>
      </>)
      hooks.emit('renderCategoryLayoutSetting', props, changeOrderLayoutColumn, changeOrderLayoutRow, e => eval(e))

      // name setting
      let renderCateNameSetting = () => (<>
        <div class="category-editor__label">{$t('ui.name')}</div>
        <g-text-field-bs
            border-color="#979797"
            modelValue={props.selectedCategoryLayout.name}
            onUpdate:modelValue={newName => debouncedUpdateCategory({ name: newName })}>
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" onClick={state.dialog.showCategoryNameKbd = true}>icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </>)
      hooks.emit('renderCateNameSetting', props, debouncedUpdateCategory, e => eval(e))

      // color setting
      const colors = ['#FFFFFF', '#CE93D8', '#B2EBF2', '#C8E6C9', '#DCE775', '#FFF59D', '#FFCC80', '#FFAB91']
      let renderCateColorSetting = () => (<>
        <div class="category-editor__label">{$t('ui.color')}</div>
        <color-selector
            modelValue={props.selectedCategoryLayout.color}
            colors={colors}
            itemSize={25}
            onUpdate:modelValue={color => updateCategory({color: color})}/>
      </>)
      hooks.emit('renderCateColorSetting', props, colors, updateCategory, e => eval(e))

      // product layout setting
      let renderRowSetting = () => <>
        <div class="category-editor__label">{$t('restaurant.menuEdit.rowsNo')}</div>
        <input-number
            modelValue={cateRows} min={4} max={10}
            width={148}
            onUpdate:modelValue={newRow => updateCategory({rows: newRow})}/>
      </>
      hooks.emit('renderRowSetting', cateRows, updateCategory, e => eval(e))
      let renderColsSetting = () => <>
        <div class="category-editor__label">{$t('restaurant.menuEdit.columnsNo')}</div>
        <input-number
            modelValue={cateCols} min={3} max={6}
            width={148}
            onUpdate:modelValue={newCol => updateCategory({columns:newCol})}/>
      </>
      hooks.emit('renderColsSetting', cateCols, updateCategory, e => eval(e))
      let renderCateProductLayoutSetting = () => <>
        { renderRowSetting() }
        { renderColsSetting() }
      </>
      hooks.emit('renderCateProductLayoutSetting', renderRowSetting, renderColsSetting, e => eval(e))

      // pop-up
      let renderPopUp = () => <>
        <dialog-text-filter
            label={$t('restaurant.menuEdit.categoryName')}
            defaultValue={props.selectedCategoryLayout.name}
            v-model={state.dialog.showCategoryNameKbd}
            onSubmit={value => updateCategory({ name: value}, value)}/>
        <g-snackbar v-model="showSnackbar" top right color="#1976d2" timeout={1000}>
          {state.notifyContent}
        </g-snackbar>
      </>
      hooks.emit('renderPopUp', props, state, updateCategory, e => eval(e))

      // entire render
      let renderCategoryEditor = () => <>
        {renderCategoryLayoutSetting()}
        {renderCateNameSetting()}
        {renderCateColorSetting()}
        {renderCateProductLayoutSetting()}
        {renderPopUp()}
      </>
      hooks.emit('renderCategoryEditor',
          renderCategoryLayoutSetting,
          renderCateNameSetting,
          renderCateColorSetting,
          renderCateProductLayoutSetting,
          renderPopUp,
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
}

export default categoryEditorFactory
