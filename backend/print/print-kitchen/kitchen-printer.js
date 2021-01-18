const _ = require('lodash')
const {getEscPrinter, getGroupPrinterInfo} = require('../print-utils/print-utils')
const PureImagePrinter = require('@gigasource/pureimage-printer-renderer');
const virtualPrinter = require('../print-utils/virtual-printer')

module.exports = async function (cms) {
  cms.on('run:print', async function (commit) {
    if (commit.printType === 'kitchenAdd') {
      await printKitchen({
        order: commit.order
      })
    } else if (commit.printType === 'kitchenCancel') {
      await printKitchenCancel({
        order: commit.order
      })
    }
  })
}

function createPureImagePrinter(escPrinter) {
  return new PureImagePrinter(560, {
    printFunctions: {
      printPng: escPrinter.printPng.bind(escPrinter),
      print: escPrinter.print.bind(escPrinter),
    }
  });
}

async function printKitchen({order, device}, callback = () => null) {
  let results = []

  try {
    const groupPrinters = await getGroupPrinterInfo(cms, device, 'kitchen');
    const printerInfos = groupPrinters.map(e => {
      return {name: e.name, ...e.printers}
    })
    const receipts = getReceiptsFromOrder(order);

    const posSetting = await cms.getModel('PosSetting').findOne({}, {generalSetting: 1})
    const {useVirtualPrinter} = posSetting.generalSetting

    for (const printerInfo of printerInfos) {
      const {escPOS} = printerInfo
      const receiptsForPrinter = await getReceiptsForPrinter(receipts, printerInfo);
      const printData = await getPrintData(receiptsForPrinter, order, printerInfo);

      if (useVirtualPrinter)
        await cms.emit(virtualPrinter.cmsHookEvents.PRINT_VIRTUAL_KITCHEN, {
          printCanvas,
          printData,
          printerInfo
        })

      const escPrinter = await getEscPrinter(printerInfo);
      if (escPOS) {
        results.push(await printEscPos(escPrinter, printData, printerInfo));
      } else {
        const pureImagePrinter = createPureImagePrinter(escPrinter);
        results.push(await printCanvas(pureImagePrinter, printData, printerInfo));
        await pureImagePrinter.cleanup();
      }
    }

    const printResults = {success: true, results};
    callback(printResults);
    return printResults
  } catch (e) {
    console.error(e);
    callbackWithError(callback, e);
    return {
      success: false,
      message: e.toString()
    }
  }
}

async function printKitchenCancel({order, device}, callback = () => null) {
  let results = []

  try {
    const groupPrinters = await getGroupPrinterInfo(cms, device, 'kitchen');
    const printerInfos = groupPrinters.map(e => {
      return {name: e.name, ...e.printers}
    })
    const receipts = getReceiptsFromOrder(order);

    const posSetting = await cms.getModel('PosSetting').findOne({}, {generalSetting: 1})
    const {useVirtualPrinter} = posSetting.generalSetting

    for (const printerInfo of printerInfos) {
      const {escPOS} = printerInfo
      const receiptsForPrinter = await getReceiptsForPrinter(receipts, printerInfo);
      const printData = await getPrintData(receiptsForPrinter, order, printerInfo);

      if (useVirtualPrinter)
        await cms.emit(virtualPrinter.cmsHookEvents.PRINT_VIRTUAL_KITCHEN, {
          printCanvas,
          printData,
          printerInfo
        })

      const escPrinter = await getEscPrinter(printerInfo);
      if (escPOS) {
        results.push(await printEscPos(escPrinter, printData, printerInfo, true));
      } else {
        results.push(await printCanvas(createPureImagePrinter(escPrinter), printData, printerInfo, true));
      }
    }

    const printResults = {success: true, results};
    callback(printResults);
    return printResults
  } catch (e) {
    console.error(e);
    callbackWithError(callback, e);
    return {
      success: false,
      message: e.toString()
    }
  }
}

function getReceiptsFromOrder(order) {
  return _.reduce(order.items, function (obj, item) {
    function addItem(i) {
      if (!item.groupPrinter) return;

      const groupPrinter = i === 1 ? item.groupPrinter : item.groupPrinter2;
      if (!groupPrinter) return;

      const receiptKey = JSON.stringify({
        groupPrinter: groupPrinter,
        course: item.course,
        takeout: item.takeout
      })

      if (!obj[receiptKey]) obj[receiptKey] = [];

      if (!_.find(item.modifiers, m => m.groupPrinter && m.groupPrinter !== groupPrinter)) {
        obj[receiptKey].push(item);
      } else {
        // case modifiers have another groupPrinter
        const modifierGroup = _.groupBy(item.modifiers, i => i.groupPrinter ? i.groupPrinter : groupPrinter);
        for (let _groupPrinter in modifierGroup) {
          const _item = {
            ...item,
            groupPrinter: _groupPrinter,
            modifiers: modifierGroup[_groupPrinter]
          }

          const _receiptKey = JSON.stringify({
            groupPrinter: _groupPrinter,
            course: item.course,
            takeout: item.takeout
          })

          if (!obj[_receiptKey]) obj[_receiptKey] = [];

          obj[_receiptKey].push(_item);
        }
      }
    }

    [1, 2].forEach(addItem);
    return obj;
  }, {});
}

