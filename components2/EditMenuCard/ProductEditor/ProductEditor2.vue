<script>
import {selectedProduct, selectedProductLayout, selectedProductLayoutPosition} from '../../OrderView/pos-ui-shared';

import {
  addPopupModifierGroup,
  allowSelectPrinter2,
  changeType,
  clearPopupModifierGroup,
  debouncedUpdateProduct,
  debounceUpdateTextLayout,
  dineInTaxes,
  isPrinter2Select,
  isProductLayout,
  layoutType,
  loadCategories,
  loadPrinters,
  loadTaxes,
  printers,
  selectPrinter,
  setAsNoPrint,
  showAddPrinter2,
  takeAwayTaxes,
  type,
  types,
  updateProduct,
  updateProductLayout
} from './ProductEditorLogic'
import {useI18n} from 'vue-i18n'
import {useRouter} from 'vue-router'
import {computed, onActivated, reactive, watch, onDeactivated} from 'vue';
import {genScopeId} from '../../utils';
import dialogEditPopupModifiers2 from "../../Modifiers/dialogEditPopupModifier/dialogEditPopupModifiers2";
import dialogProductInfo from "../dialog/dialogProductInfo";
import dialogTextFilter from "../../pos-shared-components/dialogFilter/dialogTextFilter";
import { modifierHooks } from '../../Modifiers/dialogEditPopupModifier/modifier-ui-logics';
import {modifierGroups} from "../../Modifiers/dialogEditPopupModifier/modifier-ui-logics";


const colors = ['#FFFFFF','#CE93D8','#B2EBF2','#C8E6C9','#DCE775','#FFF59D','#FFCC80','#FFAB91']

