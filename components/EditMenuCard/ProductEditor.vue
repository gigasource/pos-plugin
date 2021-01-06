<template>
  <div class="product-editor">
    <!-- Product basic info -->
    <div class="product-editor__prop-grid">
      <template v-if="types">
        <div>{{$t('article.type')}}</div>
        <g-select :disabled="!!(type && selectedProduct.id && selectedProduct.name && selectedProduct.price)" skip-search
                  text-field-component="GTextFieldBs" v-model="type" :items="types" @update:modelValue="changeType"/>
      </template>
      <template v-if="isProductLayout">
        <div>{{$t('article.id')}} </div>
        <g-text-field-bs :model-value="selectedProduct.id" @update:modelValue="setProductInfo('id', $event);debouncedUpdateProduct('id', $event)">
          <template #append-inner>
            <g-icon style="cursor: pointer" @click="openDialogInfo('id')">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>

        <div>{{$t('article.name')}} <span style="color: #FF4452">*</span></div>
        <g-text-field-bs :model-value="selectedProduct.name" @update:modelValue="setProductInfo('name', $event);debouncedUpdateProduct('name', $event)">
          <template #append-inner>
            <g-icon style="cursor: pointer" @click="openDialogInfo('name')">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>

        <div>{{$t('article.price')}} <span style="color: #FF4452">*</span></div>
        <g-text-field-bs :model-value="selectedProduct.price" @update:modelValue="setProductInfo('price', $event);debouncedUpdateProduct('price', $event)">
          <template #append-inner>
            <g-icon style="cursor: pointer" @click="openDialogInfo('price')">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>

        <g-switch :model-value="selectedProduct.isModifier" @update:modelValue="updateProduct({ isModifier: $event })" />
        <div style="font-size: 13px">{{$t('article.isModifier')}}</div>
      </template>
      <template v-else>
        <div>{{$t('article.name')}} <span style="color: #ff4552">*</span></div>
        <g-text-field v-model="selectedProductLayout.text">
          <template #append-inner>
            <g-icon style="cursor: pointer" @click="dialog.showTextKbd = true">icon-keyboard</g-icon>
          </template>
        </g-text-field>
      </template>
    </div>

    <template v-if="isProductLayout">
      <!-- Printer -->
      <div v-if="!selectedProduct.isModifier">
        <div class="product-editor__prop">
          <span class="product-editor__label">{{$t('restaurant.product.printer')}}</span>
          <span v-if="showAddPrinter2" class="prop-option--printer" @click="isPrinter2Select = true">+2. {{$t('restaurant.product.printer')}}</span>
        </div>
        <div>
          <span v-for="(item, index) in printers"
                :key="index"
                :class="getPrinterClass(item._id)"
                @click="selectPrinter(item._id)">
            {{ item.name }}
          </span>
          <span v-if="!isPrinter2Select" :class="noPrintClasses" @click="setAsNoPrint">{{$t('restaurant.product.noPrinter')}}</span>
        </div>
      </div>

      <!-- Tax -->
      <div class="row-flex mt-2 product-editor__tax">
        <div class="col-6">
          <div class="product-editor__label">{{$t('restaurant.product.dineInTax')}}</div>
          <g-grid-select mandatory v-model="selectedProduct.taxCategory" item-value="_id"
                         :items="dineInTaxes" itemCols="auto">
            <template #default="{ toggleSelect, item, index }">
              <div class="prop-option"
                   @click="e => {toggleSelect(item); updateProduct({ tax: item.value, taxCategory: item._id })}">
                {{item.text}} ({{item.value}}%)
              </div>
            </template>
            <template #selected="{ toggleSelect, item, index }">
              <div class="prop-option prop-option--1"
                   @click="e => {toggleSelect(item); updateProduct({ tax: item.value, taxCategory: item._id })}">
                {{item.text}} ({{item.value}}%)
              </div>
            </template>
          </g-grid-select>
        </div>

        <div class="col-6">
          <div class="product-editor__label">{{$t('restaurant.product.takeAwayTax')}}</div>
          <g-grid-select mandatory v-model="selectedProduct.taxCategory2" item-value="_id"
                         :items="takeAwayTaxes" itemCols="auto">
            <template #default="{ toggleSelect, item, index }">
              <div class="prop-option"
                   @click="e => {toggleSelect(item); updateProduct({ tax2: item.value, taxCategory2: item._id })}">
                {{item.text}} ({{item.value}}%)
              </div>
            </template>
            <template #selected="{ toggleSelect, item, index }">
              <div class="prop-option prop-option--1"
                   @click="e => {toggleSelect(item); updateProduct({ tax2: item.value, taxCategory2: item._id })}">
                {{item.text}} ({{item.value}}%)
              </div>
            </template>
          </g-grid-select>
        </div>
      </div>

      <!-- Color -->
      <div class="mt-2">
        <div class="product-editor__label">{{$t('ui.color')}}</div>
        <color-selector
            :model-value="selectedProductLayout.color"
            :colors="colors"
            :item-size="25"
            @update:modelValue="updateProductLayout({ color: $event })"
        />
      </div>

      <!-- Happy hour -->
