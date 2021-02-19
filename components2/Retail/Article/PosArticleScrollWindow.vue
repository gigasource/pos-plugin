<script>
import _ from 'lodash'
import { getProductGridOrder } from '../../../components/logic/productUtils'
import { computed, onActivated, ref } from 'vue'
import {
  activeCategory,
  activeCategoryProducts,
  articleSelectedProductButton,
  getActiveProducts,
  selectArticle
} from './pos-article-logic';
import { genScopeId } from '../../utils';

export default {
  name: 'PosArticleScrollWindow',
  props: {
    value: { // TODO: ???
      type: Number,
      default: 0
    }
  },
  setup() {
    const activeProductWindow = ref(0)
    const productActive = 'product-active'
    const activeWindow = computed({
      get: () => {
        if (articleSelectedProductButton.value) {
          return productWindows.value.findIndex(v => {
            return v.some((item) =>
                getProductGridOrder(item, isFavouriteCategory.value) === getProductGridOrder(articleSelectedProductButton.value, isFavouriteCategory.value))
          })
        }
        return activeProductWindow.value
      },
      set: (val) => {
        activeProductWindow.value = val
      }
    })
    const productWindows = computed(() => {
      return _.chunk(activeCategoryProducts.value, 4)
    })
    const isFavouriteCategory = computed(() => {
      return activeCategory.value && activeCategory.value.name === 'Favourite'
    })
    function updateActiveWindow(value) {
      activeWindow.value = value
    }
    function getBtnStyle(item) {
      const layout = item.layouts && item.layouts.find(layout => isFavouriteCategory.value
          ? layout.favourite
          : !layout.favourite)

      return layout
          ? {
            order: getProductGridOrder(item, isFavouriteCategory.value),
            backgroundColor: layout.color,
            border: !layout.color || layout.color === '#FFFFFF' || layout.color === 'white' ? '1px solid rgb(151, 151, 151)' : ''
          }
          : null
    }

    onActivated(async () => {
      articleSelectedProductButton.value = null;
      activeCategory.value && await getActiveProducts()
    })

    // TODO: g-grid-layout area css styling
    return genScopeId(() => (
        <div class="main">
          <g-scroll-window showArrows={false} class="main__window" elevation="0" v-model={activeWindow.value}>
            {productWindows.value.map((window, windowIndex) =>
                genScopeId(() =>
                  <g-scroll-window-item key={windowIndex} onInput={() => updateActiveWindow(windowIndex)}>
                    {window.map((item, i) =>
                        genScopeId(() => (
                            <g-btn active={articleSelectedProductButton.value && (articleSelectedProductButton.value._id === item._id)}
                                   activeClass={productActive} key={i} style={getBtnStyle(item)} uppercase={false} flat height="100%"
                                   onClick={() => selectArticle(item)}>
                              {item.name}
                            </g-btn>
                        ))()
                    )}
                  </g-scroll-window-item>
                )()
            )}
          </g-scroll-window>
          <g-item-group
              items={productWindows.value}
              returnObject={false} class="main__delimiter" mandatory
              v-model={activeWindow.value}
              v-slots={{
                default: ({ toggle, active }) =>
                  productWindows.value.map((item, index) =>
                      genScopeId(() =>
                        <g-item isActive={active(item)} item={item} key={index}>
                          {
                            genScopeId(() => <g-btn uppercase={false} onClick={() => toggle(item)} border-radius="50%"></g-btn>)()
                          }
                        </g-item>
                      )()
                  )
                }
              }>
          </g-item-group>
        </div>
    ))
  },
}
</script>

<style lang="scss" scoped>
.product-active {
  border: 2px solid #1271FF;
}

.main {
  padding: 6px 6px 6px 6px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: 1fr 12px;

  &__window {
    grid-area: 1/1/2/2;
  }
  &__delimiter {
    grid-area: 2/1/3/2;
  }

  .g-window {
    width: 100%;

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

      ::v-deep .g-btn {
        white-space: normal;
        padding: 0 !important;

        .g-btn__content {
          flex: 0 1 auto;
          line-height: 0.9;
        }
      }
    }
  }

  .g-item-group {
    align-items: center;
    justify-content: center;

    .g-btn {
      width: 8px !important;
      height: 8px !important;
      border-radius: 50%;
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
