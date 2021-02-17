<script>
import { ref, computed, onActivated, watch, withModifiers } from 'vue'
import _ from 'lodash'
import { GScrollWindow, GScrollWindowItem } from 'pos-vue-framework';
import { execGenScopeId, genScopeId } from '../../utils';
import { categories, products } from '../../Product/product-logic'
import { selectedCategory } from '../pos-order-retail-logic'
import { getCurrentOrder, prepareOrder } from '../../OrderView/pos-logic-be'
import { addItem } from '../../OrderView/pos-logic';

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
      console.log('groupped products', result)
      return result
    })

    const favoriteProducts = computed(() => {
      const result = products.value.filter(product => {
        return product.option && product.option.favorite
      })
      return result
    })

    const productWindows = computed(() => {
      const result = {}
      Object.keys(groupedProducts.value).forEach(category => {
        result[category] = _.chunk(groupedProducts.value[category], 28)
      })
      result['favorite'] = _.chunk(favoriteProducts.value, 28)
      return result
    })

    watch(() => selectedCategory.value, (newCategory, oldCategory) => {
      const categoryId = newCategory ? newCategory._id.toString() : null
      if (categoryId && itemRef[categoryId]) {
        itemRef[categoryId].style.zIndex = 1
      }
      const oldCategoryId = oldCategory ? oldCategory._id.toString() : null
      if (oldCategoryId && itemRef[oldCategoryId]) {
        itemRef[oldCategoryId].style.zIndex = -1
      }
    }, { deep: true })

    function setItemRef(el, category) {
      if (el) {
        itemRef[category] = el
      }
    }

    onActivated(() => {
      prepareOrder(0)
    })

    function addProduct(item) {
      const order = getCurrentOrder()
      addItem(order, item, 1)
    }

    function getItemStyle(item) {
      if (item.layouts) {
        return {
          order: item.layouts[0].order,
          ...(item.layouts[0].color === '#FFFFFF' || !item.layouts[0].color) && { border: '1px solid #979797', backgroundColor: '#FFF' },
          ...item.layouts[0].color && item.layouts[0].color !== '#FFFFFF' && { backgroundColor: item.layouts[0].color }
        }
      }
    }

    // const watcher = watch(() => scrollWindowProducts.value, {
    //   handler: (newValue, oldValue) => {
    //     if (!_.isEqual(newValue, oldValue)) {
    //       const tempValue = Object.assign({}, productWindows.value, newValue);
    //       for (const category in tempValue) {
    //         if (tempValue.hasOwnProperty(category)) {
    //           tempValue[category] = tempValue[category].map(window => window.map(product => ({
    //             ...product,
    //             layout: getProductLayout(product, { name: category })
    //           })))
    //         }
    //       }
    //
    //       productWindows.value = Object.assign({}, productWindows.value, tempValue);
    //       activeProductWindows.value = newValue && Object.keys(newValue).reduce((obj, key) => {
    //         obj[key] = 0;
    //         return obj
    //       }, {})
    //     }
    //   },
    //   deep: true,
    //   sync: true,
    //   immediate: true
    // })

    function renderDelimiter(productsList, category) {
      return (
          <g-item-group
              returnObject={false} mandatory
              key={`group_${category}`}
              items={productsList}
              v-slots={{
                default: ({ toggle, active }) => productsList.map((item, index) => execGenScopeId(() =>
                    <g-item isActive={active(item)} key={`${category}_item_${index}`}>
                      { execGenScopeId(() => <g-btn uppercase={false} onClick={withModifiers(() => toggle(item), ['native', 'stop'])} border-radius="50%"></g-btn>) }
                    </g-item>
                ))
              }}>
          </g-item-group>
      )
    }

    const activeProductWindow = ref(0)
    const activeWindow = computed(() => {
      return `${activeProductWindow.value}`
    })
    function renderProducts(productsList, category) {
      return execGenScopeId(() =>
          <g-scroll-window showArrows={false} elevation="0" key={`window_${category}`} v-model={activeWindow.value}>
            {
              productsList.map((window, windowIndex) => execGenScopeId(() =>
                  <g-scroll-window-item key={`${category}_window_item_${windowIndex}`}>
                    {window.map((item, i) => execGenScopeId(() =>
                        <div class="btn" key={`btn_${i}`} style={getItemStyle(item)}
                             onClick={withModifiers(() => addProduct(item), ['stop'])}>
                          { item.name }
                        </div>)
                    )}
                  </g-scroll-window-item>
              ))
            }
          </g-scroll-window>
      )
    }

    function getWindowStyle(category) {
      if (!selectedCategory.value || selectedCategory.value._id !== category) {
        return { display: 'none' }
      }
    }

    return genScopeId(() => (
        <div class="main">
          {Object.keys(productWindows.value).map((category) => {
            const productsList = productWindows.value[category]
            return (
                <div key={category} ref={(el) => setItemRef(el, category)} style={getWindowStyle(category)}>
                  {renderProducts(productsList, category)}
                  {renderDelimiter(productsList, category)}
                </div>
            )
          })}
        </div>
    ))
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
        white-space: normal;
        padding: 0 8px !important;
        line-height: 0.9;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        cursor: pointer;
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
