const { convertHtmlToPng } = require('../print-utils/print-utils');
const vueSsrRenderer = require('../print-utils/vue-ssr-renderer');
const Vue = require('vue');
const dayjs = require('dayjs');
const fs = require('fs')

function convertMoney(value) {
  return !isNaN(value) ? value.toFixed(2) : value
}

function getShippingFee({ discounts, shippingFee }) {
  if (!discounts || !discounts.length) return shippingFee

  const freeShipping = discounts.find(item => item.type === 'freeShipping');
  return freeShipping ? freeShipping.value : shippingFee;
}

function getPayment({ payment }) {
  const { type } = payment[0];
  return type.charAt(0).toUpperCase() + type.slice(1) //capitalize
}

async function makePrintData(cms, { orderId }, locale) {
  const order = await cms.getModel('Order').findById(orderId);

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
    discounts
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
    discounts,
    payment: getPayment(order)
  };
}

async function printEscPos(escPrinter, printData, groupPrinter, printerType) {
  let {
    orderNumber,
    customerName,
    customerPhone,
    customerAddress,
    customerZipCode,
    customerCompany,
    note,
    items,
    shippingFee,
    orderSum,
    date,
    locale,
    deliveryTime,
    type,
    discounts,
    payment
  } = printData;

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

  escPrinter.drawLine()
  escPrinter.bold(true)

  const itemColumnWidth = printerType === 'escpos' ? 0.4 : 0.44;
  escPrinter.tableCustom([
    { text: locale.printing.item, align: 'LEFT', width: itemColumnWidth },
    { text: locale.printing.quantity, align: 'RIGHT', width: 0.12 },
    { text: locale.printing.price, align: 'RIGHT', width: 0.22 },
    { text: locale.printing.total, align: 'RIGHT', width: 0.22 },
  ])
  escPrinter.drawLine()

  escPrinter.setTextNormal()
  items.forEach(item => {
    escPrinter.tableCustom([
      { text: (item.id && `${item.id}.`) + item.name, align: 'LEFT', width: itemColumnWidth },
      { text: `${item.quantity}`, align: 'RIGHT', width: 0.12 },
      { text: `${convertMoney(item.originalPrice || item.price)}`, align: 'RIGHT', width: 0.22 },
      { text: `${convertMoney((item.originalPrice || item.price) * item.quantity)}`, align: 'RIGHT', width: 0.22 },
    ])

    if (item.modifiers && item.modifiers.length) {
      item.modifiers.forEach(mod => {
        const modifierText = `* ${mod.name}`

        escPrinter.tableCustom([
          { text: modifierText, align: 'LEFT', width: itemColumnWidth },
          { text: `${mod.quantity * item.quantity}`, align: 'RIGHT', width: 0.12 },
          { text: `${convertMoney(mod.price)}`, align: 'RIGHT', width: 0.22 },
          { text: `${convertMoney((mod.price) * mod.quantity * item.quantity)}`, align: 'RIGHT', width: 0.22 },
        ])
      })
    }
  })
  escPrinter.drawLine()
  type === 'delivery' && escPrinter.leftRight(locale.printing.shippingFee, convertMoney(getShippingFee(printData)))
  discounts.forEach(item => {
    escPrinter.leftRight(item.coupon ? `Coupon (${item.coupon})` : item.name, `-${convertMoney(item.value)}`)
  })
  escPrinter.bold(true)
  escPrinter.leftRight(locale.printing.total, `${locale.printing.currency} ${convertMoney(orderSum)}`)
  escPrinter.leftRight('Payment', payment)

  if (payment !== 'Cash') {
    escPrinter.newLine()
    escPrinter.alignCenter()
    escPrinter.setTextDoubleHeight()
    escPrinter.bold(true)
    escPrinter.println(locale.printing.paid)
  }

  // escPrinter.newLine()
  // escPrinter.alignCenter()
  // escPrinter.setTextNormal()
  // escPrinter.println(date)

  await escPrinter.print()
}

async function printCanvas(printer, printData, groupPrinter, printerType) {
  let {
    orderNumber,
    customerName,
    customerPhone,
    customerAddress,
    customerZipCode,
    customerCompany,
    note,
    items,
    shippingFee,
    orderSum,
    date,
    locale,
    deliveryTime,
    type,
    discounts,
    payment
  } = printData;

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

  printer.drawLine()
  printer.bold(true)

  const itemColumnWidth = printerType === 'escpos' ? 0.4 : 0.44;
  printer.tableCustom([
    { text: locale.printing.item, align: 'LEFT', width: itemColumnWidth },
    { text: locale.printing.quantity, align: 'RIGHT', width: 0.12 },
    { text: locale.printing.price, align: 'RIGHT', width: 0.22 },
    { text: locale.printing.total, align: 'RIGHT', width: 0.22 },
  ])
  printer.drawLine()

  printer.setTextNormal()
  items.forEach(item => {
    printer.tableCustom([
      { text: (item.id && `${item.id}.`) + item.name, align: 'LEFT', width: itemColumnWidth },
      { text: `${item.quantity}`, align: 'RIGHT', width: 0.12 },
      { text: `${convertMoney(item.originalPrice || item.price)}`, align: 'RIGHT', width: 0.22 },
      { text: `${convertMoney((item.originalPrice || item.price) * item.quantity)}`, align: 'RIGHT', width: 0.22 },
    ])

    if (item.modifiers && item.modifiers.length) {
      item.modifiers.forEach(mod => {
        const modifierText = `* ${mod.name}`

        printer.tableCustom([
          { text: modifierText, align: 'LEFT', width: itemColumnWidth },
          { text: `${mod.quantity * item.quantity}`, align: 'RIGHT', width: 0.12 },
          { text: `${convertMoney(mod.price)}`, align: 'RIGHT', width: 0.22 },
          { text: `${convertMoney((mod.price) * mod.quantity * item.quantity)}`, align: 'RIGHT', width: 0.22 },
        ])
      })
    }
  })
  printer.drawLine()
  type === 'delivery' && printer.leftRight(locale.printing.shippingFee, convertMoney(getShippingFee(printData)))
  discounts.forEach(item => {
    printer.leftRight(item.coupon ? `Coupon (${item.coupon})` : item.name, `-${convertMoney(item.value)}`)
  })
  printer.bold(true)
  printer.leftRight(locale.printing.total, `${locale.printing.currency} ${convertMoney(orderSum)}`)
  printer.leftRight('Payment', payment)

  if (payment !== 'Cash') {
    printer.newLine()
    printer.alignCenter()
    printer.setTextDoubleHeight()
    printer.bold(true)
    printer.println(locale.printing.paid)
  }

  // printer.newLine()
  // printer.alignCenter()
  // printer.setTextNormal()
  // printer.println(date)

  await printer.print()
}

async function printSsr(printer, printData) {
  const OrderDelivery = require('../../dist/OrderDelivery.vue');

  const component = new Vue({
    components: { OrderDelivery },
    render(h) {
      return h('OrderDelivery', {
        props: {
          ...printData,
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
