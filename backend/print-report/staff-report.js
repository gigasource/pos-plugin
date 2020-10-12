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

async function printCanvas(printer, printData) {
  const {orderSalesByStaff: {name, user, from, groupByTax, groupByPayment}} = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  function formatDate(val) {
    return val ? dayjs(val).format('DD/MM/YYYY') : ''
  }

  printer.bold(true);
  printer.alignLeft();
  printer.println(`Staff name: ${name}`);

  if (user[name]) {
    printer.println(`Report Date: ${formatDate(from)}`);
    printer.bold(false);
    printer.println(`First Order: ${formatDate(user[name].from)}`);
    printer.println(`Last Order: ${formatDate(user[name].to)}`);
  }

  printer.bold(true);
  printer.drawLine();
  printer.println('Sales');

  if (user[name]) {
    printer.bold(false);
    printer.leftRight('Total', convertMoney(user[name].vSum));
    printer.leftRight('Sub-total', convertMoney(user[name].net));
    printer.leftRight('Tax', convertMoney(user[name].tax));
  }

  printer.drawLine();

  if (groupByTax) {
    printer.bold(false);
    Object.keys(groupByTax).forEach(taxGroup => {
      const {gross, net, salesTax} = groupByTax[taxGroup];

      printer.println(`Tax ${taxGroup}%:`);
      printer.leftRight('Total', convertMoney(gross));
      printer.leftRight('Sub-total', convertMoney(net));
      printer.leftRight('Tax', convertMoney(salesTax));
      printer.newLine();
    });
  }

  if (user[name]) {
    printer.leftRight('Vouchers Sold', convertMoney(0));
    printer.leftRight('Vouchers Used', convertMoney(0));
    printer.leftRight('Discount', convertMoney(user[name].discount));
  }

  printer.bold(true);
  printer.drawLine();

  if (groupByPayment) {
    Object.keys(groupByPayment).forEach(paymentType => {
      const saleAmount = groupByPayment[paymentType];

      printer.println(`${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} Sales: ${convertMoney(saleAmount)}`);
    });
    printer.println(`Returned Total: ${convertMoney(0)}`);
  }

  await printer.print();
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
