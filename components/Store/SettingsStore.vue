<template>
  <fragment/>
</template>

<script>
  import { getHighestFavouriteProductOrder, getHighestProductOrder, getProductGridOrder } from '../logic/productUtils';
  import { getProvided } from '../logic/commonUtils';

  export default {
    name: 'SettingsStore',
    domain: 'SettingsStore',
    injectService: ['PosStore:user'],
    data() {
      const i18n = this.$i18n;
      const { sidebar } = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]

      return {
        sidebarData: [
          {
            title: sidebar.product, icon: 'icon-liefer_packet', svgIcon: true, /*badge: '3', badgeColor: '#FF9529',*/
            items: [
              { title: sidebar.articles, icon: 'radio_button_unchecked', iconType: 'small', isView: true },
              { title: sidebar.category, icon: 'radio_button_unchecked', iconType: 'small', isView: true /*href: '/settings/category' */ },
              { title: sidebar.productLayout, icon: 'radio_button_unchecked', iconType: 'small', href: '/view/pos-article', appendIcon: 'open_in_new' },
            ]
          },
          /*{ title: 'Reporting', icon: 'icon-bar_chart', svgIcon: true },*/
          { title: sidebar.user, icon: 'person', isView: true /*href: '/setting/user'*/ },
          {
            title: sidebar.settings, icon: 'icon-cog', svgIcon: true, /*badge: '3', badgeColor: '#9C24AC',*/
            items: [
              { title: sidebar.general, icon: 'radio_button_unchecked', iconType: 'small', isView: true /*href: '/settings/general'*/ },
              /*{ title: 'Order Screen', icon: 'radio_button_unchecked', iconType: 'small' },
              { title: 'Print Template', icon: 'radio_button_unchecked', iconType: 'small' },*/
              { title: sidebar.paymentLayout, icon: 'radio_button_unchecked', iconType: 'small', href: '/view/pos-payment-config', appendIcon: 'open_in_new' },
              { title: sidebar.functionLayout, icon: 'radio_button_unchecked', iconType: 'small', href: '/view/pos-fn-button', appendIcon: 'open_in_new' },
            ]
          },
          {
            title: sidebar.hardware, icon: 'icon-hardware', svgIcon: true,
            items: [
              { title: sidebar.thermalPrinter, isView: true, icon: 'radio_button_unchecked', iconType: 'small' },
              /*{ title: 'POS', icon: ' ' },
              { title: 'Customer Display', icon: ' ' },
              { title: 'A4 Printer', icon: ' ' },*/
            ]
          },
          {
            title: sidebar.advancedSettings, icon: 'icon-switch', svgIcon: true,/* badge: '3', badgeColor: '#FF4081',*/
            items: [
              { title: sidebar.companyInfo, icon: 'radio_button_unchecked', iconType: 'small', isView: true /*href: '/settings/company'*/ },
              { title: sidebar.payment, icon: 'radio_button_unchecked', iconType: 'small', isView: true /*href: '/settings/payment'*/ },
              { title: sidebar.tax, icon: 'radio_button_unchecked', iconType: 'small', isView: true },
              /*{ title: 'License', icon: 'radio_button_unchecked', iconType: 'small' },*/
            ]
          },
        ],
        //category view
        listCategories: [],
        selectedCategory: null,
        //article view
        productFilters: [],
        listProducts: [],
        selectedProductIDs: [],
        totalProducts: null,
        productPagination: { limit: 15, currentPage: 1 },
        selectedProduct: null,
        productSortCondition: {},
        //payment view
        listPayments: [],
        selectedPayment: null,
        //general setting
        generalSettings: null,
        //company info view
        companyInfo: null,
        //user view
        listUsers: [],
        selectedUser: {},
        //printer view
        thermalPrinter: null,
        //tax category view
        selectedTaxCategory: null,
        listTaxCategories: [],
        //article config
        activeCategory: null,
        activeCategoryProducts: [],
        articleSelectedColor: null,
        articleSelectedProductButton: null,
      }
    },
    created() {
      const cachedArticlePageSize = localStorage.getItem('viewArticlePageSize');
      if (cachedArticlePageSize) this.productPagination.limit = parseInt(cachedArticlePageSize);
    },
    watch: {
      'productPagination.limit'(newVal) {
        localStorage.setItem('viewArticlePageSize', newVal)
      }
    },
    methods: {
      async getPosSetting() {
        return cms.getModel('PosSetting').findOne();
      },

      getProductLayout(item, category) {
        const isFavourite = category && category.name === 'Favourite' || false
        return item.layouts && item.layouts.find(layout => !!layout.favourite === isFavourite) || {}
      },

      //<!--<editor-fold desc="Settings screen">-->
      //category view
      async updateCategory(oldID, newName, newPosition) {
        const categoryModel = cms.getModel('Category');
        if (oldID && !newName) {
          const deletedCategory = this.listCategories.find(c => c._id === oldID);
          let res = await categoryModel.deleteOne({ '_id': oldID });
          if (res.deletedCount === 1) {
            const ids = this.listCategories.filter(c => c.position > deletedCategory.position).map(c => c._id)
            await categoryModel.updateMany({ '_id': { '$in': ids } }, { '$inc': { position: -1 } })
          }
        } else if (!oldID && newName) {
          await categoryModel.create({ name: newName, position: newPosition });
        } else {
          await categoryModel.findOneAndUpdate({ '_id': oldID }, { name: newName });
        }
        this.listCategories = await this.getAllCategories();
      },
      async swapCategoryPosition(direction) {
        try {
          const categoryModel = cms.getModel('Category')
          const selectedIndex = this.listCategories.indexOf(this.selectedCategory)

          const increment = direction === 'down' ? -1 : 1
          const swapItem = this.listCategories[selectedIndex - increment]
          if (!swapItem) return

          await categoryModel.updateOne({ _id: this.selectedCategory._id }, { '$set': { position: swapItem.position } })
          await categoryModel.updateOne({ _id: swapItem._id }, { '$set': { position: this.selectedCategory.position } })

          this.listCategories = await this.getAllCategories()
          this.selectedCategory = this.listCategories.find(c => c._id === this.selectedCategory._id)
        } catch (e) {
          console.error(e.message)
        }
      },
      //article view
      async findCategoryByName(name) {
        return cms.getModel('Category').find({ name: { $regex: name, $options: 'i' } })
      },
      updateProductFilters(filter) {
        const index = this.productFilters.findIndex(f => f.title === filter.title);
        if (index > -1) {
          this.productFilters.splice(index, 1, filter);
        } else {
          this.productFilters.unshift(filter);
        }
        this.productPagination.currentPage = 1
      },
      async getListProducts() {
        const productModel = cms.getModel('Product');
        const condition = this.productFilters.reduce((acc, filter) => ({ ...acc, ...filter['condition'] }), {});
        const { limit, currentPage } = this.productPagination;
        this.listProducts = await productModel.find(condition).sort(this.productSortCondition).skip(limit * (currentPage - 1)).limit(limit);
      },
      async getTotalProducts() {
        const productModel = cms.getModel('Product');
        const condition = this.productFilters.reduce((acc, filter) => ({ ...acc, ...filter['condition'] }), {});
        this.totalProducts = await productModel.count(condition);
      },
      async deleteSelectedProducts() {
        const productModel = cms.getModel('Product');
        if (this.selectedProductIDs && this.selectedProductIDs.length > 0) {
          await productModel.deleteMany({ '_id': { '$in': this.selectedProductIDs } });
        }

        // reset related fn buttons
        const settingModel = cms.getModel('PosSetting');
        await settingModel.findOneAndUpdate(
          {
            'leftFunctionButtons.buyback.product': { '$in': this.selectedProductIDs }
          },
          {
            $set: {
              'leftFunctionButtons.$.text': null,
              'leftFunctionButtons.$.buttonFunction': null,
              'leftFunctionButtons.$.buttonFunctionValue': null,
              'leftFunctionButtons.$.buyback': null,
              'leftFunctionButtons.$.backgroundColor': '#FFFFFF',
              'leftFunctionButtons.$.textColor': '#1D1D26',
            }
          });
        await settingModel.findOneAndUpdate(
          {
            'rightFunctionButtons.buyback.product': { '$in': this.selectedProductIDs }
          },
          {
            $set: {
              'rightFunctionButtons.$.text': null,
              'rightFunctionButtons.$.buttonFunction': null,
              'rightFunctionButtons.$.buttonFunctionValue': null,
              'rightFunctionButtons.$.buyback': null,
              'rightFunctionButtons.$.backgroundColor': '#FFFFFF',
              'rightFunctionButtons.$.textColor': '#1D1D26',
            }
          });

        // fetch data
        await this.getListProducts();
        await this.getTotalProducts();
        this.selectedProductIDs = [];
      },
      async createNewProduct(product) {
        const productModel = cms.getModel('Product');
        await productModel.create(product);
        await this.getListProducts();
        await this.getTotalProducts();
      },
      async updateProduct(product) {
        const productModel = cms.getModel('Product');
        await productModel.findOneAndUpdate(
          {
            _id: product._id
          },
          product
        )
        await this.getListProducts();
        await this.getTotalProducts();
        this.selectedProduct = null;
        this.selectedProductIDs = [];
      },
      async getAllTaxCategory() {
        const settings = await cms.getModel('PosSetting').findOne();
        return settings.taxCategory;
      },

      //tax category view
      async updateTaxCategory(oldTaxId, newTaxCategory) {
        const settingsModel = cms.getModel('PosSetting');
        if (oldTaxId && !newTaxCategory) {
          await settingsModel.findOneAndUpdate(
            {},
            {
              $pull: {
                taxCategory: { _id: oldTaxId }
              }
            }
          )
        } else if (newTaxCategory && !oldTaxId) {
          await settingsModel.findOneAndUpdate(
            {},
            {
              $push: {
                taxCategory: { ...newTaxCategory }
              }
            }
          )
        } else {
          await settingsModel.findOneAndUpdate(
            {
              'taxCategory._id': oldTaxId
            },
            {
              $set: {
                'taxCategory.$': newTaxCategory,
              }
            }
          )
        }
        const setting = await settingsModel.findOne();
        this.listTaxCategories = setting.taxCategory;
      },
      //payment view
      async getListPayments() {
        const setting = await cms.getModel('PosSetting').findOne();
        this.listPayments = setting.payment;
      },
      async updatePayment(oldPayment, newPayment) {
        const settingModel = cms.getModel('PosSetting');
        if (oldPayment && !newPayment) {
          await settingModel.findOneAndUpdate(
            {},
            {
              $pull: {
                payment: { _id: oldPayment._id }
              }
            }
          )
        } else if (newPayment && !oldPayment) {
          await settingModel.findOneAndUpdate(
            {},
            {
              $push: {
                payment: { ...newPayment }
              }
            }
          )
        } else {
          await settingModel.findOneAndUpdate(
            {
              'payment._id': oldPayment._id
            },
            {
              $set: {
                'payment.$': newPayment,
              }
            }
          )
        }
        await this.getListPayments();
      },
      //general setting screen
      async getGeneralSettings() {
        const setting = await cms.getModel('PosSetting').findOne({});
        this.generalSettings = setting.generalSetting || {};
      },
      async updateSettings() {
        const settingModel = cms.getModel('PosSetting');
        await settingModel.findOneAndUpdate(
          {},
          {
            generalSetting: this.generalSettings
          }
        )
      },
      //company info view
      async getCompanyInfo() {
        const setting = await cms.getModel('PosSetting').findOne();
        this.companyInfo = setting.companyInfo || {};
      },
      async updateCompanyInfo() {
        await cms.getModel('PosSetting').findOneAndUpdate(
          {},
          {
            companyInfo: this.companyInfo
          }
        );
      },
      //user view
      async getListUsers() {
        const setting = await cms.getModel('PosSetting').findOne();
        this.listUsers = setting.user;
      },
      async updateUser(oldUserId, newUser) {
        const settingModel = cms.getModel('PosSetting');
        if (oldUserId && !newUser) {
          await settingModel.findOneAndUpdate({}, {
            $pull: {
              user: { _id: oldUserId }
            }
          })
        } else if (newUser && !oldUserId) {
          await settingModel.findOneAndUpdate({}, {
            $push: {
              user: { ...newUser }
            }
          })
        } else {
          await settingModel.findOneAndUpdate(
            {
              'user._id': oldUserId
            },
            {
              $set: {
                'user.$': newUser,
              }
            }
          )
        }
        await this.getListUsers();
        //update currentUser logged in if change
        if (this.user._id === oldUserId) {
          this.user = this.listUsers.find(u => u._id === oldUserId);
        }
      },
      async getListAvatar() {
        return await cms.getModel('Avatar').find();
      },
      //printer view
      async getThermalPrinter() {
        const terminalModel = cms.getModel('Terminal');
        const terminal = await terminalModel.findOne({ name: 'Terminal 1' })
        this.thermalPrinter = terminal && terminal.thermalPrinters && terminal.thermalPrinters[0] || {};
      },
      async updateThermalPrinter(oldPrinterId, newPrinter) {
        const terminalModel = cms.getModel('Terminal');
        if (!oldPrinterId) {
          await terminalModel.findOneAndUpdate(
            { name: 'Terminal 1' },
            {
              $push: {
                thermalPrinters: newPrinter
              }
            }, { upsert: true }
          )
          //update thermal printer with new _id
          await this.getThermalPrinter();
        } else {
          await terminalModel.findOneAndUpdate(
            {
              'thermalPrinters._id': oldPrinterId
            },
            {
              $set: {
                'thermalPrinters.$': newPrinter
              }
            }, { upsert: true }
          )
        }
      },
      //<!--</editor-fold>-->

      //<!--<editor-fold desc="Article screen">-->
      selectArticle(item) {
        if (this.articleSelectedProductButton && item._id === this.articleSelectedProductButton._id) {
          this.articleSelectedProductButton = null;
          this.articleSelectedColor = null;
          return;
        }
        this.articleSelectedProductButton = item;
        const layout = this.getProductLayout(this.articleSelectedProductButton, this.activeCategory);
        this.articleSelectedColor = layout && layout.color;
      },
      isIncreasingSequence(numArr) {
        for (let num = 0; num < numArr.length - 1; num++) {
          if (!(numArr[num] < numArr[num + 1]) || !(numArr[num + 1] - numArr[num] === 1)) {
            return num + 1;
          }
        }

        return null;
      },
      async updateArticleOrders() {
        const productModel = cms.getModel('Product');
        try {
          await Promise.all(this.activeCategoryProducts.map(async (article, index) => {
            const articleLayout = this.getProductLayout(article, this.activeCategory)
            if (articleLayout.order !== index + 1) {
              await productModel.findOneAndUpdate({ 'layouts._id': articleLayout._id }, {
                '$set': {
                  'layouts.$.order': index + 1
                }
              });
              return articleLayout.order = index + 1;
            }
            return articleLayout.order;
          }))
        } catch (e) {
          console.error('Error reordering articles: ', e);
        }
      },
      async setSelectedArticleColor() {
        if (!this.articleSelectedColor || !this.articleSelectedProductButton) {
          return
        }

        //Update to db
        const productModel = cms.getModel('Product')
        const layout = this.getProductLayout(this.articleSelectedProductButton, this.activeCategory)
        const layoutID = layout._id
        //Update current product
        let foundItem = this.activeCategoryProducts.find((item) => item._id === this.articleSelectedProductButton._id);
        if (foundItem) {
          try {
            let updateColorResult = await productModel.findOneAndUpdate({ 'layouts._id': layoutID }, {
              '$set': {
                'layouts.$.color': this.articleSelectedColor
              }
            });

            if (updateColorResult) {
              layout.color = this.articleSelectedColor;
            }
          } catch (e) {
            console.error(e)
          }
        }
      },
      async switchProductOrder(direction, category) {
        const selectedArticleLayout = this.getProductLayout(this.articleSelectedProductButton, category)

        if (!this.articleSelectedProductButton || !direction) {
          return;
        }

        let dir = direction === 'right' ? 1 : -1;

        const foundItem = this.activeCategoryProducts.find((item) => item._id === this.articleSelectedProductButton._id);
        if (foundItem) {
          const foundNextItem = this.activeCategoryProducts.find(item => {
            const layout = this.getProductLayout(item, category)
            return layout && layout.order && (layout.order === selectedArticleLayout.order + dir)
          })

          if (foundNextItem) {
            //Update order on current product list
            const nextItemLayout = this.getProductLayout(foundNextItem, category)
            const currentItemLayout = this.getProductLayout(foundItem, category)

            //Update db order
            const productModel = cms.getModel('Product')
            try {
              let currentItemResult = await productModel.findOneAndUpdate({ 'layouts._id': currentItemLayout._id }, {
                '$set': {
                  'layouts.$.order': nextItemLayout.order
                }
              });

              let nextItemResult = await productModel.findOneAndUpdate({ 'layouts._id': nextItemLayout._id }, {
                '$set': {
                  'layouts.$.order': currentItemLayout.order
                }
              });

              if (nextItemResult && currentItemResult) {
                const temp = nextItemLayout.order
                nextItemLayout.order = currentItemLayout.order;
                currentItemLayout.order = temp;
              }
            } catch (e) {
              console.error(e);
            }

            this.activeCategoryProducts = this.activeCategoryProducts.sort((current, next) =>
              getProductGridOrder(current) - getProductGridOrder(next))
          }
        }
      },
      //Fully reset layout of button
      //Usage: resetLayoutFnBtn('leftFunctionButtons')
      async resetLayoutFnBtn(dbButtonList) {
        const posSettings = await cms.getModel('PosSetting').findOne({});
        // if (dbButtonList === 'leftFunctionButtons') {
        //   this.leftButtonsUpdate++;
        // }
        if (posSettings[dbButtonList]) {
          try {
            for (let item of posSettings[dbButtonList]) {
              await cms.getModel('PosSetting').findOneAndUpdate({ [`${dbButtonList}._id`]: item._id }, {
                '$set': {
                  [`${dbButtonList}.$.rows`]: item.originalRows,
                  [`${dbButtonList}.$.cols`]: item.originalCols,
                  [`${dbButtonList}.$.containedButtons`]: []
                }
              });
            }
          } catch (e) {
            console.error(e);
          }
        }

      },
      async getAllCategories() {
        const categories = await cms.getModel('Category').find().sort('position')
        const posSettings = (await cms.getModel('PosSetting').find())[0];
        let favoriteArticle = posSettings.generalSetting.favoriteArticle;
        return favoriteArticle ? categories : categories.filter(cat => cat.name !== 'Favourite').map(c => ({ ...c, position: c.position }))
      },
      async getActiveProducts() {
        let products
        if (this.activeCategory.name === 'Favourite') {
          products = await cms.getModel('Product').find({ 'option.favorite': true })
        } else {
          products = await cms.getModel('Product').find({ 'category': this.activeCategory._id })
        }
        this.activeCategoryProducts = products.sort((current, next) => getProductGridOrder(current) - getProductGridOrder(next))
      },
      //<!--</editor-fold>-->

      // utils
      getHighestProductOrder,
      getHighestFavouriteProductOrder,
      async updatePosSettings(item, dbButtonList, mergeMap) {
        try {
          await cms.getModel('PosSetting').findOneAndUpdate({ [`${dbButtonList}._id`]: item.buttonId }, {
            '$set': {
              [`${dbButtonList}.$.backgroundColor`]: item.style.backgroundColor,
              [`${dbButtonList}.$.text`]: item.text,
              [`${dbButtonList}.$.rows`]: item.row,
              [`${dbButtonList}.$.cols`]: item.col,
              [`${dbButtonList}.$.textColor`]: ['#73F8F8', '#FFFFFF'].includes(item.style.backgroundColor) ? '#000000' : '#FFFFFF',
              [`${dbButtonList}.$.buttonFunction`]: item.buttonFunction,
              [`${dbButtonList}.$.buttonFunctionValue`]: item.buttonFunctionValue,
              [`${dbButtonList}.$.containedButtons`]: mergeMap && mergeMap[item.buttonId] ? mergeMap[item.buttonId] : [],
              [`${dbButtonList}.$.buyback`]: item.buyback,
            }
          });
        } catch (e) {
          console.log('Error updating updatePosSettings', e);
        }
      },
    },
    provide() {
      return {
        ...getProvided(this.$data, this),
        ...getProvided(this.$options.methods, this),
      }
    }
  }
</script>

<style scoped>

</style>
