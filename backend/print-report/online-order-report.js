const dayjs = require('dayjs');

function convertMoney(value) {
  return !isNaN(value) ? value.toFixed(2) : value
}

function getShippingFee({discounts, shippingFee}) {
  if (!discounts || !discounts.length) return shippingFee

  const freeShipping = discounts.find(item => item.type === 'freeShipping');
  return freeShipping ? freeShipping.value : shippingFee;
}

function getPayment({payment}) {
  const {type} = payment[0];
  return type.charAt(0).toUpperCase() + type.slice(1) //capitalize
}

async function makePrintData(cms, {orderId}, locale) {
  const order = await cms.getModel('Order').findById(orderId);

  if (!order) return null;

  const {
    customer: {name, phone, address, zipCode, company},
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
    {text: locale.printing.item, align: 'LEFT', width: itemColumnWidth},
    {text: locale.printing.quantity, align: 'RIGHT', width: 0.12},
    {text: locale.printing.price, align: 'RIGHT', width: 0.22},
    {text: locale.printing.total, align: 'RIGHT', width: 0.22},
  ])
  escPrinter.drawLine()

  escPrinter.setTextNormal()
  items.forEach(item => {
    escPrinter.tableCustom([
      {text: (item.id && `${item.id}.`) + item.name, align: 'LEFT', width: itemColumnWidth},
      {text: `${item.quantity}`, align: 'RIGHT', width: 0.12},
      {text: `${convertMoney(item.originalPrice || item.price)}`, align: 'RIGHT', width: 0.22},
      {text: `${convertMoney((item.originalPrice || item.price) * item.quantity)}`, align: 'RIGHT', width: 0.22},
    ])

    if (item.modifiers && item.modifiers.length) {
      item.modifiers.forEach(mod => {
        const modifierText = `* ${mod.name}`

        escPrinter.tableCustom([
          {text: modifierText, align: 'LEFT', width: itemColumnWidth},
          {text: `${mod.quantity * item.quantity}`, align: 'RIGHT', width: 0.12},
          {text: `${convertMoney(mod.price)}`, align: 'RIGHT', width: 0.22},
          {text: `${convertMoney((mod.price) * mod.quantity * item.quantity)}`, align: 'RIGHT', width: 0.22},
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

async function printCanvas(canvasPrinter, printData, groupPrinter, printerType) {
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

  await canvasPrinter.setTextDoubleHeight();
  await canvasPrinter.bold(true);

  const orderType = type === 'delivery' ? locale.printing.delivery : locale.printing.pickup;
  if (deliveryTime) {
    printerType === 'escpos'
      ? await canvasPrinter.leftRight(`${orderType} #${orderNumber}`, deliveryTime)
      : await canvasPrinter.tableCustom([
        {text: `${orderType} #${orderNumber}`, align: 'LEFT', width: 0.7, bold: true},
        {text: deliveryTime, align: 'RIGHT', width: 0.3, bold: true},
      ]);
  } else {
    await canvasPrinter.alignCenter();
    await canvasPrinter.println(`${orderType} #${orderNumber}`);
  }

  if (customerCompany) {
    await canvasPrinter.invert(true);
    await canvasPrinter.println(`${locale.printing.company}`);
    await canvasPrinter.invert(false);
  }

  await canvasPrinter.newLine()

  await canvasPrinter.alignLeft()
  await canvasPrinter.setTextNormal()
  await canvasPrinter.println(customerName)
  customerCompany && await canvasPrinter.println(customerCompany)
  customerAddress && await canvasPrinter.println(customerAddress)
  customerZipCode && await canvasPrinter.println(customerZipCode)
  await canvasPrinter.println(customerPhone)
  note && await canvasPrinter.println(note)
  await canvasPrinter.newLine()

  await canvasPrinter.drawLine()
  await canvasPrinter.bold(true)

  const itemColumnWidth = printerType === 'escpos' ? 0.4 : 0.44;
  await canvasPrinter.tableCustom([
    {text: locale.printing.item, align: 'LEFT', width: itemColumnWidth},
    {text: locale.printing.quantity, align: 'RIGHT', width: 0.12},
    {text: locale.printing.price, align: 'RIGHT', width: 0.22},
    {text: locale.printing.total, align: 'RIGHT', width: 0.22},
  ])
  await canvasPrinter.drawLine()

  await canvasPrinter.setTextNormal()

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    await canvasPrinter.tableCustom([
      {text: (item.id && `${item.id}.`) + item.name, align: 'LEFT', width: itemColumnWidth},
      {text: `${item.quantity}`, align: 'RIGHT', width: 0.12},
      {text: `${convertMoney(item.originalPrice || item.price)}`, align: 'RIGHT', width: 0.22},
      {text: `${convertMoney((item.originalPrice || item.price) * item.quantity)}`, align: 'RIGHT', width: 0.22},
    ])

    if (item.modifiers && item.modifiers.length) {
      for (let j = 0; j < item.modifiers.length; j++) {
        const mod = item.modifiers[j];
        const modifierText = `* ${mod.name}`

        await canvasPrinter.tableCustom([
          {text: modifierText, align: 'LEFT', width: itemColumnWidth},
          {text: `${mod.quantity * item.quantity}`, align: 'RIGHT', width: 0.12},
          {text: `${convertMoney(mod.price)}`, align: 'RIGHT', width: 0.22},
          {text: `${convertMoney((mod.price) * mod.quantity * item.quantity)}`, align: 'RIGHT', width: 0.22},
        ])
      }
    }
  }

  await canvasPrinter.drawLine()
  type === 'delivery' && await canvasPrinter.leftRight(locale.printing.shippingFee, convertMoney(getShippingFee(printData)))

  for (let i = 0; i < discounts.length; i++) {
    const item = discounts[i];
    await canvasPrinter.leftRight(item.coupon ? `Coupon (${item.coupon})` : item.name, `-${convertMoney(item.value)}`)
  }

  await canvasPrinter.bold(true)
  await canvasPrinter.leftRight(locale.printing.total, `${locale.printing.currency} ${convertMoney(orderSum)}`)
  await canvasPrinter.leftRight('Payment', payment)

  if (payment !== 'Cash') {
    await canvasPrinter.newLine()
    await canvasPrinter.alignCenter()
    await canvasPrinter.setTextDoubleHeight()
    await canvasPrinter.bold(true)
    await canvasPrinter.println(locale.printing.paid)
  }

  // printer.newLine()
  // printer.alignCenter()
  // printer.setTextNormal()
  // printer.println(date)

  await canvasPrinter.print()
}

module.exports = {
  makePrintData,
  printEscPos,
  printCanvas
}
