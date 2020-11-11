const usb = require('usb');
const LOAD_USB_PRINTER = 'load-usb-printers';

const getUsbPrinterDevices = () => {
  return usb.getDeviceList().filter(device => {
    try {
      return device.configDescriptor.interfaces.filter(iface => iface.filter(conf => conf.bInterfaceClass === 0x07).length).length;
    } catch (e) {
      return false;
    }
  });
}

const extractDeviceInfo = (d) => {
  const idVendor = d.deviceDescriptor.idVendor;
  const idProduct = d.deviceDescriptor.idProduct;
  return `${idVendor.toString(16)}/${idProduct.toString(16)}/${d.portNumbers.join('/')}`;
}

module.exports = cms => {
  cms.socket.on('connect', socket => {
    socket.on(LOAD_USB_PRINTER, callback => {
      console.log(`usb-printer:${LOAD_USB_PRINTER}`)
      const result = getUsbPrinterDevices().map(extractDeviceInfo);
      callback && callback(result)
    })
  })
}
