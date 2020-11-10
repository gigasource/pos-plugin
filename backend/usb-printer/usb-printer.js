try {
  const uuid = require('uuid')
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

  const cbCache = {}

  rnBridge.app.on('load-usb-printers', (payload) => {
    console.log('usb-printer:load-usb-printer:response', payload);
    try {
      const { devices, callbackId } = payload;
      const result = getUsbPrinterDevices().map(d => extractDeviceInfo(d, devices))
      if (callbackId && cbCache[callbackId]) {
        cbCache[callbackId](result)
      } else {
        console.log(`Found 0 callback with callback id = "${callbackId}" for current response.`)
      }
    } catch (e) {
      console.log(e)
    }
  });

  module.exports = cms => {
    cms.socket.on('connect', socket => {
      socket.on('load-usb-printers', callback => {
        console.log('usb-printer:load-usb-printers. gathering metadata from android...');
        const callbackId = uuid.v4()
        console.log(`Register callback with id = "${callbackId}" for event "load-usb-printers"`)
        cbCache[callbackId] = callback
        rnBridge.app.sendObject('load-usb-printers', { callbackId });
      })
    })
  }

} catch (e) {
  console.log('usb-printer.js', e)
  module.exports = cms => {
    cms.socket.on('connect', socket => {
      socket.on('load-usb-printers', callback => {
        callback([])
      })
    });
  }
}
