<template>
  <div style="height: 100vh; width: 100vw; display: flex;">
    <template v-if="permissionDenied">
      {{ permissionDeniedMessage }}
    </template>
    <template v-else>
      <!-- sidebar -->
      <pos-dashboard-sidebar :default-path="defaultPath" :items="computedSidebar" @node-selected="onNodeSelected"/>

      <!-- content -->
      <div style="background-color: #F4F7FB; flex: 1; padding: 50px 5%">
        <restaurant-information
            v-if="view === 'restaurant-info'"
            :store="store"
            @update="updateStore"/>
        <service-and-open-hours
            v-if="view === 'service-and-open-hours'"
            v-bind="store"
            @update="updateStore"
            @update:deliveryTimeInterval="updateDeliveryTimeInterval"/>
        <setting-menu
            v-if="view === 'settings-menu'"
            :store="store"
            :categories="categories"
            :products="products"
            :collapse-text="store.collapseText"
            :display-id="store.displayId"
            @update-store="updateStore"
            @add-new-category="addNewCategory"
            @change-category-name="changeCategoryName"
            @delete-category="deleteCategory"
            @add-new-product="addNewProduct"
            @update-product="updateProduct"
            @delete-product="deleteProduct"
            @swap-category="swapCategory"/>
        <delivery-fee v-if="view === 'setting-delivery-fee'" :store="store" @update="updateStore"/>
        <multiple-printer v-if="view === 'setting-multiple-printer'" :store="store" @update="updateStore"/>
        <discount v-if="view === 'setting-discount'" :list-discount="listDiscount"
                  @addDiscount="addDiscount" @getDiscounts="getDiscounts" @removeDiscount="removeDiscount" @updateDiscount="updateDiscount"/>
      </div>
    </template>
  </div>
