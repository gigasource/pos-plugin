<script>
import ColorSelector from '../../../components/common/ColorSelector';
import InputNumber from '../../../components/EditMenuCard/InputNumber';
import PosKeyboardFull from '../../../components/pos-shared-components/PosKeyboardFull';
import { useI18n } from 'vue-i18n'
import constants from '../EditMenuCardToolbar/constants';
import { ref } from 'vue'

import {
  productRows,
  productCols,
  categoryName,
  categoryColor,
  debouncedUpdateCategory,
  deleteCategory,
  setAction,
  canSwitch,
  canDelete
} from './category-editor-category'

import {
  categoryRows,
  categoryColumns,
  changeCategoryColumn,
  changeCategoryRow,
} from './category-editor-order-layout'
import { genScopeId } from '../../utils';

export default {
  name: 'CategoryEditor2',
  components: { PosKeyboardFull, InputNumber, ColorSelector },
  setup() {
    const { t } = useI18n()

    // table layout setting: TODO: Move to order-layout-editor
    let renderCategoryLayoutSetting = () => <>
      <div class="category-editor__label">{t('restaurant.menuEdit.categoriesNo')}</div>
      <div class="row-flex align-items-center justify-between">
        <div class="fw-700 fs-small mr-2">{t('restaurant.menuEdit.columns')}:</div>
        <input-number
            modelValue={categoryColumns.value} min={1} max={8} width={148}
            onUpdate:modelValue={changeCategoryColumn}/>
      </div>
      <div class="row-flex align-items-center justify-between mt-1">
        <div class="fw-700 fs-small mr-2">{t('restaurant.menuEdit.rows')}:</div>
        <input-number
            modelValue={categoryRows.value} min={1} max={3} width={148}
            onUpdate:modelValue={changeCategoryRow}/>
      </div>
    </>

    // name setting
    const showCategoryNameKbd = ref(false)
    let renderCateNameSetting = () => (<>
      <div class="category-editor__label">{t('ui.name')}</div>
      <g-text-field-bs
          border-color="#979797"
          modelValue={categoryName.value}
          onUpdate:modelValue={newName => debouncedUpdateCategory({ name: newName }, newName)}
          v-slots={{
            'append-inner': () => <g-icon style="cursor: pointer" onClick={() => showCategoryNameKbd.value = true}>icon-keyboard</g-icon>
          }}>
      </g-text-field-bs>
    </>)

    // color setting
    const colors = ['#FFFFFF', '#CE93D8', '#B2EBF2', '#C8E6C9', '#DCE775', '#FFF59D', '#FFCC80', '#FFAB91']
    let renderCateColorSetting = () => (<>
      <div class="category-editor__label">{t('ui.color')}</div>
      <color-selector
          modelValue={categoryColor.value}
          colors={colors}
          itemSize={25}
          onUpdate:modelValue={color => debouncedUpdateCategory({color: color})}/>
    </>)

    // product layout setting
    let renderRowSetting = () => <>
      <div class="category-editor__label">{t('restaurant.menuEdit.rowsNo')}</div>
      <input-number
          modelValue={productRows.value} min={4} max={10}
          width={148}
          onUpdate:modelValue={newRow => debouncedUpdateCategory({rows: newRow})}/>
    </>
    let renderColsSetting = () => <>
      <div class="category-editor__label">{t('restaurant.menuEdit.columnsNo')}</div>
      <input-number
          modelValue={productCols.value} min={3} max={6}
          width={148}
          onUpdate:modelValue={newCol => debouncedUpdateCategory({columns:newCol})}/>
    </>

    let renderCateProductLayoutSetting = () => <>
      { renderRowSetting() }
      { renderColsSetting() }
    </>

    // pop-up
    let renderPopUp = () => <>
      <dialog-text-filter
          label={t('restaurant.menuEdit.categoryName')}
          defaultValue={categoryName.value}
          v-model={showCategoryNameKbd.value}
          onSubmit={newName => debouncedUpdateCategory({ name: newName}, newName /*forceCreate*/)}/>
    </>

    //// render toolbar buttons
    // delete button
    const showDeleteConfirmDialog = ref(false)
    let renderDeleteCategoryToolbarButton = () => {
      return <>
        <g-btn-bs elevation="2" icon="icon-edit-menu-card-delete"
                  onClick={() => showDeleteConfirmDialog.value = true}
                  disabled={!canDelete.value}>{t('ui.delete')}</g-btn-bs>
        <dialog-confirm-delete v-model={showDeleteConfirmDialog.value} type=' this category' onSubmit={() => {
          deleteCategory();
          showDeleteConfirmDialog.value = false;
        }}></dialog-confirm-delete>
      </>
    }
    let renderToolbarButtons = () => <portal to={constants.portalLeftButtons}>
      {
        genScopeId(() => <>
          <g-btn-bs elevation="2" icon="icon-edit-menu-card-switch"
                    onClick={() => setAction('switch')}
                    disabled={!canSwitch.value}>{t('ui.switch')}</g-btn-bs>
          { renderDeleteCategoryToolbarButton() }
        </>)()
      }
    </portal>

    // entire render
    let renderCategoryEditor = genScopeId(() => <div class="category-editor">
      {renderCategoryLayoutSetting()}
      {renderCateNameSetting()}
      {renderCateColorSetting()}
      {renderCateProductLayoutSetting()}
      {renderPopUp()}
      {renderToolbarButtons()}
    </div>)

    return {
      showDeleteConfirmDialog,
      showCategoryNameKbd,
      renderCategoryEditor
    }
  },
  render() {
    return this.renderCategoryEditor()
  }
}
</script>

<style scoped lang="scss">
  .category-editor {
    padding-left: 20px;
    padding-right: 20px;
    height: 100%;
    overflow: auto;

    &__label {
      color: #000;
      margin-top: 16px;
      margin-bottom: 13px;
      font-weight: 700;
      font-size: 15px;
    }

    .bs-tf-wrapper {
      margin: 0;

      ::v-deep .bs-tf-input {
        color: #000;
      }
    }
  }

  .g-snack ::v-deep .g-snack-wrapper {
    min-width: auto;
  }

  @media screen and (max-width: 1023px) {
    .category-editor {
      padding-left: 8px;
      padding-right: 8px;

      &__label {
        font-size: 13px;
        margin-top: 8px;
        margin-bottom: 4px;
      }
    }
  }

  @import "../EditMenuCardToolbar/emc-button";
</style>