<!--      <div class="mt-2" v-if="isProductLayout">-->
<!--        <div class="product-editor__label">{{$t('restaurant.product.happyHour')}}</div>-->
<!--        <div class="prop-option i">-->
<!--          <p>14:00 - 17:00 : 20%</p>-->
<!--          <p>Mo Di Mi Do Fr Sa So</p>-->
<!--        </div>-->
<!--      </div>-->

      <!-- Category -->
<!--      <div class="mt-2">-->
<!--        <div class="product-editor__label">{{$t('article.category')}}</div>-->
<!--        <div>-->
<!--          <g-grid-select mandatory v-model="selectedProduct.category" item-text="name" item-value="_id" :items="categories" itemCols="auto">-->
<!--            <template #default="{ toggleSelect, item, index }">-->
<!--              <div class="prop-option" @click="e => { toggleSelect(item); changeCategory(item) }">{{item.name}}</div>-->
<!--            </template>-->
<!--            <template #selected="{ toggleSelect, item, index }">-->
<!--              <div class="prop-option prop-option&#45;&#45;1" @click="e => { toggleSelect(item); changeCategory(item) } ">{{item.name}}</div>-->
<!--            </template>-->
<!--          </g-grid-select>-->
<!--        </div>-->
<!--      </div>-->
    </template>

    <!-- Popup modifiers -->
    <div class="mt-2">
      <div class="row-flex justify-between">
        <div class="product-editor__label">Popup modifiers</div>
        <g-icon size="16" @click="dialog.popupModifiers = true">icon-edit_modifiers</g-icon>
      </div>
      <div>
        <g-grid-select v-model="selectedProduct.activePopupModifierGroup" item-text="name" item-value="_id" :items="popupModifierGroups" itemCols="auto">
          <template #default="{ toggleSelect, item, index }">
            <div class="prop-option" @click="toggleSelect(item); changePopupModifierGroup(item)">{{item.name}}</div>
          </template>
          <template #selected="{ toggleSelect, item, index }">
            <div class="prop-option prop-option--1" @click="toggleSelect(item); changePopupModifierGroup(null)">{{item.name}}</div>
          </template>
        </g-grid-select>
      </div>
    </div>

    <dialog-product-info v-model="dialog.productInfo"
                         :product="selectedProduct"
                         :focus="dialog.focus"
                         @submit="updateProduct"/>
    <dialog-text-filter
        label="Text"
        :default-value="selectedProductLayout.text"
        v-model="dialog.showTextKbd"
        @submit="updateProductLayout({ text: $event, type: 'Text' }, $event)"/>
    <dialog-edit-popup-modifiers v-model="dialog.popupModifiers" :product="selectedProduct" />
    <g-snackbar v-model="showSnackbar" top right color="#1976d2" timeout="1000">{{notifyContent}}</g-snackbar>

  </div>
