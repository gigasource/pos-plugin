const { convertHtmlToPng } = require('../print-utils/print-utils');
const vueSsrRenderer = require('../print-utils/vue-ssr-renderer');
const Vue = require('vue');
const dayjs = require('dayjs')

function convertMoney(value) {
  return !isNaN(value) ? value.toFixed(2) : value
}

async function makePrintData(cms, { orderId }, locale) {
  const order = await cms.getModel('Order').findById(orderId).lean();

  if (!order) return null;

  const {
    customer: { name, phone, address, zipCode, company },
    note,
    items,
    shippingFee,
    vSum: orderSum,
    date,
    deliveryTime,
    type,
    forwardedStore
  } = order;


  return {
    orderNumber: order.dailyId ? order.dailyId : order.id,
    customerName: name,
    customerPhone: phone,
    customerAddress: address,
    customerZipCode: zipCode,
    customerCompany: company,
    note,
    items,
    shippingFee,
    orderSum,
    date: dayjs(date).format(locale.printing.dateFormat),
    deliveryTime,
    locale,
    type,
    forwardedStore
  };
}

async function printEscPos(escPrinter, printData, groupPrinter, printerType) {
  const {
    orderNumber,
    customerName,
    customerPhone,
    customerAddress,
    customerZipCode,
    customerCompany,
    note,
    items,
    date,
    locale,
    deliveryTime,
    type,
    forwardedStore
  } = printData;

  let filteredItems = items.filter(item => item.groupPrinter === groupPrinter || item.groupPrinter2 === groupPrinter)
  if (!filteredItems.length) return

  const tableWidthPercentTotal = printerType === 'escpos' ? 0.97 : 1;

  escPrinter.setTextDoubleHeight();
  escPrinter.bold(true);

  const orderType = type === 'delivery' ? locale.printing.delivery : locale.printing.pickup;
  if (deliveryTime) {
    printerType === 'escpos'
      ? escPrinter.leftRight(`${orderType} #${orderNumber}`, deliveryTime)
      : escPrinter.tableCustom([
        {text: `${orderType} #${orderNumber}`, align: 'LEFT', width: 0.7, bold: true},
        {text: deliveryTime, align: 'RIGHT', width: 0.3, bold: true},
      ]);
  } else {
    escPrinter.alignCenter();
    escPrinter.println(`${orderType} #${orderNumber}`);
  }

  if (customerCompany) {
    escPrinter.invert(true);
    escPrinter.println(`${locale.printing.company}`);
    escPrinter.invert(false);
  }

  escPrinter.newLine()

  escPrinter.alignLeft()
  escPrinter.setTextNormal()
  escPrinter.println(customerName)
  customerCompany && escPrinter.println(customerCompany)
  customerAddress && escPrinter.println(customerAddress)
  customerZipCode && escPrinter.println(customerZipCode)
  escPrinter.println(customerPhone)
  note && escPrinter.println(note)
  escPrinter.newLine()

  escPrinter.bold(true);
  escPrinter.drawLine()
  filteredItems.forEach((item, index) => {
    escPrinter.bold(false);
    const quantityColumnWidth = item.quantity.toString().length * 0.05;
    const itemsColumnWidth = tableWidthPercentTotal - 0.05 - item.quantity.toString().length * 0.05;

    escPrinter.setTextQuadArea();
    escPrinter.tableCustom([
      { text: item.quantity, align: 'LEFT', width: quantityColumnWidth, bold: true },
      { text: 'x', align: 'LEFT', width: 0.05, bold: true },
      { text: (item.id && `${item.id}.`) + item.name, align: 'LEFT', width: itemsColumnWidth },
    ], { textDoubleWith: true });

    if (item.note) {
      escPrinter.setTextDoubleWidth();
      escPrinter.tableCustom([
        { text: '', align: 'LEFT', width: quantityColumnWidth },
        { text: '', align: 'LEFT', width: 0.05 },
        { text: `* ${item.note}`, align: 'LEFT', width: itemsColumnWidth },
      ], { textDoubleWith: true });
    }

    if (item.modifiers) {
      escPrinter.setTextDoubleWidth();

      item.modifiers.forEach(mod => {
        let modifierText = `* ${mod.name} ${convertMoney(mod.price)} ${locale.printing.currency}`

        escPrinter.tableCustom([
          { text: '', align: 'LEFT', width: quantityColumnWidth },
          { text: '', align: 'LEFT', width: 0.05 },
          { text: modifierText, align: 'LEFT', width: itemsColumnWidth },
        ], { textDoubleWith: true });
      });
    }

    if (index < filteredItems.length - 1) {
      escPrinter.setTextNormal();
      escPrinter.newLine();
      escPrinter.newLine();
    }
  })
  escPrinter.setTextNormal()
  escPrinter.bold(true);
  escPrinter.drawLine()

  if (forwardedStore) {
    escPrinter.setTextNormal();
    escPrinter.setTextDoubleHeight();
    escPrinter.bold(true);
    escPrinter.alignCenter();
    escPrinter.println(forwardedStore)
  }
  // escPrinter.newLine()
  // escPrinter.alignCenter()
  // escPrinter.setTextNormal()
  // escPrinter.println(date)

  await escPrinter.print()
}

