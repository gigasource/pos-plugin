const { staffReport } = require('../../order-logic/report-staff-logic')
const dayjs = require('dayjs');

async function makePrintData(cms, {staffName, from, to}) {
  const report = await staffReport(from, to)
  report.staffName = staffName
  report.from = from
  report.to = to
  return report
}

async function printEscPos(escPrinter, printData) {
  const {userSales, groupByStatus, groupByPayment, staffName, from, to} = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  function formatDate(val) {
    return val ? dayjs(val).format('DD/MM/YYYY') : ''
  }

  escPrinter.bold(true);
  escPrinter.alignLeft();
  escPrinter.println(`Staff name: ${staffName}`);

  if (userSales[staffName]) {
    escPrinter.println(`Report Date: ${formatDate(from)}`);
    escPrinter.bold(false);
    escPrinter.println(`First Order: ${formatDate(userSales[staffName].from)}`);
    escPrinter.println(`Last Order: ${formatDate(userSales[staffName].to)}`);
  }

  escPrinter.bold(true);
  escPrinter.drawLine();
  escPrinter.println('Sales');

  if (userSales[staffName]) {
    escPrinter.bold(false);
    escPrinter.leftRight('Total', convertMoney(userSales[staffName].vTaxSum.gross));
    escPrinter.leftRight('Sub-total', convertMoney(userSales[staffName].vTaxSum.net));
    escPrinter.leftRight('Tax', convertMoney(userSales[staffName].vTaxSum.tax));
  }

  escPrinter.drawLine();

  const groupByTax = userSales[staffName] ? userSales[staffName].vTaxSum.vTaxSum : null
  if (groupByTax) {
    escPrinter.bold(false);
    Object.keys(groupByTax).forEach(taxGroup => {
      const {gross, net, tax} = groupByTax[taxGroup];

      escPrinter.println(`Tax ${taxGroup}%:`);
      escPrinter.leftRight('Total', convertMoney(gross));
      escPrinter.leftRight('Sub-total', convertMoney(net));
      escPrinter.leftRight('Tax', convertMoney(tax));
      escPrinter.newLine();
    });
  }

  if (userSales[staffName]) {
    escPrinter.leftRight('Vouchers Sold', convertMoney(0));
    escPrinter.leftRight('Vouchers Used', convertMoney(0));
    escPrinter.leftRight('Discount', convertMoney(userSales[staffName].vDiscount));
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

    const taxGroups = Object.keys(groupByTax);
    for (let i = 0; i < taxGroups.length; i++) {
      const taxGroup = taxGroups[i];
      const {gross, net, salesTax} = groupByTax[taxGroup];

      await canvasPrinter.println(`Tax ${taxGroup}%:`);
      await canvasPrinter.leftRight('Total', convertMoney(gross));
      await canvasPrinter.leftRight('Sub-total', convertMoney(net));
      await canvasPrinter.leftRight('Tax', convertMoney(salesTax));
      await canvasPrinter.newLine();
    }
  }

  if (user[name]) {
    await canvasPrinter.leftRight('Vouchers Sold', convertMoney(0));
    await canvasPrinter.leftRight('Vouchers Used', convertMoney(0));
    await canvasPrinter.leftRight('Discount', convertMoney(user[name].discount));
  }

  await canvasPrinter.bold(true);
  await canvasPrinter.drawLine();

  if (groupByPayment) {
    const paymentTypes = Object.keys(groupByPayment);
    for (let i = 0; i < paymentTypes.length; i++) {
      const paymentType = paymentTypes[i];
      const saleAmount = groupByPayment[paymentType];
      await canvasPrinter.println(`${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} Sales: ${convertMoney(saleAmount)}`);
    }

    await canvasPrinter.println(`Returned Total: ${convertMoney(0)}`);
  }

  await canvasPrinter.print();
}

module.exports = {
  makePrintData,
  printEscPos,
  printCanvas
}