</template>
<script>
  import _ from 'lodash';
  import ColorSelector from '../common/ColorSelector';
  import GGridItemSelector from '../FnButton/components/GGridItemSelector';
  import { createEmptyProductLayout } from '../posOrder/util'
  import DialogEditPopupModifiers from './dialogEditPopupModifiers';

  export default {
    name: 'ProductEditor',
    components: { DialogEditPopupModifiers, GGridItemSelector, ColorSelector },
    props: {
      orderLayout: Object,
      selectedCategoryLayout: Object,
      selectedProductLayout: Object,
    },
    emits: ['update:orderLayout'],
    data: function () {
      return {
        colors: '#FFFFFF,#CE93D8,#B2EBF2,#C8E6C9,#DCE775,#FFF59D,#FFCC80,#FFAB91'.split(','),
        // Product layout types
        type: this.selectedProductLayout.type,
        types: _.map([ 'Article', 'Div.Article', 'Text', 'Menu' ], item => ({ text: item, value: item })),
        dineInTaxes: [],
        takeAwayTaxes: [],
        // indicate whether the +2. Printer button has been clicked or not
        isPrinter2Select: false,
        // GroupPrinter collection data
        printers: null,
        // Category collection data
        categories: null,
        //
        dialog: {
          productInfo: false,
          popupModifiers: false,
          focus: 'id',
          showTextKbd: false,
        },
        showSnackbar: false,
        notifyContent: null,
        popupModifierGroups: [],
        layoutType: '',
        debouncedUpdateProduct: () => null
      }
    },
    computed: {
      selectedProduct: {
        get(){
          if (!this.selectedProductLayout.product) {
            this.selectedProductLayout.product = createEmptyProductLayout()
          }
          return this.selectedProductLayout.product
        },
        set(value) {
          this.selectedProductLayout.product = value
        }
      },
      showAddPrinter2() {
        // console.log('showAddPrinter2')
        // console.log('this.selectedProduct.groupPrinter', this.selectedProduct.groupPrinter)
        // console.log('!this.selectedProduct.groupPrinter2', !this.selectedProduct.groupPrinter2)
        // console.log('!this.selectedProduct.isModifier', !this.selectedProduct.isModifier)
        // console.log('!this.selectedProduct.isNoPrint', !this.selectedProduct.isNoPrint)
        // console.log('!this.isPrinter2Select', !this.isPrinter2Select)

        return (this.selectedProduct.groupPrinter
            && !this.selectedProduct.groupPrinter2
            && !this.selectedProduct.isModifier
            && !this.selectedProduct.isNoPrint
            && !this.isPrinter2Select
        )
      },
      isProductLayout() {
        return this.type !== 'Text'
      },
      noPrintClasses() {
        return {
          'prop-option': true,
          'prop-option--1': this.selectedProduct.isNoPrint,
        }
      },
      itemNoteClasses() {
        return {
          'prop-option': true,
          'prop-option--1': this.selectedProduct.isItemNote,
        }
      },
      showDineInTax() {
        if (!this.selectedProduct) return true
        const { groupPrinter, groupPrinter2 } = this.selectedProduct
        if (groupPrinter2) return groupPrinter2.showDineInTax
        if (groupPrinter) return groupPrinter.showDineInTax
        return true
      }
    },
    watch: {
      selectedProductLayout(value) {
        this.type = value.type
      },
      'dialog.popupModifiers'() {
        this.loadPopupModifierGroups()
      }
    },
    async created() {
      await this.loadPrinters()
      await this.loadCategories()
      await this.loadTaxes()
      await this.loadPopupModifierGroups()

      if (this.$route && this.$route.query && this.$route.query.type) {
        this.layoutType = this.$route.query.type
      } else {
        this.layoutType = 'default'
      }

      this.debouncedUpdateProduct = _.debounce(function (key, val) {
        this.updateProduct({ [key]: val }, !this.selectedProduct._id)
      }, 300)
    },
    activated() {
      if (this.$route && this.$route.query && this.$route.query.type) {
        this.layoutType = this.$route.query.type
      } else {
        this.layoutType = 'default'
      }
    },
    methods: {
      // categories
      async loadCategories() {
        this.categories = await cms.getModel('Category').find()
      },
      async changeCategory(category) {
        await this.updateProduct({ category: category._id })
      },
      async loadTaxes() {
        const taxes = await cms.getModel('TaxCategory').find()
        this.dineInTaxes = taxes.filter(i => i.type.includes('dineIn')).map(({ _id, value, name }) => ({ _id, text: name, value }))
        this.takeAwayTaxes = taxes.filter(i => i.type.includes('takeAway')).map(({ _id, value, name }) => ({ _id, text: name, value }))
      },
      showNotify(content) {
        this.notifyContent = content || 'Saved'
        this.showSnackbar = true
      },
      async loadPrinters() {
        this.printers = await cms.getModel('GroupPrinter').find({ type: 'kitchen' })
      },
      async loadPopupModifierGroups() {
        this.popupModifierGroups = (await cms.getModel('PosModifierGroup').find())
      },
      getPrinterClass(printer) {
        return {
          'prop-option': true,
          'prop-option--1': this.selectedProduct.groupPrinter && this.selectedProduct.groupPrinter._id === printer,
          'prop-option--2': this.selectedProduct.groupPrinter2 && this.selectedProduct.groupPrinter2._id === printer,
        }
      },
      async selectPrinter(id) {
        const printer = this.printers.find(p => p._id === id)

        const change = {
          isItemNote: false,
          isNoPrint: false
        }

        if (this.isPrinter2Select) {
          if (this.selectedProduct.groupPrinter !== printer) {
            change.groupPrinter2 = printer;
          }
          this.isPrinter2Select = false;
        } else {
          change.groupPrinter = printer;
          change.groupPrinter2 = null;
        }

        if (!this.selectedProduct.tax && printer.defaultDineInTax) {
          const taxCategory = printer.defaultDineInTax;
          this.selectedProduct.tax = taxCategory
          change.taxCategory = taxCategory
          change.tax = this.dineInTaxes.find(i => i._id.toString() === taxCategory).value
        }
        if (!this.selectedProduct.tax2 && printer.defaultTakeAwayTax) {
          const taxCategory2 = printer.defaultTakeAwayTax;
          this.selectedProduct.tax2 = taxCategory2
          change.taxCategory2 = taxCategory2
          change.tax2 = this.takeAwayTaxes.find(i => i._id.toString() === taxCategory2).value
        }

        await this.updateProduct(change)
      },
      async setAsNoPrint() {
        await this.updateProduct({
          groupPrinter: null,
          groupPrinter2: null,
          isNoPrint: true,
          isItemNote: false
        });
      },
      // end printers

      // ----
      async changeType(type) {
        if (this.selectedProductLayout.type === type)
          return

        const articleTypes = ['Article', 'Div.Article']

        // Art, Div.Art -> Div.Art, Art
        if (_.includes(articleTypes, this.selectedProductLayout.type) && _.includes(articleTypes, type)) {
          await this.updateProduct({ isDivArticle: type === 'Div.Article' })
        }

        await this.updateProductLayout({type})
      },
      changePopupModifierGroup(group) {
        return this.updateProduct({ activePopupModifierGroup: group && group._id })
      },

      // update color, update text
      async updateProductLayout(change, forceCreate) {
        console.log('Store change into this.selectedProductLayout')
        _.each(_.keys(change), k => this.selectedProductLayout[k] = change[k])

        if (this.selectedProductLayout._id) {
          console.log('UpdateProductLayout', change)
          console.log('Update product layout with id', this.selectedProductLayout._id)
          const qry = {
            type: this.layoutType,
            'categories.products._id': this.selectedProductLayout._id
          }
          const set =  { $set: _.reduce(change, (result, value, key) => {
              result[`categories.$[cate].products.$[product].${key}`] = value
              return result
            }, {}) };
          const filter = [{ 'cate._id': this.selectedCategoryLayout._id }, { 'product._id': this.selectedProductLayout._id }]
          const result = await cms.getModel('OrderLayout').findOneAndUpdate(qry, set, { arrayFilters: filter,  new: true });
          this.showNotify()
        } else {
          if (forceCreate) {
            await this.createNewProductLayout(null, change)
            this.showNotify()
          } else {
            console.log('ProductLayout is not existed yet. skipped')
          }
        }
      },

      // update ...
      async updateProduct(change, forceCreate) {
        console.log('storing', change ,'to internal variable this.selectedProduct')
        this.selectedProduct = { ...this.selectedProduct, ...change }

        if (this.selectedProduct._id) {
          console.log('updateProduct', change)
          await cms.getModel('Product').findOneAndUpdate({_id: this.selectedProduct._id}, change)
          this.showNotify()
        } else {
          if (forceCreate) {
            console.log('Create new Product')
            const product = await cms.getModel('Product').create({ ...this.selectedProduct });
            console.log('Create new ProductLayout linked to Product with id: ', product._id)
            await this.createNewProductLayout(product._id)
            this.showNotify()
          } else {
            console.log('Product is not existed yet. skipped')
          }
        }
      },

      async createNewProductLayout(productId, extraInfo) {
        const productLayout = {
          product: productId,
          ..._.pick(this.selectedProductLayout, ['top', 'left', 'color', 'type', 'text']),
          ...extraInfo
        }

        const result = await cms.getModel('OrderLayout').findOneAndUpdate(
            {
              type: this.layoutType,
              'categories._id' : this.selectedCategoryLayout._id
            },
            { $push: { 'categories.$.products' : productLayout } },
            { new: true });
        this.$emit('update:orderLayout', result)
      },
      openDialogInfo(focus) {
        this.dialog.focus = focus
        this.dialog.productInfo = true
      },
      setProductInfo(propName, propValue) {
        this.selectedProduct[propName] = propValue
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
