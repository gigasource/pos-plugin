const { ledDisplaySocketEvents: ldso, ledDisplayInterfaceConstants } = require('../../components2/Settings/CustomerScreenConfig/customre-led-display-constants')
const printToCustomerdisplay = require('./vfd-customer-display')
let SerialPort
let UsbSerial

module.exports = (cms) => {
  cms.socket.on('connect', socket => {
    socket.on(ldso.loadLedDisplays, (payload, callback) => {
      const { ledInterface } = payload;
      if (ledInterface === ledDisplayInterfaceConstants.Serial) {
        if (!SerialPort)
          SerialPort = require('serialport')
        SerialPort.list().then(serialPorts => callback(serialPorts.map(sp => sp.path)))
      } else {
        if (!UsbSerial)
          UsbSerial = require('usbserial')
        callback([])
      }
    })

    socket.on(ldso.testLedDisplay, ({path}) => {
      printToCustomerdisplay({ line1: 'Hello there!', line2: (path || '').substr(0, 20) })
    })
  })
}
