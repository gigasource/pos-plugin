<template>
  <div class="menu-setting">
    <template v-if="renderPage">
      <div class="menu-setting__title mb-3">Menu Settings</div>
      <div v-if="!categories || !categories.length" class="menu-setting--empty">
        <img draggable="false" src="/plugins/pos-plugin/assets/folk_knife.svg">
        <p>Menu is currently empty.</p>
        <p><span style="color: #536DFE">"Add new category"</span> to get started.</p>
        <div class="row-flex align-items-center">
          <g-btn-bs class="btn-add mr-2" @click="dialog.addNewCategory = true">Add New Category</g-btn-bs>
          <span class="mt-2">or</span>
          <g-btn-bs v-if="imexportable" class="btn-add" @click="openImportMenuItemDialog">Import Categories</g-btn-bs>
        </div>
      </div>
      <div :class="['menu-setting__main', isInDevice && 'menu-setting__main--mobile']" v-else>
        <div class="row-flex justify-end mb-2">
          <g-spacer/>
          <g-btn-bs v-if="!isInDevice" @click="openWebShop" border-color="#757575">Preview</g-btn-bs>
          <g-btn-bs @click="dialog.setting = true" icon="icon-cog3@18" border-color="#757575">Settings</g-btn-bs>
          <g-btn-bs v-if="imexportable" background-color="indigo accent-2" text-color="white" icon="add_circle" style="margin-right: 0"
                    @click="openImportMenuItemDialog">
            Import
          </g-btn-bs>
          <g-btn-bs v-if="imexportable" background-color="indigo accent-2" text-color="white" icon="add_circle" style="margin-right: 0"
                    @click="exportProductMenuItem">
            Export
          </g-btn-bs>
          <g-btn-bs background-color="indigo accent-2" text-color="white" icon="add_circle" style="margin-right: 0"
                    @click="dialog.addNewCategory = true">
            Add new category
          </g-btn-bs>
        </div>
        <div class="menu-setting__category" id="menu-setting">
          <div v-for="(cate, index) in categoriesViewModel" :key="index" class="mb-1">
            <div @click="toggleCollapse(cate)" class="menu-setting__category__header" @mouseenter="toggleEditBtn(index, true)" @mouseleave="toggleEditBtn(index, false)">
              <g-edit-view-input
                  @click.native.stop.prevent="() => {}"
                  :value="cate.name"
                  class="menu-setting__title"
                  @input="(name, cb) => changeCategoryName(cate._id, name, cb)">
                <template v-slot:action="{mode, switchToEditMode, applyChange, resetValue}">
                  <g-icon v-if="editBtn[index] && mode !== 'edit'" @click="switchToEditMode()" size="18" class="ml-1">mdi-pencil-outline</g-icon>
                  <g-icon v-if="mode === 'edit'" @click="applyChange()" class="ml-1">mdi-check</g-icon>
                  <g-icon v-if="mode === 'edit'" @click="resetValue()" class="ml-1">mdi-close</g-icon>
                </template>
              </g-edit-view-input>
              <g-icon v-if="editBtn[index] && !editingProduct" style="cursor: pointer; margin-left: 8px" @click.stop="swapCategory(index, index-1)">fas fa-caret-square-up</g-icon>
              <g-icon v-if="editBtn[index] && !editingProduct" style="cursor: pointer; margin-left: 8px" @click.stop="swapCategory(index, index+1)">fas fa-caret-square-down</g-icon>
              <g-spacer/>
              <g-btn-bs
                  background-color="#E3F2FD"
                  text-color="#536DFE"
                  border-color="#90CAF9"
                  @click.stop.prevent="showAddNewProductPanelForCategory(cate)"
                  :disabled="showAddNewProductPanel[cate._id]"
                  style="white-space: nowrap">
                + Add New Item
              </g-btn-bs>
              <upload-zone v-if="!isInDevice" style="border: none;" @url="setCategoryImage($event, cate._id)">
                <template v-slot:default="{showUploadDialog}">
                  <g-btn-bs icon="icon-upload2@18" background-color="#F4F9FF" border-color="#B5BAC0" text-color="#535962" @click.stop.prevent="showUploadDialog()" style="margin: 0">
                    Group Picture
                  </g-btn-bs>
                </template>
              </upload-zone>
              <g-btn-bs background-color="#F4F9FF" border-color="#B5BAC0"
                        @click.prevent.stop="openDeleteCategoryDialog(cate)">
                <g-icon color="#535962">mdi-trash-can-outline</g-icon>
              </g-btn-bs>
              <g-divider vertical inset class="ml-2 mr-3"/>
              <g-icon v-if="showProducts[cate._id]">fas fa-chevron-up</g-icon>
              <g-icon v-else>fas fa-chevron-down</g-icon>
            </div>
            <g-expand-transition>
              <template v-if="showProducts[cate._id]">
                <div>
                  <div style="border-bottom: 1px solid #E0E0E0">
                    <template v-if="cate.products && cate.products.length > 0">
                      <setting-menu-item
                          v-for="(product, index) in cate.products"
                          v-bind="product"
                          :index="index"
                          :max-index="cate.products.length"
                          :available-printers="store.printers"
                          :use-multiple-printers="store.useMultiplePrinters"
                          :key="`item_${index}`"
                          :collapse-text="collapse"
                          :display-id="showId"
                          :editing="editingProduct"
                          :displayImage="showImage"
                          @editing="setEditing(product._id, $event)"
                          @save="updateProduct(product._id, $event)"
                          @delete="openDeleteProductDialog(product._id)"
                          :store-country-locale="storeCountryLocale"
                          @swap="(oldIndex, newIndex) => swapProduct(cate, oldIndex, newIndex)"/>
                    </template>
                    <div v-else-if="!showAddNewProductPanel[cate._id]" style="height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #fff;">
                      <img src="/plugins/pos-plugin/assets/no-items.svg" class="mb-2"/>
                      <div class="text-grey">No item in this group.</div>
                    </div>
                    <div v-if="showAddNewProductPanel[cate._id]" :id="`new_product_${cate._id}`">
                      <setting-new-menu-item
                          :index="cate.products.length"
                          :available-printers="store.printers"
                          :use-multiple-printers="store.useMultiplePrinters"
                          @cancel="hideAddNewProductPanelForCategory(cate)"
                          @save="addNewProduct({...$event, category: cate._id, order: cate.products.length})"
                          :store-country-locale="storeCountryLocale"/>
                    </div>
                  </div>
                </div>
              </template>
            </g-expand-transition>
          </div>
        </div>
      </div>
      <dialog-new-category v-model="dialog.addNewCategory" @submit="addNewCategory"/>
      <dialog-delete-category v-model="dialog.deleteCategory" @confirm="deleteCategory"/>
      <dialog-delete-item v-model="dialog.deleteProduct" @confirm="deleteProduct"/>
      <g-dialog v-model="dialog.setting" eager width="531">
        <div class="dialog">
          <div class="dialog-title">Settings</div>
          <g-icon class="dialog-icon--close" size="20" color="black" @click="dialog.setting = false">icon-close</g-icon>
          <div class="dialog-content">
            <g-switch label="Collapse overflow text" v-model="collapse"/>
            <p class="fs-small-2 i text-grey-darken-1 ml-1 mb-4">Limit displaying menu description to 2 lines.</p>
            <g-switch label="Display item no." v-model="showId"/>
            <p class="fs-small-2 i text-grey-darken-1 ml-1 mb-4">Display menu number on online ordering website</p>
            <g-switch label="Display item image" v-model="showImage"/>
            <p class="fs-small-2 i text-grey-darken-1 ml-1 mb-4">Display menu image on online ordering website</p>
          </div>
        </div>
      </g-dialog>
      <dialog-import-menu-item v-model="dialog.importMenuItem" @submit="importMenuItemFromExcel"/>
    </template>
  </div>
