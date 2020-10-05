const {convertHtmlToPng} = require('../print-utils/print-utils');
const vueSsrRenderer = require('../print-utils/vue-ssr-renderer');
const _ = require('lodash');
const Vue = require('vue');

async function makePrintData(cms, {z}) {
  const posSetting = await cms.getModel('PosSetting').findOne({});
  const endOfDayReport = await cms.getModel('EndOfDay').findOne({z});

  if (!endOfDayReport) throw new Error(`z report number ${z} not found`);

  const {begin} = endOfDayReport;

  let reportData = await new Promise((resolve, reject) => {
    cms.api.processData('OrderEOD', {z}, result => {
      if (typeof result === 'string') reject(result);
      else resolve(result);
    })
  });

  const sortedOrders = _.sortBy(reportData.paidOrders, 'date')
  const firstOrderDate = _.first(sortedOrders).date
  const lastOrderDate = _.last(sortedOrders).date

  const {name: companyName, address: companyAddress, telephone: companyTel, taxNumber: companyVatNumber} = posSetting.companyInfo
  const reportDate = dayjs(begin).format('DD.MM.YYYY')
  const firstOrderDateString = dayjs(firstOrderDate).format('DD.MM.YYYY HH:mm')
  const lastOrderDateString = dayjs(lastOrderDate).format('DD.MM.YYYY HH:mm')
  const {net: subTotal, tax: taxTotal, sum: sumTotal, discount} = reportData.report
  const {reportByPayment} = reportData

  const reportGroups = _.groupBy(Object.keys(reportData.report), key => {
    const taxGroup2Chars = key.slice(key.length - 2, key.length) // 2 characters tax - for example 23%
    const taxGroup1Char = key.slice(key.length - 1, key.length) // 1 character tax - for example 5%

    if (!isNaN(Number.parseInt(taxGroup2Chars))) return taxGroup2Chars
    if (!isNaN(Number.parseInt(taxGroup1Char))) {
      return taxGroup1Char
    } else {
      return 'other'
    }
  })

  delete reportGroups.other

  // put sum, net, total in groups (for example: 0%, 7%, 19%)
  Object.keys(reportGroups).forEach(percentage => {
    if (_.isNil(percentage)) return

    const obj = {}
    reportGroups[percentage].forEach(data => {
      // data is sum, net, total, ...
      obj[data] = _.get(reportData.report, data)
    })

    reportGroups[percentage] = obj
  })

  return {
    companyName, companyAddress, companyTel, companyVatNumber, reportDate, firstOrderDateString, lastOrderDateString,
    subTotal, taxTotal, sumTotal, discount: discount || 0, reportByPayment, reportGroups, z
  }
}

async function printEscPos(escPrinter, printData) {
  const {
    companyName, companyAddress, companyTel, companyVatNumber, reportDate, firstOrderDateString, lastOrderDateString,
    subTotal, taxTotal, sumTotal, discount, reportByPayment, reportGroups, z,
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
  escPrinter.leftRight("Total", convertMoney(sumTotal));
  escPrinter.leftRight("Sub-total", convertMoney(subTotal));
  escPrinter.leftRight("Tax", convertMoney(taxTotal));
  escPrinter.bold(true);
  escPrinter.drawLine();

  escPrinter.bold(false);
  Object.keys(reportGroups).forEach(key => {
    escPrinter.println(`Tax (${key}%)`);
    escPrinter.leftRight('Total', convertMoney(reportGroups[key][`sum${key}`]));
    escPrinter.leftRight('Sub-total', convertMoney(reportGroups[key][`net${key}`]));
    escPrinter.leftRight('Tax', convertMoney(reportGroups[key][`tax${key}`]));
    escPrinter.newLine();
  });

  escPrinter.bold(false);
  escPrinter.leftRight('Discount', `${convertMoney(discount)}`);
  escPrinter.bold(true);
  escPrinter.drawLine();

  escPrinter.bold(false);
  Object.keys(reportByPayment).forEach(paymentType => {
    escPrinter.println(`${paymentType}: ${convertMoney(reportByPayment[paymentType])}`);
  });

  await escPrinter.print();
}

async function printCanvas(printer, printData) {
  const {
    companyName, companyAddress, companyTel, companyVatNumber, reportDate, firstOrderDateString, lastOrderDateString,
    subTotal, taxTotal, sumTotal, discount, reportByPayment, reportGroups, z,
  } = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  printer.alignCenter();
  printer.bold(true);
  printer.println(companyName);
  printer.bold(false);
  printer.setTextNormal();
  printer.println(companyAddress);
  printer.println(`Tel: ${companyTel}`);
  printer.println(`VAT Reg No: ${companyVatNumber}`);

  printer.newLine();
  printer.setTextDoubleHeight();
  printer.bold(true);
  printer.println('Z-Report');

  printer.newLine();
  printer.bold(false);
  printer.setTextNormal();
  printer.alignLeft();
  printer.println(`Report Date: ${reportDate}`);
  printer.println(`Z-Number: ${z}`);
  printer.println(`First Order: ${firstOrderDateString}`);
  printer.println(`Last Order: ${lastOrderDateString}`);
  printer.bold(true);
  printer.drawLine();

  printer.println('Sales');
  printer.bold(false);
  printer.leftRight("Total", convertMoney(sumTotal));
  printer.leftRight("Sub-total", convertMoney(subTotal));
  printer.leftRight("Tax", convertMoney(taxTotal));
  printer.bold(true);
  printer.drawLine();

  printer.bold(false);
  Object.keys(reportGroups).forEach(key => {
    printer.println(`Tax (${key}%)`);
    printer.leftRight('Total', convertMoney(reportGroups[key][`sum${key}`]));
    printer.leftRight('Sub-total', convertMoney(reportGroups[key][`net${key}`]));
    printer.leftRight('Tax', convertMoney(reportGroups[key][`tax${key}`]));
    printer.newLine();
  });

  printer.bold(false);
  printer.leftRight('Discount', `${convertMoney(discount)}`);
  printer.bold(true);
  printer.drawLine();

  printer.bold(false);
  Object.keys(reportByPayment).forEach(paymentType => {
    printer.println(`${paymentType}: ${convertMoney(reportByPayment[paymentType])}`);
  });

  await printer.print();
}

async function printSsr(printer, printData) {
  const ZReport = require('../../dist/ZReport.vue');

  const printComponent = new Vue({
    components: {ZReport},
    render(h) {
      return h('ZReport', {props: printData})
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
