const {convertHtmlToPng} = require('../print-utils/print-utils');
const vueSsrRenderer = require('../print-utils/vue-ssr-renderer');
const Vue = require('vue');

async function makePrintData(cms, order, locale) {
  const posSetting = await cms.getModel('PosSetting').findOne({})
  if (!order) return null

  const {name: companyName, address: companyAddress, telephone: companyTel, taxNumber: companyVatNumber} = posSetting.companyInfo
  const orderDate = dayjs(order.date).format('DD.MM.YYYY')
  const orderTime = dayjs(order.date).format('HH:mm:ss')
  const orderNumber = order.id
  const orderProductList = order.items.filter(i => i.quantity > 0)
  const {
    vSum: orderSum,
    vTax: orderTax,
    vTaxGroups: orderTaxGroups,
    receive: orderCashReceived,
    cashback: orderCashback,
    bookingNumber: orderBookingNumber,
    payment,
    vDiscount: discount
  } = order
  const orderPaymentType = payment[0].type

  return {
    companyName,
    companyAddress,
    companyTel,
    companyVatNumber,
    orderDate,
    orderTime,
    orderNumber,
    orderProductList,
    orderSum,
    orderTax,
    orderTaxGroups,
    orderCashReceived,
    orderCashback,
    orderPaymentType,
    orderBookingNumber,
    discount,
    payment
  }
}

async function printEscPos(escPrinter, printData) {
  const {
    companyName,
    companyAddress,
    companyTel,
    companyVatNumber,
    orderDate,
    orderTime,
    orderNumber,
    orderProductList,
    orderSum,
    orderTax,
    orderTaxGroups,
    orderCashReceived,
    orderCashback,
    orderPaymentType,
    orderBookingNumber,
    discount,
    payment
  } = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  escPrinter.alignCenter();
  escPrinter.setTextDoubleHeight();
  escPrinter.bold(true);
  escPrinter.println(companyName);

  escPrinter.bold(false);
  escPrinter.setTextNormal();
  escPrinter.println(companyAddress);
  escPrinter.println(`Tel: ${companyTel}`);
  escPrinter.println(`VAT Reg No: ${companyVatNumber}`);

  escPrinter.newLine();
  escPrinter.setTextDoubleHeight();
  escPrinter.bold(true);
  escPrinter.println('Invoice');

  escPrinter.newLine();
  escPrinter.bold(false);
  escPrinter.setTextNormal();
  escPrinter.alignLeft();
  escPrinter.println(`Date: ${orderDate}`);
  escPrinter.println(`Time: ${orderTime}`);
  escPrinter.println(`Invoice No: ${orderNumber}`);

  escPrinter.newLine();
  escPrinter.bold(true);
  escPrinter.tableCustom([
    {text: 'Item', align: 'LEFT', width: 0.4},
    {text: 'Q.ty', align: 'RIGHT', width: 0.1},
    {text: 'Unit price', align: 'RIGHT', width: 0.25},
    {text: 'Total', align: 'RIGHT', width: 0.22},
  ]);
  escPrinter.drawLine();

  escPrinter.bold(false);
  orderProductList.forEach(product => {
    const productUnitPrice = product.modifiers && product.modifiers.length > 0
      ? product.modifiers.reduce((totalPrice, modifier) => {
        const modifierPrice = modifier.price * modifier.quantity
        return totalPrice + modifierPrice;
      }, product.originalPrice)
      : product.originalPrice

    escPrinter.tableCustom([
      {text: product.name, align: 'LEFT', width: 0.4},
      {text: product.quantity, align: 'RIGHT', width: 0.1},
      {text: convertMoney(productUnitPrice), align: 'RIGHT', width: 0.25},
      {text: convertMoney(product.quantity * productUnitPrice), align: 'RIGHT', width: 0.22},
    ]);
  });
  escPrinter.drawLine();

  escPrinter.leftRight('Sub-total', convertMoney(orderSum - orderTax));
  if (!isNaN(discount) && discount > 0) escPrinter.leftRight('Discount', convertMoney(discount));
  orderTaxGroups.forEach(taxGroup => {
    escPrinter.leftRight(`Tax (${taxGroup.taxType}%)`, convertMoney(taxGroup.tax));
  });
  escPrinter.drawLine();

  escPrinter.bold(true);
  escPrinter.leftRight('Total', `${convertMoney(orderSum)}`);
  escPrinter.bold(false);
  if (orderCashReceived || orderCashReceived === 0) escPrinter.leftRight('Amount tend', `${convertMoney(orderCashReceived)}`);
  escPrinter.drawLine();

  escPrinter.bold(true);
  if (orderCashback || orderCashback === 0) escPrinter.leftRight('Change due', `${convertMoney(orderCashback)}`);
  escPrinter.alignLeft();
  escPrinter.bold(false);
  escPrinter.println(`Payment method:`);
  payment.map(({type, value}) => {
    escPrinter.leftRight(capitalize(type), `${convertMoney(value)}`)
  })
  escPrinter.newLine();

  escPrinter.alignCenter();
  // printer.printBarcode(orderBookingNumber);
  escPrinter.println(`Invoice ID: ${orderBookingNumber}`);
  escPrinter.newLine();
  escPrinter.bold(true);
  escPrinter.println(`Thank you for choosing ${companyName}`);
  await escPrinter.print();
}

