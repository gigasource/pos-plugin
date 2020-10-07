const {convertHtmlToPng} = require('../print-utils/print-utils');
const vueSsrRenderer = require('../print-utils/vue-ssr-renderer');
const Vue = require('vue');

async function makePrintData(cms, args) {
  return args;
}

async function printEscPos(escPrinter, printData) {
  const {date, salesByCategory, salesByPayment, zNumbers, total} = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  escPrinter.alignCenter();
  escPrinter.setTextQuadArea();
  escPrinter.bold(true);
  escPrinter.println(date);
  escPrinter.newLine();

  escPrinter.alignLeft();
  escPrinter.setTextNormal();
  escPrinter.bold(true);
  escPrinter.println('Sales');
  escPrinter.drawLine();

  escPrinter.bold(false);
  Object.keys(salesByPayment).forEach(paymentType => {
    const paymentAmount = salesByPayment[paymentType];
    escPrinter.leftRight(` ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}`,
        `${convertMoney(paymentAmount)}`);
  });

  escPrinter.bold(true);
  escPrinter.leftRight('Total', `${convertMoney(total)}`);
  if (salesByCategory || zNumbers) escPrinter.newLine();

  if (zNumbers) {
    escPrinter.bold(false);
    escPrinter.drawLine();
    zNumbers.forEach(z => {
      escPrinter.tableCustom([
        {text: `Z-Number ${z.z}: ${convertMoney(z.sum)}`, align: 'LEFT', width: 0.48},
        {text: `Date: ${z.date}`, align: 'LEFT', width: 0.48},
      ]);
    });
    escPrinter.bold(true);
    escPrinter.drawLine();
    if (salesByCategory) escPrinter.newLine();
  }

  if (salesByCategory) {
    escPrinter.bold(true);
    escPrinter.println('Product Sold');
    escPrinter.drawLine();

    Object.keys(salesByCategory).forEach(category => {
      escPrinter.newLine();
      const {products, sum} = salesByCategory[category];

      escPrinter.bold(true);
      escPrinter.println(`${category} (${convertMoney(sum)})`);
      escPrinter.bold(false);
      products.forEach(({product, quantity}) => {
        escPrinter.println(` ${quantity} x ${product}`);
      });
    })
  }

  await escPrinter.print();
}

async function printCanvas(printer, printData) {
  const {date, salesByCategory, salesByPayment, zNumbers, total} = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  printer.alignCenter();
  printer.setFontSize(36);
  printer.bold(true);
  printer.println(date);
  printer.newLine();

  printer.alignLeft();
  printer.setTextNormal();
  printer.bold(true);
  printer.println('Sales');
  printer.drawLine();

  printer.bold(false);
  Object.keys(salesByPayment).forEach(paymentType => {
    const paymentAmount = salesByPayment[paymentType];
    printer.leftRight(` ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}`,
        `${convertMoney(paymentAmount)}`);
  });

  printer.bold(true);
  printer.leftRight('Total', `${convertMoney(total)}`);
  if (salesByCategory || zNumbers) printer.newLine();

  if (zNumbers) {
    printer.bold(false);
    printer.drawLine();
    zNumbers.forEach(z => {
      printer.tableCustom([
        {text: `Z-Number ${z.z}: ${convertMoney(z.sum)}`, align: 'LEFT', width: 0.48},
        {text: `Date: ${z.date}`, align: 'LEFT', width: 0.48},
      ]);
    });
    printer.bold(true);
    printer.drawLine();
    if (salesByCategory) printer.newLine();
  }

  if (salesByCategory) {
    printer.bold(true);
    printer.println('Product Sold');
    printer.drawLine();

    Object.keys(salesByCategory).forEach(category => {
      printer.newLine();
      const {products, sum} = salesByCategory[category];

      printer.bold(true);
      printer.println(`${category} (${convertMoney(sum)})`);
      printer.bold(false);
      products.forEach(({product, quantity}) => {
        printer.println(` ${quantity} x ${product}`);
      });
    })
  }

  await printer.print();
}

async function printSsr(printer, printData) {
  const MonthReport = require('../../dist/MonthReport.vue');

  const printComponent = new Vue({
    components: {MonthReport},
    render(h) {
      return h('MonthReport', {props: printData})
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
  printSsr,
  printEscPos,
  printCanvas
}
