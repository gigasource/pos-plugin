<template>
  <div style="height: 100%; width: 100%">
    <g-toolbar height="100%" elevation="0" color="#eee">
      <g-btn-bs elevation="2" icon="icon-back" @click="back">{{$t('ui.back')}}</g-btn-bs>
      <g-btn-bs v-if="!orderLayout" text-color="#1271FF" elevation="2" icon="add_circle" @click="addLayout">{{$t('ui.add')}}</g-btn-bs>
      <g-btn-bs elevation="2" icon="icon-edit-menu-card-switch" @click="switchItem" :disabled="!switchable">{{$t('ui.switch')}}</g-btn-bs>
      <g-btn-bs elevation="2" icon="icon-edit-menu-card-copy" @click="copyItem" :disabled="!copyable">{{$t('ui.copy')}}</g-btn-bs>
      <g-btn-bs elevation="2" icon="icon-edit-menu-card-delete" @click="showDeleteConfirmDialog" :disabled="!deletable">{{$t('ui.delete')}}</g-btn-bs>
      <g-spacer/>
      <g-btn-bs elevation="2" icon="fas fa-calculator" @click="showKeyboardEditor">{{$t('restaurant.menuEdit.editKeyboard')}}</g-btn-bs>
      <g-btn-bs v-if="mode === 'basic'" elevation="2" icon="icon-basic-mode" @click="changeToIngredientMode">{{$t('inventory.basicMode')}}</g-btn-bs>
      <g-btn-bs v-else-if="mode === 'ingredient'" elevation="2" icon="icon-ingredient-mode" @click="changeToBasicMode">{{$t('inventory.ingredientMode')}}</g-btn-bs>
    </g-toolbar>

    <dialog-confirm-delete
        v-model="dialog.confirmDeleteProductLayout"
        :type="deleteProductLayoutMessage"
        @submit="deleteItem(), hideDeleteConfirmDialog()"/>
    <g-dialog v-model="dialog.mode" eager width="448">
      <div class="dialog" @click="dialog.mode = false">
        <div class="dialog-content">
          <g-icon>icon-basic-mode</g-icon>
          <div style="flex: 1; margin-left: 16px">
            <p class="dialog-content__title">{{$t('inventory.basicMode')}}</p>
            <p class="dialog-content__detail">{{$t('inventory.basicNote')}}</p>
          </div>
        </div>
        <div class="dialog-content">
          <g-icon>icon-ingredient-mode</g-icon>
          <div style="flex: 1; margin-left: 16px">
            <p class="dialog-content__title">{{$t('inventory.ingredientMode')}}</p>
            <p class="dialog-content__detail">{{$t('inventory.ingredientNote')}}</p>
          </div>
        </div>
        <div class="dialog-message">
          {{$t('inventory.clickDismiss')}}
        </div>
      </div>
    </g-dialog>
    <dialog-form-input v-model="dialog.add" @submit="createLayout">
      <template v-slot:input>
        <div class="row-flex flex-wrap justify-around mt-2">
          <pos-textfield-new style="width: 48%" label="Column" v-model="column" clearable/>
          <pos-textfield-new style="width: 48%" label="Row" v-model="row" clearable/>
        </div>
      </template>
    </dialog-form-input>
  </div>
