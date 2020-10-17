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

async function printCanvas(canvasPrinter, printData) {
  const {date, salesByCategory, salesByPayment, zNumbers, total} = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  await canvasPrinter.alignCenter();
  await canvasPrinter.setFontSize(36);
  await canvasPrinter.bold(true);
  await canvasPrinter.println(date);
  await canvasPrinter.newLine();

  await canvasPrinter.alignLeft();
  await canvasPrinter.setTextNormal();
  await canvasPrinter.bold(true);
  await canvasPrinter.println('Sales');
  await canvasPrinter.drawLine();

  await canvasPrinter.bold(false);
  await Promise.all(Object.keys(salesByPayment).map(async paymentType => {
    const paymentAmount = salesByPayment[paymentType];
    await canvasPrinter.leftRight(` ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}`,
      `${convertMoney(paymentAmount)}`);
  }));

  await canvasPrinter.bold(true);
  await canvasPrinter.leftRight('Total', `${convertMoney(total)}`);
  if (salesByCategory || zNumbers) await canvasPrinter.newLine();

  if (zNumbers) {
    await canvasPrinter.bold(false);
    await canvasPrinter.drawLine();
    await Promise.all(zNumbers.map(async z => {
      await canvasPrinter.tableCustom([
        {text: `Z-Number ${z.z}: ${convertMoney(z.sum)}`, align: 'LEFT', width: 0.48},
        {text: `Date: ${z.date}`, align: 'LEFT', width: 0.48},
      ]);
    }));
    await canvasPrinter.bold(true);
    await canvasPrinter.drawLine();
    if (salesByCategory) await canvasPrinter.newLine();
  }

  if (salesByCategory) {
    await canvasPrinter.bold(true);
    await canvasPrinter.println('Product Sold');
    await canvasPrinter.drawLine();

    await Promise.all(Object.keys(salesByCategory).map(async category => {
      await canvasPrinter.newLine();
      const {products, sum} = salesByCategory[category];

      await canvasPrinter.bold(true);
      await canvasPrinter.println(`${category} (${convertMoney(sum)})`);
      await canvasPrinter.bold(false);
      await Promise.all(products.map(async ({product, quantity}) => {
        await canvasPrinter.println(` ${quantity} x ${product}`);
      }));
    }))
  }

  await canvasPrinter.print();
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
