<template>
  <div class="pol" v-if="orderLayout" :style="{'flex-direction':category && category.type === 'vertical' ? 'row': 'column',
                                                'background': 'url(\'/plugins/pos-plugin/assets/out.png\')',
                                                'background-size': 'contain', 'overflow': displayOverlay ? 'hidden' : 'auto'}">
    <!-- Categories -->
    <div :style="{padding: '4px', 'background-color': '#E0E0E0', ...!editable && { position: 'sticky', top: 0, 'z-index': 1}}">
      <div :style="categoryContainerStyle">
        <div v-for="(category, index) in categories"
             :class="['pol__cate']"
             :key="index"
             :style="[getCategoryStyle(category), getCategoryAreaStyle(category)]"
             @click="selectCategory(category)">
          {{ getCategoryName(category) }}
        </div>
      </div>
    </div>
    <!-- Products -->
    <div style="padding: 4px; flex: 1" v-if="selectedCategoryLayout">
      <div :style="productContainerStyle">
        <div v-for="(productLayout, index) in products"
             :class="['pol__prod', !editable && 'darken-effect', isMobile && collapseText && 'collapsed']"
             :key="index"
             :style="[getAreaStyle(productLayout), getProductItemStyle(productLayout)]"
             v-on="getProductListeners(productLayout)">
          <g-icon class="mr-1" v-if="productLayout.icon">{{productLayout.icon}}</g-icon>
          <div style="transform: skewX(-15deg)" v-if="productLayout.product && productLayout.product.isModifier">{{ getProductName(productLayout) }}</div>
          <div v-else>{{ getProductName(productLayout) }}</div>
        </div>
        <pos-order-keyboard v-if="showCalculator" :keyboard-config="keyboardConfig" :mode="editable ? 'edit' : 'active'" @edit:keyboard="opendDialogEdit($event)" @openDialogSearch="dialog.search = true"/>
      </div>
    </div>
    <g-overlay :model-value="displayOverlay" absolute opacity="0.25" color="rgb(150, 150, 150)">
      <g-icon size="120">{{actionMode === 'print' ? 'icon-print' : 'icon-wallet'}}</g-icon>
    </g-overlay>
    <dialog-text-filter v-model="dialog.value" @submit="changeKeyboardExtension($event)"/>
    <dialog-choose-popup-modifier v-model="popupModifierDialog.value" :product="popupModifierDialog.product" @save="addProductWithModifier"/>
    <dialog-product-search-result v-model="dialog.search"/>
  </div>