</template>
<script>
  import _ from 'lodash'
  import DialogNewCategory from './dialogNewCategory';
  import DialogDeleteCategory from './dialogDeleteCategory';
  import XLSX from 'xlsx'
  import { imexportMenuItem, exportMenuItem } from '../../Store/imexportMenuItem';
  import DialogImportMenuItem from './dialogImportMenuItem';
  
  export default {
    name: 'SettingMenu',
    components: { DialogImportMenuItem, DialogDeleteCategory, DialogNewCategory },
    props: {
      store: Object,
      categories: Array,
      products: Array,
      collapseText: Boolean,
      displayId: Boolean,
      displayImage: Boolean,
    },
    data: function () {
      return {
        showProducts: _.reduce(this.categories, (acc, v) => { acc[v._id] = true; return acc }, {}) ,
        showAddNewProductPanel: {},
        editingProducts: {},
        selectedCategoryId: null,
        selectedProductId: null,
        renderPage: true,
        dialog: {
          addNewCategory: false,
          deleteCategory: false,
          deleteProduct: false,
          setting: false,
          importMenuItem: false,
        },
        editBtn: [],
        editingProduct: false,
        edittingItems: [],
        imexportable: cms.loginUser.user.role.name === 'admin'
      }
    },
    created() {
      if (!this.store.printers || !this.store.printers.length) {
        alert('Navigate to "Multiple Printers" and add a printer before editing menu item')
        this.renderPage = false
      }
      this.editBtn = this.categoriesViewModel ? this.categoriesViewModel.map(g => false) : []
    },
    computed: {
      storeCountryLocale() {
        return (this.store && this.store.country && this.store.country.locale) || 'en'
      },
      categoriesViewModel() {
        const categories = _.cloneDeep(this.categories)
        const products = _.cloneDeep(this.products)
        _.each(categories, cate => {
          cate.products = _.orderBy(_.filter(products, p => p.category._id === cate._id), 'position', 'asc')
        })
        return categories
      },
      collapse: {
        get() {
          return this.collapseText
        },
        set(val) {
          this.$emit('update-store', {collapseText: val})
        }
      },
      showId: {
        get() {
          return this.displayId
        },
        set(val) {
          this.$emit('update-store', {displayId: val})
        }
      },
      isInDevice() {
        return this.$route.query.device
      },
      showImage: {
        get() {
          return this.displayImage
        },
        set(val) {
          this.$emit('update-store', {displayImage: val})
        }
      }
    },
    watch: {
      categoriesViewModel(val) {
        if(val)
          this.editBtn = val.map(g => false)
      },
    },
    methods: {
      setEditing(productId, editing) {
        const wrapper = document.querySelector('.menu-setting__category')
        if (editing) {
          this.$set(this.editingProducts, productId, editing)
          this.edittingItems.push({
            id: productId,
            top: wrapper.scrollTop
          })
        } else {
          this.$delete(this.editingProducts, productId)
          const item = document.getElementById(productId)
          const index = this.edittingItems.findIndex(item => item.id === productId)
          const editingItem = this.edittingItems.splice(index, 1)[0]
          wrapper.scroll({top: editingItem.top, left: 0})
          this.edittingItems = this.edittingItems.map((ei, i) => {
            if(ei.top > editingItem.top && i >= index)
              return {
                id: ei.id,
                top: ei.top - item.offsetHeight + 112
              }
            return  ei
          })
        }
        this.editingProduct = editing
      },
      toggleCollapse(category) {
        if (this.showProducts[category._id]) {
          const editingProduct = _.keys(this.editingProducts)
          const productsOfCate = _.map(category.products, p => p._id)
          const intersectProducts = _.intersection(editingProduct, productsOfCate)
          const canCollapse = intersectProducts.length === 0
          if (canCollapse)
            this.$delete(this.showProducts, category._id)
        } else {
          this.$set(this.showProducts, category._id, true)
        }
      },
      showAddNewProductPanelForCategory(cate) {
        this.$set(this.showAddNewProductPanel, cate._id, true)
        this.$nextTick(() => {
          const wrapper = document.getElementById('menu-setting')
          const panel = document.getElementById('new_product_' + cate._id)
          const top = wrapper.scrollTop
          wrapper.scroll({top: top + panel.getBoundingClientRect().top - wrapper.getBoundingClientRect().top - 48, left: 0, behavior: 'smooth'})
        })
      },
      hideAddNewProductPanelForCategory(cate) {
        this.$set(this.showAddNewProductPanel, cate._id, false)
      },
      addNewCategory(name, callback) {
        this.$emit('add-new-category', name, (response) => {
          callback(response)
          const wrapper = document.querySelector('.menu-setting__category')
          wrapper.scroll({top: wrapper.scrollHeight, behavior: 'smooth'})
        })
      },
      changeCategoryName(categoryId, name, callback) {
        this.$emit('change-category-name', categoryId, name, callback)
      },
      openDeleteCategoryDialog(cate) {
        this.dialog.deleteCategory = true
        this.selectedCategoryId = cate._id
      },
      deleteCategory() {
        this.$emit('delete-category', this.selectedCategoryId)
      },
      addNewProduct(product) {
        this.$emit('add-new-product', product )
        this.showAddNewProductPanel[product.category] = false
      },
      updateProduct(productId, change) {
        this.$emit('update-product', productId, change)
      },
      deleteProduct() {
        this.$emit('delete-product', this.selectedProductId)
      },
      openDeleteProductDialog(productId) {
        this.selectedProductId = productId
        this.dialog.deleteProduct = true
      },
      openWebShop() {
        window.open(`${location.origin}/store/${this.store.alias || this.store._id}`)
      },
      toggleEditBtn(index, mode) {
        if(this.editBtn && this.editBtn.length > 0) {
          this.$set(this.editBtn, index, mode)
        }
      },
      swapProduct(category, oldIndex, newIndex) {
        const product = category.products[oldIndex]
        const swapProduct = category.products[newIndex]
        this.updateProduct(product._id, {position: newIndex})
        this.updateProduct(swapProduct._id, {position: oldIndex})
      },
      swapCategory(oldIndex, newIndex) {
        const category = this.categories[oldIndex]
        const swapCategory = this.categories[newIndex]
        if(category && swapCategory) {
          this.$emit('swap-category', category._id, swapCategory._id, oldIndex, newIndex)
        }
      },
      setCategoryImage(image, categoryId) {
        this.$emit('change-category-image', image, categoryId)
      },
      
      // import file
      openImportMenuItemDialog() {
        this.dialog.importMenuItem = true
      },
      importMenuItemFromExcel(metadata, callback) {
        const self = this
        const reader = new FileReader();
        reader.onload = function(e) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, {type: 'array'});
          imexportMenuItem({
            workbook: workbook,
            behavior: metadata.importBehavior,
            storeId: self.store._id,
            onCompleted: (isCompleted, error) => {
              callback && callback(isCompleted, error)
              if (isCompleted)
                self.$emit('import-categories-completed')
            }
          })
        };
        reader.readAsArrayBuffer(metadata.file);
      },
      exportProductMenuItem() {
        exportMenuItem({ storeId: this.store._id })
      }
    }
  }
