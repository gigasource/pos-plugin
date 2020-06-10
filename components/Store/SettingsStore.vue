<template>
  <fragment/>
</template>

<script>
  import { getHighestFavouriteProductOrder, getHighestProductOrder, getProductGridOrder } from '../logic/productUtils';
  import { getProvided } from '../logic/commonUtils';

  export default {
    name: 'SettingsStore',
    domain: 'SettingsStore',
    injectService: ['PosStore:(user, device)'],
    data() {
      const i18n = this.$i18n;
      const { sidebar } = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]

      return {
        sidebarData: [
          { title: sidebar.user, icon: 'person', isView: true, key: 'user'},
          { title: sidebar.general, icon: 'icon-general_setting', isView: true, key: 'general' },
          {
            title: sidebar.advancedSettings, icon: 'icon-switch', svgIcon: true, key: 'advancedSettings',
            items: [
              { title: sidebar.companyInfo, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'companyInfo' },
              { title: sidebar.payment, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'payment' },
              { title: sidebar.tax, icon: 'radio_button_unchecked', iconType: 'small', isView: true, key: 'tax' },
            ]
          },
          { title: sidebar.onlineOrderSettings, icon: 'icon-general_setting', isView: true, key: 'onlineOrderSettings' }
        ],
        printerSidebarDefault: [
          {
            title: sidebar.receiptCategory, icon: 'icon-restaurant', displayChild: true, key: 'receiptCategory',
            items: [
              {type: 'edit'}
            ]
          },
          {
            title: sidebar.invoiceReport, icon: 'icon-invoice_report', type: 'invoice', key: 'invoiceReport'
          },
          {
            title: sidebar.entireReceipt, icon: 'icon-receipt', displayChild: false, type: 'entire', key: 'entireReceipt'
          },
          {
            title: sidebar.generalSettings, icon: 'icon-general_setting', slot: 'general'
          }
        ],
        //category view
        listCategories: [],
        selectedCategory: null,
        //article view
        productFilters: [],
        listProducts: [],
        selectedProductIDs: [],
        totalProducts: null,
        productPagination: {limit: 15, currentPage: 1},
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
        //printer setting
        printerGeneralSetting: null,
        printer: null,
        printerSidebar: [],
        selectedPrinterMenu: null,
        //online order
        onlineDevice: null,
        defaultPrepareTime: null,
        onlineOrderSorting: null,
        webshopName: '',
        //reservation
        reservationSetting: null,
      }
    },
    async created() {
      const cachedArticlePageSize = localStorage.getItem('viewArticlePageSize')
      if (cachedArticlePageSize) this.productPagination.limit = parseInt(cachedArticlePageSize)

      const posSettings = await this.getPosSetting()
      if (!posSettings) return

      this.defaultPrepareTime = posSettings.defaultPrepareTime
      this.onlineOrderSorting = posSettings.onlineOrderSorting

      await this.getOnlineDevice()
      await this.registerHardware()
      await this.setupPairDevice()
      await this.getPairStatus()
      await this.getWebshopName()
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
          let res = await categoryModel.deleteOne({'_id': oldID});
          if (res.deletedCount === 1) {
            const ids = this.listCategories.filter(c => c.position > deletedCategory.position).map(c => c._id)
            await categoryModel.updateMany({'_id': {'$in': ids}}, {'$inc': {position: -1}})
          }
        } else if (!oldID && newName) {
          await categoryModel.create({name: newName, position: newPosition});
        } else {
          await categoryModel.findOneAndUpdate({'_id': oldID}, {name: newName});
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

          await categoryModel.updateOne({_id: this.selectedCategory._id}, {'$set': {position: swapItem.position}})
          await categoryModel.updateOne({_id: swapItem._id}, {'$set': {position: this.selectedCategory.position}})

          this.listCategories = await this.getAllCategories()
          this.selectedCategory = this.listCategories.find(c => c._id === this.selectedCategory._id)
        } catch (e) {
          console.error(e.message)
        }
      },
      //article view
      async findCategoryByName(name) {
        return cms.getModel('Category').find({name: {$regex: name, $options: 'i'}})
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
        const condition = this.productFilters.reduce((acc, filter) => ({...acc, ...filter['condition']}), {});
        const {limit, currentPage} = this.productPagination;
        this.listProducts = await productModel.find(condition).sort(this.productSortCondition).skip(limit * (currentPage - 1)).limit(limit);
      },
      async getTotalProducts() {
        const productModel = cms.getModel('Product');
        const condition = this.productFilters.reduce((acc, filter) => ({...acc, ...filter['condition']}), {});
        this.totalProducts = await productModel.count(condition);
      },
      async deleteSelectedProducts() {
        const productModel = cms.getModel('Product');
        if (this.selectedProductIDs && this.selectedProductIDs.length > 0) {
          await productModel.deleteMany({'_id': {'$in': this.selectedProductIDs}});
        }

        // reset related fn buttons
        const settingModel = cms.getModel('PosSetting');
        await settingModel.findOneAndUpdate(
            {
              'leftFunctionButtons.buyback.product': {'$in': this.selectedProductIDs}
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
              'rightFunctionButtons.buyback.product': {'$in': this.selectedProductIDs}
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
        this.listTaxCategories = settings.taxCategory
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
                  taxCategory: {_id: oldTaxId}
                }
              }
          )
        } else if (newTaxCategory && !oldTaxId) {
          await settingsModel.findOneAndUpdate(
              {},
              {
                $push: {
                  taxCategory: {...newTaxCategory}
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
                  payment: {_id: oldPayment._id}
                }
              }
          )
        } else if (newPayment && !oldPayment) {
          await settingModel.findOneAndUpdate(
              {},
              {
                $push: {
                  payment: {...newPayment, editable: true}
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
      getGeneralSettings() {
        const setting = cms.getList('PosSetting')[0];
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
              user: {_id: oldUserId}
            }
          })
        } else if (newUser && !oldUserId) {
          await settingModel.findOneAndUpdate({}, {
            $push: {
              user: {...newUser}
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
        const terminal = await terminalModel.findOne({name: 'Terminal 1'})
        this.thermalPrinter = terminal && terminal.thermalPrinters && terminal.thermalPrinters[0] || {};
      },
      async updateThermalPrinter(oldPrinterId, newPrinter) {
        const terminalModel = cms.getModel('Terminal');
        if (!oldPrinterId) {
          await terminalModel.findOneAndUpdate(
              {name: 'Terminal 1'},
              {
                $push: {
                  thermalPrinters: newPrinter
                }
              }, {upsert: true}
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
              }, {upsert: true}
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
              await productModel.findOneAndUpdate({'layouts._id': articleLayout._id}, {
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
            let updateColorResult = await productModel.findOneAndUpdate({'layouts._id': layoutID}, {
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
              let currentItemResult = await productModel.findOneAndUpdate({'layouts._id': currentItemLayout._id}, {
                '$set': {
                  'layouts.$.order': nextItemLayout.order
                }
              });

              let nextItemResult = await productModel.findOneAndUpdate({'layouts._id': nextItemLayout._id}, {
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
        const posSettings = cms.getList('PosSetting')[0];
        // if (dbButtonList === 'leftFunctionButtons') {
        //   this.leftButtonsUpdate++;
        // }
        if (posSettings[dbButtonList]) {
          try {
            for (let item of posSettings[dbButtonList]) {
              await cms.getModel('PosSetting').findOneAndUpdate({[`${dbButtonList}._id`]: item._id}, {
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
        return favoriteArticle ? categories : categories.filter(cat => cat.name !== 'Favourite').map(c => ({
          ...c,
          position: c.position
        }))
      },
      async getActiveProducts() {
        let products
        if (this.activeCategory.name === 'Favourite') {
          products = await cms.getModel('Product').find({'option.favorite': true})
        } else {
          products = await cms.getModel('Product').find({'category': this.activeCategory._id})
        }
        this.activeCategoryProducts = products.sort((current, next) => getProductGridOrder(current) - getProductGridOrder(next))
      },
      //<!--</editor-fold>-->

      // utils
      getHighestProductOrder,
      getHighestFavouriteProductOrder,
      async updatePosSettings(item, dbButtonList, mergeMap) {
        try {
          await cms.getModel('PosSetting').findOneAndUpdate({[`${dbButtonList}._id`]: item.buttonId}, {
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
      //printer setting
      async genPrinterSidebar() {
        this.printerSidebar = _.cloneDeep(this.printerSidebarDefault)
        const groupPrinters = await cms.getModel('GroupPrinter').find()
        const kitchenPrinters = groupPrinters.filter(p => p.type === 'kitchen')
        const category = this.printerSidebar[0]
        for (const printer of kitchenPrinters) {
          category.items.unshift({
            title: printer.name,
            id: printer._id,
            icon: 'radio_button_unchecked',
            type: 'kitchen'
          })
        }
        const invoicePrinter = groupPrinters.find(p => p.type === 'invoice')
        const invoice = this.printerSidebar[1]
        invoice.id = invoicePrinter._id

        const receiptPrinter = groupPrinters.filter(p => p.type === 'entire')
        const receipt = this.printerSidebar[2]
        if (receiptPrinter.length === 0) {
          this.printerSidebar.splice(2, 1)
        } else if (receiptPrinter.length === 1) {
          receipt.id = receiptPrinter[0]._id
        } else {
          receipt.displayChild = true
          receipt.items = []
          for (const printer of receiptPrinter) {
            receipt.items.push({
              title: printer.name,
              id: printer._id,
              icon: 'radio_button_unchecked',
              type: 'entire'
            })
          }
        }
      },
      getListHardware() {
        const setting = cms.getList('PosSetting')[0]
        return setting['hardwares'].map(h => h.name)
      },
      async getPrinterGeneralSetting() {
        const setting = await cms.getModel('PosSetting').find()
        this.printerGeneralSetting = setting[0].printerGeneralSetting || {}
      },
      async updatePrinterGeneralSetting() {
        await cms.getModel('PosSetting').findOneAndUpdate(
            {},
            {
              printerGeneralSetting: this.printerGeneralSetting
            }
        );
      },
      async getGroupPrintersByType(type) {
        return await cms.getModel('GroupPrinter').find({type})
      },
      async getGroupPrinterById(_id) {
        return await cms.getModel('GroupPrinter').findOne({_id})
      },
      async getPrinterById(_id, index) {
        const groupPrinter = await cms.getModel('GroupPrinter').findOne({_id})
        this.printer = groupPrinter && groupPrinter.printers && groupPrinter.printers[index || 0] || {}
      },
      async createGroupPrinter() {
        const groupPrinters = await this.getGroupPrintersByType('kitchen')
        const names = groupPrinters.map(p => p.name)
        let name = 'New Printer', i = 1
        while (_.includes(names, name)) {
          name = `New Printer (${i})`
          i++
        }
        const printer = await cms.getModel('GroupPrinter').create({name, type: 'kitchen'})
        await this.genPrinterSidebar()
        return printer
      },
      async deleteGroupPrinter(_id) {
        await cms.getModel('GroupPrinter').deleteOne({_id})
        await this.genPrinterSidebar()
        this.selectedPrinterMenu = this.printerSidebar[0].items[0]
      },
      async updateGroupPrinterName(_id, name) {
        await cms.getModel('GroupPrinter').findOneAndUpdate({_id}, {name})
        const item = this.printerSidebar[0].items.find(item => item.id === _id)
        this.$set(item, 'title', name)
        this.selectedPrinterMenu = item
      },
      async updatePrinter(printerId, printer, groupId, index) {
        if (printerId) {
          await cms.getModel('GroupPrinter').findOneAndUpdate(
              {
                'printers._id': printerId
              },
              {
                $set: {
                  'printers.$': printer
                }
              }
          )
        } else {
          await cms.getModel('GroupPrinter').findOneAndUpdate(
              {
                _id: groupId
              },
              {
                $push: {
                  printers: printer
                }
              }
          )
          await this.getPrinterById(groupId, index)
        }
      },
      async deletePrinter(_id) {
        await cms.getModel('GroupPrinter').findOneAndUpdate(
            {
              _id
            },
            {
              $pull: {
                printers: {_id: this.printer._id}
              }
            }
        )
      },
      async addEntirePrinter(lower, upper) {
        let i = lower, printers = []
        while (i < upper) {
          i++
          printers.push({name: 'EntireReceipt' + i, type: 'entire'})
        }
        await cms.getModel('GroupPrinter').create(printers)
        await this.genPrinterSidebar()
        this.selectedPrinterMenu = this.printerSidebar.find(s => s.slot === 'general')
      },
      async removeEntirePrinter(lower, upper) {
        const regex = `EntireReceipt[${lower + 1}-${upper}]`
        await cms.getModel('GroupPrinter').deleteMany({name: {$regex: regex}, type: 'entire'})
        await this.genPrinterSidebar()
        this.selectedPrinterMenu = this.printerSidebar.find(s => s.slot === 'general')
      },
      //keyboard Config
      async updateKeyboardConfig(keyboardConfig) {
        await cms.getModel('PosSetting').findOneAndUpdate({}, {keyboardConfig})
      },
      async testPrinter(printer) {
        await cms.socket.emit('testPrinter', printer)
      },

      //online order
      async getOnlineDevice() {
        const posSettings = await this.getPosSetting()
        if (posSettings) {
          this.onlineDevice = posSettings.onlineDevice
        }
      },

      async updateOnlineDevice(device) {
        try {
          await this.updatePosSetting('onlineDevice', device)

          const posSettings = await this.getPosSetting()
          if (posSettings) {
            this.onlineDevice = posSettings.onlineDevice
          }
          return this.onlineDevice
        } catch (e) {
          console.warn(e)
        }
      },

      async updateDefaultPrepareTime(value) {
        await cms.getModel('PosSetting').updateOne({}, {defaultPrepareTime: value});
      },

      async updateOnlineOrderSorting(value) {
        await cms.getModel('PosSetting').updateOne({}, {onlineOrderSorting: value});
        this.onlineOrderSorting = value
      },

      getPairStatus() {
        cms.socket.emit('getPairStatus', ({error}) => {
          if (error) {
            console.warn(`Pair status: ${error}`)

            this.unregisterOnlineOrder(async () => {
              const posSettings = await this.getPosSetting()

              if (!posSettings.skipPairing || this.$router.currentRoute.path !== '/admin') {
                this.$router.currentRoute.path !== '/pos-setup' && this.$router.push('/pos-setup')
              }
            })
          }
        })
      },

      registerOnlineOrder(pairingCode, callback) {
        window.cms.socket.emit('registerOnlineOrderDevice', pairingCode, callback)
      },

      unregisterOnlineOrder(callback) {
        window.cms.socket.emit('unregisterOnlineOrderDevice', callback)
      },

      getWebshopName() {
        cms.socket.emit('getWebshopName', webshopName => {
          if (!webshopName) this.webshopName = 'Web shop name not available'
          else this.webshopName = webshopName
        })
      },

      async setupPairDevice() {
        const posSettings = await this.getPosSetting()
        if (!posSettings) return

        if (posSettings.onlineDevice && this.$router.currentRoute.path === '/pos-login') {
          this.onlineDevice = posSettings.onlineDevice
          const { id } = posSettings.onlineDevice;
          if (!id && !posSettings.skipPairing) this.$router.push('/pos-setup')
        }

        // listens for unpair event
        cms.socket.on('unpairDevice', () => {
          this.unregisterOnlineOrder(async () => {
            this.onlineDevice = Object.assign({}, this.onlineDevice, {
              id: null
            })
            await this.updateOnlineDevice(this.onlineDevice)
            this.$router.currentRoute.path !== '/pos-setup' && this.$router.push('/pos-setup')
          })
        })
      },

      async skipPairing() {
        await this.updatePosSetting('skipPairing', true)
        this.$router.go(-1)
      },

      getOnlineDeviceServices(callback) {
        cms.socket.emit('getOnlineDeviceServices', callback)
      },

      updateOnlineDeviceServices(services, callback) {
        cms.socket.emit('updateOnlineDeviceServices', services, callback)
      },

      //generic
      async registerHardware() {
        const posSettings = await this.getPosSetting()
        if (!posSettings) return

        let hardwares = posSettings.hardwares
        if (hardwares && hardwares instanceof Array) {
          if (!hardwares.find(i => i.name === this.device)) hardwares = [...hardwares, { name: this.device }]
        } else {
          hardwares = [{ name: this.device }]
        }
        await this.updatePosSetting('hardwares', hardwares)
      },
      async updateGroupPrinter(_id, key, value) {
        try {
          const model = cms.getModel('GroupPrinter')
          await model.updateOne({ _id }, { $set: { [key]: value } })
        } catch (e) {
          console.warn(e)
        }
      },
      async updatePosSetting(key, value) {
        try {
          const model = cms.getModel('PosSetting')
          await model.updateOne({}, { $set: { [key]: value } })
        } catch (e) {
          console.warn(e)
        }
      },
      setSinglePrinter(type) {
        try {
          if (!type) return
          let groups = cms.getList('GroupPrinter').filter(item => item.type === type)

          if (groups) {
            groups = groups.map(groupPrinter => {
              if (!groupPrinter.printers.length) return groupPrinter
              groupPrinter.printers = [Object.assign(groupPrinter.printers[0], {
                ...groupPrinter.printers[0],
                hardwares: []
              })]
              return groupPrinter
            })

            groups.forEach(async group => {
              await cms.getModel('GroupPrinter').updateOne({ _id: group._id },
                { $set: { printers: group.printers } })
            })
          }
        } catch (e) {
          console.warn(e)
        }
      },
      //reservation setting
      async getReservationSetting() {
        const posSetting = await this.getPosSetting()
        if(posSetting) {
          this.reservationSetting = posSetting.reservation || {}
        }
      },
      async updateReservationSetting() {
        await cms.getModel('PosSetting').findOneAndUpdate({}, {reservation: this.reservationSetting})
      }
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