</template>
<script>
  import _ from 'lodash'
  import posOrderKeyboard from '../../components/posOrder/PosOrderKeyboard'
  import dialogChoosePopupModifier from './dialogChoosePopupModifier';
  import dialogTextFilter from '../pos-shared-components/dialogFilter/dialogTextFilter';
  import dialogProductSearchResult from '../Order/components/dialogProductSearchResult';
  import { createEmptyCategoryLayout, createEmptyLayout, createEmptyProductLayout, isSameArea } from './util'

  export default {
    name: 'PosOrderLayout',
    injectService: ['SettingsStore:updateKeyboardConfig'],
    components: {dialogChoosePopupModifier, dialogTextFilter, dialogProductSearchResult, posOrderKeyboard},
    props: {
      editable: {
        type: Boolean,
        default: false,
      },
      view: null,
      orderLayout: null,
      selectedCategoryLayout: null,
      selectedProductLayout: null,
      productDblClicked: null,
      keyboardConfig: null,
      storeLocale: null,
      mode: String,
      fontSize: String,
      category: Object,
      minimumTextRow: Boolean,
      collapseBlankColumn: Boolean,
      collapseText: Boolean,
      hideTextRow: Boolean,
      hideBlankColumn: Boolean,
      actionMode: String,
      showOverlay: Boolean,
      scrollabeLayout: Boolean,
      isMobile: null
    },
    data() {
      return {
        // touch helper
        isTouchEventHandled: null,
        doubleClicked: false,
        lastSelectMoment: null,
        highlightSelectedProduct: false,
        dialog: {
          value: false,
          position: {},
          search: false
        },
        popupModifierDialog: {
          value: false,
          product: {}
        },
      }
    },
    emits: ['update:selectedCategoryLayout', 'update:selectedProductLayout', 'update:view', 'update:orderLayout', 'update:keyboardConfig', 'update:productDblClicked', 'addModifierToProduct', 'addProductToOrder'],
    computed: {
      categoryContainerStyle() {
        if(this.category && this.category.type === 'vertical') {
          if(this.category.differentSize) {
            return {
              display: 'block',
              width: this.category.size
            }
          }
          return {
            display: 'grid',
            'grid-template-rows': `repeat(8, calc(12.5% - ${5 * 8 / 7}px))`,
            'grid-template-columns': '100%',
            'height': '100%',
            "grid-gap": '5px',
            width: this.category.size
          }
        }
        if (this.category && this.category.type === 'horizontal' && this.category.singleRow) {
          if(this.category.differentSize) {
            return {
              display: 'flex',
              maxWidth: '100%',
              overflow: 'auto',
              height: this.category.size
            }
          }
          return {
            display: 'grid',
            'grid-template-columns': `repeat(8, calc(12.5% - ${5 * 8 / 7}px))`,
            'grid-template-rows': '100%',
            "grid-gap": '5px',
            height: this.category.size
          }
        }
        return {
          display: 'grid',
          'grid-template-columns': this.getGridTemplateFromNumber(this.orderLayout.columns),
          'grid-template-rows': this.getGridTemplateFromNumber(this.orderLayout.rows),
          'grid-gap': '5px',
          height: this.category ? this.category.size : `${40 * this.orderLayout.rows}px`
        }
      },
      productContainerStyle() {
        const style = {
          display: 'grid',
          'grid-template-columns': this.getGridTemplateFromNumber(this.selectedCategoryLayout.columns),
          'grid-template-rows': this.scrollabeLayout ? `repeat(${this.selectedCategoryLayout.rows}, 1fr)` : this.getGridTemplateFromNumber(this.selectedCategoryLayout.rows),
          'grid-gap': '5px',
          height: '100%'
        }
        if (this.minimumTextRow || this.hideTextRow) {
          let rows = []
          const texts = this.products.filter(p => p.type === 'Text')
          for(const text of texts) {
            let flag = true
            const row = text.top
            const rowItems = this.products.filter(p => p.top === row)
            for(const item of rowItems) {
              if(item.type !== 'Text') {
                  flag = false;
                  break;
              }
            }
            if(flag) rows.push(row)
          }
          if(this.hideTextRow) {
            const rowNo = this.selectedCategoryLayout.rows - _.uniq(rows).length
            const rowItem = this.scrollabeLayout ? '1fr' : `calc(${100/rowNo}% - ${5 * (this.selectedCategoryLayout.rows - 1) / rowNo}px)`
            style['grid-template-rows'] = _.range(0, this.selectedCategoryLayout.rows).map(i => rows.includes(i) ? '0' : rowItem).join(' ')
          } else {
            const rowNo = this.selectedCategoryLayout.rows
            const rowItem = this.scrollabeLayout ? '1fr' : `calc(${100/rowNo}% - ${5 * (rowNo - 1) / rowNo}px)`
            style['grid-template-rows'] = _.range(0, this.selectedCategoryLayout.rows).map(i => rows.includes(i) ? 'min-content' : rowItem).join(' ')
          }
        }
        if (this.collapseBlankColumn || this.hideBlankColumn) {
          let columns = [], col = 0
          while (col < this.selectedCategoryLayout.columns) {
            const colItems = this.products.filter(p => p.left === col)
            if(colItems.length === 0) {
              columns.push(col)
            }
            col++
          }
          if(this.hideBlankColumn) {
            const cols = this.selectedCategoryLayout.columns - columns.length
            style['grid-template-columns'] = _.range(0, this.selectedCategoryLayout.columns)
                .map(i => columns.includes(i) ? '0' : `calc(${100/cols}% - ${5 * (this.selectedCategoryLayout.columns - 1) / cols}px)`)
                .join(' ')
          } else {
            const cols = 4 * this.selectedCategoryLayout.columns - 3 * columns.length
            style['grid-template-columns'] = _.range(0, this.selectedCategoryLayout.columns)
                .map(i => columns.includes(i) ? `calc(${100/cols}% - ${5 * (cols - 1) / cols}px)` : `calc(${400/cols}% - ${5 * (cols - 1) / cols}px)`)
                .join(' ')
          }
        }
        return style
      },
      showCalculator() {
        if (!this.selectedCategoryLayout || !this.keyboardConfig)
          return false
        //out of boundary
        if(this.selectedCategoryLayout.rows <= this.keyboardConfig.top
            || this.selectedCategoryLayout.columns <= this.keyboardConfig.left)
          return false

        let show = this.keyboardConfig.active
        if (this.keyboardConfig.onlyShowInFirstPage) {
          const {top, left} = this.selectedCategoryLayout
          if (top !== 0 || left !== 0)
            show = false
        }

        return show
      },
      categories() {
        if (this.editable) {
          return this.fillMissingAreas(
              this.orderLayout.categories,
              this.orderLayout.columns,
              this.orderLayout.rows,
              true);
        }
        return [...this.orderLayout.categories]
      },
      products() {
        if (this.editable) {
          return this.fillMissingAreas(
              this.selectedCategoryLayout.products,
              this.selectedCategoryLayout.columns,
              this.selectedCategoryLayout.rows);
        }
        // remove product layout which is not text but doesn't link to any product
        return _.filter(this.selectedCategoryLayout.products, p => p.type === 'Text' || (p.type !== 'Text' && p.product))
      },
      displayOverlay() {
        return this.showOverlay && this.actionMode !== 'none'
      }
    },
    async created() {
      await this.loadKeyboardConfig();
      let type = 'default'
      if (this.$route.query && this.$route.query.type) {
        type = this.$route.query.type
      }
      await this.loadOrderLayout(type);
      cms.socket.on('updateOrderLayouts', this.loadOrderLayout)
    },
    beforeUnmount() {
      cms.socket.off('updateOrderLayouts')
    },
    async activated() {
      await this.loadKeyboardConfig();
      let type = 'default'
      if (this.$route.query && this.$route.query.type) {
        type = this.$route.query.type
      }
      await this.loadOrderLayout(type);
      cms.socket.on('updateProductProps', async () => {
        await this.loadOrderLayout(type);
      })
    },
    deactivated() {
      cms.socket.off('updateProductProps');
    },
    watch: {
      orderLayout() {
        if (this.selectedCategoryLayout) {
          const cateLayout = _.find(this.orderLayout.categories, c => isSameArea(this.selectedCategoryLayout, c))
          if (!cateLayout)
            return
          // update category layout
          this.$emit('update:selectedCategoryLayout', cateLayout)
          if (!this.view || this.view.name !== 'ProductEditor' || !this.selectedProductLayout)
            return
          // update product layout
          const prodLayout = _.find(cateLayout.products, pl => isSameArea(this.selectedProductLayout, pl))
          if (prodLayout)
            this.$emit('update:selectedProductLayout', prodLayout)
          else if (this.editable) {
            this.$emit('update:view', { name: 'CategoryEditor' })
            this.$emit('update:selectedProductLayout', null)
          }
        } else {
          // automatically select first category
          if (this.orderLayout.categories.length > 0) {
            // find tab-product at 0-0
            const topLeftCategory = _.find(this.orderLayout.categories, c => c.top === 0 && c.left === 0)
            if (topLeftCategory)
              this.$emit('update:selectedCategoryLayout', topLeftCategory)
            else
              this.$emit('update:selectedCategoryLayout', _.first(this.orderLayout.categories))

            if (this.editable && (!this.view || this.view.name !== 'CategoryEditor'))
              this.$emit('update:view', { name: 'CategoryEditor' })
          }
        }
      }
    },
    methods: {
      async loadOrderLayout(type = 'default') {
        this.$emit('update:orderLayout', await cms.getModel('OrderLayout').findOne({type}))
      },
      async loadKeyboardConfig() {
        const setting = await cms.getModel('PosSetting').findOne()
        const keyboardConfig = setting.keyboardConfig
        // work-around: Fixing error keyboardConfig is null
        // TODO: Find what is the purpose of keyboardConfig layout
        if (!keyboardConfig.layout)
          keyboardConfig.layout = []
        this.$emit('update:keyboardConfig', keyboardConfig)
      },
      //
      fillMissingAreas(areas, columns, rows, isCategory) {
        // add extra info
        // areas: [ { top, left }, {...} ]
        // generating empty elements
        const allAreas = [];
        for (let row = 0; row < rows; row++) {
          for (let column = 0; column < columns; column++) {
            let empty = createEmptyLayout(row, column);
            if (isCategory) {
              if (this.selectedCategoryLayout && isSameArea(empty, this.selectedCategoryLayout))
                empty = this.selectedCategoryLayout;
              else
                empty = {...empty, ...createEmptyCategoryLayout()}
            } else {
              if (this.selectedProductLayout && isSameArea(empty, this.selectedProductLayout))
                empty = this.selectedProductLayout
              else
                empty = {...empty, ...createEmptyProductLayout()}
            }
            allAreas.push(empty)
          }
        }
        return this.removeOuterAreas(_.unionWith(areas, allAreas, (area1, area2) => isSameArea(area1, area2)), columns, rows)
      },

      removeOuterAreas(areas, columns, rows) {
        return _.filter(areas, area => area.top < rows && area.left < columns)
      },
      getCategoryAreaStyle(cateItem) {
        if (this.category && this.category.type === 'vertical') {
          return this.getAreaStyle(cateItem, true)
        } else {
          return this.getAreaStyle(cateItem)
        }
      },
      getAreaStyle(item, rotate) {
        if(!item.top && item.top !== 0) {
          return
        }
        if (rotate) {
          return {
            'grid-area': `${item.left + 1} / ${item.top + 1} / ${item.left + 2} / ${item.top + 2}`
          }
        } else {
          return {
            'grid-area': `${item.top + 1} / ${item.left + 1} / ${item.top + 2} / ${item.left + 2}`
          }
        }

      },
      getCategoryStyle(category) {
        const isCategorySelected = this.selectedCategoryLayout && isSameArea(this.selectedCategoryLayout, category);
        return {
          backgroundColor: category.color,
          color: '#000',
          border: `1px solid ${isCategorySelected ? '#1271FF' : 'transparent'}`,
          boxShadow: isCategorySelected ? '1px 0px 3px rgba(18, 113, 255, 0.36)' : 'none',
          ... this.category && this.category.differentSize && (this.category.type === 'horizontal' ? { marginRight: "5px" } : { marginBottom: "5px"}),
          ... this.category && this.category.fontSize && { fontSize: this.category.fontSize }
        }
      },
      getProductItemStyle(product) {
        const isProductSelected = this.selectedProductLayout && isSameArea(this.selectedProductLayout, product);
        const style = {
          backgroundColor: product.color,
          color: '#000',
          borderRadius: '2px',
        };
        if (!product.name && !product.text && !product.product) {
          style.border = '1px dashed #bdbdbd'
        }
        if (isProductSelected && this.highlightSelectedProduct) {
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
        if (this.isMobile) {
          style.fontSize = this.fontSize
        }
        return style;
      },
      getGridTemplateFromNumber(num) {
        return _.join(_.map(_.range(0, num), c => `calc(${100/num}% - ${5 * (num - 1) / num}px)`), ' ')
      },
      getCategoryName(item) {
        if (item)
          return item.name
      },
      getProductName(productLayout) {
        if (productLayout.type === 'Text')
          return productLayout.text
        if (productLayout.product && productLayout.product._id && productLayout.product.id)
          return `${productLayout.product.id}. ${productLayout.product.name}`
        else
          return productLayout.product.name
      },
      async selectCategory(categoryLayout) {
        if (this.editable) {
          this.$emit('update:selectedCategoryLayout', categoryLayout);
          this.$emit('update:view', { name: 'CategoryEditor' })
        } else {
          this.$emit('update:selectedCategoryLayout', categoryLayout);
        }
        this.$emit('update:selectedProductLayout', null)
      },
      async selectProduct(productLayout) {
        if (this.editable) {
          if (this.selectedCategoryLayout._id) {
            if(this.mode === 'ingredient') {
              this.$emit('update:view', { name: 'IngredientEditor' })
            } else {
              this.$emit('update:view', { name: 'ProductEditor' })
            }
            this.$emit('update:selectedProductLayout', productLayout);
          }
        } else {
          this.$emit('update:selectedProductLayout', productLayout);
        }
        this.highlightProduct(productLayout)
      },

      highlightProduct(productLayout) {
        if (!this.editable && productLayout.type === 'Text')
          return

        this.highlightSelectedProduct = true

        if (!this.editable) {
          // flash in view mode
          setTimeout(() => {
            this.highlightSelectedProduct = false
          }, 200)
        }
      },

      onProductSelect(productLayout) {
        if (this.editable) {
          this.selectProduct(productLayout);

          // Known issues:
          //    + if user do n click/tab in short time, (n-1) double tab event will be raised
          //    + if user double click on item x, then click very fast to another item y,
          //      switch item action will not be executed because of the click event to item y has been omitted.
          // TODO: Fix known issues
          this.doubleClicked = false
          this.lastSelectMoment = new Date().getTime()
          // double click is ~300->350ms
          const timeout = 200
          setTimeout(() => {
            if (new Date().getTime() - this.lastSelectMoment < timeout) {
              this.doubleClicked = true
              this.$emit('update:productDblClicked', true)
            } else {
              if (!this.doubleClicked) {
                this.addProductToOrder(productLayout);
                this.$emit('update:productDblClicked', false)
              }
            }
          }, timeout)
        } else {
        }
      },

      addProductToOrder({ product }) {
        // Handle these stuff in productSelected event.
        // work-around
        if (!product || !product._id)
          return
        if (product.isModifier) {
          this.$emit('addModifierToProduct', {
            product: product._id.toString(),
            name: product.name,
            price: product.price,
            quantity: 1,
          })
        } else {
          this.$emit('addProductToOrder', product)
        }
      },

      async showPopupModifierDialog({ product }) {
        const globalModifierGroups = await cms.getModel('PosModifierGroup').find({ isGlobal: true })
        if (!globalModifierGroups.length && !product.activePopupModifierGroup) {
          return this.addProductToOrder({ product })
        }

        this.popupModifierDialog = {
          value: true,
          product
        }
      },

      addProductWithModifier(product, modifiers) {
        this.$emit('addProductToOrder', {
          ...product,
          modifiers: modifiers.map(({ _id, name, price }) => ({ product: _id.toString(), name, price, quantity: 1 }))
        })
      },

      onClick(productLayout) {
        if (!this.isTouchEventHandled) {
          this.onProductSelect(productLayout)
        }
      },

      onTouchStart(productLayout) {
        this.isTouchEventHandled = true
        this.onProductSelect(productLayout)
      },

      getProductListeners(productLayout) {
        return this.editable
          ? { click: () => this.onClick(productLayout), touchstart: () => this.onTouchStart(productLayout)}
          : { click: () => {
              if(productLayout.type === 'Text') return
              const { product } = productLayout;
              if (product.activePopupModifierGroup) return this.showPopupModifierDialog(productLayout)
              this.addProductToOrder(productLayout);
            }
          }
      },

      opendDialogEdit(position) {
        this.dialog.position = position
        this.dialog.value = true
      },
      updateKeyboardConfig() {},
      async changeKeyboardExtension(val) {
        const config = Object.assign({}, this.keyboardConfig)
        _.set(config, ['layout', this.dialog.position.top-1, 'rows', this.dialog.position.left-1], val)
        await this.updateKeyboardConfig(config)
        this.$emit('update:keyboardConfig', config)
      }
    }
  }
</script>
<style scoped lang="scss">
  .pol {
    position: relative;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
    overflow: auto;

    &__cate {
      border-radius: 4px;
      display: flex;
      justify-content: center;
      text-align: center;
      align-items: center;
      padding: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      overflow: hidden;
    }

    &__prod {
      display: flex;
      justify-content: center;
      text-align: center;
      align-items: center;
      font-size: 14px;
      line-height: 1.2;
      font-weight: 700;
      color: #1d1d26;
      padding: 0 8px;
      word-break: break-word;
      overflow: hidden;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;

      & > div {
        max-height: 100%;
      }

      &.collapsed div {
        word-break: break-word;
        -webkit-line-clamp: 2;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }
</style>