async function printCanvas(printer, printData, groupPrinter, printerType) {
  const {
    orderNumber,
    customerName,
    customerPhone,
    customerAddress,
    customerZipCode,
    customerCompany,
    note,
    items,
    date,
    locale,
    deliveryTime,
    type,
    forwardedStore
  } = printData;

  let filteredItems = items.filter(item => item.groupPrinter === groupPrinter || item.groupPrinter2 === groupPrinter)
  if (!filteredItems.length) return

  const tableWidthPercentTotal = printerType === 'escpos' ? 0.97 : 1;

  printer.setTextDoubleHeight();
  printer.bold(true);

  const orderType = type === 'delivery' ? locale.printing.delivery : locale.printing.pickup;
  if (deliveryTime) {
    printerType === 'escpos'
        ? printer.leftRight(`${orderType} #${orderNumber}`, deliveryTime)
        : printer.tableCustom([
          {text: `${orderType} #${orderNumber}`, align: 'LEFT', width: 0.7, bold: true},
          {text: deliveryTime, align: 'RIGHT', width: 0.3, bold: true},
        ]);
  } else {
    printer.alignCenter();
    printer.println(`${orderType} #${orderNumber}`);
  }

  if (customerCompany) {
    printer.invert(true);
    printer.println(`${locale.printing.company}`);
    printer.invert(false);
  }

  printer.newLine()

  printer.alignLeft()
  printer.setTextNormal()
  printer.println(customerName)
  customerCompany && printer.println(customerCompany)
  customerAddress && printer.println(customerAddress)
  customerZipCode && printer.println(customerZipCode)
  printer.println(customerPhone)
  note && printer.println(note)
  printer.newLine()

  printer.bold(true);
  printer.drawLine()
  filteredItems.forEach((item, index) => {
    printer.bold(false);
    const quantityColumnWidth = item.quantity.toString().length * 0.05;
    const itemsColumnWidth = tableWidthPercentTotal - 0.05 - item.quantity.toString().length * 0.05;

    printer.setTextQuadArea();
    printer.tableCustom([
      { text: item.quantity, align: 'LEFT', width: quantityColumnWidth, bold: true },
      { text: 'x', align: 'LEFT', width: 0.05, bold: true },
      { text: (item.id && `${item.id}.`) + item.name, align: 'LEFT', width: itemsColumnWidth },
    ], { textDoubleWith: true });

    if (item.note) {
      printer.setTextDoubleWidth();
      printer.tableCustom([
        { text: '', align: 'LEFT', width: quantityColumnWidth },
        { text: '', align: 'LEFT', width: 0.05 },
        { text: `* ${item.note}`, align: 'LEFT', width: itemsColumnWidth },
      ], { textDoubleWith: true });
    }

    if (item.modifiers) {
      printer.setTextDoubleWidth();

      item.modifiers.forEach(mod => {
        let modifierText = `* ${mod.name} ${convertMoney(mod.price)} ${locale.printing.currency}`

        printer.tableCustom([
          { text: '', align: 'LEFT', width: quantityColumnWidth },
          { text: '', align: 'LEFT', width: 0.05 },
          { text: modifierText, align: 'LEFT', width: itemsColumnWidth },
        ], { textDoubleWith: true });
      });
    }

    if (index < filteredItems.length - 1) {
      printer.setTextNormal();
      printer.newLine();
      printer.newLine();
    }
  })
  printer.setTextNormal()
  printer.bold(true);
  printer.drawLine()

  if (forwardedStore) {
    printer.setTextNormal();
    printer.setTextDoubleHeight();
    printer.bold(true);
    printer.alignCenter();
    printer.println(forwardedStore)
  }
  // printer.newLine()
  // printer.alignCenter()
  // printer.setTextNormal()
  // printer.println(date)

  await printer.print()
}

async function printSsr(printer, printData, groupPrinter) {
  const KitchenDelivery = require('../../dist/KitchenDelivery.vue');

  let filteredItems = printData.items.filter(item => item.groupPrinter === groupPrinter || item.groupPrinter2 === groupPrinter)
  if (!filteredItems.length) return

  const component = new Vue({
    components: { KitchenDelivery },
    render(h) {
      return h('KitchenDelivery', {
        props: {
          ...Object.assign({}, printData, {
            items: filteredItems
          }),
          fontSize: printer.fontSize,
          marginTop: printer.marginTop
        }
      })
    }
  })

  vueSsrRenderer.renderToString(component, {}, async (err, html) => {
    if (err) throw err

    const reportPng = await convertHtmlToPng(html)
    printer.printPng(reportPng)
    await printer.print()
  })
}

module.exports = {
  makePrintData,
  printEscPos,
  printSsr,
  printCanvas
}
