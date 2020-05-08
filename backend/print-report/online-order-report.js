const {convertHtmlToPng} = require('../print-utils/print-utils');
const vueSsrRenderer = require('../print-utils/vue-ssr-renderer');
const Vue = require('vue');
const dayjs = require('dayjs');

function convertMoney(value) {
  return !isNaN(value) ? value.toFixed(2) : value
}

async function makePrintData(cms, {orderId}) {
  const order = await cms.getModel('Order').findById(orderId);
  const i18nSetting = await cms.getModel('SystemConfig').findOne({type: 'I18n'});
  const locale = i18nSetting ? i18nSetting.content.locale : 'en';
  const localeFilePath = `../../i18n/${locale}.js`;
  const localeObj = require(localeFilePath)[locale];

  if (!order) return null;

  const {
    customer: {name, phone, address, zipCode, company},
    note,
    items,
    shippingFee,
    vSum: orderSum,
    date,
    deliveryTime,
  } = order;

  return {
    orderNumber: order.id,
    customerName: name,
    customerPhone: phone,
    customerAddress: address,
    customerZipCode: zipCode,
    customerCompany: company,
    note,
    items,
    shippingFee,
    orderSum,
    date: dayjs(date).format(localeObj.printing.dateFormat),
    deliveryTime,
    locale: localeObj,
  };
}

async function printEscPos(escPrinter, printData) {
  let {
    orderNumber,
    customerName,
    customerPhone,
    customerAddress,
    customerZipCode,
    customerCompany,
    note,
    items,
    shippingFee,
    orderSum,
    date,
    locale,
    deliveryTime,
  } = printData;

  escPrinter.alignCenter();
  escPrinter.setTextDoubleHeight();
  escPrinter.bold(true);
  escPrinter.leftRight(`${locale.printing.delivery} #${orderNumber}`, deliveryTime)
  if (customerCompany) {
    escPrinter.invert(true);
    escPrinter.println(`${locale.printing.company}`);
    escPrinter.invert(false);
  }

  escPrinter.newLine()

  escPrinter.alignLeft()
  escPrinter.setTextNormal()
  escPrinter.println(customerName)
  customerCompany && escPrinter.println(customerCompany)
  customerAddress && escPrinter.println(customerAddress)
  customerZipCode && escPrinter.println(customerZipCode)
  escPrinter.println(customerPhone)
  note && escPrinter.println(note)
  escPrinter.newLine()

  escPrinter.drawLine()
  escPrinter.bold(true)
  escPrinter.tableCustom([
    {text: 'Artikel', align: 'LEFT', width: 0.4},
    {text: 'Menge', align: 'RIGHT', width: 0.12},
    {text: 'E.P', align: 'RIGHT', width: 0.22},
    {text: 'Summe', align: 'RIGHT', width: 0.22},
  ])
  escPrinter.drawLine()

  escPrinter.setTextNormal()
  items.forEach(item => {
    escPrinter.tableCustom([
      {text: `${item.id}. ${item.name}`, align: 'LEFT', width: 0.4},
      {text: `${item.quantity}`, align: 'RIGHT', width: 0.12},
      {text: `${convertMoney(item.price)}`, align: 'RIGHT', width: 0.22},
      {text: `${convertMoney(item.price * item.quantity)}`, align: 'RIGHT', width: 0.22},
    ])
  })
  escPrinter.drawLine()
  escPrinter.bold(true)
  escPrinter.leftRight(`Summe`, `EUR ${convertMoney(orderSum)}`)
  escPrinter.newLine()
  escPrinter.alignCenter()
  escPrinter.setTextNormal()
  escPrinter.println(date)

  await escPrinter.print()
}

async function printSsr(printer, printData) {
  const OrderDelivery = require('../../dist/OrderDelivery.vue');

  const component = new Vue({
    components: {OrderDelivery},
    render(h) {
      return h('OrderDelivery', {
        props: {
          ...printData,
          fontSize: printer.fontSize,
          marginTop: printer.marginTop
        }
      })
    }
  })

  vueSsrRenderer.renderToString(component, {}, async (err, html) => {
    if (err) throw err

    const reportPng = await convertHtmlToPng(html)
    printer.printPng(reportPng)
    await printer.print()
  })
}

module.exports = {
  makePrintData,
  printEscPos,
  printSsr
}
