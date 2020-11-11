try {
  const uuid = require('uuid')
  const usb = require('usb');
  const rnBridge = require('rn-bridge')

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
    const productName = metadata.mProductName ? metadata.mProductName : metadata.mName
    const manufacturerName = metadata.mManufacturerName ? metadata.mManufacturerName : "Noname"
    return {
      name: metadata.mName,
      manufacturerName: manufacturerName,
      productName: productName
    }
  }

  module.exports = cms => {
    cms.socket.on('connect', socket => {
      socket.on(LOAD_USB_PRINTER, callback => {

        if (typeof (callback) !== 'function') {
          console.error(`usb-printer:${LOAD_USB_PRINTER}: callback is not a function.`)
          return;
        }

        rnBridge.app.once(LOAD_USB_PRINTER, payload => {
          console.log(`usb-printer:${LOAD_USB_PRINTER}:response`, payload);
          try {
            const { devices } = payload;
            const result = getUsbPrinterDevices().map(d => extractDeviceInfo(d, devices))
            callback && callback(result)
          } catch (e) {
            console.log(e)
          }
        });

        console.log(`usb-printer:${LOAD_USB_PRINTER}. gathering metadata from android`);
        rnBridge.app.sendObject(LOAD_USB_PRINTER, { });
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
