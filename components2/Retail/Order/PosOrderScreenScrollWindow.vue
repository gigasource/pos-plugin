<script>
import _ from 'lodash'
import { GScrollWindow, GScrollWindowItem } from 'pos-vue-framework';
import { nextTick, onActivated, onMounted, withModifiers } from 'vue';
import { genScopeId } from '../../utils';

export default {
  name: 'PosOrderScreenScrollWindow',
  injectService: ['OrderStore:(addProductToOrder,getScrollWindowProducts,scrollWindowProducts)'],
  components: {
    scrollWindow: {
      name: 'ScrollWindow',
      mixins: [GScrollWindow],
      props: {
        shouldForceUpdate: Boolean
      },
      data() {
        return {
          _forceUpdate: null
        }
      },
      mounted() {
        this._forceUpdate = this.$forceUpdate
      },
      watch: {
        shouldForceUpdate(newVal) {
          this.$forceUpdate = newVal ? this._forceUpdate : () => null
        }
      }
    },
    scrollWindowItem: {
      name: 'ScrollWindowItem',
      mixins: [GScrollWindowItem],
      props: {
        shouldForceUpdate: Boolean
      },
      data() {
        return {
          _forceUpdate: null
        }
      },
      mounted() {
        this._forceUpdate = this.$forceUpdate
      },
      watch: {
        shouldForceUpdate(newVal) {
          this.$forceUpdate = newVal ? this._forceUpdate : () => null
        }
      }
    }
  },
  props: {
    value: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const productWindows = ref(null)
    const activeProductWindows = ref({})
    const shouldForceUpdate = ref(true)

    function addProduct(item) {
      this.addProductToOrder(item)
    }

    function getItemStyle(item) {
      if (item.layout) {
        return {
          order: item.layout.order,
          ...(item.layout.color === '#FFFFFF' || !item.layout.color) && { border: '1px solid #979797', backgroundColor: '#FFF' },
          ...item.layout.color && item.layout.color !== '#FFFFFF' && { backgroundColor: item.layout.color }
        }
      }
    }

    function addProductToOrder() {
      console.log('OrderStore:addProductToOrder was not implemented')
    }

    function getScrollWindowProducts() {
      console.log('OrderStore:getScrollWindowProducts was not implemented')
    }

    // created() {
    // const orderStore = this.$getService('OrderStore');
    // orderStore.changeProductList = (newValue, oldValue) => {
    //   if (newValue) {
    //     const newCategory = newValue.name;
    //     const oldCategory = oldValue && oldValue.name;
    //
    //     if (newCategory && this.$refs[`window_${newCategory}`]) {
    //       this.$refs[`window_${newCategory}`][0].style.zIndex = '1'
    //     }
    //
    //     if (oldCategory) {
    //       if (newCategory === oldCategory) return;
    //       const oldRef = this.$refs[`window_${oldCategory}`];
    //
    //       if (oldRef && oldRef.length > 0) {
    //         oldRef[0].style.zIndex = '-1'
    //       }
    //     }
    //   }
    // };
    // this.unwatch = orderStore.$watch('scrollWindowProducts', (newValue, oldValue) => {
    //   if (!_.isEqual(newValue, oldValue)) {
    //     const tempValue = Object.assign({}, this.productWindows, newValue);
    //     for (const category in tempValue) {
    //       if (tempValue.hasOwnProperty(category)) {
    //         tempValue[category] = tempValue[category].map(window => window.map(product => ({
    //           ...product,
    //           layout: this.$getService('SettingsStore:getProductLayout')(product, { name: category })
    //         })))
    //       }
    //     }
    //
    //     this.productWindows = Object.assign({}, this.productWindows, tempValue);
    //     this.activeProductWindows = newValue && Object.keys(newValue).reduce((obj, key) => {
    //       obj[key] = 0;
    //       return obj
    //     }, {})
    //   }
    // }, { immediate: true, deep: true, sync: true })
    // }

    onActivated(async () => {
      this.shouldForceUpdate = true;
      await this.getScrollWindowProducts();
      await nextTick(() => {
        this.shouldForceUpdate = false
      })
    })

    watch(() => scrollWindowProducts.value, {
      handler: (newValue, oldValue) => {
        if (!_.isEqual(newValue, oldValue)) {
          const tempValue = Object.assign({}, this.productWindows, newValue);
          for (const category in tempValue) {
            if (tempValue.hasOwnProperty(category)) {
              tempValue[category] = tempValue[category].map(window => window.map(product => ({
                ...product,
                layout: this.$getService('SettingsStore:getProductLayout')(product, { name: category })
              })))
            }
          }

          this.productWindows = Object.assign({}, this.productWindows, tempValue);
          this.activeProductWindows = newValue && Object.keys(newValue).reduce((obj, key) => {
            obj[key] = 0;
            return obj
          }, {})
        }
      },
      deep: true,
      sync: true,
      immediate: true
    })

    onMounted(async () => {
      await this.getScrollWindowProducts();
      await nextTick(() => {
        this.shouldForceUpdate = false
      })
    })

    return genScopeId(() => (
        <div class="main">
          {productWindows.value.map((productsList, category) =>
              <div key={category} ref={`window_${category}`} style="z-index: -1">
                <scroll-window area="window" showArrows={false} elevation="0"
                               shouldForceUpdate={shouldForceUpdate.value} key={`window_${category}`}
                               value={activeProductWindows.value[category]}>
                  {productsList.map((window, windowIndex) =>
                      <scroll-window-item
                          shouldForceUpdate={shouldForceUpdate.value}
                          key={`${category}_window_item_${windowIndex}`}
                          onInput={activeProductWindows.value[category] = $event}>
                        {window.map((item, i) =>
                            <div class="btn" key={`btn_${i}`} style={getItemStyle(item)}
                                 onClick={withModifiers(() => addProduct(item), ['stop'])}>
                              {item.name}
                            </div>
                        )} </scroll-window-item>
                  )} </scroll-window>
                <g-item-group
                    area="delimiter" returnObject={false} mandatory
                    v-model={activeProductWindows.value[category]} key={`group_${category}`}
                    items={productsList}
                    v-slots={{
                      default: ({toggle, active}) => <>
                        {productsList.map((item, index) =>
                            <g-item isActive={active(item)} key={`${category}_item_${index}`}>
                              <g-btn uppercase={false} onClick={withModifiers(() => toggle(item), ['native', 'stop'])} border-radius="50%"></g-btn>
                            </g-item>
                        )}
                      </>
                    }}>
                </g-item-group>
              </div>
          )}
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
