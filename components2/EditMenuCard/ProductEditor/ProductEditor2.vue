<script>
import {
  view,
  selectedProductLayout,
  selectedProduct,
  ProductEditModes,
  updateProductEditMode,
} from '../../OrderView/pos-ui-shared';

import {
  isProductLayout,
  /*type*/
  changeType, types, type, layoutType,
  /*taxes*/
  dineInTaxes, takeAwayTaxes, showDineInTax, loadTaxes,
  /*printer*/
  printers, isPrinter2Select, showAddPrinter2, loadPrinters, selectPrinter, setAsNoPrint,
  /*category*/
  categories, loadCategories, changeCategory,
  /*modifier*/
  popupModifierGroups, loadPopupModifierGroups, changePopupModifierGroup, addPopupModifierGroup, clearPopupModifierGroup,
  /*product layout*/ createNewProductLayout, updateProductLayout, debounceUpdateTextLayout,
  /*product*/
  updateProduct, setProductInfo, debouncedUpdateProduct,
  /*action*/
  canDelete, canSwitch, canCopy, deleteProductLayout, setAction
} from './ProductEditorLogic'

import constants from '../EditMenuCardToolbar/constants';
import { useI18n }  from 'vue-i18n'
import { useRouter } from 'vue-router'
import { computed, onActivated, reactive, watch, ref } from 'vue';
import { genScopeId } from '../../utils';


const colors = '#FFFFFF,#CE93D8,#B2EBF2,#C8E6C9,#DCE775,#FFF59D,#FFCC80,#FFAB91'.split(',')

