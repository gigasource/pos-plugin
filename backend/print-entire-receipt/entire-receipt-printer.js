const Vue = require('vue');
const _ = require('lodash');
const {renderer, print, groupArticles, getEscPrinter} = require('../print-utils/print-utils');
const PureImagePrinter = require('@gigasource/pureimage-printer-renderer');
const virtualPrinter = require('../print-utils/virtual-printer');

function createPureImagePrinter(escPrinter) {
  return new PureImagePrinter(560, {
    printFunctions: {
      printPng: escPrinter.printPng.bind(escPrinter),
      print: escPrinter.print.bind(escPrinter),
    }
  });
}

module.exports = async function (cms) {
  cms.socket.on('connect', socket => {
    socket.on('printEntireReceipt', async function ({order, device}, callback) {
      try {
        const results = await printHandler(order, device)
        callback({success: true, results})
      } catch (e) {
        callbackWithError(callback, e)
      }
    })
  })
}

module.exports.printEntireReceiptHandler = printHandler

async function printHandler(order, device) {
  // get device printers
  const {printerGeneralSetting, generalSetting} = await cms.getModel('PosSetting').findOne()
  const groupPrinters = printerGeneralSetting.useMultiPrinterForEntirePrinter
    ? await cms.getModel('GroupPrinter').aggregate([
      {$unwind: {path: '$printers'}},
      {$match: {'printers.hardwares': device, 'type': 'entire'}}
    ])
    : await cms.getModel('GroupPrinter').aggregate([
      {$unwind: {path: '$printers'}},
      {$match: {type: 'entire'}}
    ])

  const _groupPrinters = _.reduce(groupPrinters, (acc, printer) => {
    const {includes, groupArticles: _groupArticles, oneReceiptForOneArticle} = printer.printers
    let items = order.items
    if (_groupArticles) items = groupArticles(items)

    items = _.filter(items, function ({groupPrinter, groupPrinter2}) {
      if (!groupPrinter) return
      if (!includes.length) return true
      return includes.includes(groupPrinter) || printer.printers.includes.includes(groupPrinter2)
    });

    if (oneReceiptForOneArticle) {
      _.forEach(items, function (article) {
        acc.push({...printer, items: [article]})
      })
    } else {
      acc.push({...printer, items})
    }

    return acc
  }, [])

  const {useVirtualPrinter} = generalSetting

  let results = []
  //render report
  await Promise.all(_.map(_groupPrinters, printer => {
    return new Promise(async resolve => {
      const props = {
        items: printer.items,
        table: order.table,
        // printer: printer.name, // not needed, these 2 depends on isKitchenReceipt (refer to Kitchen.vue)
        // user: _.last(order.user).name,
        time: dayjs(order.date).format('HH:mm'),
        fontSize: printer.printers.fontSize,
        marginTop: printer.printers.marginTop
      }
      const printerInfo = printer.printers

      if (useVirtualPrinter)
        await cms.execPostAsync(virtualPrinter.cmsHookEvents.PRINT_VIRTUAL_ENTIRE_RECEIPT, null, [{
          printCanvas,
          props,
          printerInfo
        }]);

      const {escPOS} = printerInfo;
      const escPrinter = await getEscPrinter(printerInfo);
      if (escPOS) {
        results.push(await printEsc(escPrinter, props, printerInfo));
      } else {
        const pureImagePrinter = createPureImagePrinter(escPrinter);
        results.push(await printCanvas(pureImagePrinter, props, printerInfo));
        await pureImagePrinter.cleanup();
      }

      resolve();
    })

  }))

  return results
}

