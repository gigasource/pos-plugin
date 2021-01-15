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
  mode, editable, productDblClicked, products
} from "./pos-ui-shared";
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
      'grid-template-columns': getGridTemplateFromNumber(selectedCategoryLayout.columns),
      'grid-template-rows': scrollableLayout.value ? `repeat(${selectedCategoryLayout.rows}, 1fr)` : getGridTemplateFromNumber(selectedCategoryLayout.rows),
      'grid-gap': '5px',
      height: '100%'
    }
    if (minimumTextRow.value || hideTextRow.value) {
      let rows = []
      const texts = products.filter(p => p.type === 'Text')
      for (const text of texts) {
        let flag = true
        const row = text.top
        const rowItems = products.filter(p => p.top === row)
        for (const item of rowItems) {
          if (item.type !== 'Text') {
            flag = false;
            break;
          }
        }
        if (flag) rows.push(row)
      }
      if (hideTextRow.value) {
        const rowNo = selectedCategoryLayout.rows - _.uniq(rows).length
        const rowItem = scrollableLayout.value ? '1fr' : `calc(${100 / rowNo}% - ${5 * (selectedCategoryLayout.rows - 1) / rowNo}px)`
        style['grid-template-rows'] = _.range(0, selectedCategoryLayout.rows).map(i => rows.includes(i) ? '0' : rowItem).join(' ')
      } else {
        const rowNo = selectedCategoryLayout.rows
        const rowItem = scrollableLayout.value ? '1fr' : `calc(${100 / rowNo}% - ${5 * (rowNo - 1) / rowNo}px)`
        style['grid-template-rows'] = _.range(0, selectedCategoryLayout.rows).map(i => rows.includes(i) ? 'min-content' : rowItem).join(' ')
      }
    }
    if (collapseBlankColumn.value || hideBlankColumn.value) {
      let columns = [], col = 0
      while (col < selectedCategoryLayout.columns) {
        const colItems = products.filter(p => p.left === col)
        if (colItems.length === 0) {
          columns.push(col)
        }
        col++
      }
      if (hideBlankColumn.value) {
        const cols = selectedCategoryLayout.columns - columns.length
        style['grid-template-columns'] = _.range(0, selectedCategoryLayout.columns)
          .map(i => columns.includes(i) ? '0' : `calc(${100 / cols}% - ${5 * (selectedCategoryLayout.columns - 1) / cols}px)`)
          .join(' ')
      } else {
        const cols = 4 * selectedCategoryLayout.columns - 3 * columns.length
        style['grid-template-columns'] = _.range(0, selectedCategoryLayout.columns)
          .map(i => columns.includes(i) ? `calc(${100 / cols}% - ${5 * (cols - 1) / cols}px)` : `calc(${400 / cols}% - ${5 * (cols - 1) / cols}px)`)
          .join(' ')
      }
    }
    return style
  })

  function getProductItemStyle(product) {
    const isProductSelected = selectedProductLayout && isSameArea(selectedProductLayout, product);
    const style = {
      backgroundColor: product.color,
      color: '#000',
      borderRadius: '2px',
    };
    if (!product.name && !product.text && !product.product) {
      style.border = '1px dashed #bdbdbd'
    }
    if (isProductSelected && highlightSelectedProduct.value) {
      style.boxShadow = '0px 0px 3px #0091FF';
      style.border = '1px solid #2972FF'
    }
    if (product.type === 'Text') {
      style.backgroundColor = 'transparent'
      style.fontWeight = '400'
      style.color = '#212121'
      style.lineHeight = 1.2
    }
    if (product.product && product.product.isModifier) {
      style.fontStyle = 'italic'
    }
    if (isMobile) {
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
      addModifier(order, _.omit(product, ['name', 'price']));
    } else {
      console.log(product);
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
      if (selectedCategoryLayout._id) {
        if (mode.value === 'ingredient') {
          view.value = {name: 'IngredientEditor'};
        } else {
          view.value = {name: 'ProductEditor'};
        }
        selectedProductLayout.value = productLayout;
      }
    } else {
      selectedProductLayout.value = productLayout;
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
      selectedCategoryLayout &&
      <div style="padding: 4px; flex: 1">
        <div style={productContainerStyle}>
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
          {renderKeyboard()}
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