</template>
<script>
  import _ from 'lodash';
  import RestaurantInformation from './RestaurantInformation';
  import ServiceAndOpenHours from './ServiceAndOpenHours';
  import SettingMenu from './SettingMenu';
  import DeliveryFee from "./DeliveryFee";
  import MultiplePrinter from "./MultiplePrinter";
  import Discount from "./Discount";
  export default {
    name: 'SettingView',
    components: {Discount, MultiplePrinter, DeliveryFee, SettingMenu, ServiceAndOpenHours, RestaurantInformation},
    data: function () {
      return {
        sidebarItems: [
          {title: 'Basics', icon: 'airplay', onClick: () => this.changeView('restaurant-info')},
          {
            title: 'Service & Open hours',
            icon: 'mdi-file-document-outline',
            onClick: () => this.changeView('service-and-open-hours')
          },
          {title: 'Menu', icon: 'filter_list', onClick: () => this.changeView('settings-menu')},
          {title: 'Delivery Fee', icon: 'icon-setting-delivery', onClick: () => this.changeView('setting-delivery-fee', 'Delivery Fee')},
          {title: 'Multiple Printer', icon: 'icon-setting-multiple', onClick: () => this.changeView('setting-multiple-printer', 'Multiple Printer')},
          {title: 'Discount', icon: 'icon-coupon', onClick: () => this.changeView('setting-discount', 'Discount')},
        ],
        sidebarItemsDevice: [
          {
            title: 'Service & Open hours',
            icon: 'mdi-file-document-outline',
            onClick: () => this.changeView('service-and-open-hours')
          },
          {title: 'Menu', icon: 'filter_list', onClick: () => this.changeView('settings-menu')},
          {title: 'Discount', icon: 'icon-coupon', onClick: () => this.changeView('setting-discount', 'Discount')},
        ],
        view: '',
        sidebar: '',
        defaultPath: '',
        //
        store: null,
        categories: null,
        products: null,
        permissionDenied: true,
        permissionDeniedMessage: '',
        listDiscount: []
      }
    },
    computed: {
      computedSidebar() {
        return this.$route.query.device ? this.sidebarItemsDevice : this.sidebarItems
      }
    },
    async created() {
      const storeIdOrAlias = this.$route.params.storeIdOrAlias
      if (storeIdOrAlias) {
        const store = await cms.getModel('Store').findOne({alias: storeIdOrAlias})
        const user = cms.loginUser.user
        let userManageThisStore = false
        if (user.role.name !== 'admin') {
          if (user.role.name === 'device') {
            userManageThisStore = store && (user.store._id === store._id)
          } else {
            const userStoreGroups = _.map(user.storeGroups, g => g._id)
            const storeGroups = _.map(store.groups, g => g._id)
            userManageThisStore = _.intersection(storeGroups, userStoreGroups).length > 0
          }
        }
        
        if (user.role.name === 'admin' || userManageThisStore) {
          this.permissionDenied = false
          this.$set(this, 'store', store)
          await this.loadCategories()
          await this.loadProducts()
        } else {
          this.permissionDenied = true;
          this.permissionDeniedMessage = 'Permission denied!'
        }
      }

      if (this.$route.query.device) {
        this.view = 'settings-menu'
        this.defaultPath = 'item.1'
      } else {
        this.view = 'restaurant-info'
        this.defaultPath = 'item.0'
      }
    },
    methods: {
      onNodeSelected(node) {
        node.onClick && node.onClick.bind(this)();
      },
      async loadStore() {
        this.$set(this, 'store', await cms.getModel('Store').findOne({_id: this.store._id}))
      },
      async updateStore(change) {
        if (change.orderTimeOut) window.cms.socket.emit('updateOrderTimeOut', this.store._id, change.orderTimeOut)

        await cms.getModel('Store').updateOne({_id: this.store._id}, change)
        Object.assign(this.store, change)
      },
      async updateDeliveryTimeInterval(val) {
        await this.updateStore({deliveryTimeInterval: val})
      },
      changeView(view, title) {
        if (view) {
          this.view = view
          //reset icon
          for (const item of this.computedSidebar) {
            if (item.icon.startsWith('icon-') && item.icon.endsWith('_white')) {
              this.$set(item, 'icon', item.icon.slice(0, item.icon.length - 6))
            }
          }
        }
        if (title) {
          const item = this.computedSidebar.find(i => i.title === title)
          this.$set(item, 'icon', item.icon+'_white')
        }
      },

      // categories
      async loadCategories() {
        this.$set(this, 'categories', await cms.getModel('Category').find({ store: this.store._id }, { store: 0 }).sort({position: 1}))
      },
      async addNewCategory(name, callback) {
        if (_.trim(name) === "") {
          callback && callback({ ok: false, message: 'Category name is missing!' })
          return
        }

        const isDuplicateName = _.find(this.categories, c => c.name === name)
        if (isDuplicateName) {
          callback && callback({ ok: false, message: 'This name is already taken!' })
          return
        }

        await cms.getModel('Category').create({name, store: this.store._id, position: this.categories.length})
        await this.loadCategories()
        callback && callback({ok: true})
      },
      async changeCategoryName(_id, name, callback) {
        if (_.trim(name) === "") {
          alert('Category name is missing')
          callback && callback(false)
          return
        }

        const category = _.find(this.categories, c => c._id === _id)
        if (category.name === name)
          return

        const isDuplicateName = _.find(this.categories, c => c.name === name && c._id !== _id)
        if (isDuplicateName) {
          alert('This name is already taken!')
          callback && callback(false)
          return
        }

        await cms.getModel('Category').updateOne({_id}, { name })
        await this.loadCategories()
        callback && callback(true)
      },

      async deleteCategory(_id) {
        await cms.getModel('Product').remove({ category: _id })
        await cms.getModel('Category').remove({_id: _id})
        await this.loadCategories()
        await this.loadProducts()
      },

      async swapCategory(oldId, swapId, oldIndex, newIndex) {
        const category = _.cloneDeep(this.categories[oldIndex])
        const swapCategory = _.cloneDeep(this.categories[newIndex])
        category.position = newIndex
        swapCategory.position = oldIndex
        this.categories.splice(oldIndex, 1, swapCategory)
        this.categories.splice(newIndex, 1, category)
        await cms.getModel('Category').updateOne({_id: oldId}, {position: newIndex})
        await cms.getModel('Category').updateOne({_id: swapId}, {position: oldIndex})
      },

      // products
      async loadProducts() {
        this.$set(this, 'products', await cms.getModel('Product').find({ store: this.store._id }, { store: 0 }))
      },
      async addNewProduct(product) {
        await cms.getModel('Product').create({...product, store: this.store._id})
        await this.loadProducts()
      },
      async updateProduct(_id, change) {
        await cms.getModel('Product').updateOne({_id, store: this.store._id}, change)
        await this.loadProducts()
      },
      async deleteProduct(_id) {
        if (!_id) return
        const product = await cms.getModel('Product').findOne({_id}, { image: 1 })
        if (product) {
          const image = product.image
          try {
            await this.$getService('FileUploadStore').removeFile(image)
          } catch (e) {
            console.log(e)
          }
          await cms.getModel('Product').remove({_id: _id, store: this.store._id})
          await this.loadProducts()
        }
      },

      // Discounts
      async getDiscounts() {
        try {
          this.listDiscount = await cms.getModel('Discount').find({store: this.store._id})
        } catch (e) {
          console.error(e)
        }
      },
      async addDiscount(discount ,cb) {
        try {
          if (discount._id) {
            await cms.getModel('Discount').findOneAndUpdate({ _id: discount._id }, {
              ...discount
            })
          } else {
            await cms.getModel('Discount').create({
              ...discount,
              ...!discount.store && { store: this.store._id }
            })
          }
          await cb()
        } catch (e) {
          console.error(e)
        }
      },
      async updateDiscount(discount, cb) {
        try {
          await cms.getModel('Discount').findOneAndUpdate({ _id: discount._id }, discount)
          await cb()
        } catch (e) {
          console.error(e)
        }
      },
      async removeDiscount({ _id }, cb) {
        try {
          await cms.getModel('Discount').deleteOne({ _id: _id })
          await cb()
        } catch (e) {
          console.error(e)
        }
      }
    }
  }
</script>
<style scoped>
</style>