async function printEsc(printer, props, printerInfo) {
  const {items, table, time} = props;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  printer.alignLeft();
  printer.setTextQuadArea();
  printer.bold(true);
  if (table) printer.println(`Table: ${table}`);

  printer.alignRight();
  printer.setTextNormal();
  printer.bold(true);
  printer.println(time);
  printer.drawLine();

  printer.alignLeft();
  items.forEach((item, index) => {
    printer.bold(false);
    const quantityColumnWidth = item.quantity.toString().length * 0.05;
    const itemsColumnWidth = 0.92 - item.quantity.toString().length * 0.05;

    printer.setTextQuadArea();
    printer.tableCustom([
      {text: item.quantity, align: 'LEFT', width: quantityColumnWidth, bold: true},
      {text: 'x', align: 'LEFT', width: 0.05, bold: true},
      {text: `${item.id}. ${item.name}`, align: 'LEFT', width: itemsColumnWidth},
    ], {textDoubleWith: true});

    if (item.modifiers) {
      printer.setTextDoubleWidth();

      item.modifiers.forEach(mod => {
        let modifierText = `* ${mod.name}`
        if (mod.price) modifierText += ` ${convertMoney(mod.price)}`;

        printer.tableCustom([
          {text: '', align: 'LEFT', width: quantityColumnWidth},
          {text: '', align: 'LEFT', width: 0.05},
          {text: modifierText, align: 'LEFT', width: itemsColumnWidth},
        ], {textDoubleWith: true});
      });
    }

    if (index < items.length - 1) {
      printer.setTextNormal();
      if (item.separate) {
        printer.println('************************');
      } else {
        printer.newLine();
        printer.newLine();
      }
    }
  });

  printer.setTextNormal();
  printer.bold(true);
  printer.drawLine();

  printer.setTextNormal();
  printer.bold(true);
  printer.alignCenter();
  printer.println('Entire Receipt');

  await printer.print();

  return {
    items: props.items,
    printer: printerInfo,
    name: printerInfo.name,
  }
}

async function printCanvas(canvasPrinter, props, printerInfo) {
  const {items, table, time} = props;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  await canvasPrinter.alignLeft();
  await canvasPrinter.setTextQuadArea();
  await canvasPrinter.bold(true);
  if (table) await canvasPrinter.println(`Table: ${table}`);

  await canvasPrinter.alignRight();
  await canvasPrinter.setTextNormal();
  await canvasPrinter.bold(true);
  await canvasPrinter.println(time);
  await canvasPrinter.drawLine();

  await canvasPrinter.alignLeft();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    await canvasPrinter.bold(false);
    const quantityColumnWidth = item.quantity.toString().length * 0.05;
    const itemsColumnWidth = 0.92 - item.quantity.toString().length * 0.05;

    await canvasPrinter.setTextQuadArea();
    await canvasPrinter.tableCustom([
      {text: item.quantity, align: 'LEFT', width: quantityColumnWidth, bold: true},
      {text: 'x', align: 'LEFT', width: 0.05, bold: true},
      {text: `${item.id}. ${item.name}`, align: 'LEFT', width: itemsColumnWidth},
    ], {textDoubleWith: true});

    if (item.modifiers) {
      await canvasPrinter.setTextDoubleWidth();

      for(let j = 0; j < item.modifiers.length; j++) {
        const mod = item.modifiers[j];

        let modifierText = `* ${mod.name}`
        if (mod.price) modifierText += ` ${convertMoney(mod.price)}`;

        await canvasPrinter.tableCustom([
          {text: '', align: 'LEFT', width: quantityColumnWidth},
          {text: '', align: 'LEFT', width: 0.05},
          {text: modifierText, align: 'LEFT', width: itemsColumnWidth},
        ], {textDoubleWith: true});
      }
    }

    if (i < items.length - 1) {
      await canvasPrinter.setTextNormal();
      if (item.separate) {
        await canvasPrinter.println('************************');
      } else {
        await canvasPrinter.newLine();
        await canvasPrinter.newLine();
      }
    }
  }

  await canvasPrinter.setTextNormal();
  await canvasPrinter.bold(true);
  await canvasPrinter.drawLine();

  await canvasPrinter.setTextNormal();
  await canvasPrinter.bold(true);
  await canvasPrinter.alignCenter();
  await canvasPrinter.println('Entire Receipt');

  await canvasPrinter.print();

  return {
    items: props.items,
    printer: printerInfo,
    name: printerInfo.name,
  }
}

function callbackWithError(callback, error) {
  callback({
    success: false,
    message: error.toString()
  })
}
