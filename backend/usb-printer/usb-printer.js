const usb = require('usb');
const rnBridge = require('rn-bridge')

const EVENT = 'load-usb-printers';

const getUsbPrinterDevices = () => {
  return usb.getDeviceList().filter(device => {
    try {
      return device.configDescriptor.interfaces.filter(iface => iface.filter(conf => conf.bInterfaceClass === 0x07).length).length;
    } catch (e) {
      return false;
    }
  });
}

const extractDeviceInfo = (d, metaData) => {
  const idVendor = d.deviceDescriptor.idVendor;
  const idProduct = d.deviceDescriptor.idProduct;
  return {
    id: `${idVendor.toString(16)}/${idProduct.toString(16)}/${d.portNumbers.join('/')}`,
    idVendor,
    idProduct,
    ...getMetaData(metaData, idVendor, idProduct)
  }
}

const getMetaData = (metaDataCol, vendorId, productId) => {
  const metadata = metaDataCol.find(p => p.mVendorId === vendorId && p.mProductId === productId)
  return {
    name: metadata.mName,
    manufacturerName: metadata.mManufacturerName,
    productName: metadata.mProductName
  }
}

module.exports = cms => {
  cms.socket.on('connect', socket => {
    socket.on('load-usb-printers', callback => {
      console.log('usb-printer:load-usb-printers. gathering metadata from android...');
      rnBridge.app.send(EVENT);
      rnBridge.app.on('message', message => {
        const {event} = message;
        if (event === EVENT) {
          let metaData = message.devices;
          console.log('usb-printer:load-usb-printer:response', metaData);
          try {
            metaData = JSON.parse(metaData);
            const result = getUsbPrinterDevices().map(d => extractDeviceInfo(d, metaData))
            callback(result)
          } catch (e) {
            console.log(e)
          }
        }
      });
    })
  })
}
