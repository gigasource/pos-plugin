<script>
import {
  type,
  layoutType,
  selectedProduct,
  debounceUpdateTextLayout,
  debouncedUpdateProduct,
  dialog,
  isPrinter2Select,
  isProductLayout,
  getPrinterClass,
  updateProduct,
  setProductInfo,
  openDialogInfo,
  updateProductLayout,
  addPopupModifierGroup,
  clearPopupModifierGroup,
  loadPrinters, loadCategories, loadTaxes, loadPopupModifierGroups,
} from './ProductEditorLogic'

import useI18n from 'vue-i18n'
import { useRouter } from 'vue-router'

import { onActivated } from 'vue';

const colors = '#FFFFFF,#CE93D8,#B2EBF2,#C8E6C9,#DCE775,#FFF59D,#FFCC80,#FFAB91'.split(',')

export default {
  name: 'ProductEditor2.vue',
  props: {},
  setup() {

    const { t: $t } = useI18n()
    const router = useRouter()

    (async () => {
      await loadPrinters()
      await loadCategories()
      await loadTaxes()
      await loadPopupModifierGroups()
    })()

    // set layout type by route
    function setLayoutTypeByRouteQuery() {
      if (router.query && router.query.type) {
        layoutType.value = router.query.type
      } else {
        layoutType.value = 'default'
      }
    }
    onActivated(() => setLayoutTypeByRouteQuery())
    setLayoutTypeByRouteQuery()


    function renderLayoutType() {
      return <>
        <div>{$t('article.type')}</div>
        <g-select
            disabled={!!(type && selectedProduct.id && selectedProduct.name && selectedProduct.price)}
            skip-search
            text-field-component="GTextFieldBs"
            v-model={type}
            items={types}
            onUpdate:modelValue={changeType}/>
      </>
    }

    function renderTextLayout() {
      const slots = {
        'append-inner': () =>
            <g-icon style="cursor: pointer" onClick={dialog.value.showTextKbd = true}>icon-keyboard</g-icon>
      }

      return <>
        <div>
          {$t('article.name')}
          <span style="color: #ff4552">*</span>
        </div>
        <g-text-field
            modelValue={selectedProductLayout.text}
            onUpdate:modelValue={debounceUpdateTextLayout('text', $event)} v-slot={slots}/>
      </>
    }

    function renderProductLayout() {
      const productIdSlots = {
        'append-inner': () => <g-icon style="cursor: pointer" onClick={openDialogInfo('id')}>icon-keyboard</g-icon>
      }

      const productNameSlots = {
        'append-inner': () => <g-icon style="cursor: pointer" onCick={openDialogInfo('name')}>icon-keyboard</g-icon>
      }

      const priceSlots = {
        'append-inner': () => <g-icon style="cursor: pointer" onClick={openDialogInfo('price')}>icon-keyboard</g-icon>
      }

      function updateProductInfo(prop, value) {
        setProductInfo(prop, value);
        debouncedUpdateProduct(prop, value);
      }

      return <>
        <div>{$t('article.id')} </div>
        <!-- product id -->
        <g-text-field-bs
            model-value={selectedProduct.id}
            onUpdate:modelValue={updateProductInfo('id', $event)}
            v-slots={productIdSlots}/>

        <!-- product name -->
        <div>{$t('article.name')}<span style="color: #FF4452">*</span></div>
        <g-text-field-bs
            model-value={selectedProduct.name}
            onUpdate:modelValue={updateProductInfo('name', $event)}
            v-slots={productNameSlots}/>

        <!-- price -->
        <div>{$t('article.price')} <span style="color: #FF4452">*</span></div>
        <g-text-field-bs
            model-value={selectedProduct.price}
            onUpdate:modelValue={updateProductInfo('price', $event)}
            v-slots={priceSlots}/>

        <!-- is modifier -->
        <g-switch
            model-value={selectedProduct.isModifier}
            onUpdate:modelValue={updateProduct({ isModifier: $event })}/>
        <div style="font-size: 13px">{$t('article.isModifier')}</div>
      </>
    }

    function renderPrinterSetting() {
      if (selectedProduct && !selectedProduct.isModifier) {
        return (
            <div>
              <div class="product-editor__prop">
                <span class="product-editor__label">{$t('restaurant.product.printer')}</span>
                {showAddPrinter2.value
                    ?
                    <span className="prop-option--printer" onClick={isPrinter2Select.value = true}>+2. {$t('restaurant.product.printer')}</span>
                    : null
                }
              </div>
              <div>
                {
                  printers.map((item, index) => <>
                    <span key={index} class={getPrinterClass(item._id)} onClick="selectPrinter(item._id)">{item.name}</span>
                    {isPrinter2Select.value
                        ? null
                        :
                        <span className={noPrintClasses} onClick="setAsNoPrint">{$t('restaurant.product.noPrinter')}</span>}
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
        default: (toggleSelect, item, index) => <>
          <div class="prop-option" onClick={e => {
            toggleSelect(item);
            updateProduct({ tax2: item.value, taxCategory2: item._id })
          }}>
            {item.text} ({item.value}%)
          </div>
        </>,
        selected: (toggleSelect, item, index) => <>
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
            <div class="product-editor__label">{$t('restaurant.product.dineInTax')}</div>
            <g-grid-select
                mandatory
                v-model="selectedProduct.taxCategory"
                item-value="_id"
                items={dineInTaxes} itemCols="auto"
                v-slot={dineInTaxSlots}/>
          </div>

          <div class="col-6">
            <div class="product-editor__label">{$t('restaurant.product.takeAwayTax')}</div>
            <g-grid-select
                mandatory
                v-model={selectedProduct.taxCategory2}
                item-value="_id"
                items={takeAwayTaxes}
                itemCols="auto"
                v-slots={takeAwayTaxSlots}/>
          </div>
        </div>
      </>
    }

    function renderColor() {
      return <>
        <div class="mt-2">
          <div class="product-editor__label">{$t('ui.color')}</div>
          <color-selector
              model-value={selectedProductLayout.color}
              colors={colors}
              item-size="25"
              onUpdate:modelValue={updateProductLayout({ color: $event })}/>
        </div>
      </>
    }

    function renderPopupModifier() {
      const popupModifierSlots = {
        default: (toggleSelect, item, index) =>
            <div class="prop-option" key={`${index}-default`} onClick={addPopupModifierGroup(toggleSelect, item)}>{item.name}</div>,
        selected: (toggleSelect, item, index) =>
            <div class="prop-option prop-option--1" key={`${index}-selected`} onClick={clearPopupModifierGroup(toggleSelect, item)}>{item.name}</div>
      }

      return <>
        <div class="mt-2">
          <div class="row-flex justify-between">
            <div class="product-editor__label">Popup modifiers</div>
            <g-icon size="16" onClick={dialog.popupModifiers = true}>icon-edit_modifiers</g-icon>
          </div>
          <div>
            <g-grid-select
                v-model={selectedProduct.activePopupModifierGroup}
                item-text="name"
                item-value="_id"
                items={popupModifierGroups}
                itemCols="auto" v-slots={popupModifierSlots}/>
          </div>
        </div>
      </>
    }

    function renderDialogProductInfo() {
      return (
          <dialog-product-info
              v-model="dialog.productInfo"
              product={selectedProduct}
              focus={dialog.focus}
              onSubmit={updateProduct}/>
      )
    }

    function renderTextFilter() {
      return (
          <dialog-text-filter
              label="Text"
              default-value={selectedProductLayout.text}
              v-model={dialog.showTextKbd}
              onSubmit={updateProductLayout({ text: $event, type: 'Text' }, $event)}/>
      )
    }

    function renderPopupModifierDialog() {
      return <dialog-edit-popup-modifiers v-model={dialog.popupModifiers} product={selectedProduct}/>
    }

    return () => {
      return isProductLayout ? <>
        {renderLayoutType()}
        {renderProductLayout()}
        {renderPrinterSetting()}
        {renderTax()}
        {renderColor()}
        {renderPopupModifier}
        {renderDialogProductInfo}
        {renderTextFilter}
        {renderPopupModifierDialog}
      </> : <>
        {renderLayoutType()}
        {renderTextLayout()}
        {renderPopupModifier()}
      </>
    }
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