export default {
  name: 'ProductEditor2.vue',
  props: {},
  components: {dialogEditPopupModifiers2, dialogProductInfo, dialogTextFilter}, // TODO: update component
  setup() {
    const {t} = useI18n()
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

    function openDialogTextFilter() {
      dialog.showTextKbd = true
    }


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
      if (!selectedProduct.value)
        return
      return <>
        <div>{t('article.type')}</div>
        <g-select
            disabled={!!(type.value && selectedProduct.value.id && selectedProduct.value.name && selectedProduct.value.price)}
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
              'append-inner': () => <g-icon style="cursor: pointer"
                                            onClick={() => openDialogTextFilter()}>icon-keyboard</g-icon>
            }}/>
      </>
    }

    function renderProductLayout() {
      if (!selectedProduct.value)
        return
      return <>
        <div>{t('article.id')} </div>
        <g-text-field-bs
            model-value={selectedProduct.value.id}
            onUpdate:modelValue={e => debouncedUpdateProduct('id', e)}
            v-slots={{
              'append-inner': () => <g-icon style="cursor: pointer"
                                            onClick={() => openDialogInfo('id')}>icon-keyboard</g-icon>
            }}/>

        <div>{t('article.name')}<span style="color: #FF4452">*</span></div>
        <g-text-field-bs
            model-value={selectedProduct.value.name}
            onUpdate:modelValue={e => debouncedUpdateProduct('name', e)}
            v-slots={{
              'append-inner': () => <g-icon style="cursor: pointer"
                                            onClick={() => openDialogInfo('name')}>icon-keyboard</g-icon>
            }}/>

        <div>{t('article.price')} <span style="color: #FF4452">*</span></div>
        <g-text-field-bs
            model-value={selectedProduct.value.price}
            onUpdate:modelValue={e => debouncedUpdateProduct('price', e)}
            v-slots={{
              'append-inner': () => <g-icon style="cursor: pointer"
                                            onClick={() => openDialogInfo('price')}>icon-keyboard</g-icon>
            }}/>

        <g-switch
            model-value={selectedProduct.value.isModifier}
            onUpdate:modelValue={e => updateProduct({isModifier: e})}/>
        <div style="font-size: 13px">{t('article.isModifier')}</div>
      </>
    }

    function renderPrinterSetting() {
      if (selectedProduct.value && !selectedProduct.value.isModifier) {
        return (
            <div>
              <div class="product-editor__prop">
                <span class="product-editor__label">{t('restaurant.product.printer')}</span>
                {showAddPrinter2.value && <span class="prop-option--printer"
                                                onClick={() => allowSelectPrinter2()}>+2. {t('restaurant.product.printer')}</span>}
              </div>
              <div>
                {printers.value.map((item, index) => <span key={index} class={getPrinterClass(item._id)}
                                                           onClick={() => selectPrinter(item._id)}>{item.name}</span>)}
                {!isPrinter2Select.value &&
                <span class={noPrintClasses.value} onClick={setAsNoPrint}>{t('restaurant.product.noPrinter')}</span>}
              </div>
            </div>
        )
      }
    }

    function renderTax() {
      if (!selectedProduct.value)
        return
      const dineInTaxSlots = {
        default: ({toggleSelect, item, index}) => {
          return genScopeId(() =>
              <div class="prop-option"
                   onClick={e => {
                     toggleSelect(item);
                     updateProduct({tax: item.value, taxCategory: item._id})
                   }}>
                {item.text} ({item.value}%)
              </div>)()
        },
        selected: ({toggleSelect, item, index}) => {
          return genScopeId(() =>
              <div class="prop-option prop-option--1"
                   onClick={e => {
                     toggleSelect(item);
                     updateProduct({tax: item.value, taxCategory: item._id})
                   }}>{item.text} ({item.value}%)
              </div>)()
        }
      }

      const takeAwayTaxSlots = {
        default: ({toggleSelect, item, index}) => {
          return genScopeId(() =>
              <div class="prop-option" onClick={e => {
                toggleSelect(item);
                updateProduct({tax2: item.value, taxCategory2: item._id})
              }}>
                {item.text} ({item.value}%)
              </div>)()
        },
        selected: ({toggleSelect, item, index}) => {
          return genScopeId(() =>
              <div class="prop-option prop-option--1"
                   onClick={e => {
                     toggleSelect(item);
                     updateProduct({tax2: item.value, taxCategory2: item._id})
                   }}>
                {item.text} ({item.value}%)
              </div>)()
        }
      }

      return (
          <div class="row-flex mt-2 product-editor__tax">
            <div class="col-6">
              <div class="product-editor__label">{t('restaurant.product.dineInTax')}</div>
              <g-grid-select
                  mandatory
                  v-model={selectedProduct.value.taxCategory}
                  item-value="_id"
                  items={dineInTaxes.value}
                  itemCols="auto"
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
      )
    }

    const renderColor = () => {
      if (!selectedProductLayout.value) return
      return (
        <div class="mt-2">
          <div class="product-editor__label">{t('ui.color')}</div>
          <color-selector
              model-value={selectedProductLayout.value.color}
              colors={colors}
              item-size="25"
              onUpdate:modelValue={e => updateProductLayout({color: e})}/>
        </div>
      )
    }

    const renderPopupModifier = () => isProductLayout.value && selectedProduct.value && (
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
                items={modifierGroups.value.groups}
                itemCols="auto" v-slots={{
              default: ({ toggleSelect, item, index }) =>
                  <div class="prop-option" key={`${index}-default`} onClick={() => addPopupModifierGroup(toggleSelect, item)}>{item.name}</div>,
              selected: ({ toggleSelect, item, index }) =>
                  <div class="prop-option prop-option--1" key={`${index}-selected`} onClick={() => clearPopupModifierGroup(toggleSelect, item)}>{item.name}</div>
            }}/>
          </div>
        </div>
    )

    const renderDialogProductInfo = () => (
        <dialog-product-info
            v-model={dialog.productInfo}
            product={selectedProduct.value}
            focus={dialog.focus}
            onSubmit={updateProduct}/>
    )

    const renderTextFilter = () => (
        <dialog-text-filter
            label="Text"
            default-value={selectedProductLayout.value.text}
            v-model={dialog.showTextKbd}
            onSubmit={e => updateProductLayout({text: e, type: 'Text'}, e)}/>
    )

    const renderPopupModifierDialog = () => <dialog-edit-popup-modifiers2
        v-model={dialog.popupModifiers}
        product={selectedProduct.value}/>

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
    onDeactivated(() => {
      selectedProductLayoutPosition.value = { top: 0, left: 0 }
    })

    async function _created() {
      await loadPrinters()
      await loadCategories()
      await loadTaxes()
      modifierHooks.emit('updateModifiers')
    }

    _created()

    return genScopeId(() => {
      return <div class="product-editor">
        {isProductLayout.value ? <>
          <div class="product-editor__prop-grid">
            {renderLayoutType()}
            {renderProductLayout()}
          </div>
          {renderPrinterSetting()}
          {renderTax()}
          {renderColor()}
          {renderPopupModifier()}
          {renderDialogProductInfo()}
          {renderPopupModifierDialog()}
        </> : <>
          <div class="product-editor__prop-grid">
            {renderLayoutType()}
            {renderTextLayout()}
          </div>
          {renderTextFilter()}
          {renderPopupModifier()}
        </>
        }
      </div>
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
  padding-bottom: 40px;

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

:deep .prop-option {
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