export default {
  name: 'ProductEditor2.vue',
  props: {},
  setup() {
    const { t } = useI18n()
    const router = useRouter()

    const dialog = reactive({
      productInfo: false,
      popupModifiers: false,
      focus: 'id',
      showTextKbd: false,
    })

    function openDialogInfo(focus) {
      dialog.focus = focus
      dialog.productInfo = true
    }

    watch(() => dialog.popupModifiers, async (val) => {
      await loadPopupModifierGroups()
    })



    // styles
    const noPrintClasses = computed(() => ({
      'prop-option': true,
      'prop-option--1': selectedProduct.value.isNoPrint,
    }))

    const itemNoteClasses = computed(() => ({
      'prop-option': true,
      'prop-option--1': selectedProduct.value.isItemNote,
    }))

    const getPrinterClass = (printer) => {
      return {
        'prop-option': true,
        'prop-option--1': selectedProduct.value.groupPrinter && selectedProduct.value.groupPrinter._id === printer,
        'prop-option--2': selectedProduct.value.groupPrinter2 && selectedProduct.value.groupPrinter2._id === printer,
      }
    }

    function renderLayoutType() {
      return <>
        <div>{t('article.type')}</div>
        <g-select
            disabled={!!(type && selectedProduct.value.id && selectedProduct.value.name && selectedProduct.value.price)}
            skip-search
            text-field-component="GTextFieldBs"
            v-model={type.value}
            items={types}
            onUpdate:modelValue={changeType}/>
      </>
    }

    function renderTextLayout() {
      return <>
        <div>
          {t('article.name')}
          <span style="color: #ff4552">*</span>
        </div>
        <g-text-field
            modelValue={selectedProductLayout.value.text}
            onUpdate:modelValue={e => debounceUpdateTextLayout('text', e)}
            v-slots={{
              'append-inner': () => <g-icon style="cursor: pointer" onClick={() => dialog.showTextKbd = true}>icon-keyboard</g-icon>
            }}/>
      </>
    }

    function renderProductLayout() {
      function updateProductInfo(prop, value) {
        setProductInfo(prop, value);
        debouncedUpdateProduct(prop, value);
      }

      return <>
        <div>{t('article.id')} </div>
        <g-text-field-bs
            model-value={selectedProduct.value.id}
            onUpdate:modelValue={e => updateProductInfo('id', e)}
            v-slots={{
              'append-inner': () => <g-icon style="cursor: pointer" onClick={() => openDialogInfo('id')}>icon-keyboard</g-icon>
            }}/>

        <div>{t('article.name')}<span style="color: #FF4452">*</span></div>
        <g-text-field-bs
            model-value={selectedProduct.value.name}
            onUpdate:modelValue={e => updateProductInfo('name', e)}
            v-slots={{
              'append-inner': () => <g-icon style="cursor: pointer" onClick={() => openDialogInfo('name')}>icon-keyboard</g-icon>
            }}/>

        <div>{t('article.price')} <span style="color: #FF4452">*</span></div>
        <g-text-field-bs
            model-value={selectedProduct.value.price}
            onUpdate:modelValue={e => updateProductInfo('price', e)}
            v-slots={{
              'append-inner': () => <g-icon style="cursor: pointer" onClick={() => openDialogInfo('price')}>icon-keyboard</g-icon>
            }}/>

        <g-switch
            model-value={selectedProduct.value.isModifier}
            onUpdate:modelValue={e => updateProduct({ isModifier: e })}/>
        <div style="font-size: 13px">{t('article.isModifier')}</div>
      </>
    }

    function renderPrinterSetting() {
      if (selectedProduct.value && !selectedProduct.value.isModifier) {
        return (
            <div>
              <div class="product-editor__prop">
                <span class="product-editor__label">{t('restaurant.product.printer')}</span>
                {showAddPrinter2.value
                    ?
                    <span class="prop-option--printer" onClick={() => isPrinter2Select.value = true}>+2. {t('restaurant.product.printer')}</span>
                    : null
                }
              </div>
              <div>
                {
                  printers.value.map((item, index) => <>
                    <span key={index} class={getPrinterClass(item._id)} onClick={() => selectPrinter(item._id)}>{item.name}</span>
                    {isPrinter2Select.value
                        ? null
                        :
                        <span class={noPrintClasses} onClick={setAsNoPrint}>{t('restaurant.product.noPrinter')}</span>}
                  </>)
                }
              </div>
            </div>
        )
      }
    }

    function renderTax() {
      const dineInTaxSlots = {
        default: ({ toggleSelect, item, index }) => <>
          <div class="prop-option"
               onClick={e => {
                 toggleSelect(item);
                 updateProduct({ tax: item.value, taxCategory: item._id })
               }}>
            {item.text} ({item.value}%)
          </div>
        </>,
        selected: ({ toggleSelect, item, index }) => <>
          <div class="prop-option prop-option--1"
               onClick={e => {
                 toggleSelect(item);
                 updateProduct({ tax: item.value, taxCategory: item._id })
               }}>{item.text} ({item.value}%)
          </div>
        </>
      }

      const takeAwayTaxSlots = {
        default: ({toggleSelect, item, index}) => <>
          <div class="prop-option" onClick={e => {
            toggleSelect(item);
            updateProduct({ tax2: item.value, taxCategory2: item._id })
          }}>
            {item.text} ({item.value}%)
          </div>
        </>,
        selected: ({toggleSelect, item, index}) => <>
          <div class="prop-option prop-option--1" onClick={e => {
            toggleSelect(item);
            updateProduct({ tax2: item.value, taxCategory2: item._id })
          }}>
            {item.text} ({item.value}%)
          </div>
        </>

      }

      return <>
        <div class="row-flex mt-2 product-editor__tax">
          <div class="col-6">
            <div class="product-editor__label">{t('restaurant.product.dineInTax')}</div>
            <g-grid-select
                mandatory
                v-model={selectedProduct.value.taxCategory}
                item-value="_id"
                items={dineInTaxes.value} itemCols="auto"
                v-slots={dineInTaxSlots}/>
          </div>

          <div class="col-6">
            <div class="product-editor__label">{t('restaurant.product.takeAwayTax')}</div>
            <g-grid-select
                mandatory
                v-model={selectedProduct.value.taxCategory2}
                item-value="_id"
                items={takeAwayTaxes.value}
                itemCols="auto"
                v-slots={takeAwayTaxSlots}/>
          </div>
        </div>
      </>
    }

    function renderColor() {
      return <>
        <div class="mt-2">
          <div class="product-editor__label">{t('ui.color')}</div>
          <color-selector
              model-value={selectedProductLayout.value.color}
              colors={colors}
              item-size="25"
              onUpdate:modelValue={e => updateProductLayout({ color: e })}/>
        </div>
      </>
    }

    function renderPopupModifier() {
      return <>
        <div class="mt-2">
          <div class="row-flex justify-between">
            <div class="product-editor__label">Popup modifiers</div>
            <g-icon size="16" onClick={() => dialog.popupModifiers = true}>icon-edit_modifiers</g-icon>
          </div>
          <div>
            <g-grid-select
                v-model={selectedProduct.value.activePopupModifierGroup}
                item-text="name"
                item-value="_id"
                items={popupModifierGroups.value}
                itemCols="auto" v-slots={{
                  default: ({toggleSelect, item, index}) =>
                      <div class="prop-option" key={`${index}-default`} onClick={() => addPopupModifierGroup(toggleSelect, item)}>{item.name}</div>,
                  selected: ({toggleSelect, item, index}) =>
                      <div class="prop-option prop-option--1" key={`${index}-selected`} onClick={() => clearPopupModifierGroup(toggleSelect, item)}>{item.name}</div>
                }}/>
          </div>
        </div>
      </>
    }

    function renderDialogProductInfo() {
      return (
          <dialog-product-info
              v-model={dialog.productInfo}
              product={selectedProduct.value}
              focus={dialog.focus}
              onSubmit={updateProduct}/>
      )
    }

    function renderTextFilter() {
      return (
          <dialog-text-filter
              label="Text"
              default-value={selectedProductLayout.value.text}
              v-model={dialog.showTextKbd}
              onSubmit={e => updateProductLayout({ text: e, type: 'Text' }, e)}/>
      )
    }

    function renderPopupModifierDialog() {
      return <dialog-edit-popup-modifiers v-model={dialog.popupModifiers} product={selectedProduct.value}/>
    }

    //// toolbar
    function renderToolbarButtons() {
      return <>
        <portal to={constants.portalLeftButtons}>
          <g-btn-bs elevation="2" icon="icon-edit-menu-card-switch" onClick={() => setAction('switch')} disabled={!canSwitch.value}>{t('ui.switch')}</g-btn-bs>
          <g-btn-bs elevation="2" icon="icon-edit-menu-card-copy" onClick={() => setAction('copy')} disabled={!canCopy.value}>{t('ui.copy')}</g-btn-bs>
          { renderDeleteProductToolbarButton() }
        </portal>
        <portal to={constants.portalRightButtons}>
          { renderSwitchProductEditModeButton() }
        </portal>
      </>
    }

    // delete button
    const showDeleteConfirmDialog = ref(false)
    function renderDeleteProductToolbarButton() {
      return <>
        <g-btn-bs elevation="2" icon="icon-edit-menu-card-delete" onClick={() => showDeleteConfirmDialog.value = true} disabled={!canDelete.value}>{t('ui.delete')}</g-btn-bs>
        <dialog-confirm-delete v-model={showDeleteConfirmDialog.value} type=' this product' onSubmit={() => {
          deleteProductLayout();
          showDeleteConfirmDialog.value = false;
        }}></dialog-confirm-delete>
      </>
    }

    // render switch product editor mode
    const showSwitchEditModeDialog = ref(false)
    const shouldShowSwitchEditModeDialog = ref(true)
    function openSwitchModeDialogIfNeeded() {
      if (shouldShowSwitchEditModeDialog.value) {
        showSwitchEditModeDialog.value = true
        shouldShowSwitchEditModeDialog.value = false
      }
    }
    function changeToIngredientMode() {
      openSwitchModeDialogIfNeeded()
      updateProductEditMode(ProductEditModes.ingredient)
    }
    function renderSwitchProductEditModeButton() {
      return <>
        {
          view.value.mode === ProductEditModes.ingredient
              ? <g-btn-bs elevation="2" icon="icon-ingredient-mode" onClick={() => updateProductEditMode(ProductEditModes.basic)}>{t('inventory.ingredientMode')} </g-btn-bs>
              : <g-btn-bs elevation="2" icon="icon-basic-mode" onClick={changeToIngredientMode}>{t('inventory.basicMode')} </g-btn-bs>
        }
        <g-dialog v-model={showSwitchEditModeDialog.value} eager width="448">
          <div class="dialog" onClick={() => showSwitchEditModeDialog.value = false}>
            <div class="dialog-content">
              <g-icon>icon-basic-mode</g-icon>
              <div style="flex: 1; margin-left: 16px">
                <p class="dialog-content__title">{t('inventory.basicMode')}</p>
                <p class="dialog-content__detail">{t('inventory.basicNote')}</p>
              </div>
            </div>
            <div class="dialog-content">
              <g-icon>icon-ingredient-mode</g-icon>
              <div style="flex: 1; margin-left: 16px">
                <p class="dialog-content__title">{t('inventory.ingredientMode')}</p>
                <p class="dialog-content__detail">{t('inventory.ingredientNote')}</p>
              </div>
            </div>
            <div class="dialog-message">{t('inventory.clickDismiss')}</div>
          </div>
        </g-dialog>
      </>
    }

    // set layout type by route
    function setLayoutTypeByRouteQuery() {
      if (router.query && router.query.type) {
        layoutType.value = router.query.type
      } else {
        layoutType.value = 'default'
      }
    }

    setLayoutTypeByRouteQuery()
    onActivated(() => setLayoutTypeByRouteQuery())
    async function _created() {
      await loadPrinters()
      await loadCategories()
      await loadTaxes()
      await loadPopupModifierGroups()
    }

    _created()

    return genScopeId(() => {
      return isProductLayout.value ? <>
        {renderLayoutType()}
        {renderProductLayout()}
        {renderPrinterSetting()}
        {renderTax()}
        {renderColor()}
        {renderPopupModifier()}
        {renderDialogProductInfo()}
        {renderTextFilter()}
        {renderPopupModifierDialog()}
        {renderToolbarButtons()}
      </> : <>
        {renderLayoutType()}
        {renderTextLayout()}
        {renderPopupModifier()}
        {renderToolbarButtons()}
      </>
    })
  }
}
</script>