async function printCanvas(canvasPrinter, printData) {
  const {
    companyName,
    companyAddress,
    companyTel,
    companyVatNumber,
    orderDate,
    orderTime,
    orderNumber,
    orderProductList,
    orderSum,
    orderTax,
    orderTaxGroups,
    orderCashReceived,
    orderCashback,
    orderPaymentType,
    orderBookingNumber,
    discount,
    payment
  } = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  await canvasPrinter.alignCenter();
  await canvasPrinter.setFontSize(30);
  await canvasPrinter.bold(true);
  await canvasPrinter.println(companyName);
  await canvasPrinter.newLine(4);
  await canvasPrinter.bold(false);
  await canvasPrinter.setFontSize(20);
  await canvasPrinter.println(companyAddress);
  await canvasPrinter.println(`Tel: ${companyTel}`);
  await canvasPrinter.println(`VAT Reg No: ${companyVatNumber}`);

  await canvasPrinter.newLine(10);
  await canvasPrinter.bold(true);
  await canvasPrinter.setFontSize(40);
  await canvasPrinter.println('Invoice');
  await canvasPrinter.newLine(10);
  await canvasPrinter.bold(false);

  await canvasPrinter.setFontSize(25);
  await canvasPrinter.alignLeft();
  await canvasPrinter.println(`Date: ${orderDate}`);
  await canvasPrinter.newLine(4);
  await canvasPrinter.println(`Time: ${orderTime}`);
  await canvasPrinter.newLine(4);
  await canvasPrinter.println(`Invoice No: ${orderNumber}`);

  await canvasPrinter.newLine(16);
  await canvasPrinter.bold(true);
  await canvasPrinter.tableCustom([
    {text: 'Item', align: 'LEFT', width: 0.4},
    {text: 'Q.ty', align: 'RIGHT', width: 0.15},
    {text: 'Unit price', align: 'RIGHT', width: 0.2},
    {text: 'Total', align: 'RIGHT', width: 0.25},
  ]);
  await canvasPrinter.newLine(8);
  await canvasPrinter.drawLine();

  await canvasPrinter.bold(false);

  for (let i = 0; i < orderProductList.length; i++) {
    const product = orderProductList[i];
    const productUnitPrice = product.modifiers && product.modifiers.length > 0
      ? product.modifiers.reduce((totalPrice, modifier) => {
        const modifierPrice = modifier.price * modifier.quantity
        return totalPrice + modifierPrice;
      }, product.originalPrice)
      : product.originalPrice;

    await canvasPrinter.tableCustom([
      {text: product.name, align: 'LEFT', width: 0.4},
      {text: product.quantity, align: 'RIGHT', width: 0.15},
      {text: convertMoney(productUnitPrice), align: 'RIGHT', width: 0.2},
      {text: convertMoney(product.quantity * productUnitPrice), align: 'RIGHT', width: 0.25},
    ]);
    await canvasPrinter.newLine(4);
  }

  await canvasPrinter.drawLine();

  await canvasPrinter.leftRight('Sub-total', convertMoney(orderSum - orderTax));
  if (!isNaN(discount) && discount > 0) await canvasPrinter.leftRight('Discount', convertMoney(discount));

  for (let i = 0; i < orderTaxGroups.length; i++) {
    const taxGroup = orderTaxGroups[i];
    await canvasPrinter.leftRight(`Tax (${taxGroup.taxType}%)`, convertMoney(taxGroup.tax));
  }

  await canvasPrinter.drawLine();

  await canvasPrinter.bold(true);
  await canvasPrinter.leftRight('Total', `${convertMoney(orderSum)}`);
  await canvasPrinter.bold(false);
  if (orderCashReceived || orderCashReceived === 0) await canvasPrinter.leftRight('Cash tend', `${convertMoney(orderCashReceived)}`);
  await canvasPrinter.drawLine();

  await canvasPrinter.bold(true);
  if (orderCashback || orderCashback === 0) await canvasPrinter.leftRight('Change due', `${convertMoney(orderCashback)}`);
  await canvasPrinter.alignLeft();
  await canvasPrinter.bold(false);
  await canvasPrinter.newLine();
  await canvasPrinter.println(`Payment method: ${capitalize(orderPaymentType)}`);
  await canvasPrinter.newLine(14);

  await canvasPrinter.alignCenter();
  await canvasPrinter.printBarcode(orderBookingNumber);
  await canvasPrinter.println(`Invoice ID: ${orderBookingNumber}`);
  await canvasPrinter.newLine(8);
  await canvasPrinter.bold(true);
  await canvasPrinter.println(`Thank you for choosing ${companyName}`);
  await canvasPrinter.print();
}

async function printSsr(printer, printData) {
  const OrderReport = require('../../dist/OrderReport.vue');

  const printComponent = new Vue({
    components: {OrderReport},
    render(h) {
      return h('OrderReport', {props: printData})
    }
  });

  vueSsrRenderer.renderToString(printComponent, {}, async (err, html) => {
    if (err) throw err;

    const reportImage = await convertHtmlToPng(html);
    printer.printPng(reportImage);
    await printer.print();
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1) //capitalize
}

module.exports = {
  makePrintData,
  printSsr,
  printEscPos,
  printCanvas
}
