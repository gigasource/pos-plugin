<script>
import { computed, onActivated, ref, withModifiers } from 'vue'
import _ from 'lodash'
import { GScrollWindow, GScrollWindowItem } from 'pos-vue-framework';
import { execGenScopeId, genScopeId } from '../../utils';
import { categories, products } from '../../Product/product-logic'
import { selectedCategory } from '../pos-retail-shared-logic'
import { getCurrentOrder, prepareOrder } from '../../OrderView/pos-logic-be'
import { addItem } from '../../OrderView/pos-logic';
import { loadRetailLayoutSetting, retailLayoutSetting } from './retail-layout-setting-logic';

export default {
  name: 'PosOrderScreenScrollWindow',
  components: [GScrollWindow, GScrollWindowItem],
  props: {
    value: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    let itemRef = {}

    /**
     * Object key is category._id
     */
    const groupedProducts = computed(() => {
      const result = {}
      categories.value.forEach(category => {
        const cateId = category._id.toString()
        result[cateId] = _.cloneDeep(products.value.filter(product => {
          return product.category && !!product.category.find(_category => {
            return _category.toString() === cateId
          })
        }))
        //todo: sort
        // result[category].sort((current, next) => {
        //   return getProductGridOrder()
        // })
      })
      return result
    })

    const favoriteProducts = computed(() => {
      const result = products.value.filter(product => {
        return product.option && product.option.favorite
      })
      return result
    })

    const numberOfProductsInWindows = computed(() => retailLayoutSetting.productColumn * retailLayoutSetting.productRow)
    const productWindows = computed(() => {
      const result = {}
      Object.keys(groupedProducts.value).forEach(category => {
        result[category] = _.chunk(groupedProducts.value[category], numberOfProductsInWindows.value)
      })
      result['Favorite'] = _.chunk(favoriteProducts.value, numberOfProductsInWindows.value)
      return result
    })

    function setItemRef(el, category) {
      if (el) {
        itemRef[category] = el
      }
    }

    onActivated(() => {
      prepareOrder(0)
      loadRetailLayoutSetting()
    })

    function addProduct(item) {
      const order = getCurrentOrder()
      addItem(order, item, 1)
    }

    const productWindowsIndex = ref({})

    function getItemStyle(item) {
      const customizableStyle = {
        fontSize: retailLayoutSetting.productFontSize + 'px'
      }

      if (retailLayoutSetting.showFullProductName) {
        customizableStyle.overflow = 'initial'
        customizableStyle.whiteSpace = 'initial'
      }

      if (item.layouts) {
        return {
          order: item.layouts[0].order,
          ...(item.layouts[0].color === '#FFFFFF' || !item.layouts[0].color) && { border: '1px solid #979797', backgroundColor: '#FFF' },
          ...item.layouts[0].color && item.layouts[0].color !== '#FFFFFF' && { backgroundColor: item.layouts[0].color },
          ...customizableStyle
        }
      }

      return customizableStyle
    }

    function getWindowStyle(category) {
      if (!selectedCategory.value || (selectedCategory.value._id !== category && selectedCategory.value.name !== category)) {
        return { display: 'none' }
      }
    }

    const windowGridLayoutStyle = computed(() => ({
      gridTemplateRows: `repeat(${retailLayoutSetting.productRow}, 1fr)`,
      gridTemplateColumns: `repeat(${retailLayoutSetting.productColumn}, 1fr)`
    }))

    function renderProducts(productsList, category) {
      return execGenScopeId(() =>
          <g-scroll-window
              showArrows={false} elevation="0"
              key={`window_${category}`}
              v-model={productWindowsIndex.value[category]}>
            {
              productsList.map((window, windowIndex) => execGenScopeId(() =>
                  <g-scroll-window-item
                      data-index={windowIndex}
                      style={windowGridLayoutStyle.value}
                      key={`${category}_window_item_${windowIndex}`}
                      onUpdate:modelValue={val => productWindowsIndex.value[category] = val}>
                    {window.map((item, i) => execGenScopeId(() =>
                        <div class="btn" key={`btn_${i}`}
                             style={getItemStyle(item)}
                             onClick={withModifiers(() => addProduct(item), ['stop'])}>
                          {item.name}
                        </div>)
                    )}
                  </g-scroll-window-item>
              ))
            }
          </g-scroll-window>
      )
    }

    function renderDelimiter(items, category) {
      return (
          <div class="g-item-group row-flex">
            { items.map((item, index) =>
                <div
                    key={`${index}_${index === productWindowsIndex.value[category]}`}
                    style={{ width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: index === productWindowsIndex.value[category] ? '#2196F3' : '#E0E0E0'
                    }}
                    class="mr-1"
                    onClick={() => productWindowsIndex.value[category] = index}>
                </div>
            )}
          </div>
      )
    }

    // <!-- <editor-fold desc='render fn'> -->
    return genScopeId(() => (
        <div class="main">
          {Object.keys(productWindows.value).map((category) => {
            const productsList = productWindows.value[category]
            if (selectedCategory.value && category !== selectedCategory.value._id)
              return

            return (
                <div key={category} ref={(el) => setItemRef(el, category)} style={getWindowStyle(category)}>
                  {renderProducts(productsList, category)}
                  {renderDelimiter(productsList, category)}
                </div>
            )
          })}
        </div>
    ))
    // <!-- </editor-fold> -->
  }
}
</script>

<style scoped lang="scss">
.main {
  overflow: hidden;
  position: relative;
  background-color: #fff;

  .g-window {
    padding: 6px 6px 0 6px;
    width: 100%;
    position: absolute;
    top: 0;
    bottom: 12px;

    ::v-deep .g-window__container {
      height: 100%;
    }

    .g-window-item,
    .g-scroll-window-item {
      height: 100%;
      display: grid;
      grid-template-rows: repeat(7, 1fr);
      grid-template-columns: repeat(4, 1fr);
      grid-gap: 6px;
      margin-right: 6px;

      .btn {
        text-overflow: ellipsis;
        padding: 0 8px !important;
        line-height: 0.9;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        white-space: nowrap;
        overflow: hidden;
      }
    }
  }

  .g-item-group {
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: 0;
    height: 12px;
    left: 50%;
    transform: translateX(-50%);

    .g-btn {
      width: 8px !important;
      height: 8px !important;
      min-width: 0 !important;
      padding: 0 !important;
      margin: 0 6px;
      box-shadow: none;
      background-color: #E0E0E0 !important;
    }

    .g-item__active .g-btn {
      background-color: #2196F3 !important;
    }
  }
}
</style>
