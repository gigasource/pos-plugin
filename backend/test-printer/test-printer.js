const EscPrinter = require('../print-utils/node-thermal-printer');
const DataForSendToTSC = require('tscprinter/src/DataForSendToPrinterTSC')

class TscPrinter extends EscPrinter {
    constructor(printerConfig) {
      super(printerConfig);
    }

    println(text) {
      this.buffer = Buffer.concat([
        DataForSendToTSC.sizeBydot(480, 240),
        DataForSendToTSC.cls(),
        DataForSendToTSC.text(0, 0, '1', 0, 2, 2, text),
        DataForSendToTSC.print(1)
      ])
    }
}

module.exports = cms => {
  cms.socket.on('connect', socket => {
    socket.on('testPrinter', async printerConfig => {
      let printer;
      if (printerConfig.tscPOS) {
        console.log('test tsc printer')
        printer = new TscPrinter(printerConfig);
      } else {
        console.log('test esc printer')
        printer = new EscPrinter(printerConfig);
      }
      printer.println('Test Drucker');
      await printer.print();
    })
  })
}
