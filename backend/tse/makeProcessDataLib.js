const numeral = require('numeral');
const moment = require('dayjs');
const JsonFn = require('json-fn');
const _ = require('lodash');
//numeral.register('locale', 'de', {delimiters: {thousands: '', decimal: ','}});
//numeral.locale('de');

//const beleg = makeKassenBelegFinish(testOrder);

function getPayment(payment) {
  if (payment.type === 'cash') return 'Bar';
  return 'Unbar'
}

const vorgangstypConstant = {
  Beleg: 'Beleg',
  AVTransfer: 'AVTransfer',
  AVBestellung: 'AVBestellung',
  AVTraining: 'AVTraining',
  AVBelegstorno: 'AVBelegstorno',
  AVBelegabbruch: 'AVBelegabbruch',
  AVSachbezug: 'AVSachbezug',
  AVSonstige: 'AVSonstige',
  AVRechnung: 'AVRechnung'
}

function makeKassenBelegFinish(order, getTotal, getTotalTax) {
  //Beleg^75.33_7.99_0.00_0.00_0.00^ 10.00:Bar_5.00:Bar:CHF_5.00:Bar:USD_64.30:Unbar

  const processType = 'Kassenbeleg-V1';

  let Vorgangstyp = vorgangstypConstant.Beleg;
  const betrag = getTotal(order);
  //
  let zahlungen = [];
  const payments = _.orderBy(order.payment, p => p.type === 'cash'? 0: 1);
  for (const payment of payments) {
    const tax = numeral(payment.value).format('0.00')
    zahlungen.push(`${tax}:${getPayment(payment)}`)
  }
  ///const
  //let zahlungen = `${betrag}_${getPayment(order)}`;

  const transactionData = `${Vorgangstyp}^${getTotalTax(order)}^${zahlungen.join('_')}`;
  return {
    processType,
    transactionData
  }
}

function makeKassenBestellung(items, cancellationsItem, allowPassthrough) {
  const result = {
    processType: 'Bestellung-V1',
    transactionData: ''
  }
  const transactionDataArr = [];
  const lineBreaker = '\r';

  for (const item of items) {
    const _item = JsonFn.clone(item);
    if (_item.tseMethod === 'passthrough' && !allowPassthrough) {
      continue;
    }
    if (_item.tseMethod === 'apply:1' && !allowPassthrough) {
      _item.quantity = 1;
    }
    const _price = _item.price + _.sumBy(item.modifiers, m => m.price * m.quantity);
    const price = numeral(_price).format('0.00');
    transactionDataArr.push(`${_item.quantity};${_item.name};${price}`);
  }

  for (const item of (cancellationsItem || [])) {
    const _item = JsonFn.clone(item);
    if (_item.tseMethod === 'passthrough' && !allowPassthrough) {
      continue;
    }
    // apply:1 ??
    const price = numeral(item.price).format('0.00');
    transactionDataArr.push(`-${item.quantity};${item.name};${price}`)
  }

  result.transactionData = transactionDataArr.join(lineBreaker);
  return result;
}

function makeQr({
                  qrCodeVersion = 'V0',
                  kassenSeriennummer = '00001',
                  processType = 'Kassenbeleg-V1',
                  processData,
                  transactionNumber,
                  signatureCounter,
                  startTime,
                  logTime,
                  sigAlg = 'ecdsa-plain-SHA256',
                  logTimeFormat = 'unixTime',
                  signature,
                  publicKey
                }) {
  return `${qrCodeVersion};${kassenSeriennummer};${processType};${processData};${transactionNumber};${signatureCounter};${startTime};${logTime};${sigAlg};${logTimeFormat};${signature};${publicKey}`
}

function extractQr(qrCode) {
  const [qrCodeVersion, kassenSeriennummer, processType, processData, transactionNumber,
    signatureCounter, startTime, logTime, sigAlg, logTimeFormat, signature, publicKey] = qrCode.split(';');
  return {
    qrCodeVersion,
    kassenSeriennummer,
    processType,
    processData,
    transactionNumber,
    signatureCounter,
    startTime: moment.unix(startTime).format('DD.MM.YYYY HH:mm:ss'),
    logTime: moment.unix(logTime).format('DD.MM.YYYY HH:mm:ss'),
    sigAlg,
    logTimeFormat,
    signature,
    publicKey
  }
}

module.exports = {
  makeKassenBelegFinish,
  makeKassenBestellung,
  makeQr,
  extractQr
}
