const { xReport } = require('../../order-logic/report-x-report-logic')
const dayjs = require('dayjs');

async function makePrintData(cms, {from, to}) {
  const posSettings = await cms.getModel('PosSetting').findOne();
  const companyInfo = posSettings && posSettings.companyInfo;
  return {
    ...companyInfo,
    ...(await xReport(from, to)),
    from,
    to
  };
}

async function printEscPos(escPrinter, printData) {
  const {
    name,
    address,
    telephone,
    taxNumber,
    date,
    from, to,
    report,
    sumByPayment
  } = printData;

  function getDateTimeString(date) {
    return dayjs(date).format('DD.MM HH:mm')
  }

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  escPrinter.alignCenter();
  escPrinter.setTextDoubleHeight();
  escPrinter.bold(true);
  escPrinter.println(name);

  escPrinter.bold(false);
  escPrinter.setTextNormal();
  escPrinter.println(address);
  escPrinter.println(`Tel: ${telephone}`);
  escPrinter.println(`VAT Reg No: ${taxNumber}`);

  escPrinter.newLine();
  escPrinter.setTextDoubleHeight();
  escPrinter.bold(true);
  escPrinter.println('X-Report');

  escPrinter.newLine();
  escPrinter.setTextNormal();
  escPrinter.alignLeft();
  escPrinter.bold(true);
  escPrinter.println(`Report Date: ${date}`);
  escPrinter.bold(false);
  escPrinter.println(`First Order: ${getDateTimeString(from)}`);
  escPrinter.println(`Last Order: ${getDateTimeString(to)}`);
  escPrinter.bold(true);
  escPrinter.drawLine();

  escPrinter.println('Sales');
  if (report) {
    escPrinter.bold(false);
    escPrinter.leftRight('Total', convertMoney(report.vTaxSum.gross));
    escPrinter.leftRight('Sub-total', convertMoney(report.vTaxSum.net));
    escPrinter.leftRight('Tax', convertMoney(report.vTaxSum.tax));
    escPrinter.bold(true);
    escPrinter.drawLine();

    escPrinter.bold(false);

    Object.keys(report.vTaxSum.vTaxSum).forEach(key => {
      escPrinter.println(`Tax ${key}%:`);
      escPrinter.leftRight('Total', convertMoney(report.vTaxSum.vTaxSum[key].gross));
      escPrinter.leftRight('Sub-total', convertMoney(report.vTaxSum.vTaxSum[key].net));
      escPrinter.leftRight('Total', convertMoney(report.vTaxSum.vTaxSum[key].tax));
      escPrinter.newLine();
    })

    escPrinter.leftRight('Discount', convertMoney(report.discount));
  }
  escPrinter.bold(true);
  escPrinter.drawLine();

  /**
   * todo: fix this
   */
  // Object.keys(sumByPayment).forEach(paymentType => {
  //   const paymentAmount = sumByPayment[paymentType];
  //   escPrinter.println(`${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}: ${convertMoney(paymentAmount)}`);
  // });

  await escPrinter.print();
}

async function printCanvas(canvasPrinter, printData) {
  const {
    name,
    address,
    telephone,
    taxNumber,
    date,
    from, to,
    report,
    sumByPayment
  } = printData;

  function getDateTimeString(date) {
    return dayjs(date).format('DD.MM HH:mm')
  }

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  await canvasPrinter.alignCenter();
  await canvasPrinter.setTextDoubleHeight();
  await canvasPrinter.bold(true);
  await canvasPrinter.println(name);

  await canvasPrinter.bold(false);
  await canvasPrinter.setTextNormal();
  await canvasPrinter.println(address);
  await canvasPrinter.println(`Tel: ${telephone}`);
  await canvasPrinter.println(`VAT Reg No: ${taxNumber}`);

  await canvasPrinter.newLine();
  await canvasPrinter.setTextDoubleHeight();
  await canvasPrinter.bold(true);
  await canvasPrinter.println('X-Report');

  await canvasPrinter.newLine();
  await canvasPrinter.setTextNormal();
  await canvasPrinter.alignLeft();
  await canvasPrinter.bold(true);
  await canvasPrinter.println(`Report Date: ${date}`);
  await canvasPrinter.bold(false);
  await canvasPrinter.println(`First Order: ${getDateTimeString(from)}`);
  await canvasPrinter.println(`Last Order: ${getDateTimeString(to)}`);
  await canvasPrinter.bold(true);
  await canvasPrinter.drawLine();

  await canvasPrinter.println('Sales');
  if (report) {
    await canvasPrinter.bold(false);
    await canvasPrinter.leftRight('Total', convertMoney(report.vTaxSum.gross));
    await canvasPrinter.leftRight('Sub-total', convertMoney(report.vTaxSum.net));
    await canvasPrinter.leftRight('Tax', convertMoney(report.vTaxSum.tax));
    await canvasPrinter.bold(true);
    await canvasPrinter.drawLine();

    await canvasPrinter.bold(false);

    for (let key in report.vTaxSum.vTaxSum) {
      await canvasPrinter.println(`Tax ${key}%:`);
      await canvasPrinter.leftRight('Total', convertMoney(report.vTaxSum.vTaxSum[key].gross));
      await canvasPrinter.leftRight('Sub-total', convertMoney(report.vTaxSum.vTaxSum[key].net));
      await canvasPrinter.leftRight('Total', convertMoney(report.vTaxSum.vTaxSum[key].tax));
      await canvasPrinter.newLine();
    }

    await canvasPrinter.leftRight('Discount', convertMoney(report.discount));
  }
  await canvasPrinter.bold(true);
  await canvasPrinter.drawLine();

  /**
   * todo: fix this
   */
  // const paymentTypes = Object.keys(sumByPayment);
  // for (let i = 0; i < paymentTypes.length; i++) {
  //   const paymentType = paymentTypes[i];
  //   const paymentAmount = sumByPayment[paymentType];
  //   await canvasPrinter.println(`${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}: ${convertMoney(paymentAmount)}`);
  // }

  await canvasPrinter.print();
}

module.exports = {
  makePrintData,
  printEscPos,
  printCanvas
}
