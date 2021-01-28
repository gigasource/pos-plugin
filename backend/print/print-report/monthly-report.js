const {monthReport} = require('../../order-logic/report-month-report')
const dayjs = require('dayjs')
const _ = require('lodash');

async function makePrintData(cms, _report) {
  const report = await monthReport(_report.from, _report.to);
  return _.assign(report, _report);
}

async function printEscPos(escPrinter, printData) {
  const {date, salesByCategory, salesByPayment, zNumbers, total, salesByCategoryName} = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  escPrinter.alignCenter();
  escPrinter.setTextQuadArea();
  escPrinter.bold(true);
  escPrinter.println(dayjs(date).format('MM.YYYY'));
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
    Object.keys(zNumbers).forEach(date => {
      const z = Object.keys(zNumbers[date])[0]
      escPrinter.tableCustom([
        {text: `Z-Number ${z}: ${convertMoney(zNumbers[date][z])}`, align: 'LEFT', width: 0.48},
        {text: `Date: ${date}`, align: 'LEFT', width: 0.48},
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
      const products = salesByCategoryName[category];

      escPrinter.bold(true);
      escPrinter.println(`${category || 'No category'} (${convertMoney(salesByCategory[category].vSum)})`);
      escPrinter.bold(false);
      Object.keys(products).forEach(product => {
        escPrinter.println(` ${products[product].quantity} x ${product} (${products[product].vSum})`);
      });
    })
  }

  await escPrinter.print();
}

async function printCanvas(canvasPrinter, printData) {
  const {salesByCategory, salesByPayment, zNumbers, total, salesByCategoryName,selectedPeriod} = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  await canvasPrinter.alignCenter();
  await canvasPrinter.setFontSize(36);
  await canvasPrinter.bold(true);
  await canvasPrinter.println(selectedPeriod);
  await canvasPrinter.newLine();

  await canvasPrinter.alignLeft();
  await canvasPrinter.setTextNormal();
  await canvasPrinter.bold(true);
  await canvasPrinter.println('Sales');
  await canvasPrinter.drawLine();

  await canvasPrinter.bold(false);

  const paymentTypes = Object.keys(salesByPayment);
  for (let i = 0; i < paymentTypes.length; i++) {
    const paymentType = paymentTypes[i];
    const paymentAmount = salesByPayment[paymentType];
    await canvasPrinter.leftRight(` ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}`, `${convertMoney(paymentAmount)}`);
  }

  await canvasPrinter.bold(true);
  await canvasPrinter.leftRight('Total', `${convertMoney(total)}`);
  if (salesByCategory || zNumbers) await canvasPrinter.newLine();

  if (zNumbers) {
    await canvasPrinter.bold(false);
    await canvasPrinter.drawLine();
    for (let date in zNumbers) {
      const z = Object.keys(zNumbers[date])[0];
      if (z) {
        await canvasPrinter.tableCustom([
          {text: `Z-Number ${z}: ${convertMoney(zNumbers[date][z])}`, align: 'LEFT', width: 0.48},
          {text: `Date: ${date}`, align: 'LEFT', width: 0.48},
        ]);
      }
    }

    await canvasPrinter.bold(true);
    await canvasPrinter.drawLine();
    if (salesByCategory) await canvasPrinter.newLine();
  }

  if (salesByCategory) {
    await canvasPrinter.bold(true);
    await canvasPrinter.println('Product Sold');
    await canvasPrinter.drawLine();

    for (let category in salesByCategory) {
      await canvasPrinter.newLine();
      const products = salesByCategoryName[category];

      await canvasPrinter.bold(true);
      await canvasPrinter.println(`${category || 'No category'} (${convertMoney(salesByCategory[category].vSum)})`);
      await canvasPrinter.bold(false);

      for (let product in products) {
        await canvasPrinter.println(` ${products[product].quantity} x ${product} (${products[product].vSum})`);
      }
    }
  }

  await canvasPrinter.print();
}

module.exports = {
  makePrintData,
  printEscPos,
  printCanvas
}
