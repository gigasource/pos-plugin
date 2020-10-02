const {convertHtmlToPng} = require('../print-utils/print-utils');
const vueSsrRenderer = require('../print-utils/vue-ssr-renderer');
const Vue = require('vue');

async function makePrintData(cms, order) {
  const posSetting = await cms.getModel('PosSetting').findOne({})

  if (!order) return null

  const {name: companyName, address: companyAddress, telephone: companyTel, taxNumber: companyVatNumber} = posSetting.companyInfo
  const orderDate = dayjs(order.date).format('DD.MM.YYYY')
  const orderTime = dayjs(order.date).format('HH:mm:ss')
  const orderNumber = order.id
  const orderProductList = order.items
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
}
