const _ = require('lodash');
let tse;
let tseReady;
//process.env.NO_SETUP_TSE = 'true';
process.env.mockMode = 'true'

const TseClient = require('nodejs-tse-client')
const moment = require('dayjs')
const utc = require('dayjs/plugin/utc')
moment.extend(utc)
const {makeKassenBestellung} = require("./makeProcessDataLib");
const JsonFn = require('json-fn');

const clientId = 'SWISSBIT'
const {makeKassenBelegFinish} = require("./makeProcessDataLib");
const numeral = require('numeral');
const orderUtil = require("../../components/logic/orderUtil");
const {makeQr} = require("./makeProcessDataLib");

module.exports = async (cms) => {
  const AsyncEventEmitter = require('asynchronous-emitter');
  const ee = new AsyncEventEmitter();
  cms.ee = ee;

  const PosSetting = cms.getModel('PosSetting');
  const TseTransaction = cms.getModel('TseTransaction');
  const OrderTseTemp = cms.getModel('OrderTseTemp');
  const OrderTseContent = cms.getModel('OrderTseContent');
  const TseCertificate = cms.getModel('TseCertificate');
  const TseConfig = cms.getModel('TseConfig');
  const Order = cms.getModel('Order');
  const EndOfDay = cms.getModel('EndOfDay')
  let OrderCommit;

  cms.on('/api/deleteAll', async function () {
    await Order.remove({})
    await cms.getModel('OrderCommit').remove({})
    await EndOfDay.remove({})
    await TseTransaction.remove({});
    await OrderTseTemp.remove({});
    await OrderTseContent.remove({});
  })

  if (process.env.NODE_ENV !== 'test') {
    cms.app.get('/api/deleteAll', async function (req, res) {
      cms.emit('/api/deleteAll');
      res.send('ok');
    })
  } else {
    cms.emit('/api/deleteAll');
  }

  await initTse();

  const posSetting = await PosSetting.findOne({});
  const tseConfig = await TseConfig.findOne({});

  function isDrink(item) {
    return item.groupPrinter === 'Bar' || item.groupPrinter === 'Getränk';
  }

  function isFood(item) {
    return item.groupPrinter !== 'Bar' && item.groupPrinter !== 'Getränk';
  }

  cms.on('run:print', async (commit) => {
    if (`${commit.action}@${commit.type}` === 'print@report') {
      await tseInvoicePrintHandler(commit);
    }
    OrderCommit = cms.getModel('OrderCommit');
    if (!commit.order.items) return;
    const items = commit.order.items.filter(i => !i.isVoucher);
    const allItems = commit.oldOrder ? commit.oldOrder.items.concat(items) : items;
    const order = commit.order;
    const oldOrder = commit.oldOrder;

    const {passthroughTse, passthroughTseComplete, updateOrderTseTemp} = await checkPassthroughTse(posSetting, order);
    if ((order.tseMethod === 'passthrough' && passthroughTse) || passthroughTseComplete) {
      order.tseMethod = 'passthrough';
      items.forEach(i => i.tseMethod = 'passthrough');
      await updateOrderTseTemp(order);
      await updateOrder(order, {tseMethod: order.tseMethod});
    } else {
      order.tseMethod = 'auto';
      await updateOrder(order, {tseMethod: order.tseMethod});
      if (order.tseMethod === 'auto') {
        // check maxProcent
        // check numberOfCustomers

        if (passthroughTse) {
          let hasItemAtLastTime = oldOrder && oldOrder.items.length > 0;
          let hasFood = !!items.find(i => isFood(i));

          if (order.numberOfCustomers === 1) {
            if (hasItemAtLastTime) {
              items.forEach(i => i.tseMethod = 'passthrough')
            } else if (hasFood) {
              items.forEach(i => {
                if (!isFood(i)) i.tseMethod = 'passthrough';
              })
            } else {
              items.forEach((i, k) => {
                if (k === 0) i.tseMethod = 'apply:1'
                if (k > 0) i.tseMethod = 'passthrough';
              })
            }

          } else if (order.numberOfCustomers >= 2) {
            let removedFood = false;
            let removedDrink = false;
            if (allItems.find(i => i.sent && isFood(i))) removedFood = true;
            if (allItems.find(i => i.sent && isDrink(i))) removedDrink = true;

            for (const item of items) {
              if (isFood(item) && !removedFood) {
                removedFood = true;
                item.tseMethod = 'apply:1';
              } else if (isDrink(item) && !removedDrink) {
                removedDrink = true;
                item.tseMethod = 'apply:1';
              } else {
                item.tseMethod = 'passthrough';
              }
            }
          }
        }

        await updateOrderTseTemp(order);
      }
    }

    for (const item of items) {
      if (!item.tseMethod) continue;
      await updateItem(order, item._id, {'items.$.tseMethod': item.tseMethod})
    }

    const content = makeKassenBestellung(items, []);
    await sendContentToTse(content, commit.order._id);

  })

  async function tseInvoicePrintHandler(commit) {
    const order = commit.data.printData;
    if (order.z) return;
    if (order.immediatePay && !order.qrCode) {
      await printInvoiceTseProcess(order)
    }
    //todo : truong hop co qrcode nhung thieu mon: ko cho in || storno roi tao ra moi
  }

  async function printInvoiceTseProcess(order) {
    const tseConfig = await TseConfig.findOne({});
    order.items.forEach(i => {
      i.date = new Date();
    });
    order.date = new Date();
    //vDate

    const orderTseContent = await OrderTseContent.findOne({order: order._id});
    if (orderTseContent) {
      const content = orderTseContent.content;
      await OrderTseContent.remove({order: order._id})
      const qrCode = await sendContentToTsePayApi(order, content, tseConfig);
      order.qrCode = qrCode;
      await updateOrder(order, {qrCode, items: order.items, date: order.date});
    }
  }

  cms.on('run:endOfDay', async (report) => {
    let startId = 0;
    if (tseConfig.tseEnable && tseConfig.passthroughEnable) {
      const date = dayjs(report.begin).startOf('day').toDate();
      let orders1 = await Order.find({
        vDate: {$lte: date},
        z: {$exists: false},
        status: {$nin: ['inProgress'/*, 'StornoReference'*/]},
      }).lean();

      await cms.getModel('OrderCommit').addCommits([{
        type: 'order',
        action: 'delete',
        where: JSON.stringify({
          vDate: {$lte: date},
          z: {$exists: false},
          status: {$nin: ['inProgress']},
          qrCode: {$exists: false}
        }),
        data: {allowMutateInactiveOrder: true},
        update: {
          method: 'deleteMany'
        }
      }]);

      orders1 = _.sortBy(orders1, ['date']);
      startId = orders1[0].id;
      if (tseConfig.numberOfCustomersDialog) {
        const orders3 = orders1.filter(e => e.qrCode);
        for (const order of orders3) {
          let mutate = false;
          order.items = order.items.filter(i => {
            if (i.tseMethod === 'passthrough') mutate = true;
            return i.tseMethod !== 'passthrough';
          });
          order.items.forEach(i => {
            if (i.tseMethod === 'apply:1' && i.quantity > 1) {
              mutate = true;
              i.quantity = 1;
            }
          })
          order.cancellationItems = (order.cancellationItems || []).filter(i => i.tseMethod === 'passthrough');
          if (mutate) {
            const taxGroups = orderUtil.getOrderTaxGroups(order.items)
            const vTaxGroups = orderUtil.getOrderVTaxGroups(taxGroups);
            const vSum = orderUtil.calOrderVSum(order);

            await updateOrder(order, {
              items: order.items,
              cancellationItems: order.cancellationItems,
              vTaxGroups,
              vSum
            });
          }
        }
      }

      await makeExecPostAsync('run:resetHighestOrderId');

      let i = startId;
      for (const order of orders1.filter(o => o.qrCode)) {
        if (order.id !== i) {
          order.id = i;
          await updateOrder(order, {id: i});
        }
        i++;
      }
    }
  })

  function getPayment(order) {
    if (order.payment.length === 1) {
      return order.payment[0].type;
    } else {
      return 'multi';
    }
  }

  cms.on('run:closeOrder', tseHandler);

  async function tseHandler(commit, order) {
    //if (order.splitId)
    let isNew = order.immediatePay;
    let split = !!order.splitId;
    let qrCode;
    const posSetting = await PosSetting.findOne({});
    const tseConfig = await TseConfig.findOne({});
    let method = commit.data.fromPayBtn ? 'finish' : 'printInvoice';
    let content;
    if (order.recentItems.length > 0 || order.recentCancellationItems.length > 0) {
      content = makeKassenBestellung(order.recentItems, order.recentCancellationItems);
    }
    // 4 case :
    // close order without print, close order with print , rePrint
    // close order immediately with print , close order immediately without print

    if (!isNew || split) {
      if (method === 'finish' && !order.qrCode) {
        const _order = JsonFn.clone(order, true);

        _order.items = order.items.filter(i => i.tseMethod !== 'passthrough');
        _order.items.forEach(i => {
          if (i.tseMethod === 'apply:1' && i.quantity > 1) {
            i.quantity = 1;
          }
        })
        _order.cancellationItems = (order.cancellationItems || []).filter(i => i.tseMethod === 'passthrough');
        if (_order.tseMethod !== 'passthrough') {
          qrCode = await sendContentToTsePayApi(_order, content, tseConfig);
          order.qrCode = qrCode;
          //await Export.findByIdAndUpdate(order._id, {$set: {qrCode}});
        }
      } else if (method === 'printInvoice') {
        const items = [], cancellationItems = [];
        for (const item of order.items) {
          if (item.tseMethod === 'passthrough') {
            items.push(item);
            item.date = new Date();
          }
          if (item.tseMethod === 'apply:1' && item.quantity > 1) {
            const _item = JsonFn.clone(item, true);
            _item.quantity -= 1;
            items.push(_item);
          }
        }

        for (const item of (order.cancellationItems || [])) {
          if (item.tseMethod === 'passthrough') {
            item.date = new Date();
            cancellationItems.push(item);
          }
        }
        let content;
        if (items.length > 0 || cancellationItems.length > 0) {
          content = makeKassenBestellung(items, cancellationItems, true);
          //create commit to update here
        }

        qrCode = await sendContentToTsePayApi(order, content, tseConfig);
        order.qrCode = qrCode;
        await updateOrder(order, {items, cancellationItems, qrCode});
      }
    } else {
      let passthroughTse = false;
      {
        const beginHour = parseInt(posSetting.generalSetting.beginHour.split(':')[0])
        const _date = subtractDate(new Date(), beginHour).startOf('d').toDate();

        let orderTseTemp = await OrderTseTemp.findOne({date: _date});
        if (!orderTseTemp) {
          orderTseTemp = await OrderTseTemp.create({
            date: _date,
          });
        }

        orderTseTemp.orderNumber = (orderTseTemp.orderNumber || 0) + 1;
        orderTseTemp.sum = (orderTseTemp.sum || 0) + getSumme(order);

        let passthroughSum = (orderTseTemp.passthroughSum || 0) + getSumme(order);
        let procent = (passthroughSum / (orderTseTemp.sum || 0)) * 100;
        //console.log('procent: ', procent);
        //passthroughTse = true;
        //check bar

        if (procent < tseConfig.procent && getPayment(order) === 'cash' && tseConfig.passthroughEnable && method === 'finish') {
          passthroughTse = true;
        }

        if (passthroughTse) {
          orderTseTemp.passthroughOrderNumber = (orderTseTemp.passthroughOrderNumber || 0) + 1;
          orderTseTemp.passthroughSum = passthroughSum;
          await OrderTseContent.create({order: order._id, content});
        }

        await OrderTseTemp.findOneAndUpdate({_id: orderTseTemp._id}, orderTseTemp, {new: true});
      }
      if (!passthroughTse) {
        qrCode = await sendContentToTsePayApi(order, content, tseConfig);
      }
    }
    if (qrCode) {
      await updateOrder(order, {qrCode});
    }
  }


  function getTaxTotal(order) {
    const taxes = _.groupBy(order.vTaxGroups, t => t.taxType);
    //todo: check if it is not correct
    const tax_1_1 = _.get(taxes, '19.0.tax', 0);
    //const tax_1_1 = _.get(taxes, '7.tax', 0);
    const tax_1_2 = _.get(taxes, '16.0.tax', 0);
    const tax_1 = tax_1_1 + tax_1_2;
    const tax_2 = _.get(taxes, '5.0.tax', 0);
    const format = i => numeral(i).format('0.00').replace(',', '.');
    const taxArr = [format(tax_1), format(tax_2), '0.00', '0.00', format(taxes[0] || 0)];
    return taxArr.join('_');
  }

  async function sendContentToTsePayApi(order, content, tseConfig) {
    const orderContent = makeKassenBelegFinish(order, getSumme, getTaxTotal);
    if (content) {
      // make transaction here
      const result = await tse.startAndFinishTransaction({clientId, transactionData: content.transactionData, processType: content.processType})
      await TseTransaction.create({
        TSE_TANR: result.transactionFinishInfo.transactionNumber,
        TSE_TA_START: moment.unix(result.transactionStartInfo.logTime).toDate(),
        TSE_TA_ENDE: moment.unix(result.transactionFinishInfo.logTime).toDate(),
        TSE_TA_VORGANGSART: content.processType,
        TSE_TA_SIGZ: result.transactionStartInfo.signatureCounter,
        TSE_TA_SIG: result.transactionFinishInfo.signature,
        TSE_TA_VORGANGSDATEN: content.transactionData,
        refExport: order._id
      });
    }
    // make beleg:
    const finishResult = await tse.startAndFinishTransaction({clientId, transactionData: orderContent.transactionData, processType: orderContent.processType});
    const transactionNumber = finishResult.transactionFinishInfo.transactionNumber;
    const startTime = finishResult.transactionStartInfo.logTime;
    const logTime = finishResult.transactionFinishInfo.logTime;
    const signature = finishResult.transactionFinishInfo.signature;

    await TseTransaction.create({
      TSE_TANR: finishResult.transactionFinishInfo.transactionNumber,
      TSE_TA_START: moment.unix(finishResult.transactionStartInfo.logTime).toDate(),
      TSE_TA_ENDE: moment.unix(finishResult.transactionFinishInfo.logTime).toDate(),
      TSE_TA_VORGANGSART: orderContent.processType,
      TSE_TA_SIGZ: finishResult.transactionStartInfo.signatureCounter,
      TSE_TA_SIG: finishResult.transactionFinishInfo.signature,
      TSE_TA_VORGANGSDATEN: orderContent.transactionData,
      refExport: order._id
    });
    //todo: pattern for transactionNumber

    //todo: gen qr code
    const qrCode = makeQr({
      processData: orderContent.transactionData,
      transactionNumber,
      signatureCounter: finishResult.transactionFinishInfo.signatureCounter,
      startTime: startTime,
      logTime,
      signature,
      sigAlg: tseConfig.signatureAlgorithm,
      publicKey: tseConfig.tsePublicKey
    });

    return qrCode;
  }

  const sendContentToTse = async (content, orderId) => {
    const result = await tse.startAndFinishTransaction({clientId, transactionData: content.transactionData, processType: content.processType})

    await TseTransaction.create({
      TSE_TANR: result.transactionFinishInfo.transactionNumber,
      TSE_TA_START: moment.unix(result.transactionStartInfo.logTime).toDate(),
      TSE_TA_ENDE: moment.unix(result.transactionFinishInfo.logTime).toDate(),
      TSE_TA_VORGANGSART: content.processType,
      TSE_TA_SIGZ: result.transactionStartInfo.signatureCounter,
      TSE_TA_SIG: result.transactionFinishInfo.signature,
      TSE_TA_VORGANGSDATEN: content.transactionData,
      order: orderId
    });
  }

  function filterPassthroughItem(order) {
    const _order = JsonFn.clone(order);
    _order.items.forEach(i => {
      if (i.tseMethod === 'apply:1' && i.quantity > 1) {
        i.quantity = 1;
      }
    })
    _order.items = order.items.filter(i => i.tseMethod === 'passthrough' || i.tseMethod === 'apply:1');
    return _order;
  }

  function filterJustSentItem(order) {
    const _order = JsonFn.clone(order);
    _order.items = _order.items.filter(i => !i.sent);
    return _order;
  }

  function subtractDate(date, tagesBegin) {
    const offset = moment(date).clone().utcOffset();
    return moment(date).clone().subtract(tagesBegin, 'hour').utcOffset(offset);
  }

  function getSumme(order, paymentOption) {
    if (!order.payment) {
      const vSum = orderUtil.calOrderVSum(order);
      return vSum;
    } else if (paymentOption) {
      let payment = _.find(order.payment, {type: paymentOption});
      return payment ? payment.value : 0;
    } else {
      return order.vSum;
    }
  }

  async function checkPassthroughTse(posSetting, order) {
    //return {passthroughTse: true};
    let passthroughTse = false;
    let passthroughTseComplete = false;
    const beginHour = parseInt(posSetting.generalSetting.beginHour.split(':')[0])
    const _date = subtractDate(new Date(), beginHour).startOf('d').toDate();
    let orderTseTemp = await OrderTseTemp.findOne({date: _date});
    if (!orderTseTemp) {
      orderTseTemp = await OrderTseTemp.create({
        date: _date,
      });
    }

    orderTseTemp.orderNumber = (orderTseTemp.orderNumber || 0) + 1;
    orderTseTemp.sum = (orderTseTemp.sum || 0) + getSumme(order);

    let passthroughSum = (orderTseTemp.passthroughSum || 0)/* + Export.getSumme(filterJustSentItem(order))*/;
    let procent = (passthroughSum / (orderTseTemp.sum || 0)) * 100;
    await OrderTseTemp.findOneAndUpdate({_id: orderTseTemp._id}, orderTseTemp, {new: true});

    //console.log('procent: ', procent);
    //passthroughTse = true;
    tseConfig;
    if (procent < tseConfig.procent && tseConfig.passthroughEnable) {
      passthroughTse = true;
      if (order.numberOfCustomers === 1) {
        orderTseTemp.onlyFoodHoldNumber = orderTseTemp.onlyFoodHoldNumber || 0;
        if (orderTseTemp.onlyFoodHoldNumber >= 1) {
          orderTseTemp.onlyFoodHoldNumber = 0;
          passthroughTseComplete = true;
          //console.log('passthrough complete !!!');
        } else {
          orderTseTemp.onlyFoodHoldNumber += 1;
        }
      }
      //if (!passthroughTseComplete) console.log('passthrough !!!');
    }

    const updateOrderTseTemp = async function (order) {
      orderTseTemp.passthroughSum = (orderTseTemp.passthroughSum || 0) + getSumme(filterPassthroughItem(order));
      //console.log('passthroughSum : ', orderTseTemp.passthroughSum);
      await OrderTseTemp.findOneAndUpdate({_id: orderTseTemp._id}, orderTseTemp, {new: true});
    }

    return {passthroughTse, orderTseTemp, passthroughTseComplete, updateOrderTseTemp};
  }

  async function updateOrder(order, update) {
    console.log('updateOrder ', order._id, ': ', update);
    await OrderCommit.addCommits([{
      type: 'order',
      action: 'update',
      where: JsonFn.stringify({
        _id: order._id,
      }),
      data: {
        table: order.table,
        allowMutateInactiveOrder: true
      },
      update: {
        method: 'findOneAndUpdate',
        query: JsonFn.stringify({
          $set: update
        })
      }
    }])
  }

  async function makeExecPostAsync(hook) {
    console.log('execPostAsync ', hook);
    await OrderCommit.addCommits([{
      type: 'order',
      action: 'execPostAsync',
      data: {
        hook
      }
    }])
  }

  async function updateItem(order, itemId, update) {
    console.log('updateItem ', itemId, ': ', update);
    await OrderCommit.addCommits([{
      type: 'order',
      action: 'update',
      where: JsonFn.stringify({
        _id: order._id,
        'items._id': itemId
      }),
      data: {
        table: order.table,
        allowMutateInactiveOrder: true
      },
      update: {
        method: 'findOneAndUpdate',
        query: JsonFn.stringify({
          $set: update
        })
      }
    }])
  }

  async function initTse() {
    tse = new TseClient();
    //add cloud
    //add bridge
    if (process.env.NO_SETUP_TSE !== 'true') {
      /*await tse.init();
      await tse.factoryReset();*/
      try {
        await tse.fastInit({
          credentialSeed: 'SwissbitSwissbit',
          adminPuk: '123456',
          adminPin: '12345',
          timeAdminPin: '12345',
          clientId,
        });
        console.log('Tse init successful !!!')
        cms.emit('tseReady', {tseReady: true});
        tseReady = true;
      } catch (e) {
        console.warn(e);
        cms.emit('tseReady', {tseReady: false});
      }
    } else {
      await tse.loginAdminUser('12345');
      await tse.updateTime();
      cms.emit('tseReady', {tseReady: true});
      tseReady = true;
    }

    await initFirstTimeTse();

    async function initFirstTimeTse() {
      let tseConfig = await TseConfig.findOne({});
      if (!tseConfig) tseConfig = {};

      tseConfig.inited = true;
      tseConfig.tsePublicKey = await tse.getTsePublicKey();
      tseConfig.signatureAlgorithm = await tse.getTseSignatureAlgorithm();
      tseConfig.serialNumber = await tse.getTseSerialNumber();
      tseConfig.certificateExpirationDate = await tse.getTseCertificateExpDate();
      tseConfig.tsePublicKey = await tse.getTsePublicKey();
      await TseConfig.updateOne({}, tseConfig, {upsert: true});

      let certificates = await tse.getLogMessageCertificate();
      certificates = certificates.replace(/-----END CERTIFICATE-----\n/g, '');
      certificates = certificates.replace(/-----END CERTIFICATE-----/g, '');
      certificates = certificates.split('-----BEGIN CERTIFICATE-----\n');
      certificates = certificates.filter(c => !_.isEmpty(c));
      //certificate

      await TseCertificate.remove({});
      await TseCertificate.create({certificates});
    }
  }
}
