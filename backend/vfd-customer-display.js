const _ = require('lodash')
const numeral = require('numeral')
const normalizeString = require('./print/print-utils/normalize-string')
let SerialPort
let UsbSerial
let spCustomerdisplay = null

// printToCustomerdisplay({ item: { name: 'Coke', price: 20 }, sum: '20' })
// printToCustomerdisplay({ line1: 'Hello world!', line2: 'Oops! Goodbye.' })

function printToCustomerdisplay({ line1, line2, sum, item, rabatt }) {
  let comName = '/dev/tty.usbserial-1440'

  if (!line1) {
    if (item) {
      const price = numeral(item.price).format('0.00');
      if (item.name.length < 20 - price.length) {
        line1 = `${_.padEnd(item.name, 20 - price.length)}${price}`;
      } else {
        line1 = `${item.name.substring(0, 20)}`;
      }
      line1 = normalizeString(line1);
    } else if (rabatt) {
      rabatt = rabatt.toString();
      line1 = `${_.padEnd('Rabatt:', 19 - rabatt.length)}${rabatt}%`;
    } else {
      line1 = '';
    }


    sum = numeral(sum).format('0.00');
    line2 = `${_.padEnd('Summe:', 20 - sum.length)}${sum}`;
    line2 = normalizeString(line2);
  }
  const pre1 = `${String.fromCharCode(0x1F)}${String.fromCharCode(0x43)}${String.fromCharCode(0)}${String.fromCharCode(0x0C)}${String.fromCharCode(0x0B)}`;
  const pre2 = `${String.fromCharCode(0x1F)}${String.fromCharCode(0x42)}${String.fromCharCode(0x0D)}`;

  if (!spCustomerdisplay) {
    if (comName === 'USB') {
      if (!UsbSerial) {
        UsbSerial = require('usbserial');
      }
      spCustomerdisplay = new UsbSerial();
      spCustomerdisplay.on('ready', () => spCustomerdisplay.send(buffer));
    } else {
      if (!SerialPort) {
        SerialPort = require('serialport');
      }

      SerialPort.list().then(function (serials) {
        if (_.find(serials, { path: comName })) {
          spCustomerdisplay = new SerialPort(comName, {
            baudRate: 9600
          });

          spCustomerdisplay.on('open', function (err) {
            spCustomerdisplay.write(`${pre1}${line1}${pre2}${line2}`, function (err, results) {
              spCustomerdisplay.drain(function () {});
            });
          });

          spCustomerdisplay.on('error', function (err) {
            spCustomerdisplay = null;
            console.log('Error:', err.message);
          })
        }
      })
    }
  } else {
    spCustomerdisplay.write(`${pre1}${line1}${pre2}${line2}`, function (err, results) {
      spCustomerdisplay.drain(function () {
      });
    });
  }

  if (sum && !item && spCustomerdisplay) {
    setTimeout(function () {
      spCustomerdisplay.write(`${pre1}${pre2}`, function (err, results) {
        spCustomerdisplay.drain(function () {
        });
      });
    }, 2 * 60 * 1000)
  }
}
