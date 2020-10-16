const {convertHtmlToPng} = require('../print-utils/print-utils');
const vueSsrRenderer = require('../print-utils/vue-ssr-renderer');
const Vue = require('vue');
const dayjs = require('dayjs');

async function makePrintData(cms, args) {
  return {orderSalesByStaff: args}
}

async function printEscPos(escPrinter, printData) {
  const {orderSalesByStaff: {name, user, from, groupByTax, groupByPayment}} = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  function formatDate(val) {
    return val ? dayjs(val).format('DD/MM/YYYY') : ''
  }

  escPrinter.bold(true);
  escPrinter.alignLeft();
  escPrinter.println(`Staff name: ${name}`);

  if (user[name]) {
    escPrinter.println(`Report Date: ${formatDate(from)}`);
    escPrinter.bold(false);
    escPrinter.println(`First Order: ${formatDate(user[name].from)}`);
    escPrinter.println(`Last Order: ${formatDate(user[name].to)}`);
  }

  escPrinter.bold(true);
  escPrinter.drawLine();
  escPrinter.println('Sales');

  if (user[name]) {
    escPrinter.bold(false);
    escPrinter.leftRight('Total', convertMoney(user[name].vSum));
    escPrinter.leftRight('Sub-total', convertMoney(user[name].net));
    escPrinter.leftRight('Tax', convertMoney(user[name].tax));
  }

  escPrinter.drawLine();

  if (groupByTax) {
    escPrinter.bold(false);
    Object.keys(groupByTax).forEach(taxGroup => {
      const {gross, net, salesTax} = groupByTax[taxGroup];

      escPrinter.println(`Tax ${taxGroup}%:`);
      escPrinter.leftRight('Total', convertMoney(gross));
      escPrinter.leftRight('Sub-total', convertMoney(net));
      escPrinter.leftRight('Tax', convertMoney(salesTax));
      escPrinter.newLine();
    });
  }

  if (user[name]) {
    escPrinter.leftRight('Vouchers Sold', convertMoney(0));
    escPrinter.leftRight('Vouchers Used', convertMoney(0));
    escPrinter.leftRight('Discount', convertMoney(user[name].discount));
  }

  escPrinter.bold(true);
  escPrinter.drawLine();

  if (groupByPayment) {
    Object.keys(groupByPayment).forEach(paymentType => {
      const saleAmount = groupByPayment[paymentType];

      escPrinter.println(`${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} Sales: ${convertMoney(saleAmount)}`);
    });
    escPrinter.println(`Returned Total: ${convertMoney(0)}`);
  }

  await escPrinter.print();
}

async function printCanvas(canvasPrinter, printData) {
  const {orderSalesByStaff: {name, user, from, groupByTax, groupByPayment}} = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  function formatDate(val) {
    return val ? dayjs(val).format('DD/MM/YYYY') : ''
  }

  await canvasPrinter.bold(true);
  await canvasPrinter.alignLeft();
  await canvasPrinter.println(`Staff name: ${name}`);

  if (user[name]) {
    await canvasPrinter.println(`Report Date: ${formatDate(from)}`);
    await canvasPrinter.bold(false);
    await canvasPrinter.println(`First Order: ${formatDate(user[name].from)}`);
    await canvasPrinter.println(`Last Order: ${formatDate(user[name].to)}`);
  }

  await canvasPrinter.bold(true);
  await canvasPrinter.drawLine();
  await canvasPrinter.println('Sales');

  if (user[name]) {
    await canvasPrinter.bold(false);
    await canvasPrinter.leftRight('Total', convertMoney(user[name].vSum));
    await canvasPrinter.leftRight('Sub-total', convertMoney(user[name].net));
    await canvasPrinter.leftRight('Tax', convertMoney(user[name].tax));
  }

  await canvasPrinter.drawLine();

  if (groupByTax) {
    await canvasPrinter.bold(false);
    await Promise.all(Object.keys(groupByTax).map(async taxGroup => {
      const {gross, net, salesTax} = groupByTax[taxGroup];

      await canvasPrinter.println(`Tax ${taxGroup}%:`);
      await canvasPrinter.leftRight('Total', convertMoney(gross));
      await canvasPrinter.leftRight('Sub-total', convertMoney(net));
      await canvasPrinter.leftRight('Tax', convertMoney(salesTax));
      await canvasPrinter.newLine();
    }));
  }

  if (user[name]) {
    await canvasPrinter.leftRight('Vouchers Sold', convertMoney(0));
    await canvasPrinter.leftRight('Vouchers Used', convertMoney(0));
    await canvasPrinter.leftRight('Discount', convertMoney(user[name].discount));
  }

  await canvasPrinter.bold(true);
  await canvasPrinter.drawLine();

  if (groupByPayment) {
    await Promise.all(Object.keys(groupByPayment).map(async paymentType => {
      const saleAmount = groupByPayment[paymentType];
      await canvasPrinter.println(`${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} Sales: ${convertMoney(saleAmount)}`);
    }));
    await canvasPrinter.println(`Returned Total: ${convertMoney(0)}`);
  }

  await canvasPrinter.print();
}

async function printSsr(printer, printData) {
  const StaffReport = require('../../dist/StaffReport.vue');

  const printComponent = new Vue({
    components: {StaffReport},
    render(h) {
      return h('StaffReport', {props: printData})
    }
  });

  vueSsrRenderer.renderToString(printComponent, {}, async (err, html) => {
    if (err) throw err;

    const reportImage = await convertHtmlToPng(html);
    printer.printPng(reportImage);
    await printer.print();
  });
}

module.exports = {
  makePrintData,
  printEscPos,
  printSsr,
  printCanvas
}
