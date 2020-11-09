<template>
  <div :class="['setting-view', isInDevice && 'setting-view--mobile']">
    <template v-if="permissionDenied">
      {{ permissionDeniedMessage }}
    </template>
    <template v-else>
      <!-- sidebar -->
      <pos-dashboard-sidebar :default-path="defaultPath" :items="computedSidebar" @node-selected="onNodeSelected">
        <template v-slot:footer>
          <div class="row-flex align-items-center w-100 py-2">
            <g-btn-bs icon="icon-logout" @click.stop="logout">Log out</g-btn-bs>
            <g-spacer/>
            <g-icon title="German" size="32" style="cursor: pointer; margin-right: 8px" @click.stop="changeLanguage('de-DE')">icon-germany</g-icon>
            <g-icon title="English" size="32" style="cursor: pointer; margin-right: 8px" @click.stop="changeLanguage('en')">icon-english</g-icon>
          </div>
        </template>
      </pos-dashboard-sidebar>

      <!-- content -->
      <div class="setting-view__content">
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
            :display-image="store.displayImage"
            :imexportable="importExportable"
            @update-store="updateStore"
            @add-new-category="addNewCategory"
            @change-category-name="changeCategoryName"
            @delete-category="deleteCategory"
            @add-new-product="addNewProduct"
            @update-product="updateProduct"
            @delete-product="deleteProduct"
            @swap-category="swapCategory"
            @change-category-image="changeCategoryImage"
            @import-categories-completed="reloadCategoriesAndProducts"
            @change-category-availability="changeCategoryAvailability"
            @update-printer="updatePrinters"
        />
        <delivery-fee
            v-if="view === 'setting-delivery-fee'"
            v-bind="store"
            @update="updateStore"
            :store-country-locale="storeCountryLocale"/>
        <multiple-printer
            v-if="view === 'setting-multiple-printer'"
            :store="store"
            @update="updateStore"/>
        <discount v-if="view === 'setting-discount'" :list-discount="listDiscount"
                  @addDiscount="addDiscount" @getDiscounts="getDiscounts" @removeDiscount="removeDiscount"
                  @updateDiscount="updateDiscount" :store-country-locale="storeCountryLocale"/>
        <payment-providers
            v-if="view === 'payment-provider'"
            :store="store"
            @deactive="deactivePaymentProvider($event)"
            @active="(name, metaData) => activePaymentProvider(name, metaData)"/>
        <payment-providers-transaction
            v-if="view === 'transaction'"
            :store="store"/>
        <reservation-setting v-if="view === 'setting-reservation'" :store="store" @update="updateStore"/>
        <other-setting v-if="view === 'setting-other'" :store="store" @update="updateStore"/>
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
  import dayjs from 'dayjs';
  // payments
  import PaymentProviders from './payments/PaymentProviders';
  import PaymentProvidersTransaction from './payments/PaymentProvidersTransaction';
  import ReservationSetting from "./ReservationSetting";
  import OtherSetting from "./OtherSetting";

  export default {
    name: 'SettingView',
    components: {
      OtherSetting,
      ReservationSetting, Discount, MultiplePrinter, DeliveryFee, SettingMenu, ServiceAndOpenHours, RestaurantInformation, PaymentProviders, PaymentProvidersTransaction},
    injectService: ['PermissionStore:importExportMenu'],
    data: function () {
      const i18n = this.$i18n;
      let { setting } = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]

      return {
        setting,
        view: '',
        sidebar: '',
        defaultPath: '',
        store: null,
        categories: null,
        products: null,
        permissionDenied: true,
        permissionDeniedMessage: '',
        listDiscount: []
      }
    },
    computed: {
      importExportable() {
        return this.importExportMenu != null
      },
      storeCountryLocale() {
        return (this.store && this.store.country && this.store.country.locale) || 'en'
      },
      sidebarItems() {
        if(this.setting) {
          let items = [
            { title: this.setting.basic, key: 'Basic', icon: 'airplay', onClick: () => this.changeView('restaurant-info') },
            {
              title: this.setting.serviceOpenHours,
              key: 'Service',
              icon: 'mdi-file-document-outline',
              onClick: () => this.changeView('service-and-open-hours')
            },
            { title: this.setting.reservation, key: 'Reservation', icon: 'icon-table_outlined', onClick: () => this.changeView('setting-reservation', 'Reservation') },
            { title: this.setting.menu, key: 'Menu', icon: 'filter_list', onClick: () => this.changeView('settings-menu', 'Menu') },
            { title: this.setting.deliveryFee, key: 'Delivery Fee', icon: 'icon-setting-delivery', onClick: () => this.changeView('setting-delivery-fee', 'Delivery Fee') },
            { title: this.setting.printer, key: 'Multiple Printer', icon: 'icon-setting-multiple', onClick: () => this.changeView('setting-multiple-printer', 'Multiple Printer') },
            { title: this.setting.discount, key: 'Discount', icon: 'icon-coupon', onClick: () => this.changeView('setting-discount', 'Discount') },
          ]

          const managePaymentPermission =
              cms.loginUser.user.permissions.find(e => e.permission === 'manageStorePayment' && e.value === true);

          if (cms.loginUser.user.role.name === "admin" || managePaymentPermission) {
            items.push({
              title: this.setting.paymentSetting,
              icon: 'icon-card_outlined',
              key: 'Payment Setting',
              onClick: () => this.changeView('payment-provider', 'Payment Setting'),
              items: [
                {title: this.setting.transaction, key: 'Transaction', icon: 'history', onClick: () => this.changeView('transaction', 'Transaction')}
              ]
            })
          }

          items.push(
              { title: this.setting.other , key: 'Other', icon: 'mdi-dots-horizontal-circle-outline', onClick: () => this.changeView('setting-other')}
          )
          return items
        }
        return []
      },
      sidebarItemsDevice() {
        if(this.setting)
          return [
              {
                title: this.setting.serviceOpenHours,
                key: 'Service',
                icon: 'mdi-file-document-outline',
                onClick: () => this.changeView('service-and-open-hours')
              },
              {title: this.setting.menu, key: 'Menu', icon: 'filter_list', onClick: () => this.changeView('settings-menu')},
              {title: this.setting.discount, key: 'Discount', icon: 'icon-coupon', onClick: () => this.changeView('setting-discount', 'Discount')},
              {title: this.setting.reservation, key: 'Reservation', icon: 'mdi-file-document-outline', onClick: () => this.changeView('setting-reservation')},
          ]
        return []
      },
      computedSidebar() {
        return this.$route.query.device ? this.sidebarItemsDevice : this.sidebarItems
      },
      isInDevice() {
        return this.$route.query.device
      }
    },
    async created() {
      const storeIdOrAlias = this.$route.params.storeIdOrAlias
      if (storeIdOrAlias) {
        const store = await cms.getModel('Store').findOne({alias: storeIdOrAlias})
        if (store.gSms && store.gSms.autoAcceptOrder === undefined) store.gSms.autoAcceptOrder = true // backward compatibility

        if (!store) {
          this.permissionDenied = true;
          this.permissionDeniedMessage = '404 NOT FOUND!'
          return
        }

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
          return
        }

        try {
          // change locale depend on store setting
          root.$i18n.locale = this.store.country.locale || 'en'
          this.setting = root.$i18n.messages[this.store.country.locale].setting || root.$i18n.messages['en'].setting
        } catch (e) {
        }
      }

      if (this.$route.query.device) {
        this.view = 'settings-menu'
        this.defaultPath = 'item.1'
      } else {
        this.view = 'restaurant-info'
        this.defaultPath = 'item.0'
      }

      cms.socket.on('loadStore', storeId => {
        if (this.store.id === storeId) this.loadStore()
      })
    },
    beforeDestroy() {
      cms.socket.off('loadStore')
    },
    methods: {
      onNodeSelected(node) {
        node.onClick && node.onClick.bind(this)();
      },
      async loadStore() {
        this.$set(this, 'store', await cms.getModel('Store').findOne({_id: this.store._id}))
      },
      async updateStore(change) {
        await cms.getModel('Store').updateOne({_id: this.store._id}, change)
        for (const key in change) {
          if (change.hasOwnProperty(key)) {
            this.$set(this.store, key, change[key])
          }
          if(key === 'reservationSetting' || key === 'openHours') {
            const setting = {...this.store.reservationSetting, openHours: this.store.openHours}
            cms.socket.emit('updateReservationSetting', this.store._id, setting)
            console.debug(`sentry:eventType=reservationSetting,store=${this.store.name},alias=${this.store.alias}`,
            `1. Online Order frontend: sending reservation setting to backend`, JSON.stringify(setting))
          }
        }
      },
      async updateDeliveryTimeInterval(val) {
        await this.updateStore({deliveryTimeInterval: val})
      },
      changeView(view, key) {
        if (view) {
          this.view = view
          //reset icon
          for (const item of this.computedSidebar) {
            if (item.icon.startsWith('icon-') && item.icon.endsWith('_white')) {
              this.$set(item, 'icon', item.icon.slice(0, item.icon.length - 6))
            }
          }
        }
        if (key) {
          let item = this.computedSidebar.find(i => i.key === key)
          // TODO: Known-issue: 2nd level won't highlighted
          if (item)
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
        cms.socket.emit('send-menu', this.store._id)
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
        cms.socket.emit('send-menu', this.store._id)
      },
      async deleteCategory(_id) {
        await cms.getModel('Product').remove({ category: _id })
        await cms.getModel('Category').remove({_id: _id})
        await this.loadCategories()
        await this.loadProducts()
        cms.socket.emit('send-menu', this.store._id)
      },
      async swapCategory(oldId, swapId, oldIndex, newIndex) {
        const category = _.cloneDeep(this.categories[oldIndex])
        const swapCategory = _.cloneDeep(this.categories[newIndex])
        category.position = newIndex
        swapCategory.position = oldIndex
        if(oldIndex < newIndex) {
          this.categories.splice(oldIndex, 2, swapCategory, category)
        } else {
          this.categories.splice(newIndex, 2, category, swapCategory)
        }
        await cms.getModel('Category').updateOne({_id: oldId}, {position: newIndex})
        await cms.getModel('Category').updateOne({_id: swapId}, {position: oldIndex})
        cms.socket.emit('send-menu', this.store._id)
      },
      async changeCategoryImage(image, _id) {
        await cms.getModel('Category').findOneAndUpdate({_id}, {image})
        const cate = this.categories.find(c => c._id === _id)
        if(!image) {
          try {
            await this.$getService('FileUploadStore').removeFile(cate.image)
          } catch(e) {
            console.log(e)
          }
        }
        cate.image = image
        cms.socket.emit('send-menu', this.store._id)
      },
      async changeCategoryAvailability(availability, _id) {
        await cms.getModel('Category').findOneAndUpdate({_id}, {availability})
        const cate = this.categories.find(c => c._id === _id)
        cate.availability = availability
        cms.socket.emit('send-menu', this.store._id)
      },

      // products
      async loadProducts() {
        this.$set(this, 'products', await cms.getModel('Product').find({ store: this.store._id }, { store: 0 }))
      },
      async addNewProduct(product) {
        await cms.getModel('Product').create({...product, store: this.store._id})
        await this.loadProducts()
        cms.socket.emit('send-menu', this.store._id)
      },
      async updateProduct(_id, change) {
        await cms.getModel('Product').updateOne({_id, store: this.store._id}, change)
        await this.loadProducts()
        cms.socket.emit('send-menu', this.store._id)
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
          cms.socket.emit('send-menu', this.store._id)
        }
      },
      async updatePrinters(ids, printer) {
        await cms.getModel('Product').updateMany({
          _id: { $in: ids }
        }, {
          groupPrinters: [printer]
        })
        await this.loadProducts()
        cms.socket.emit('send-menu', this.store._id)
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
      },

      // Payment Providers
      async deactivePaymentProvider(name) {
        await this.setPaymentProvider(name, false)
      },
      async activePaymentProvider(name, metadata) {
        await this.setPaymentProvider(name, true, metadata)
      },
      async setPaymentProvider(name, value, metadata) {
        const paymentProviders = this.store.paymentProviders || {};
        switch (name) {
          case 'paypal':
            paymentProviders[name] = { enable: value, ...metadata }
            await cms.getModel('Store').updateOne({ _id: this.store._id }, { paymentProviders })
            break;
        }
      },
      async reloadCategoriesAndProducts(){
        await this.loadCategories()
        await this.loadProducts()
      },
      logout() {
        this.$getService('PosStore').logout()
      },
      changeLanguage(locale) {
        root.$i18n.locale = locale
        this.setting = root.$i18n.messages[locale].setting
      }
    }
  }
</script>
<style scoped lang="scss">
  .setting-view {
    height: 100vh;
    width: 100vw;
    display: flex;
    position: relative;

    &__content {
      background-color: #F4F7FB;
      flex: 1;
      padding: 50px 5%;
    }

    &--mobile {
      ::v-deep .g-sidebar {
        width: 225px;
      }

      .setting-view__content {
        padding: 16px 24px;
      }
    }
  }
</style>
