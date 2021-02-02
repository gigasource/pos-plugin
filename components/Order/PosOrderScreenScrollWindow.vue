<template>
  <div class="main">
    <div v-for="(productsList, category) in productWindows" :key="category" :ref="`window_${category}`" style="z-index: -1">
      <scroll-window area="window" :show-arrows="false"
                     elevation="0" :should-force-update="shouldForceUpdate"
                     :key="`window_${category}`"
                     :value="activeProductWindows[category]"
      >
        <scroll-window-item v-for="(window, windowIndex) in productsList" :should-force-update="shouldForceUpdate"
                            :key="`${category}_window_item_${windowIndex}`"
                            @input="activeProductWindows[category] = $event"
        >
          <div class="btn"
               v-for="(item, i) in window"
               :key="`btn_${i}`"
               :style="getItemStyle(item)"
               @click.stop="addProduct(item)">
            {{item.name}}
          </div>
        </scroll-window-item>
      </scroll-window>
      <g-item-group area="delimiter"
                    :return-object="false" mandatory
                    v-model="activeProductWindows[category]"
                    :key="`group_${category}`"
                    :items="productsList"
      >
        <template #default="{ toggle, active }">
          <g-item v-for="(item, index) in productsList"
                  :is-active="active(item)"
                  :key="`${category}_item_${index}`"
          >
            <g-btn :uppercase="false" @click.native.stop="toggle(item)" border-radius="50%"></g-btn>
          </g-item>
        </template>
      </g-item-group>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import { GScrollWindow, GScrollWindowItem } from 'pos-vue-framework';
  import { nextTick } from 'vue';

  export default {
    name: 'PosOrderScreenScrollWindow',
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
    data() {
      return {
        productWindows: null,
        activeProductWindows: {},
        shouldForceUpdate: true
      }
    },
    methods: {
      addProduct(item) {
        this.$getService('OrderStore:addProductToOrder')(item)
      },
      getItemStyle(item) {
        if (item.layout) return {
          order: item.layout.order,
          ...(item.layout.color === '#FFFFFF' || !item.layout.color) && {border: '1px solid #979797', backgroundColor: '#FFF'},
          ...item.layout.color && item.layout.color !== '#FFFFFF' && {backgroundColor: item.layout.color}
        }
      }
    },
    created() {
      const orderStore = this.$getService('OrderStore');

      orderStore.changeProductList = (newValue, oldValue) => {
        if (newValue) {
          const newCategory = newValue.name;
          const oldCategory = oldValue && oldValue.name;

          if (newCategory && this.$refs[`window_${newCategory}`]) {
            this.$refs[`window_${newCategory}`][0].style.zIndex = '1'
          }

          if (oldCategory) {
            if (newCategory === oldCategory) return;
            const oldRef = this.$refs[`window_${oldCategory}`];

            if (oldRef && oldRef.length > 0) {
              oldRef[0].style.zIndex = '-1'
            }
          }
        }
      };

      this.unwatch = orderStore.$watch('scrollWindowProducts', (newValue, oldValue) => {
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
      }, { immediate: true, deep: true, sync: true })
    },
    async activated() {
      this.shouldForceUpdate = true;
      await this.$getService('OrderStore:getScrollWindowProducts')();
      nextTick(() => {
        this.shouldForceUpdate = false
      })
    },
    async mounted() {
      await this.$getService('OrderStore:getScrollWindowProducts')();
      nextTick(() => {
        this.shouldForceUpdate = false
      })
    },
    beforeDestroy() {
      this.unwatch()
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
