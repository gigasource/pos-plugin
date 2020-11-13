<template>
  <div>
    <!-- Capture order -->
    <dialog-common
        :value="dialog.captureFailed.show"
        @input="dialog.captureFailed.show = false"
        :title="$t('onlineOrder.captureFailedDialog.title')">
      <div>{{ $t('onlineOrder.captureFailedDialog.details') }}:</div>
      <div>{{dialog.captureFailed.error}}</div>
    </dialog-common>

    <dialog-common
        :value="dialog.capturing.show"
        @input="dialog.capturing.show = false"
        :title="$t('onlineOrder.capturingDialog.title')">
      {{ $t('onlineOrder.capturingDialog.message') }}
    </dialog-common>

    <!-- Refund order -->
    <dialog-common
        :value="dialog.refunding.show"
        @input="dialog.refunding.show = false"
        :title="$t('onlineOrder.refundingDialog.title')">
      {{ $t('onlineOrder.refundingDialog.message') }}
    </dialog-common>

    <dialog-order-transaction-refund-failed
        v-model="dialog.refundFailed.show"
        :error="dialog.refundFailed.error"
        :capture-responses="dialog.refundFailed.captureResponses"
        :refund-responses="dialog.refundFailed.refundResponses"/>

    <dialog-common
        :value="dialog.refundSucceeded.show"
        :title="$t('onlineOrder.refundSucceededDialog.title')"
        @input="dialog.refundSucceeded.show = false">
      {{ $t('onlineOrder.refundSucceededDialog.message') }}
    </dialog-common>

    <dialog-order-transaction-refund-confirm
        v-if="dialog.refundConfirm.show"
        v-model="dialog.refundConfirm.show"
        :order="dialog.refundConfirm.order"
        :store-locale="storeLocale"
        @submit="doRefundOrder(dialog.refundConfirm.order, dialog.refundConfirm.status)"/>
  </div>
</template>

