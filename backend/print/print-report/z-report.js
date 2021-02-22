const _ = require('lodash');
const {
  eodReport
} = require('../../order-logic/report-eod-logic')
const dayjs = require('dayjs')

async function makePrintData(cms, _report) {
  const posSetting = await cms.getModel('PosSetting').findOne({});
  const endOfDayReport = await eodReport(_report.z)
  const {
    report,
    reportByPayment,
    cancelledReport,
    cancelledItemReport,
    paidOrders,
    voucherReport,
    dineInReport,
    takeAwayReport
  } = endOfDayReport

  if (!endOfDayReport) throw new Error(`report report number ${z} not found`);

  const {from} = report;

  const sortedOrders = _.sortBy(paidOrders, 'date')
  const firstOrderDate = _.first(sortedOrders).date
  const lastOrderDate = _.last(sortedOrders).date

  const {name: companyName, address: companyAddress, telephone: companyTel, taxNumber: companyVatNumber} = posSetting.companyInfo
  const reportDate = dayjs(from).format('DD.MM.YYYY')
  const firstOrderDateString = dayjs(firstOrderDate).format('DD.MM.YYYY HH:mm')
  const lastOrderDateString = dayjs(lastOrderDate).format('DD.MM.YYYY HH:mm')

  return {
    companyName,
    companyAddress,
    companyTel,
    companyVatNumber,
    reportDate,
    firstOrderDateString,
    lastOrderDateString,
    vTaxSum: report.vTaxSum,
    discount: report.vDiscount || 0,
    reportByPayment,
    z: _report.z,
    cancelledItemReport,
    voucherReport,
    dineInReport,
    takeAwayReport
  }
}