</template>
<script>
  import _ from 'lodash'
  import dialogConfirmDelete from '../Settings/dialog/dialogConfirmDelete';

  export default {
    name: 'EditMenuCardToolbar',
    components: { dialogConfirmDelete },
    props: {
      view: null,
      orderLayout: null,
      selectedCategoryLayout: null,
      selectedProductLayout: null,
      productDblClicked: null,
      mode: String
    },
    data: function () {
      return {
        targetLayout: null, // category or product
        prevCategoryLayout: null,
        prevProductLayout: null,
        actionTarget: null,
        action: null,

        // confirm delete dialog
        // TODO: i18n
        deleteProductLayoutMessage: ' this product',
        dialog: {
          confirmDeleteProductLayout: false,
          mode: false,
          add: false
        },
        column: 4,
        row: 2
      }
    },
    computed: {
      switchable() {
        switch (this.targetLayout) {
          case 'product':
            return (this.selectedProductLayout && this.selectedProductLayout._id)
          case 'category':
            return (this.selectedCategoryLayout && this.selectedCategoryLayout._id)
        }
      },
      copyable() {
        if (this.targetLayout)
            return (this.selectedProductLayout && this.selectedProductLayout._id)
      },
      deletable() {
        switch (this.targetLayout) {
          case 'product':
            return (this.selectedProductLayout && this.selectedProductLayout._id)
          case 'category':
            const cateExist = this.selectedCategoryLayout && this.selectedCategoryLayout._id
            const cateHasItem = cateExist && _.filter(this.selectedCategoryLayout.products, pLayout => pLayout.product && pLayout.product._id).length > 0
            return cateExist && !cateHasItem
        }
      }
    },
    watch: {
      view(value) {
        if (value) {
          if (value.name === 'CategoryEditor') {
            this.targetLayout = 'category'
          } else if (value.name === 'ProductEditor') {
            this.targetLayout = 'product'
          }
        }
      },
      selectedCategoryLayout() {
        if (this.actionTarget === 'category' && this.prevCategoryLayout && this.selectedCategoryLayout)
          this.doCategoryAction()
      },
      selectedProductLayout() {
        if (this.selectedCategoryLayout._id && this.actionTarget === 'product' && this.prevProductLayout && this.selectedProductLayout)
          this.doProductAction()
      },
      productDblClicked() {
        if (this.productDblClicked) {
          this.switchItem()
        }
      }
    },
    methods: {
      back() {
        this.$router.push({ path: '/pos-dashboard' })
      },
      storePreviousInfo(){
        if (this.view.name === 'CategoryEditor') {
          this.prevCategoryLayout = this.selectedCategoryLayout
        } else if (this.view.name === 'ProductEditor') {
          this.prevCategoryLayout = this.selectedCategoryLayout
          this.prevProductLayout = this.selectedProductLayout
        }
        this.actionTarget = this.targetLayout
      },
      switchItem() {
        this.storePreviousInfo()
        this.action = 'switch'
      },
      copyItem() {
        this.storePreviousInfo()
        this.action = 'copy'
      },
      async doCategoryAction() {
        if (this.prevCategoryLayout && this.actionTarget === 'category') {
          if (this.action === 'switch')
            await this.switchCategory()
        }
      },
      async doProductAction() {
        switch (this.action) {
          case 'switch':
            await this.switchProduct()
            break;
          case 'copy':
            await this.copyProduct()
            break;
        }
      },

      async switchCategory() {
        console.log('switch category')
        let qry = { 'categories._id': this.prevCategoryLayout._id }
        let set = { $set: { 'categories.$.top': this.selectedCategoryLayout.top, 'categories.$.left': this.selectedCategoryLayout.left } }
        console.log('qry', qry, 'set', set)
        let orderLayout = await cms.getModel('OrderLayout').findOneAndUpdate(qry, set, { new: true })

        //
        if (this.selectedCategoryLayout._id) {
          qry = { 'categories._id': this.selectedCategoryLayout._id }
          set = { $set: { 'categories.$.top': this.prevCategoryLayout.top, 'categories.$.left': this.prevCategoryLayout.left } }
          console.log('qry', qry, 'set', set)
          orderLayout = await cms.getModel('OrderLayout').findOneAndUpdate(qry, set, { new: true })
        }
        this.clearCategoryAction()
        this.$emit('update:orderLayout', orderLayout)
      },
      clearCategoryAction() {
        console.log('clear category action')
        this.prevCategoryLayout = null
        this.actionTarget = null
        this.action = null
      },

      async switchProduct() {
        console.log('switchProduct')
        if (this.prevCategoryLayout._id === this.selectedCategoryLayout._id) {
          console.log('switch product in same category')
          // TODO: Bulk update
          let result = await this.changeProductLayoutPosInTheSameCate(
              this.prevProductLayout,
              _.pick(this.selectedProductLayout, ['top', 'left']),
              this.prevCategoryLayout)

          if (this.selectedProductLayout._id)
            result = await this.changeProductLayoutPosInTheSameCate(
                this.selectedProductLayout,
                _.pick(this.prevProductLayout, ['top', 'left']),
                this.prevCategoryLayout)

          this.clearProductAction()
          this.$emit('update:orderLayout', result)
        } else {
          // switch in 2 categories
          console.log('TODO: switching products between category is not implemented')
        }
      },
      async changeProductLayoutPosInTheSameCate(productLayout, { top, left }, categoryLayout) {
        return await cms.getModel('OrderLayout').findOneAndUpdate(
            { 'categories.products._id': productLayout._id },
            {
              $set: {
                ['categories.$[cate].products.$[product].top']: top,
                ['categories.$[cate].products.$[product].left']: left,
              }
            },
            {
              arrayFilters: [{ 'cate._id': categoryLayout._id }, { 'product._id': productLayout._id }],
              new: true
            });
      },
      async copyProduct() {
        console.log('copyProduct')
        if (this.selectedProductLayout._id) {
          console.log('Product existed in selected position. Skip copy.')
          return;
        }
        const product = await cms.getModel('Product').create({
          ...this.copyProductInfo(this.prevProductLayout.product)
        });
        const productLayout = {
          product: product._id,
          ..._.pick(this.selectedProductLayout, ['top', 'left']),
          ..._.pick(this.prevProductLayout, ['color', 'type', 'text'])
        }
        const result = await cms.getModel('OrderLayout').findOneAndUpdate(
            { 'categories._id' : this.selectedCategoryLayout._id },
            { $push: { 'categories.$.products' : productLayout } },
            { new: true });
        this.clearProductAction()
        this.$emit('update:orderLayout', result)
      },

      copyProductInfo(product) {
        if (!product) return
        const clone = {
          ...product,
          id: this.createNewProductId(product.id)
        }
        delete clone._id
        return clone
      },

      createNewProductId(id) {
        const idRegex = /^(?<digit>\d+)(?<alpha>\w)?$/g
        const result = idRegex.exec(id)
        if (!result)
          return id
        if (!result.groups.alpha)
          return Number(result.groups.digit) + 1
        return `${result.groups.digit}${String.fromCharCode(result.groups.alpha.charCodeAt(0) + 1) }`
      },

      clearProductAction() {
        console.log('clear product action')
        this.prevCategoryLayout = null
        this.prevProductLayout = null
        this.actionTarget = null
        this.action = null
      },

      async deleteItem() {
        if (!this.view) return
        if (this.view.name === 'CategoryEditor') {
          const orderLayout = await cms.getModel('OrderLayout').findOneAndUpdate(
              { _id: this.orderLayout._id },
              { $pull: { categories: { _id: this.selectedCategoryLayout._id } } },
              { new: true }
          )
          this.$emit('update:selectedCategoryLayout', null)
          this.$emit('update:orderLayout', orderLayout)
        } else if (this.view.name === 'ProductEditor') {
          if (this.selectedProductLayout.product._id)
            await cms.getModel('Product').remove({_id: this.selectedProductLayout.product._id})
          const orderLayout = await cms.getModel('OrderLayout').findOneAndUpdate(
              { 'categories._id': this.selectedCategoryLayout._id },
              { $pull: { 'categories.$.products': { _id: this.selectedProductLayout._id } } },
              { new: true }
          )
          this.$emit('update:orderLayout', orderLayout)
          this.$emit('update:view', { name: "CategoryEditor" })
          this.$emit('update:selectedProductLayout', null)
        }
      },
      showDeleteConfirmDialog() {
        this.dialog.confirmDeleteProductLayout = true
      },
      hideDeleteConfirmDialog() {
        this.dialog.confirmDeleteProductLayout = false
      },
      showKeyboardEditor() {
        this.$emit('update:view', { name: 'KeyboardEditor'})
      },
      changeToIngredientMode() {
        this.$emit('update:view', { name: 'IngredientEditor'})
        this.$emit('update:mode', 'ingredient')
        this.dialog.mode = true
      },
      changeToBasicMode() {
        this.$emit('update:mode', 'basic')
        this.$emit('update:view', { name: 'CategoryEditor'})
      },
      addLayout() {
        this.dialog.add = true
      },
      async createLayout() {
        const layout = await cms.getModel('OrderLayout').create({
          columns: this.column,
          rows: this.row,
          type: 'default'
        })
        this.$emit('update:orderLayout', layout)
        this.dialog.add = false
      }
    }
  }
</script>
<style scoped lang="scss">
  .g-toolbar {
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
  }

  .g-btn-bs {
    background-color: white;
    font-size: 14px;
  }

  .delete_product_title {
    height: 25px;

    font-family: Muli;
    font-style: normal;
    font-weight: bold;
    font-size: 20px;
    line-height: 25px;
    /* identical to box height */

    display: flex;
    align-items: center;
    text-align: center;

    color: #1D1D26;
  }

  .dialog {
    width: 100%;
    background-color: white;
    border-radius: 4px;
    padding: 20px;

    &-content {
      display: flex;
      margin-bottom: 16px;

      &__title {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      &__detail {
        font-size: 13px;
      }
    }

    &-message {
      text-align: center;
      font-size: 12px;
      color: #9e9e9e;
    }
  }

  @media screen and (max-width: 1280px) {
    .g-btn-bs {
      font-size: 0;

      ::v-deep .g-icon {
        margin-right: 0 !important;
      }
    }
  }
</style>