<script>
  import orderUtil from '../logic/orderUtil';
  import { getBookingNumber, getProductGridOrder, getVDate } from '../logic/productUtils';
  import { getProvided } from '../logic/commonUtils';
  import * as jsonfn from 'json-fn';
  const socketIntervals = {}

  export default {
    name: 'OrderStore',
    domain: 'OrderStore',
    injectService: ['PosStore:(user, timeFormat, dateFormat, device, storeLocale)'],
    data() {
      return {
        activeTableProduct: null,
        initOrderProps: {},
        currentOrder: { items: [], hasOrderWideDiscount: false, firstInit: false },
        printedOrder: { items: [], hasOrderWideDiscount: false, firstInit: false },
        activeOrders: [],
        savedOrders: [],
        scrollWindowProducts: null,
        productIdQuery: '',
        productIdQueryResults: [],
        productNameQuery: '',
        productNameQueryResults: [],
        actionList: [],
        //payment screen variables
        paymentAmountTendered: '',
        paymentTip: 0,
        lastPayment: 0,
        //order history screen variables
        orderHistoryOrders: [],
        orderHistoryFilters: [],
        orderHistoryCurrentOrder: null,
        totalOrders: null,
        orderHistoryPagination: { limit: 15, currentPage: 1 },
        // online order
        pendingOrders: [],
        kitchenOrders: [],
        onlineOrders: [],
        // reservations
        reservations: [],
        dialog: {
          // capture
          capturing: {
            show: false,
          },
          captureFailed: {
            show: false,
            error: null
          },
          // refund
          refundConfirm: {
            show: false,
            order: null,
            status: null,
          },
          refunding: {
            show: false,
          },
          refundFailed: {
            show: false,
            error: null,
            captureResponses: {},
            refundResponses: [],
          },
          refundSucceeded: {
            show: false,
          },
        },
        //call in order
        calls: [],
        selectedCustomer: {},
        orderType: '',
        missedCalls: []
      }
    },
    computed: {
      // order screen
      paymentDiscount() {
        if (this.currentOrder.items) {
          return orderUtil.calOrderDiscount(this.currentOrder.items);
        }
      },
      paymentChange() {
        if (parseFloat(this.paymentAmountTendered) > this.paymentTotal) {
          return parseFloat(this.paymentAmountTendered) - this.paymentTotal
        }
        return 0
      },
      paymentTotal() {
        if (this.currentOrder) {
          const total = orderUtil.calOrderTotal(this.currentOrder.items) + orderUtil.calOrderModifier(this.currentOrder.items)
          if(Number.isInteger(total))
            return total
          return +total.toFixed(2)
        }
        return 0
      },
      paymentTax() {
        if (this.currentOrder) {
          return orderUtil.calOrderTax(this.currentOrder.items);
        }
        return 0
      },
      paymentSubTotal() {
        return this.paymentTotal - this.paymentTax
      },
      activeProduct() {
        if (this.currentOrder.items && !_.isNil(this.activeTableProduct)) {
          return this.currentOrder.items[this.activeTableProduct]
        }
      },
    },
    methods: {
      //<!--<editor-fold desc="Order screen">-->
      async getOnlineOrderDeviceId() {
        const posSetting = await cms.getModel('PosSetting').findOne({})
        return posSetting.onlineDevice && posSetting.onlineDevice.id
      },
      async getScrollWindowProducts() {
        const products = {}
        const allProducts = await cms.getModel('Product').find();
        const groupedProducts = _.groupBy(allProducts, 'category.name')
        const favouriteProducts = allProducts.filter(product => product.option && product.option.favorite)
        .sort((cur, next) => getProductGridOrder(cur, true) - getProductGridOrder(next, true))
        .map(product => ({
          ..._.omit(product, 'attributes'),
          originalPrice: product.price
        }))
        if (favouriteProducts) {
          Object.assign(products, {
            Favourite: _.chunk(favouriteProducts, 28)
          })
        }
        if (groupedProducts) {
          for (const key in groupedProducts) {
            if (groupedProducts.hasOwnProperty(key)) {
              const isFavourite = key === 'Favourite'
              Object.assign(products, {
                [key]: _.chunk(groupedProducts[key].sort((current, next) => {
                  return getProductGridOrder(current, isFavourite) - getProductGridOrder(next, isFavourite)
                }).map(product => ({
                  ..._.omit(product, 'attributes'),
                  originalPrice: product.price
                })), 28)
              })
            }
          }
        }
        this.scrollWindowProducts = products
        return products
      },
      mapProduct(p) {
        return {
          ...p,
          ...!p.originalPrice && { originalPrice: p.price },
          ...!p.quantity && { quantity: 1 },
          ...!p.course && { course: 1 },
          product: p._id,
          _id: this.genObjectId(),
          taxes: [p.tax, p.tax2]
        }
      },
      addProductToOrder(product) {
        if (!this.currentOrder || !product) return
        if (!this.currentOrder._id && !this.actionList.some(i => i.type === 'order')) {
          this.$set(this.currentOrder, 'firstInit', true)
          const takeAway = !this.currentOrder.table;
          this.$set(this.currentOrder, 'takeAway', takeAway)
          this.actionList.push({
            type: 'order',
            action: 'createOrder',
            where: null,
            data: {
              table: this.currentOrder.table,
            },
            update: {
              method: 'create',
              query: jsonfn.stringify({
                table: this.currentOrder.table,
                items: [],
                status: 'inProgress',
                takeAway
              })
            }
          })
        } else this.$set(this.currentOrder, 'firstInit', false);

        const latestProduct = _.last(this.currentOrder.items);

        const mappedProduct = this.mapProduct(product);
        if (!latestProduct) {
          // create order with product
          this.actionList.push({
            type: 'order',
            action: 'addItem',
            where: jsonfn.stringify({ _id: !this.currentOrder.firstInit ? this.currentOrder._id : null }),
            data: {
              table: this.currentOrder.table,
            },
            orderId: this.currentOrder.id,
            update: {
              method: 'findOneAndUpdate',
              query: jsonfn.stringify({
                $push: {
                  'items': { ...mappedProduct }
                }
              })
            }
          })
          this.$set(this.currentOrder, 'items', [mappedProduct])
        } else {
          const isSameItem = _.isEqualWith(product, latestProduct, (product, latestProduct) => {
            return latestProduct.product === product._id &&
              product.price === latestProduct.price &&
              (!latestProduct.modifiers || latestProduct.modifiers.length === 0) &&
              !latestProduct.printed
          } )

          if (isSameItem) return this.addItemQuantity(latestProduct)
          // else add product to arr
          this.actionList.push({
            type: 'order',
            action: 'addItem',
            where: jsonfn.stringify({
              _id: !this.currentOrder.firstInit ? this.currentOrder._id : null
            }),
            data: {
              orderId: this.currentOrder.id,
              table: this.currentOrder.table,
            },
            update: {
              method: 'findOneAndUpdate',
              query: jsonfn.stringify({
                $push: {
                  'items': { ...mappedProduct }
                }
              })
            }
          })
          this.currentOrder.items.push(mappedProduct)
        }
      },
      addItemQuantity(item) {
        // $set qty
        const itemToUpdate = this.currentOrder.items.find(i => i === item)
        this.actionList.push({
          type: 'order',
          action: 'changeItemQuantity',
          where: jsonfn.stringify({
            _id: !this.currentOrder.firstInit ? this.currentOrder._id : null,
            'items._id': itemToUpdate._id
          }),
          data: {
            orderId: this.currentOrder.id,
            table: this.currentOrder.table,
          },
          update: {
            method: 'findOneAndUpdate',
            query: jsonfn.stringify({
              $inc: {
                'items.$.quantity': 1
              }
            })
          }
        })
        itemToUpdate.quantity++
      },
      removeItemQuantity(item) {
        // $set qty
        const itemToUpdate = this.currentOrder.items.find(i => i === item)
        if (itemToUpdate.quantity === 0) return
        this.actionList.push({
          type: 'order',
          action: 'changeItemQuantity',
          where: jsonfn.stringify({
            _id: !this.currentOrder.firstInit ? this.currentOrder._id : null,
            'items._id': itemToUpdate._id
          }),
          data: {
            orderId: this.currentOrder.id,
            table: this.currentOrder.table,
          },
          update: {
            method: 'findOneAndUpdate',
            query: jsonfn.stringify({
              $inc: {
                'items.$.quantity': -1
              }
            })
          }
        })
        itemToUpdate.quantity--
      },
      updateOrderItem(_id, update) {
        const item = this.currentOrder.items.find(i => i._id === _id)
        _.forEach(update, (val, key) => {
          this.$set(item, key, val)
        })

        const updates = _.reduce(update, (acc, val, key) => {
          acc[`items.$.${key}`] = val
          return acc
        }, {})
        console.log('updates', updates)
        this.actionList.push({
          type: 'order',
          action: 'update',
          where: jsonfn.stringify({
            _id: !this.currentOrder.firstInit ? this.currentOrder._id : null,
            'items._id': item._id
          }),
          data: {
            orderId: this.currentOrder.id,
            table: this.currentOrder.table,
          },
          update: {
            method: 'findOneAndUpdate',
            query: jsonfn.stringify(updates)
          }
        })
      },
      calculateNewPrice(changeType, amount, update = false) {
        if (this.activeProduct) {
          let originalPrice = this.activeProduct.originalPrice;
          let newPrice = originalPrice
          if (changeType === 'percentage') {
            newPrice = (originalPrice * (100 - amount)) / 100
          }
          if (changeType === 'amount') newPrice = originalPrice - amount
          if (changeType === 'new') newPrice = amount

          newPrice = +newPrice.toFixed(2)

          if (update) {
            this.$set(this.activeProduct, 'price', newPrice)
            this.$set(this.activeProduct, 'discountUnit', changeType === 'percentage' ? 'percent' : 'amount')
            this.$set(this.activeProduct, 'vDiscount', originalPrice - newPrice)
          }
          return newPrice
        }
      },
      updateNewPrice({ difference, type, value }) {
        if (this.activeProduct) {
          this.$set(this.activeProduct, 'price', value)
          this.$set(this.activeProduct, 'discountUnit', type === 'percentage' ? 'percent' : 'amount')
          this.$set(this.activeProduct, 'vDiscount', difference)
        }
      },
      queryProductsById() {
        let quantity;
        if (this.productIdQuery.includes('x')) {
          const queryStrArr = this.productIdQuery.split(' ')
          quantity = parseInt(queryStrArr[2]);
          this.productIdQuery = queryStrArr[0]
        }
        const results = cms.getList('Product').filter(item => item.id === this.productIdQuery)
        if (results) {
          this.productIdQueryResults = results.map(product => ({
            ...product,
            originalPrice: product.price,
            ...quantity && { quantity }
          }))
        }
      },
      queryProductsByName() {
        const results = cms.getList('Product').filter(product => product.name.toLowerCase().includes(this.productNameQuery.trim().toLowerCase()))
        this.productNameQueryResults = Object.freeze(results.map(product => ({
          ...product,
          originalPrice: product.price
        })))
      },
      async getSavedOrders() {
        try {
          const orderModel = cms.getModel('Order')
          this.savedOrders = await orderModel.find({ status: 'inProgress' })
        } catch (e) {
          console.error(e)
        }
      },
      async removeSavedOrder(order) {
        try {
          const orderModel = cms.getModel('Order')
          await orderModel.findOneAndUpdate({ '_id': order._id }, { status: 'cancelled' });
          const index = this.savedOrders.findIndex(o => o._id === order._id);
          this.savedOrders.splice(index, 1);
        } catch (e) {
          console.error(e)
        }
      },
      async selectSavedOrder(order) {
        await this.resetOrderData()
        const orderModel = cms.getModel('Order')
        this.currentOrder = await orderModel.findOne({ _id: order._id })
      },
      async resetOrderData() {
        const tseConfig = await cms.getModel('TseConfig').findOne()
        const tseEnabled = tseConfig && !!tseConfig.tseEnable
        this.activeTableProduct = null
        this.currentOrder = { items: [], hasOrderWideDiscount: false, ...tseEnabled && { tseMethod: this.currentOrder.tseMethod || 'auto' } };
        this.paymentAmountTendered = ''
        this.productIdQuery = ''
        await this.getSavedOrders()
      },
      async getMappedOrder(paymentMethod, useCompactOrder = true) {
        const orderDateTime = new Date()
        const id = await orderUtil.getLatestOrderId()
        const taxGroups = _.groupBy(this.currentOrder.items, 'tax')
        const vTaxGroups = _.map(taxGroups, (val, key) => ({
          taxType: key,
          tax: orderUtil.calOrderTax(val),
          sum: orderUtil.calOrderTotal(val)
        }))

        const items = useCompactOrder
          ? this.compactOrder(this.currentOrder.items)
          : _.cloneDeep(this.currentOrder.items)

        return Object.assign({}, this.currentOrder, {
          id,
          status: 'paid',
          takeOut: this.currentOrder.takeOut,
          items: await orderUtil.getComputedOrderItems(items, orderDateTime),
          user: this.currentOrder.user
            ? [...this.currentOrder.user, { name: this.user.name, date: orderDateTime }]
            : [{ name: this.user.name, date: orderDateTime }],
          date: orderDateTime,
          vDate: await getVDate(orderDateTime),
          bookingNumber: getBookingNumber(orderDateTime),
          payment: [paymentMethod || { ...this.currentOrder.payment, value: this.paymentTotal }],
          vSum: this.paymentTotal.toFixed(2),
          vTax: this.paymentTax.toFixed(2),
          vTaxGroups,
          vDiscount: this.paymentDiscount.toFixed(2),
          receive: parseFloat(this.paymentAmountTendered),
          cashback: this.paymentChange.toFixed(2)
        });
      },
      async savePaidOrder(paymentMethod) {
        try {
          if (!this.currentOrder || !this.currentOrder.items.length) return
          const orderModel = cms.getModel('Order')
          const order = await this.getMappedOrder(paymentMethod);

          const newOrder = this.currentOrder.status === 'inProgress'
            ? await orderModel.findOneAndUpdate({ _id: this.currentOrder._id }, order)
            : await orderModel.create(order);
          newOrder && this.printOrderReport(newOrder._id)

          await this.resetOrderData();
        } catch (e) {
          console.error(e)
        }
      },
      async saveSplitOrder(items, payment, isLast, callback = () => null) {
        // last split, pay for original order
        if (isLast && this.currentOrder._id) {
          const order = await this.saveRestaurantOrder(payment, false, false, false)
          return callback(order)
        }

        // create order
        const order = { items, payment, splitId: this.currentOrder.splitId, table: this.currentOrder.table, _id: this.genObjectId() }
        cms.socket.emit('pay-order', order, this.user, this.device, true, [], false, false, async newOrder => {
          callback(newOrder);
        })
      },
      compactOrder(products) {
        let resultArr = [];
        products.forEach(product => {
          const existingProduct = resultArr.find(r =>
            _.isEqual(_.omit(r, 'quantity'), _.omit(product, 'quantity'))
          );
          if (existingProduct) {
            existingProduct.quantity = existingProduct.quantity + product.quantity
          } else {
            resultArr.push(_.cloneDeep(product));
          }
        })
        return resultArr
      },
      addOrderCommits(changes) {
        this.actionList.push(...changes.map(change => ({
          type: 'order',
          action: 'update',
          where: jsonfn.stringify({
            _id: !this.currentOrder.firstInit ? this.currentOrder._id : null,
          }),
          data: {
            orderId: this.currentOrder.id,
            table: this.currentOrder.table,
          },
          update: {
            method: 'findOneAndUpdate',
            query: jsonfn.stringify(change)
          }
        })))
      },
      discountCurrentOrder(change) {
        const items = this.currentOrder.items.filter(i => i.quantity);
        this.$set(this.currentOrder, 'items', orderUtil.applyDiscountForOrder(items, change));
        this.$set(this.currentOrder, 'hasOrderWideDiscount', true);
        this.$set(this.currentOrder, 'discount', change)
        this.currentOrder.items.forEach(item => this.setNewPrice(item.price, item))
        this.addOrderCommits([
          { hasOrderWideDiscount: true, discount: change }
        ])
      },
      resetOrderDiscount() {
        this.$set(this.currentOrder, 'items', orderUtil.resetDiscount(this.compactOrder(this.currentOrder.items)));
        this.$set(this.currentOrder, 'hasOrderWideDiscount', true);
        this.$set(this.currentOrder, 'discount', null)
        this.currentOrder.items.forEach(item => this.setNewPrice(item.price, item))
        this.addOrderCommits([
          { hasOrderWideDiscount: true, discount: null }
        ])
      },
      //<!--</editor-fold>-->

      //<!--<editor-fold desc="Order history screen">-->
      updateOrderHistoryFilter(filter) {
        const index = this.orderHistoryFilters.findIndex(f => f.title === filter.title);
        if (index > -1) {
          this.orderHistoryFilters.splice(index, 1, filter);
        } else {
          this.orderHistoryFilters.unshift(filter);
        }
        this.orderHistoryPagination.currentPage = 1;
      },
      async getOrderHistory() {
        const orderModel = cms.getModel('Order');
        const condition = this.orderHistoryFilters.reduce((acc, filter) => (
          { ...acc, ...filter['condition'] }),
          { $or: [{ status: 'paid' }, { status: 'completed' }] });
        const { limit, currentPage } = this.orderHistoryPagination;
        const orders = await orderModel.find(condition).sort({ date: -1 }).skip(limit * (currentPage - 1)).limit(limit);
        this.orderHistoryOrders = orders.map(order => ({
          ...order,
          info: order.note,
          tax: order.vTax ? order.vTax : orderUtil.calOrderTax(order.items),
          dateTime: dayjs(order.date).format(`${this.dateFormat} ${this.timeFormat}`),
          amount: order.vSum ? order.vSum : orderUtil.calOrderTotal(order.items),
          staff: order.user,
          barcode: '',
          promotions: [],
        }));
        this.orderHistoryCurrentOrder = this.orderHistoryOrders[0];
      },
      async getTotalOrders() {
        const orderModel = cms.getModel('Order');
        const condition = this.orderHistoryFilters.reduce((acc, filter) => (
            { ...acc, ...filter['condition'] }),
            { $or: [{ status: 'paid' }, { status: 'completed' }] });
        this.totalOrders = await orderModel.count(condition);
      },
      async deleteOrder() {
        try {
          const orderModel = cms.getModel('Order');
          await orderModel.findOneAndUpdate({ '_id': this.orderHistoryCurrentOrder._id }, { status: 'cancelled' });
          const index = this.orderHistoryOrders.findIndex(o => o._id === this.orderHistoryCurrentOrder._id);
          this.orderHistoryOrders.splice(index, 1);
          this.orderHistoryCurrentOrder = this.orderHistoryOrders[0];
        } catch (e) {
          console.error(e)
        }
      },
      printOrderReport(order) {
        return new Promise(async (resolve, reject) => {
          if (!order) {
            reject()
          }
          try {
            await cms.getModel('OrderCommit').addCommits([{
              type: 'report',
              action: 'print',
              data: {
                reportType: 'OrderReport',
                printData: order,
                device: this.device
              }
            }])
            resolve()
          } catch (e) {
            reject(e.message)
          }
        })
      },

      //<!--</editor-fold>-->

      //<!--<editor-fold desc="Button functions">-->
      isActiveFnBtn(btn) {
        if (!btn || !btn.buttonFunction) return
        if (btn.buttonFunction === 'changePrice' || btn.buttonFunction.includes('discount')) {
          return !_.isNil(this.activeTableProduct) && !this.activeTableProduct.discountResistance
        }
        if (['pay', 'quickCash', 'saveOrder'].includes(btn.buttonFunction)) {
          return this.currentOrder.items.length > 0
        }
        return true;
      },
      chooseFunction(functionName) {
        if (!functionName) return () => null
        return this[functionName]
      },
      buybackProduct({ price, product, unit }) {
        this.addProductToOrder(Object.assign(_.omit(product, 'attributes'), {
          price: -price,
          originalPrice: -price,
          tax: 0,
          discountResistance: true
        }))
      },
      changePrice() {
        this.$getService('dialogChangePrice:open')('new', this.activeProduct ? this.activeProduct.originalPrice : 0)
      },
      discountSingleItemDialog() {
        this.$getService('dialogChangePrice:open')('percentage', this.activeProduct ? this.activeProduct.originalPrice : 0)
      },
      discountSingleItemByAmount(value) {
        this.calculateNewPrice('amount', value, true)
      },
      discountSingleItemByPercent(value) {
        this.calculateNewPrice('percentage', value, true)
      },
      productLookup() {
        this.$getService('dialogProductLookup:setActive')(true)
      },
      async saveOrder() {
        if (!this.currentOrder || !this.currentOrder.items.length) return
        const orderModel = cms.getModel('Order')
        const date = new Date();

        const order = Object.assign({}, this.currentOrder, {
          status: 'inProgress',
          items: await orderUtil.getComputedOrderItems(this.compactOrder(this.currentOrder.items), date),
          date,
          vDate: getVDate(date),
          user: [{ name: this.user.name || '', date }],
        })

        if (this.currentOrder._id) {
          const existingOrder = await orderModel.findOne({ _id: this.currentOrder._id })
          if (existingOrder) {
            await orderModel.findOneAndUpdate({ _id: this.currentOrder._id }, order)
          } else {
            await orderModel.create(order)
          }
        } else {
          await orderModel.create(order)
        }
        this.currentOrder = {
          items: [],
          hasOrderWideDiscount: false
        }
        this.resetOrderData()
      },
      async quickCash() {
        this.lastPayment = +this.paymentTotal
        this.paymentAmountTendered = this.paymentTotal.toString()
        await this.savePaidOrder({ type: 'cash', value: this.paymentTotal });
      },
      pay() {
        this.$router.push({ path: `/pos-payment` })
      },
      //<!--</editor-fold>-->

      //<!--<editor-fold desc="Restaurant functions">-->
      async addModifierToProduct(modifier, product) {
        console.log(modifier)
        if (!this.currentOrder || !this.currentOrder.items || !this.currentOrder.items.length) return
        product = product
          ? _.find(this.currentOrder.items, item => item === product)
          : _.last(this.currentOrder.items)

        if (!product || product.sent || product.printed) return
        modifier._id = this.genObjectId();
        this.actionList.push({
          type: 'order',
          action: 'update',
          where: jsonfn.stringify({
            _id: !this.currentOrder.firstInit ? this.currentOrder._id : null,
            'items._id': product._id
          }),
          data: {
            orderId: this.currentOrder.id,
            table: this.currentOrder.table,
          },
          update: {
            method: 'findOneAndUpdate',
            query: jsonfn.stringify({
              $push: {
                'items.$.modifiers': {...modifier}
              }
            })
          }
        })

        if (product.modifiers) {
          product.modifiers.push(modifier)
        } else {
          this.$set(product, 'modifiers', [modifier])
        }
      },
      async removeProductModifier(product, modIndex) {
        const modifier = product.modifiers[modIndex]
        this.actionList.push({
          type: 'order',
          action: 'update',
          where: jsonfn.stringify({
            _id: !this.currentOrder.firstInit ? this.currentOrder._id : null,
            'items._id': product._id
          }),
          data: {
            orderId: this.currentOrder.id,
            table: this.currentOrder.table,
          },
          update: {
            method: 'findOneAndUpdate',
            query: jsonfn.stringify({
              $pull: {
                'items.$.modifiers': {
                  _id: modifier._id
                }
              }
            })
          }
        })
        product.modifiers.splice(modIndex, 1)
      },
      getExtraCommits() {
        if (!this.actionList) this.actionList = []
        if (this.currentOrder.numberOfCustomers) {
          this.actionList.push({
            type: 'order',
            action: 'update',
            where: jsonfn.stringify({ _id: this.currentOrder._id }),
            data: {
              table: this.currentOrder.table,
            },
            update: {
              method: 'findOneAndUpdate',
              query: jsonfn.stringify({$set: {numberOfCustomers: this.currentOrder.numberOfCustomers}})
            }
          })
        }

        if (this.currentOrder.tseMethod) {
          this.actionList.push({
            type: 'order',
            action: 'update',
            where: jsonfn.stringify({ _id: this.currentOrder._id }),
            data: {
              table: this.currentOrder.table,
            },
            update: {
              method: 'findOneAndUpdate',
              query: jsonfn.stringify({$set: {tseMethod: this.currentOrder.tseMethod}})
            }
          })
        }

        if (this.currentOrder.manual) {
          this.actionList.push({
            type: 'order',
            action: 'update',
            where: jsonfn.stringify({ _id: this.currentOrder._id }),
            data: {
              table: this.currentOrder.table,
            },
            update: {
              method: 'findOneAndUpdate',
              query: jsonfn.stringify({ $set: { manual: true } })
            }
          })
        }

        this.actionList.push({
          type: 'order',
          action: 'update',
          where: jsonfn.stringify({ _id: this.currentOrder._id }),
          data: {
            table: this.currentOrder.table,
          },
          update: {
            method: 'findOneAndUpdate',
            query: jsonfn.stringify({
              $push: {
                user: {
                  $each: [{ name: this.user.name, date: new Date() }],
                  $position: 0
                }
              }
            })
          }
        })
      },
      async saveTableOrder() {
        if (!this.actionList.length) return;
        this.getExtraCommits()

        if (!this.currentOrder._id) this.currentOrder._id = this.genObjectId();
        this.actionList.forEach(actionInfo => {
          if (actionInfo.action === 'createOrder') {
            const query = jsonfn.parse(actionInfo.update.query);
            query._id = this.currentOrder._id;
            actionInfo.update.query = jsonfn.stringify(query);
          }
          if (actionInfo.where) {
            const condition = jsonfn.parse(actionInfo.where);
            if (!condition._id) {
              condition._id = this.currentOrder._id;
              actionInfo.where = jsonfn.stringify(condition);
            } else {
              if (condition._id != this.currentOrder._id) {
                console.error('Different object id')
              }
            }
          }
        })
        cms.socket.emit('print-to-kitchen', this.device, this.currentOrder, this.printedOrder, this.actionList, (order) => {
          this.actionList = [];
          this.$set(this.currentOrder, 'status', order.status || 'inProgress')
          if (!this.currentOrder.user) this.$set(this.currentOrder, 'user', [])
          this.currentOrder.user.unshift({ name: this.user.name })
          this.$router.go(-1)
          // this.currentOrder = { items: [], hasOrderWideDiscount: false }
        })
      },
      setNewPrice(price, product) {
        this.$set(product, 'price', price)
        const vDiscount = product.originalPrice - price;
        this.$set(product, 'vDiscount', vDiscount)
        this.actionList.push({
          type: 'order',
          action: 'update',
          where: jsonfn.stringify({
            _id: !this.currentOrder.firstInit ? this.currentOrder._id : null,
            'items._id': product._id
          }),
          data: {
            orderId: this.currentOrder.id,
            table: this.currentOrder.table,
          },
          update: {
            method: 'findOneAndUpdate',
            query: jsonfn.stringify({
              $set: {
                'items.$.price': price,
                'items.$.vDiscount': vDiscount
              }
            })
          }
        })
      },
      setOrderDiscount() {
        if (this.currentOrder.items.some(i => i.price !== i.originalPrice) && !this.currentOrder.hasOrderWideDiscount) {
          this.$getService('alertDiscount:setActive')(true);
        } else {
          const originalTotal = this.currentOrder.items.reduce((acc, item) => (acc + (item.discountResistance ? 0 : item.quantity * item.originalPrice)), 0);
          this.$getService('dialogDiscount:open')(originalTotal, this.currentOrder.discount);
        }
      },
      updateOrderTable(table) {
        this.$set(this.currentOrder, 'table', table)
      },
      updateOrderItems(items) {
        this.$set(this.currentOrder, 'items', items)
      },
      updateCurrentOrder(key, val, commit) {
        this.$set(this.currentOrder, key, val)
        if (commit) {
          this.addOrderCommits([{ [key]: val }])
        }
      },
      updatePrintedOrder(key, val) {
        this.$set(this.printedOrder, key, val)
      },
      async moveItems(table, newItems, currentOrderItems, cb = () => null) {
        const clientId = await this.getOnlineOrderDeviceId()
        const sentryTags = `sentry:eventType=moveItems,clientId=${clientId},orderId=${this.currentOrder._id}`;
        console.debug(sentryTags, `1. POS frontend: emit moveItems to table ${table}`)
        cms.socket.emit('move-items', table, newItems, this.currentOrder, currentOrderItems, this.user, updatedOrder => {
          console.debug(sentryTags, `5. POS frontend: event ack`)
          if (updatedOrder) {
            this.$set(this.currentOrder, 'status', updatedOrder.status)
          }
          cb()
        })
      },
      addVoucher(value) {
        this.addProductToOrder({
          name: 'Voucher',
          price: +value,
          isVoucher: true
        })
      },
      redeemVoucher(value) {
        this.addProductToOrder({
          name: 'Redeemed Voucher',
          price: -value,
          isVoucher: true
        })
      },
      printKitchen(order) {
        return new Promise((resolve, reject) => {
          cms.socket.emit('printKitchen', {
            order,
            device: this.device
          }, ({success, message, results}) => {
            if (success) {
              console.log(results)
              resolve(results)
            }
            reject(message)
          })
        })
      },
      printEntireReceipt(order) {
        return new Promise((resolve, reject) => {
          cms.socket.emit('printEntireReceipt',
            { order, device: this.device },
            ({ success, message, results }) => {
              if (success) {
                console.log(results)
                resolve(results)
              }
              reject(message)
            })
        })
      },
      async createOrderCommits(commits) {
        if (commits instanceof Array)
          return Promise.all(commits.map(this.createOrderCommit))
      },
      async createOrderCommit(commit) { // key-value pair
        return await cms.getModel('OrderCommit').addCommits([{
          type: 'order',
          action: 'update',
          where: jsonfn.stringify({ _id: this.currentOrder._id }),
          data: {
            table: this.currentOrder.table,
          },
          update: {
            method: 'findOneAndUpdate',
            query: jsonfn.stringify({$set: {[commit.key]: commit.value}})
          }
        }]);
      },
      saveRestaurantOrder(paymentMethod, resetOrder = true, shouldPrint = false, fromPayBtn, cb = () => null) {
        return new Promise(async (resolve, reject) => {
          try {
            if (!this.currentOrder || !this.currentOrder.items.length) return
            const payment = paymentMethod || this.currentOrder.payment.map(({ type, name, value }) => ({ type: name || type, value }));
            const order = {
              ...this.currentOrder,
              payment,
            }
            this.getExtraCommits()
            if (this.actionList.length && this.actionList[0].action === 'createOrder' && !order._id) {
              order._id = this.genObjectId();
              const query = jsonfn.parse(this.actionList[0].update.query);
              query._id = order._id;
              this.actionList[0].update.query = jsonfn.stringify(query);
            }
            this.actionList.forEach(actionInfo => {
              if (actionInfo.action !== 'createOrder') {
                if (actionInfo.where) {
                  const condition = jsonfn.parse(actionInfo.where);
                  if (!condition._id) {
                    condition._id = order._id;
                    actionInfo.where = jsonfn.stringify(condition);
                  } else {
                    if (condition._id != order._id) {
                      console.error('Different object id');
                    }
                  }
                }
              }
            })
            cms.socket.emit('pay-order', order, this.user, this.device, false, this.actionList, shouldPrint, fromPayBtn, async newOrder => {
              this.$set(this.currentOrder, 'status', 'paid')
              if (!this.currentOrder.user) this.$set(this.currentOrder, 'user', [])
              this.currentOrder.user.unshift({ name: this.user.name })
              if (resetOrder) this.currentOrder = { items: [], hasOrderWideDiscount: false }
              cb(newOrder)
              resolve(newOrder)
            })
          } catch (e) {
            reject(e)
          }
        })
      },
      async quickCashRestaurant() {
        this.lastPayment = +this.paymentTotal
        this.paymentAmountTendered = this.paymentTotal.toString()
        await this.saveRestaurantOrder({ type: 'cash', value: this.paymentTotal });
      },
      async changeTable(order, newTable, cb) {
        await cms.getModel('OrderCommit').addCommits([
          {
            type: 'order',
            where: jsonfn.stringify({ _id: order._id }),
            action: 'update',
            data: {
              orderId: order.id,
              table: order.table,
            },
            update: {
              method: 'findOneAndUpdate',
              query: jsonfn.stringify({
                $set: {
                  table: newTable
                }
              })
            }
          },
          {
            type: 'order',
            action: 'changeTable',
            where: jsonfn.stringify({ _id: order._id }),
            data: {
              table: order.table,
              orderId: order._id
            },
            update: newTable
          }
        ])
        cb()
      },
      //<!--</editor-fold>-->

      // online ordering
      emitWithRetry(eventName, id, data, cb) {
        if (!socketIntervals[id])
          socketIntervals[id] = setTimeout(() => this.emitWithRetry(eventName, id, data, cb), 5000)
        console.log(`emit event ${eventName}`, socketIntervals[id])

        cms.socket.emit(eventName, ...data, () => {
          console.log(`clear interval ${id}`)
          clearInterval(socketIntervals[id])
          delete socketIntervals[id]
        })
      },
      printOnlineOrderReport(orderId) {
        return new Promise(async (resolve, reject) => {
          if (_.isNil(orderId)) reject()
          try {
            await cms.getModel('OrderCommit').addCommits([{
              type: 'report',
              action: 'print',
              data: {
                reportType: 'OnlineOrderReport',
                printData: { orderId },
                device: this.device
              }
            }])
            resolve()
          } catch(e) {
            reject(e.message)
          }
        })
      },
      printOnlineOrderKitchen(orderId) {
        return new Promise(async (resolve, reject) => {
          if (_.isNil(orderId)) reject()
          try {
            await cms.getModel('OrderCommit').addCommits([{
              type: 'report',
              action: 'print',
              data: {
                reportType: 'OnlineOrderKitchen',
                printData: { orderId },
                device: this.device
              }
            }])
            resolve()
          } catch(e) {
            reject(e.message)
          }
        })
      },
      async updateOnlineOrders() {
        let orderModel = cms.getModel('Order');
        this.pendingOrders = await orderModel.find({ online: true, status: 'inProgress' })
        this.kitchenOrders = await orderModel.find({ online: true, status: 'kitchen' })
      },
      isPrepaidOrder(order) {
        return order.paypalOrderDetail && order.paypalOrderDetail.orderID != null // paypal
        // more online payment
      },
      isCapturedOrder(order) {
        return order.paypalOrderDetail && order.paypalOrderDetail.response != null // paypal
        // more online payment
      },
      async declineOrder(order) {
        const status = 'declined'
        const updateInfo = Object.assign({}, order, {
          status,
          user: this.user
        })
        const updatedOrder = await cms.getModel('Order').findOneAndUpdate({ _id: order._id}, updateInfo)
        await this.updateOnlineOrders()

        const orderStatus = {
          orderId: updatedOrder.id,
          onlineOrderId: updatedOrder.onlineOrderId,
          status: status,
          responseMessage: order.declineReason,
          paypalOrderDetail: order.paypalOrderDetail
        };

        const clientId = await this.getOnlineOrderDeviceId();
        console.debug(`sentry:orderToken=${updatedOrder.onlineOrderId},orderId=${updatedOrder.id},eventType=orderStatus,clientId=${clientId}`,
            `8. Restaurant frontend: Order id ${updatedOrder.id}: send status to backend: ${status}`)

        this.emitWithRetry('updateOrderStatus', updatedOrder.onlineOrderId, [orderStatus])
      },
      async acceptPendingOrder(order) {
        try {
          let deliveryDateTime
          if (order.deliveryTime === 'asap') {
            deliveryDateTime = dayjs().add(order.prepareTime, 'minute')
            order.deliveryTime = deliveryDateTime.format('HH:mm')
          } else {
            deliveryDateTime = dayjs(order.deliveryTime, 'HH:mm')
          }
          const status = 'kitchen'
          const acceptResponse = $t(order.type === 'delivery' ? 'onlineOrder.deliveryIn' : 'onlineOrder.pickUpIn', this.storeLocale, {
            0: dayjs(deliveryDateTime).diff(dayjs(order.date), 'minute')
          })

          // validate prepaid (paypal, etc) before update status
          let isPrepaidOrder = this.isPrepaidOrder(order);
          // info which will be added/updated into order documents
          let updateOrderInfo = Object.assign({}, order, { status, user: this.user });
          let updatedOrder;
          if (isPrepaidOrder) {
            updatedOrder = order
          } else {
            updatedOrder = await cms.getModel('Order').findOneAndUpdate({ _id: order._id }, updateOrderInfo)
            this.printOnlineOrderKitchen(order._id)
            this.printOnlineOrderReport(order._id)
            await this.updateOnlineOrders()
          }

          const orderStatus = {
            orderId: updatedOrder.id,
            onlineOrderId: updatedOrder.onlineOrderId,
            status: status,
            responseMessage: acceptResponse,
            paypalOrderDetail: order.paypalOrderDetail,
            total: order.vSum
          }

          const clientId = await this.getOnlineOrderDeviceId();
          console.debug(
              `sentry:orderToken=${updatedOrder.onlineOrderId},orderId=${updatedOrder.id},eventType=orderStatus,clientId=${clientId}`,
              `8. Restaurant frontend: Order id ${updatedOrder.id}: send status to backend: ${status}`)

          if (isPrepaidOrder) {
            this.dialog.capturing.show = true
          }

          this.emitWithRetry('updateOrderStatus', updatedOrder.onlineOrderId, [orderStatus])
        } catch (e) {
          // TODO: Show an error dialog to the user
          console.error(e)
        }
      },
      async completeOrder(order) {
        const status = 'completed'
        const updatedOrder = await cms.getModel('Order').findOneAndUpdate({_id: order._id},
            Object.assign({}, order, {
              status
            }))
        await this.updateOnlineOrders()
        const orderStatus = {
          orderId: updatedOrder.id,
          onlineOrderId: updatedOrder.onlineOrderId,
          status,
          paypalOrderDetail: order.paypalOrderDetail
        }

        const clientId = await this.getOnlineOrderDeviceId();
        console.debug(`sentry:orderToken=${updatedOrder.onlineOrderId},orderId=${updatedOrder.id},eventType=orderStatus,clientId=${clientId}`,
            `8. Restaurant frontend: Order id ${updatedOrder.id}: send status to backend: ${status}`)
        this.emitWithRetry('updateOrderStatus', updatedOrder.onlineOrderId, [orderStatus])
      },
      isCaptureRefundExpired(captureResponses) {
        // find final capture
        let finalCapture;
        for(let purchase_unit of captureResponses.purchase_units) {
          for (let capture of purchase_unit.payments.captures) {
            if (capture.final_capture) {
              finalCapture = capture
              break;
            }
          }
        }

        // capture not completed, doesn't allow refund
        if (!finalCapture)
          return true;

        const _3HoursBefore = dayjs().subtract(3, 'hour')
        const createTime = dayjs(finalCapture.create_time)
        return createTime.isBefore(_3HoursBefore)
      },
      isRefundable(order) {
        // refundable order is order paid via paypal and money has been captured
        // and not refund yet or refund but some capture failed
        return (order.paypalOrderDetail
            && order.paypalOrderDetail.captureResponses
            && order.paypalOrderDetail.captureResponses.status === "COMPLETED" && !this.isCaptureRefundExpired(order.paypalOrderDetail.captureResponses)
            && (!order.paypalOrderDetail.refundResponses || this.isRefundFailed(order.paypalOrderDetail.refundResponses)))
      },
      isRefunded(order) {
        return (order.paypalOrderDetail
          && order.paypalOrderDetail.refundResponses
          && _.every(order.paypalOrderDetail.refundResponses, r => r.status === "COMPLETED"))
      },
      isRefundFailed(refundResponses) {
        return _.find(refundResponses, r => r.status !== "COMPLETED") != null
      },
      refundOrder(order, status) {
        this.dialog.refundConfirm.order = order
        this.dialog.refundConfirm.status = status
        this.dialog.refundConfirm.show = true
      },
      doRefundOrder(order, status) {
        this.dialog.refunding.show = true

        window.cms.socket.emit('refundOrder', order, async ({error, responseData}) => {
          this.dialog.refunding.show = false
          if (error) {
            this.dialog.refundFailed.show = true
            try {
              // known error
              // FULLY_REFUNDED error return when the user refund.
              let errorObj = jsonfn.parse(error)
              this.dialog.refundFailed.error = errorObj.details[0].description
            } catch (e) {
              this.dialog.refundFailed.error = error
            }
            return
          }

          const isRefundError = this.isRefundFailed(responseData)
          if (isRefundError) {
            this.dialog.refundFailed.show = true
            this.$set(this.dialog.refundFailed, 'captureResponses', order.paypalOrderDetail.captureResponses)
            this.dialog.refundFailed.refundResponses.splice(0, this.dialog.refundFailed.refundResponses.length, ...responseData)
          } else {
            this.dialog.refundSucceeded.show = true
          }

          order.paypalOrderDetail.refundResponses = responseData
          await cms.getModel('Order').updateOne({ _id: order._id }, order)
          await this.getOnlineOrdersWithStatus(status)
        })
      },
      async getOnlineOrdersWithStatus(status) {
        this.onlineOrders = await cms.getModel('Order').find({
          online: true,
          status
        })
      },
      async playBell() {
        const play = async () => {
          if (this.pendingOrders.length) await this.bell.play()

          const setting = await cms.getModel('PosSetting').findOne()
          if (!setting.onlineDevice.sound) {
            this.bellPlaying = false
            this.bell.removeEventListener('ended', play)
          }

          const repeat = setting.onlineDevice.soundLoop === 'repeat'
          if (!repeat || !this.pendingOrders || !this.pendingOrders.length)  {
            this.bellPlaying = false
            this.bell.removeEventListener('ended', play)
          }
        }

        try {
          const setting = await cms.getModel('PosSetting').findOne()
          if (!setting.onlineDevice.sound) return
          const loop = setting.onlineDevice.soundLoop
          await play()

          if (!loop || loop === 'none') {
            this.bellPlaying = false
            return
          }

          this.bell.addEventListener('ended', play)
        } catch (e) {
          this.bell.addEventListener('canplaythrough', () => this.bell.play())
        }
      },
      async createReservation(reservation) {
        const res = await cms.getModel('Reservation').create(reservation)
        cms.socket.emit('scheduleNewReservation', res)
        cms.socket.emit('updateOnlineReservation', res._id, 'create')
      },
      async getReservations(date = new Date(), status = 'all') {
        const dateTo = dayjs(date).startOf('day').add(1, 'day').toDate(),
          dateFrom = dayjs(date).startOf('day').toDate()
        this.reservations = await cms.getModel('Reservation').find({
          status: (status === 'all' ? { $in: ['pending', 'completed'] } : status),
          date: { $gte: dateFrom, $lt: dateTo }
        })
      },
      async updateReservation(_id, change) {
        await cms.getModel('Reservation').findOneAndUpdate({ _id }, change)
        cms.socket.emit('rescheduleReservation', _id, change)
      },
      async completeReservation(_id) {
        await this.updateReservation(_id, { status: 'completed' })
        const reservation = this.reservations.find(r => r._id === _id)
        reservation.status = 'completed'
      },
      async removeReservation(_id) {
        await this.updateReservation(_id, { status: 'declined' })
        const index = this.reservations.findIndex(r => r._id === _id)
        this.reservations.splice(index, 1)
        cms.socket.emit('updateOnlineReservation', _id, 'delete')
      },
      async checkReservationDay(date) {
        const dateTo = dayjs(date).startOf('day').add(1, 'day').toDate(),
            dateFrom = dayjs(date).startOf('day').toDate()
        const reservations = await cms.getModel('Reservation').find({date: { $gte: dateFrom, $lte: dateTo }, status: {$ne: 'declined'}})
        return reservations && reservations.length > 0
      },
      genObjectId(id) {
        const BSON = require('bson');
        if (id) return new BSON.ObjectID(id)
        return new BSON.ObjectID();
      },
      async getTempOrder() {
        return new Promise(resolve => {
          console.log('emit buildTempOrder')
          cms.socket.emit('buildTempOrder', this.currentOrder.table, (order) => {
            resolve(order);
          })
        })
      },

      // call in order
      async getCustomerInfo(phone) {
        const customer = await cms.getModel('Customer').findOne({phone})
        if (!customer) {
          return {
            phone,
            name: 'New customer',
            addresses: []
          }
        }
        return customer
      },
      async createCallInOrder(customer, time, note) {
        let order = {}
        const orderDateTime = new Date()
        const id = await orderUtil.getLatestOrderId()
        const dailyId = await orderUtil.getLatestDailyId()
        const taxGroups = _.groupBy(this.currentOrder.items, 'tax')
        const vTaxGroups = _.map(taxGroups, (val, key) => ({
          taxType: key,
          tax: orderUtil.calOrderTax(val),
          sum: orderUtil.calOrderTotal(val)
        }))

        const items = this.compactOrder(this.currentOrder.items)

        Object.assign(order, this.currentOrder, {
          id,
          dailyId,
          status: 'kitchen',
          online: true,
          takeOut: this.currentOrder.takeOut,
          items: await orderUtil.getComputedOrderItems(items, orderDateTime),
          user: this.currentOrder.user
              ? [...this.currentOrder.user, { name: this.user.name, date: orderDateTime }]
              : [{ name: this.user.name, date: orderDateTime }],
          date: orderDateTime,
          vDate: await getVDate(orderDateTime),
          bookingNumber: getBookingNumber(orderDateTime),
          payment: [{ type: 'cash', value: this.paymentTotal }],
          vSum: this.paymentTotal.toFixed(2),
          vTax: this.paymentTax.toFixed(2),
          vTaxGroups,
          vDiscount: this.paymentDiscount.toFixed(2),
          receive: 0,
          cashback: 0,
          customer,
          deliveryDate: new Date(),
          type: this.orderType || 'delivery',
          deliveryTime: dayjs().add(time, 'minute').format('HH:mm'),
          shippingFee: 0,
          note,
        });

        const newOrder = await cms.getModel('Order').create(order)

        try {
          this.printOnlineOrderKitchen(newOrder._id)
          this.printOnlineOrderReport(newOrder._id)
        } catch(e) {
          console.log(e)
        }

        this.resetOrderData()
        const callIndex = this.calls.findIndex(c => c.customer.phone === this.selectedCustomer.phone)
        this.calls.splice(callIndex, 1)
        this.orderType = ''
        this.selectedCustomer = {}
      },
      // customer
      async createCustomer(customer) {
        const CustomerModel = cms.getModel('Customer')
        const customerWithSamePhone = await CustomerModel.findOne({
          phone: customer.phone
        })
        if(customerWithSamePhone) {
          await CustomerModel.findOneAndUpdate(
              {
                _id: customerWithSamePhone._id
              },
              {
                $push: {
                  addresses: { $each: customer.addresses }
                }
              }
          )
        } else {
          await cms.getModel('Customer').create(customer)
        }
      },
      async getCustomers() {
        return await cms.getModel('Customer').find()
      },
      async updateCustomer(_id, change) {
        await cms.getModel('Customer').findOneAndUpdate({_id}, {...change})
      },
      async deleteCustomer(_id) {
        await cms.getModel('Customer').deleteOne({_id})
      },
      getActiveOrders: _.throttle(async function () {
        const orders = await cms.getModel('Order').find({ status: 'inProgress' })
        this.activeOrders = orders || []
        if (this.activeOrders.length) {
          const existingOrder = this.activeOrders.find(o => o.table === this.currentOrder.table)
          if (existingOrder) this.mapToCurrentOrder(existingOrder)
        }
      }, 1000),
      mapToCurrentOrder(order, table) {
        if (order) {
          this.$set(this.currentOrder, '_id', order._id)
          this.$set(this.currentOrder, 'user', _.cloneDeep(order.user))
          this.$set(this.currentOrder, 'items', _.cloneDeep(order.items))
          this.$set(this.currentOrder, 'manual', order.manual)
          this.$set(this.currentOrder, 'discount', order.discount)
          this.$set(this.currentOrder, 'takeAway', order.takeAway)
          order.splitId && this.$set(this.currentOrder, 'splitId', order.splitId)
          order.numberOfCustomers && this.$set(this.currentOrder, 'numberOfCustomers', order.numberOfCustomers)
          order.tseMethod && this.$set(this.currentOrder, 'tseMethod', order.tseMethod)
          this.printedOrder = _.cloneDeep(this.currentOrder)
        } else {
          this.currentOrder = { items: [], hasOrderWideDiscount: false, tseMethod: 'auto' }
          if (table) this.$set(this.currentOrder, 'table', table)
          this.printedOrder = _.cloneDeep(this.currentOrder)
        }
      },
      setInitOrderProps(val) {
        this.initOrderProps = val
      }
    },
    async created() {
      await this.getScrollWindowProducts()

      const cachedPageSize = localStorage.getItem('orderHistoryPageSize')
      if (cachedPageSize) this.orderHistoryPagination.limit = parseInt(cachedPageSize)
      this.bell = new Audio('/plugins/pos-plugin/assets/sounds/bell.mp3')
      this.bell.addEventListener('play', () => {
        this.bellPlaying = true;
      })

      await this.updateOnlineOrders()

      await this.getActiveOrders()
      cms.socket.on('update-table-status', this.getActiveOrders)

      // add online orders: cms.socket.emit('added-online-order')
      cms.socket.on('updateOnlineOrders', async sentryTagString => {
        console.debug(sentryTagString, '7. Restaurant frontend: received updateOnlineOrders signal')
        await this.updateOnlineOrders()
      })
      // this.orderHistoryCurrentOrder = this.orderHistoryOrders[0];
      cms.socket.on('updateOrderItems', async () => {
        const order = await this.getTempOrder();
        if (!order) return;
        const tempItems = this.currentOrder.items.filter(i => !i.printed)
        this.$set(this.currentOrder, '_id', order._id)
        this.$set(this.currentOrder, 'user', order.user)
        this.$set(this.currentOrder, 'id', order.id)
        const newItems = [...order.items, ...tempItems];
        this.$set(this.currentOrder, 'items', _.uniqBy(newItems, '_id'))
        this.printedOrder = _.cloneDeep(order)
      })
      await this.getReservations()

      cms.socket.on('new-phone-call', async (phoneNumber, date) => {
        const customer = await this.getCustomerInfo(phoneNumber);
        this.calls.unshift({customer, date, phoneNumber});
      })

      cms.socket.on('new-missed-phone-call', async (phoneNumber, date) => {
        const customer = await this.getCustomerInfo(phoneNumber);

        const callIndex = this.calls.findIndex(e => e.phoneNumber === phoneNumber);
        if (callIndex > -1) this.calls.splice(callIndex, 1);
        this.missedCalls.unshift({customer, date});
      })
    },
    watch: {
      'orderHistoryPagination.limit'(newVal) {
        localStorage.setItem('orderHistoryPageSize', newVal)
      },
      pendingOrders: {
        async handler(val, oldVal) {
          if (val && val.length) {
            if ((!oldVal || (oldVal && val.length > oldVal.length)) && !this.bellPlaying) await this.playBell()
          }
        },
        immediate: true
      },
      'currentOrder.table': {
        async handler(val) {
          if (val) {
            let existingOrder = this.activeOrders.find(order => order.table === val)
            this.mapToCurrentOrder(existingOrder, val)
          } else {
            this.actionList = []
            this.currentOrder = { items: [], hasOrderWideDiscount: false, table: val, tseMethod: 'auto' }
            this.printedOrder = _.cloneDeep(this.currentOrder)
          }

          if (this.initOrderProps) {
            for (const prop in this.initOrderProps) {
              if (this.initOrderProps.hasOwnProperty(prop)) {
                this.$set(this.currentOrder, prop, this.initOrderProps[prop])
              }
            }
            this.setInitOrderProps({})
          }
        }
      },
      async 'currentOrder.status'(val) {
        if (val && this.currentOrder.table) {
          const existingActiveOrder = this.activeOrders.find(o => o.table === this.currentOrder.table)
          if (existingActiveOrder) {
            if (val !== 'inProgress') {
              const index = this.activeOrders.indexOf(existingActiveOrder)
              this.activeOrders.splice(index, 1)
            }
          } else if (val === 'inProgress') {
            this.activeOrders.push(_.cloneDeep(this.currentOrder))
          }

          await this.resetOrderData()
        }
      },
      currentOrder: {
        handler(val) {
          if (val) {
            cms.socket.emit('update-customer-order', val)
          }
        },
        deep: true,
        immediate: true
      },
    },
    provide() {
      return {
        ...getProvided(this.$data, this),
        ...getProvided(this.$options.methods, this),
        ...getProvided(this.$options.computed, this),
        isRefundFailed: this.isRefundFailed
      }
    }
  }

  //curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: localhost:8888" -H "Origin: ws://localhost:8888" ws://localhost:8888
</script>