<style scoped lang="scss">
.product-editor {
  padding-left: 20px;
  padding-right: 20px;
  height: 100%;
  overflow: auto;

  &__prop-grid {
    display: grid;
    grid-template-columns: 60px calc(100% - 60px);
    grid-auto-rows: 50px;
    align-items: center;

    ::v-deep .bs-tf-input {
      width: 100%;
    }

    .g-select ::v-deep .bs-tf-input {
      width: 0;
    }
  }

  &__label {
    font-size: 15px;
    font-weight: 700;
    color: #1d1d26;
  }

  &__printer {
    padding: 4px;
    margin-right: 4px;
    border-radius: 4px;
    border: 1px solid #000;
    cursor: pointer;
  }

  &__prop {
    display: flex;
    justify-content: space-between;
    padding-bottom: 8px;
  }

  ::v-deep .g-col {
    padding: 0;
  }
}

.prop-option {
  display: inline-block;
  padding: 0 6px;
  margin-right: 4px;
  margin-bottom: 2px;
  cursor: pointer;
  border: 1px solid #E0E0E0;
  box-sizing: border-box;
  border-radius: 2px;
  font-size: 13px;

  &--1 {
    background: #E3F2FD;
    border: 1px solid #90CAF9;
  }

  &--2 {
    background: #ffab91;
    border: 1px solid #e6724b;
  }

  &--printer {
    background: #FFFFFF;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1398);
    border-radius: 2px;
    padding: 0 8px;
    font-size: 13px;
  }

  &--disabled {
    opacity: 0.5;
  }
}

.g-snack ::v-deep .g-snack-wrapper {
  min-width: auto;
}

@media screen and (max-width: 1023px) {
  .product-editor {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>

