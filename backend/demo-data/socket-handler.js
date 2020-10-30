const fs = require('fs')
const url = require('url')
const path = require('path')
const axios = require('axios')
const jsonFn = require('json-fn')
const FormData = require('form-data')

const { webshopUrl: webshopUrlFromConfig } = global.APP_CONFIG;
const cdnFolderName = 'store-demo-data'

function getPath(end) {
  return path.join(process.cwd(), end)
}

async function getWebShopUrl() {
  const posSetting = await cms.getModel('PosSetting').findOne()
  return posSetting.customServerUrl ? posSetting.customServerUrl : webshopUrlFromConfig
}

async function getStoreId() {
  const posSettings = await cms.getModel('PosSetting').findOne()
  if (posSettings && posSettings.onlineDevice && posSettings.onlineDevice.store) {
    const store = posSettings.onlineDevice.store
    return store.id
  }
}

module.exports = cms => {
  cms.socket.on('connect', socket => {
    socket.on('export-demo-data', async (exportRoom, cb = () => null) => {
      const storeId = await getStoreId()
      if (!storeId) return

      // collections: Category, Product, OrderLayout, GroupPrinter, PosModifierGroup, PosModifierCategory, PosPopupModifier
      // optional Room
      const data = {}
      const categories = await cms.getModel('Category').find()
      const products = await cms.getModel('Product').find()
      const orderLayouts = await cms.getModel('OrderLayout').find()
      const popUpModifierGroups = await cms.getModel('PosModifierGroup').find()
      const popUpModifierCategories = await cms.getModel('PosModifierCategory').find()
      const popUpModifiers = await cms.getModel('PosPopupModifier').find()
      const groupPrinters = await cms.getModel('GroupPrinter').find()

      Object.assign(data, {
        'GroupPrinter': groupPrinters,
        'Category': categories,
        'PosModifierGroup': popUpModifierGroups,
        'PosModifierCategory': popUpModifierCategories,
        'PosPopupModifier': popUpModifiers,
        'Product': products,
        'OrderLayout': orderLayouts
      })

      if (exportRoom) {
        const rooms = await cms.getModel('Room').find()
        Object.assign(data, {
          'Room': rooms
        })
      }

      // write to json
      const fileContent = JSON.stringify(data)
      const filePath = getPath(`demo-data-${new Date().getTime()}.json`);
      fs.writeFileSync(filePath, fileContent)

      // upload to paired store
      try {
        const formData = new FormData()
        const cdnFileName = `demo-data-${storeId}.json`;
        const cdnUploadPath = `/cms-files/files?overwrite=true&folderPath=/${cdnFolderName}`
        const cdnFilePath = `/cms-files/files/view/${cdnFolderName}/${cdnFileName}`
        formData.append('file', fileContent, { filename: cdnFileName, contentType: 'application/json' })
        const uploadUrl = url.resolve(await getWebShopUrl(), cdnUploadPath)
        const uploadRequest = {
          method: 'post',
          headers: formData.getHeaders(),
          url: uploadUrl,
          data: formData
        }

        const response = await axios(uploadRequest)
        if (response.data && response.data[0].uploadSuccess) {
          const updateUrl = url.resolve(await getWebShopUrl(), `store/demo-data/${storeId}`)
          await axios.put(updateUrl, {
            filePath: cdnFilePath
          })
        }

        cb()
      } catch (e) {
        console.log('error exporting demo data', e)
      }
    })

    socket.on('import-demo-data', async (cb) => {
      const storeId = await getStoreId()
      if (!storeId) return
      try {
        const { data: { demoDataSrc } } = await axios.get(url.resolve(await getWebShopUrl(), `store/demo-data/${storeId}`))
        if (!demoDataSrc) return
        const downloadUrl = url.resolve(await getWebShopUrl(), demoDataSrc, { responseType: 'stream' })

        axios.get(downloadUrl).then(async response => {
          const { data } = response
          for (const collection in data) {
            if (data.hasOwnProperty(collection)) {
              const documents = data[collection]
              // drop local db, import from response
              await cms.getModel(collection).deleteMany()
              await cms.getModel(collection).create(documents)
            }
          }
        })

        cb()
      } catch (e) {
        console.log('error importing demo data', e)
      }
    })
  })
}
