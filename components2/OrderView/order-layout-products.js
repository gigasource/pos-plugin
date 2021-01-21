import {
  collapseBlankColumn,
  collapseText, fontSize, hideBlankColumn,
  hideTextRow,
  minimumTextRow,
  scrollableLayout
} from "./order-layout-setting-logic";
import {isMobile} from "../AppSharedStates";
import {computed, reactive, ref} from "vue";
import _ from "lodash";
import {
  fillMissingAreas,
  getAreaStyle,
  getGridTemplateFromNumber, highlightSelectedProduct,
  selectedCategoryLayout,
  selectedProductLayout,
  editable, productDblClicked, products, updateView, updateSelectedProductLayout
} from './pos-ui-shared';
import {isSameArea} from "../../components/posOrder/util";
import {addProduct, getCurrentOrder} from "./pos-logic-be";
import {addModifier} from "./pos-logic";
import {orderLayoutKeyboardFactory} from "./order-layout-keyboard";

export function orderLayoutProductFactory() {
  const {renderKeyboard} = orderLayoutKeyboardFactory();

  const order = getCurrentOrder();
  const isTouchEventHandled = ref();
  const doubleClicked = ref(false);
  const lastSelectMoment = ref();

  const popupModifierDialog = reactive({
    value: false,
    product: {}
  });

  const productContainerStyle = computed(() => {
    const style = {
      display: 'grid',
      'grid-template-columns': getGridTemplateFromNumber(selectedCategoryLayout.value.columns),
      'grid-template-rows': scrollableLayout.value ?
        `repeat(${selectedCategoryLayout.value.rows}, 1fr)`
        : getGridTemplateFromNumber(selectedCategoryLayout.value.rows),
      'grid-gap': '5px',
      height: '100%'
    }
    if (minimumTextRow.value || hideTextRow.value) {
      let rows = []
      const texts = products.value.filter(p => p.type === 'Text')
      for (const text of texts) {
        let flag = true
        const row = text.top
        const rowItems = products.value.filter(p => p.top === row)
        for (const item of rowItems) {
          if (item.type !== 'Text') {
            flag = false;
            break;
          }
        }
        if (flag) rows.push(row)
      }
      if (hideTextRow.value) {
        const rowNo = selectedCategoryLayout.value.rows - _.uniq(rows).length
        const rowItem = scrollableLayout.value ? '1fr' : `calc(${100 / rowNo}% - ${5 * (selectedCategoryLayout.value.rows - 1) / rowNo}px)`
        style['grid-template-rows'] = _.range(0, selectedCategoryLayout.value.rows).map(i => rows.includes(i) ? '0' : rowItem).join(' ')
      } else {
        const rowNo = selectedCategoryLayout.value.rows
        const rowItem = scrollableLayout.value ? '1fr' : `calc(${100 / rowNo}% - ${5 * (rowNo - 1) / rowNo}px)`
        style['grid-template-rows'] = _.range(0, selectedCategoryLayout.value.rows).map(i => rows.includes(i) ? 'min-content' : rowItem).join(' ')
      }
    }
    if (collapseBlankColumn.value || hideBlankColumn.value) {
      let columns = [], col = 0
      while (col < selectedCategoryLayout.value.columns) {
        const colItems = products.value.filter(p => p.left === col)
        if (colItems.length === 0) {
          columns.push(col)
        }
        col++
      }
      if (hideBlankColumn.value) {
        const cols = selectedCategoryLayout.value.columns - columns.length
        style['grid-template-columns'] = _.range(0, selectedCategoryLayout.value.columns)
          .map(i => columns.includes(i) ? '0' : `calc(${100 / cols}% - ${5 * (selectedCategoryLayout.value.columns - 1) / cols}px)`)
          .join(' ')
      } else {
        const cols = 4 * selectedCategoryLayout.value.columns - 3 * columns.length
        style['grid-template-columns'] = _.range(0, selectedCategoryLayout.value.columns)
          .map(i => columns.includes(i) ? `calc(${100 / cols}% - ${5 * (cols - 1) / cols}px)` : `calc(${400 / cols}% - ${5 * (cols - 1) / cols}px)`)
          .join(' ')
      }
    }
    return style
  })

  function getProductItemStyle(productLayout) {
    const isProductSelected = selectedProductLayout.value && isSameArea(selectedProductLayout.value, productLayout);
    const style = {
      backgroundColor: productLayout.color,
      color: '#000',
      borderRadius: '2px',
    };
    if (!productLayout.name && !productLayout.text && !productLayout.product) {
      style.border = '1px dashed #bdbdbd'
    }
    if (isProductSelected && highlightSelectedProduct.value) {
      style.boxShadow = '0px 0px 3px #0091FF';
      style.border = '1px solid #2972FF'
    }
    if (productLayout.type === 'Text') {
      style.backgroundColor = 'transparent'
      style.fontWeight = '400'
      style.color = '#212121'
      style.lineHeight = 1.2
    }
    if (productLayout.product && productLayout.product.isModifier) {
      style.fontStyle = 'italic'
    }
    if (isMobile.value) {
      style.fontSize = fontSize.value
    }
    return style;
  }

  function getProductListeners(productLayout) {
    //todo: manual test here
    return editable.value
      ? {
        onClick: () => onClick(productLayout),
        onTouchstart: () => onTouchStart(productLayout)
      }
      : {
        onClick: () => {
          if (productLayout.type === 'Text') return
          const {product} = productLayout;
          if (product.activePopupModifierGroup) return showPopupModifierDialog(productLayout)
          _addProductToOrder(productLayout);
        }
      }
  }

  //fixme: refactor
  function _addProductToOrder({product}) {
    // Handle these stuff in productSelected event.
    // work-around
    if (!product || !product._id)
      return
    if (product.isModifier) {
      addModifier(order, _.pick(product, ['name', 'price']));
    } else {
      addProduct(order, product);
    }
  }

  function onClick(productLayout) {
    if (!isTouchEventHandled.value) {
      onProductSelect(productLayout)
    }
  }

  function onTouchStart(productLayout) {
    isTouchEventHandled.value = true
    onProductSelect(productLayout)
  }

  function onProductSelect(productLayout) {
    if (editable.value) {
      selectProduct(productLayout);

      // Known issues:
      //    + if user do n click/tab in short time, (n-1) double tab event will be raised
      //    + if user double click on item x, then click very fast to another item y,
      //      switch item action will not be executed because of the click event to item y has been omitted.
      // TODO: Fix known issues
      doubleClicked.value = false
      lastSelectMoment.value = new Date().getTime()
      // double click is ~300->350ms
      const timeout = 200
      setTimeout(() => {
        if (new Date().getTime() - lastSelectMoment.value < timeout) {
          doubleClicked.value = true
          productDblClicked.value = true;
        } else {
          if (!doubleClicked.value) {
            _addProductToOrder(productLayout);
            productDblClicked.value = false;
          }
        }
      }, timeout)
    } else {
    }
  }

  function highlightProduct(productLayout) {
    if (!editable.value && productLayout.type === 'Text')
      return

    highlightSelectedProduct.value = true

    if (!editable.value) {
      // flash in view mode
      setTimeout(() => {
        highlightSelectedProduct.value = false
      }, 200)
    }
  }

  async function selectProduct(productLayout) {
    if (editable.value) {
      if (selectedCategoryLayout.value._id) {
        updateView('ProductEditor')
        updateSelectedProductLayout(productLayout)
      }
    } else {
      updateSelectedProductLayout(productLayout)
    }
    highlightProduct(productLayout)
  }

  function getProductName(productLayout) {
    if (productLayout.type === 'Text')
      return productLayout.text
    if (productLayout.product && productLayout.product._id && productLayout.product.id)
      return `${productLayout.product.id}. ${productLayout.product.name}`
    else
      return productLayout.product.name
  }

  async function showPopupModifierDialog({product}) {
    const globalModifierGroups = await cms.getModel('PosModifierGroup').find({isGlobal: true})
    if (!globalModifierGroups.length && !product.activePopupModifierGroup) {
      return _addProductToOrder({product})
    }

    console.log('show popup')
    _.assign(popupModifierDialog, {
      value: true,
      product
    })
  }

  async function addProductWithModifier(product, modifiers) {
    //todo: test if can not create the right modifier
    addProduct(order, product);
    await Promise.resolve();
    for (const modifier of modifiers) {
      addModifier(order, modifier);
      await Promise.resolve();
    }
  }

  const renderProducts = () => (<>
    {
      selectedCategoryLayout.value &&
      <div style="padding: 4px; flex: 1">
        <div style={productContainerStyle.value}>
          {
            products.value.map(productLayout => (
              <div
                class={['pol__prod', !editable.value && 'darken-effect', isMobile.value && collapseText.value && 'collapsed']}
                style={[getAreaStyle(productLayout), getProductItemStyle(productLayout)]}
                {...getProductListeners(productLayout)}>
                {productLayout.icon && <g-icon class="mr-1">{productLayout.icon}</g-icon>}
                {productLayout.product && productLayout.product.isModifier ?
                  <div style="transform: skewX(-15deg)">{getProductName(productLayout)}</div> :
                  <div>{getProductName(productLayout)}</div>}
              </div>
            ))
          }
          {{/*renderKeyboard()*/}}
        </div>
      </div>
    }
    <dialog-choose-popup-modifier v-model={popupModifierDialog.value} product={popupModifierDialog.product}
                                  onSave={addProductWithModifier}/>
  </>)

  return {
    renderProducts
  }
}