function getReceiptsForPrinter(receipts, printer) {
  return Object.keys(receipts)
    .filter(key => {
      const {groupPrinter} = JSON.parse(key);
      return printer.name === groupPrinter;
    })
    .map(key => receipts[key]);
}

async function getPrintData(receipts, order, printer) {
  return _.map(receipts, (value, key) => {
    const {course, takeout} = JSON.parse(key)

    return {
      items: value,
      table: order.table,
      printer: printer.name,
      user: _.last(order.user) && _.last(order.user).name,
      time: dayjs(order.date).format('HH:mm'),
      fontSize: printer.fontSize,
      marginTop: printer.marginTop,
      isKitchenReceipt: true,
      course,
      takeout
    };
  });
}

async function printEscPos(printer, printData, printerInfo, cancel = false) {
  const results = [];

  await Promise.all(printData.map(props => {
    return new Promise(async resolve => {
      const {items, table, user, time, isKitchenReceipt, course, takeout} = props;

      function convertMoney(value) {
        return !isNaN(value) ? value.toFixed(2) : value
      }

      if (cancel) {
        printer.alignCenter()
        printer.setTextQuadArea()
        printer.bold(true);
        printer.println('** CANCEL **')
        printer.newLine();
      }

      printer.alignLeft();
      printer.setTextQuadArea();
      printer.bold(true);
      if (takeout) printer.println('TAKE AWAY');
      if (table) printer.println(`Table: ${table}`);

      printer.alignRight();
      printer.setTextNormal();
      printer.bold(true);
      printer.println(time);
      printer.drawLine();

      printer.alignLeft();
      items.forEach((item, index) => {
        printer.bold(false);
        printer.setTextQuadArea();
        const quantityColumnWidth = item.quantity.toString().length * 0.05;
        const itemsColumnWidth = 0.92 - item.quantity.toString().length * 0.05;

        if (cancel) {
          printer.tableCustom([
            {text: item.quantity, align: 'LEFT', width: quantityColumnWidth, bold: true},
            {text: 'x', align: 'LEFT', width: 0.05, bold: true},
            {text: item.name, align: 'LEFT', width: itemsColumnWidth},
          ], {textDoubleWith: true});
        } else {
          printer.tableCustom([
            {text: item.quantity, align: 'LEFT', width: quantityColumnWidth, bold: true},
            {text: 'x', align: 'LEFT', width: 0.05, bold: true},
            {text: `${item.id}. ${item.name}`, align: 'LEFT', width: itemsColumnWidth},
          ], {textDoubleWith: true});
        }

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
      if (course && course > 1) printer.println(`Course ${course}`);
      if (isKitchenReceipt) printer.println(`${printerInfo.name} Printer${user ? ` - ${user}` : ''}`);
      else printer.println('Entire Receipt');

      await printer.print();

      results.push({
        items: props.items,
        printer: printerInfo,
        name: printerInfo.name,
      });
      resolve();
    });
  }));

  return results;
}

async function printCanvas(canvasPrinter, printData, printerInfo, cancel = false) {
  const results = [];
  await Promise.all(printData.map(props => {
    return new Promise(async resolve => {
      const {items, table, user, time, isKitchenReceipt, course, takeout} = props;

      function convertMoney(value) {
        return !isNaN(value) ? value.toFixed(2) : value
      }

      if (cancel) {
        await canvasPrinter.alignCenter()
        await canvasPrinter.setTextQuadArea()
        await canvasPrinter.bold(true);
        await canvasPrinter.println('** CANCEL **')
        await canvasPrinter.newLine();
      }

      await canvasPrinter.alignLeft();
      await canvasPrinter.setTextQuadArea();
      await canvasPrinter.bold(true);
      if (takeout) await canvasPrinter.println('TAKE AWAY');
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
        await canvasPrinter.setTextQuadArea();
        const quantityColumnWidth = item.quantity.toString().length * 0.05;
        const itemsColumnWidth = 0.92 - item.quantity.toString().length * 0.05;

        if (cancel) {
          await canvasPrinter.tableCustom([
            {text: item.quantity, align: 'LEFT', width: quantityColumnWidth, bold: true},
            {text: 'x', align: 'LEFT', width: 0.05, bold: true},
            {text: item.name, align: 'LEFT', width: itemsColumnWidth},
          ], {textDoubleWith: true});
        } else {
          await canvasPrinter.tableCustom([
            {text: item.quantity, align: 'LEFT', width: quantityColumnWidth, bold: true},
            {text: 'x', align: 'LEFT', width: 0.05, bold: true},
            {text: `${item.id}. ${item.name}`, align: 'LEFT', width: itemsColumnWidth},
          ], {textDoubleWith: true});
        }

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
      if (course && course > 1) await canvasPrinter.println(`Course ${course}`);
      if (isKitchenReceipt) await canvasPrinter.println(`${printerInfo.name} Printer${user ? ` - ${user}` : ''}`);
      else await canvasPrinter.println('Entire Receipt');

      await canvasPrinter.print();

      results.push({
        items: props.items,
        printer: printerInfo,
        name: printerInfo.name,
      });
      resolve();
    });
  }));

  return results;
}

function callbackWithError(callback, error) {
  callback({
    success: false,
    message: error.toString()
  })
}

module.exports.printKitchen = printKitchen
module.exports.printKitchenCancel = printKitchenCancel
