const dayjs = require('dayjs')

function convertMoney(value) {
  return !isNaN(value) ? value.toFixed(2) : value
}

async function makePrintData(cms, {orderId}, locale) {
  const order = await cms.getModel('Order').findById(orderId).lean();

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
    const itemsColumnWidth = tableWidthPercentTotal - 0.05 - quantityColumnWidth;

    escPrinter.setTextQuadArea();
    escPrinter.tableCustom([
      {text: item.quantity, align: 'LEFT', width: quantityColumnWidth, bold: true},
      {text: 'x', align: 'LEFT', width: 0.05, bold: true},
      {text: (item.id && `${item.id}.`) + item.name, align: 'LEFT', width: itemsColumnWidth},
    ], {textDoubleWith: true});

    if (item.note) {
      escPrinter.setTextDoubleWidth();
      escPrinter.tableCustom([
        {text: '', align: 'LEFT', width: quantityColumnWidth},
        {text: '', align: 'LEFT', width: 0.05},
        {text: `* ${item.note}`, align: 'LEFT', width: itemsColumnWidth},
      ], {textDoubleWith: true});
    }

    if (item.modifiers) {
      escPrinter.setTextDoubleWidth();

      item.modifiers.forEach(mod => {
        let modifierText = `* ${mod.name} ${convertMoney(mod.price)} ${locale.printing.currency}`

        escPrinter.tableCustom([
          {text: '', align: 'LEFT', width: quantityColumnWidth},
          {text: '', align: 'LEFT', width: 0.05},
          {text: modifierText, align: 'LEFT', width: itemsColumnWidth},
        ], {textDoubleWith: true});
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

async function printCanvas(canvasPrinter, printData, groupPrinter, printerType) {
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

  await canvasPrinter.bold(true);
  await canvasPrinter.drawLine();

  for (let i = 0; i < filteredItems.length; i++) {
    const item = filteredItems[i];

    await canvasPrinter.bold(false);
    const quantityColumnWidth = item.quantity.toString().length * 0.06;
    const itemsColumnWidth = tableWidthPercentTotal - 0.05 - quantityColumnWidth;

    await canvasPrinter.setTextQuadArea();
    await canvasPrinter.tableCustom([
      {text: item.quantity, align: 'LEFT', width: quantityColumnWidth, bold: true},
      {text: 'x', align: 'LEFT', width: 0.05, bold: true},
      {text: (item.id && `${item.id}.`) + item.name, align: 'LEFT', width: itemsColumnWidth},
    ], {textDoubleWith: true});

    if (item.note) {
      await canvasPrinter.setTextDoubleWidth();
      await canvasPrinter.tableCustom([
        {text: '', align: 'LEFT', width: quantityColumnWidth},
        {text: '', align: 'LEFT', width: 0.05},
        {text: `* ${item.note}`, align: 'LEFT', width: itemsColumnWidth},
      ], {textDoubleWith: true});
    }

    if (item.modifiers) {
      await canvasPrinter.setTextDoubleWidth();

      for (let j = 0; j < item.modifiers.length; j++) {
        const mod = item.modifiers[j];
        const modifierText = `* ${mod.name} ${convertMoney(mod.price)} ${locale.printing.currency}`

        await canvasPrinter.tableCustom([
          {text: '', align: 'LEFT', width: quantityColumnWidth},
          {text: '', align: 'LEFT', width: 0.05},
          {text: modifierText, align: 'LEFT', width: itemsColumnWidth},
        ], {textDoubleWith: true});
      }
    }

    if (i < filteredItems.length - 1) {
      await canvasPrinter.setTextNormal();
      await canvasPrinter.newLine();
      await canvasPrinter.newLine();
    }
  }

  await canvasPrinter.setTextNormal()
  await canvasPrinter.bold(true);
  await canvasPrinter.drawLine()

  if (forwardedStore) {
    await canvasPrinter.setTextNormal();
    await canvasPrinter.setTextDoubleHeight();
    await canvasPrinter.bold(true);
    await canvasPrinter.alignCenter();
    await canvasPrinter.println(forwardedStore)
  }
  //await printer.newLine()
  //await printer.alignCenter()
  //await printer.setTextNormal()
  //await printer.println(date)

  await canvasPrinter.print()
}

module.exports = {
  makePrintData,
  printEscPos,
  printCanvas
}