async function printEscPos(escPrinter, printData) {
  const {
    companyName,
    companyAddress,
    companyTel,
    companyVatNumber,
    reportDate,
    firstOrderDateString,
    lastOrderDateString,
    vTaxSum,
    discount,
    reportByPayment,
    z
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
  escPrinter.println('Z-Report');

  escPrinter.newLine();
  escPrinter.bold(false);
  escPrinter.setTextNormal();
  escPrinter.alignLeft();
  escPrinter.println(`Report Date: ${reportDate}`);
  escPrinter.println(`Z-Number: ${z}`);
  escPrinter.println(`First Order: ${firstOrderDateString}`);
  escPrinter.println(`Last Order: ${lastOrderDateString}`);
  escPrinter.bold(true);
  escPrinter.drawLine();

  escPrinter.println('Sales');
  escPrinter.bold(false);
  escPrinter.leftRight("Total", convertMoney(vTaxSum.gross));
  escPrinter.leftRight("Sub-total", convertMoney(vTaxSum.net));
  escPrinter.leftRight("Tax", convertMoney(vTaxSum.tax));
  escPrinter.bold(true);
  escPrinter.drawLine();

  escPrinter.bold(false);
  Object.keys(vTaxSum.vTaxSum).forEach(key => {
    escPrinter.println(`Tax (${key}%)`);
    escPrinter.leftRight('Total', convertMoney(vTaxSum.vTaxSum[key]['gross']));
    escPrinter.leftRight('Sub-total', convertMoney(vTaxSum.vTaxSum[key]['net']));
    escPrinter.leftRight('Tax', convertMoney(vTaxSum.vTaxSum[key]['tax']));
    escPrinter.newLine();
  });

  escPrinter.bold(false);
  escPrinter.leftRight('Discount', `${convertMoney(discount)}`);
  escPrinter.bold(true);
  escPrinter.drawLine();

  escPrinter.bold(false);
  Object.keys(reportByPayment).forEach(paymentType => {
    escPrinter.leftRight(`${capitalize(paymentType)}`, ` ${convertMoney(reportByPayment[paymentType])}`);
  });

  await escPrinter.print();
}

async function printCanvas(canvasPrinter, printData, groupPrinter, locale) {
  const {
    companyName,
    companyAddress,
    companyTel,
    companyVatNumber,
    reportDate,
    firstOrderDateString,
    lastOrderDateString,
    vTaxSum,
    discount,
    reportByPayment,
    z,
    cancelledItemReport,
    voucherReport,
    dineInReport,
    takeAwayReport
  } = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  await canvasPrinter.alignCenter();
  await canvasPrinter.bold(true);
  await canvasPrinter.println(companyName);
  await canvasPrinter.bold(false);
  await canvasPrinter.setTextNormal();
  await canvasPrinter.println(companyAddress);
  await canvasPrinter.println(`Tel: ${companyTel}`);
  await canvasPrinter.println(`VAT Reg No: ${companyVatNumber}`);

  await canvasPrinter.newLine();
  await canvasPrinter.setTextDoubleHeight();
  await canvasPrinter.bold(true);
  await canvasPrinter.println(locale.report.zReport);

  await canvasPrinter.newLine();
  await canvasPrinter.bold(false);
  await canvasPrinter.setTextNormal();
  await canvasPrinter.alignLeft();
  await canvasPrinter.println(`${locale.report.reportDate}: ${reportDate}`);
  await canvasPrinter.println(`${locale.report.ZNumber}: ${z}`);
  await canvasPrinter.println(`${locale.report.firstOrder}: ${firstOrderDateString}`);
  await canvasPrinter.println(`${locale.report.lastOrder}: ${lastOrderDateString}`);
  await canvasPrinter.println(`${locale.report.printDate}: ${dayjs().format(locale.dates.datetimeFormat)}`);

  await canvasPrinter.bold(true);
  await canvasPrinter.drawLine();

  await canvasPrinter.println(locale.report.totalSales);
  await canvasPrinter.bold(false);
  await canvasPrinter.leftRight(locale.report.total, convertMoney(vTaxSum.gross));
  await canvasPrinter.leftRight(locale.report.subtotal, convertMoney(vTaxSum.net));
  await canvasPrinter.leftRight(locale.report.tax, convertMoney(vTaxSum.tax));
  await canvasPrinter.bold(true);
  await canvasPrinter.drawLine();

  await canvasPrinter.bold(false);

  const groupTypes = Object.keys(vTaxSum.vTaxSum);
  for (let i = 0; i < groupTypes.length; i++) {
    const groupType = groupTypes[i];
    await canvasPrinter.println(`${locale.report.tax} (${groupType}%)`);
    await canvasPrinter.leftRight(locale.report.total, convertMoney(vTaxSum.vTaxSum[groupType]['gross']));
    await canvasPrinter.leftRight(locale.report.subtotal, convertMoney(vTaxSum.vTaxSum[groupType]['net']));
    await canvasPrinter.leftRight(locale.report.tax, convertMoney(vTaxSum.vTaxSum[groupType]['tax']));
    await canvasPrinter.newLine();
  }

  await canvasPrinter.bold(false);
  await canvasPrinter.leftRight(locale.report.vouchersUsed, `${convertMoney(voucherReport.used)}`);
  await canvasPrinter.leftRight(locale.report.vouchersSold, `${convertMoney(voucherReport.sold)}`);

  await canvasPrinter.leftRight(locale.discount.discount, `${convertMoney(discount)}`);
  await canvasPrinter.bold(true);
  await canvasPrinter.drawLine();

  await canvasPrinter.bold(false);

  const paymentTypes = Object.keys(reportByPayment);
  for (let i = 0; i < paymentTypes.length; i++) {
    const paymentType = paymentTypes[i];
    await canvasPrinter.leftRight(`${capitalize(paymentType)}`, `${convertMoney(reportByPayment[paymentType])}`);
  }

  //cancellation:
  await canvasPrinter.println(`${locale.report.cancelledTotal}: ${convertMoney(cancelledItemReport)}`);

  await canvasPrinter.newLine();
  await canvasPrinter.newLine();

  await canvasPrinter.drawLine();
  await canvasPrinter.newLine();

  //dineIn, takeAway:
  await canvasPrinter.println(locale.report.dineIn);
  await canvasPrinter.leftRight(locale.report.total, convertMoney(dineInReport['gross']));
  await canvasPrinter.leftRight(locale.report.subtotal, convertMoney(dineInReport['net']));
  await canvasPrinter.leftRight(locale.report.tax, convertMoney(dineInReport['tax']));

  await canvasPrinter.newLine();
  await canvasPrinter.println(locale.report.takeAway);
  await canvasPrinter.leftRight(locale.report.total, convertMoney(takeAwayReport['gross']));
  await canvasPrinter.leftRight(locale.report.subtotal, convertMoney(takeAwayReport['net']));
  await canvasPrinter.leftRight(locale.report.tax, convertMoney(takeAwayReport['tax']));

  await canvasPrinter.drawLine();
  //await canvasPrinter.newLine();


  await canvasPrinter.print();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports = {
  makePrintData,
  printEscPos,
  printCanvas
}
