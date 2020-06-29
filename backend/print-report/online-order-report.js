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
    orderNumber: order.id,
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

async function printEscPos(escPrinter, printData) {
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
    escPrinter.leftRight(`${orderType} #${orderNumber}`, deliveryTime);
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
  escPrinter.tableCustom([
    { text: locale.printing.item, align: 'LEFT', width: 0.4 },
    { text: locale.printing.quantity, align: 'RIGHT', width: 0.12 },
    { text: locale.printing.price, align: 'RIGHT', width: 0.22 },
    { text: locale.printing.total, align: 'RIGHT', width: 0.22 },
  ])
  escPrinter.drawLine()

  escPrinter.setTextNormal()
  items.forEach(item => {
    escPrinter.tableCustom([
      { text: (item.id && `${item.id}.`) + item.name, align: 'LEFT', width: 0.4 },
      { text: `${item.quantity}`, align: 'RIGHT', width: 0.12 },
      { text: `${convertMoney(item.originalPrice || item.price)}`, align: 'RIGHT', width: 0.22 },
      { text: `${convertMoney((item.originalPrice || item.price) * item.quantity)}`, align: 'RIGHT', width: 0.22 },
    ])

    if (item.modifiers && item.modifiers.length) {
      item.modifiers.forEach(mod => {
        const modifierText = `* ${mod.name}`

        escPrinter.tableCustom([
          { text: modifierText, align: 'LEFT', width: 0.4 },
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
  printSsr
}