</script>

<style scoped lang="scss">
  .menu-setting {
    height: 100%;

    &__title {
      font-size: 18px;
      font-weight: 700;
    }

    &--empty {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      margin-left: 50%;
      margin-top: 25%;
      transform: translate(-50%, -50%);

      p {
        color: #757575;
      }

      .btn-add {
        color: #536DFE;
        cursor: pointer;
        font-weight: 700;
        margin-top: 8px;
      }
    }

    &__main {
      height: calc(100% - 27px - 16px);

      &--mobile {
        height: calc(100%);
        margin-top: -43px;
      }
    }

    &__category {
      position: relative;
      height: calc(100% - 36px - 8px);
      overflow: hidden auto;
      scrollbar-width: none; // firefox

      &::-webkit-scrollbar {
        display: none;
      }

      &__header {
        position: sticky;
        top: 0;
        display: flex;
        height: 48px;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        background-color: #E1E8F0;
        cursor: pointer;
        z-index: 2;

        .g-edit-view-input {
          ::v-deep .g-icon {
            font-size: 20px !important;
            margin-left: 8px;
          }
        }
      }
    }
  }

  .dialog {
    background: white;
    border-radius: 4px;
    width: 100%;
    position: relative;
    padding: 40px;

    &-title {
      color: #212121;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 28px;
      margin-left: 4px;
    }

    &-icon--close {
      position: absolute;
      top: 16px;
      right: 16px;
    }
  }
</style>
