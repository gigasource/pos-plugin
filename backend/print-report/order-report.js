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
    escPrinter.tableCustom([
      {text: product.name, align: 'LEFT', width: 0.4},
      {text: product.quantity, align: 'RIGHT', width: 0.1},
      {text: convertMoney(product.originalPrice), align: 'RIGHT', width: 0.25},
      {text: convertMoney(product.quantity * product.originalPrice), align: 'RIGHT', width: 0.22},
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
  payment.map(({ type, value }) => {
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

async function printCanvas(printer, printData) {
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

  printer.alignCenter();
  printer.setFontSize(30);
  printer.bold(true);
  printer.println(companyName);
  printer.newLine(4);
  printer.bold(false);
  printer.setFontSize(20);
  printer.println(companyAddress);
  printer.println(`Tel: ${companyTel}`);
  printer.println(`VAT Reg No: ${companyVatNumber}`);

  printer.newLine(10);
  printer.bold(true);
  printer.setFontSize(40);
  printer.println('Invoice');
  printer.newLine(10);
  printer.bold(false);

  printer.setFontSize(25);
  printer.alignLeft();
  printer.println(`Date: ${orderDate}`);
  printer.newLine(4);
  printer.println(`Time: ${orderTime}`);
  printer.newLine(4);
  printer.println(`Invoice No: ${orderNumber}`);

  printer.newLine(16);
  printer.bold(true);
  printer.tableCustom([
    {text: 'Item', align: 'LEFT', width: 0.4},
    {text: 'Q.ty', align: 'RIGHT', width: 0.1},
    {text: 'Unit price', align: 'RIGHT', width: 0.25},
    {text: 'Total', align: 'RIGHT', width: 0.25},
  ]);
  printer.newLine(8);
  printer.drawLine();

  printer.bold(false);
  orderProductList.forEach(product => {
    printer.tableCustom([
      {text: product.name, align: 'LEFT', width: 0.4},
      {text: product.quantity, align: 'RIGHT', width: 0.1},
      {text: convertMoney(product.originalPrice), align: 'RIGHT', width: 0.25},
      {text: convertMoney(product.quantity * product.originalPrice), align: 'RIGHT', width: 0.25},
    ]);
    printer.newLine(4);
  });
  printer.drawLine();

  printer.leftRight('Sub-total', convertMoney(orderSum - orderTax));
  if (!isNaN(discount) && discount > 0) printer.leftRight('Discount', convertMoney(discount));
  orderTaxGroups.forEach(taxGroup => {
    printer.leftRight(`Tax (${taxGroup.taxType}%)`, convertMoney(taxGroup.tax));
  });
  printer.drawLine();

  printer.bold(true);
  printer.leftRight('Total', `${convertMoney(orderSum)}`);
  printer.bold(false);
  if (orderCashReceived || orderCashReceived === 0)
    printer.leftRight('Cash tend', `${convertMoney(orderCashReceived)}`);
  printer.drawLine();

  printer.bold(true);
  if (orderCashback || orderCashback === 0)
    printer.leftRight('Change due', `${convertMoney(orderCashback)}`);
  printer.alignLeft();
  printer.bold(false);
  printer.newLine();
  printer.println(`Payment method: ${capitalize(orderPaymentType)}`);
  printer.newLine(14);

  printer.alignCenter();
  printer.printBarcode(orderBookingNumber);
  printer.println(`Invoice ID: ${orderBookingNumber}`);
  printer.newLine(8);
  printer.bold(true);
  printer.println(`Thank you for choosing ${companyName}`);
  await printer.print();
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
