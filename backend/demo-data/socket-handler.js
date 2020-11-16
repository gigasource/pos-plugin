const fs = require('fs')
const url = require('url')
const path = require('path')
const axios = require('axios')
const jsonFn = require('json-fn')
const FormData = require('form-data')

const { webshopUrl: webshopUrlFromConfig } = global.APP_CONFIG;
const cdnFolderName = 'store-demo-data'
const cdnTemplateFolderName = 'store-demo-data/template'

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
    socket.on('export-demo-data', async (isTemplate, cb = () => null) => {
      const storeId = await getStoreId()
      if (!storeId) return cb()

      // collections: Category, Product, OrderLayout,
      // PosModifierGroup, PosModifierCategory, PosPopupModifier, Room
      const data = {}
      const categories = await cms.getModel('Category').find()
      const products = await cms.getModel('Product').find()
      const orderLayouts = await cms.getModel('OrderLayout').find()
      const popUpModifierGroups = await cms.getModel('PosModifierGroup').find()
      const popUpModifierCategories = await cms.getModel('PosModifierCategory').find()
      const popUpModifiers = await cms.getModel('PosPopupModifier').find()
      const rooms = await cms.getModel('Room').find()

      Object.assign(data, {
        'Category': categories,
        'PosModifierGroup': popUpModifierGroups,
        'PosModifierCategory': popUpModifierCategories,
        'PosPopupModifier': popUpModifiers,
        'Product': products,
        'OrderLayout': orderLayouts,
        'Room': rooms
      })

      // write to json
      const fileContent = JSON.stringify(data)
      const filePath = getPath(`demo-data-${new Date().getTime()}.json`);
      fs.writeFileSync(filePath, fileContent)

      // upload to paired store
      try {
        const folder = isTemplate ? cdnTemplateFolderName : cdnFolderName
        const formData = new FormData()
        const cdnFileName = `demo-data-${storeId}.json`;
        const cdnUploadPath = `/cms-files/files?overwrite=true&folderPath=/${folder}`
        const cdnFilePath = `/cms-files/files/view/${folder}/${cdnFileName}`
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
        cb(e)
      }
    })

    socket.on('import-demo-data', async (cb) => {
      const storeId = await getStoreId()
      if (!storeId) return cb()
      try {
        const { data: { demoDataSrc } } = await axios.get(url.resolve(await getWebShopUrl(), `store/demo-data/${storeId}`))
        if (!demoDataSrc) return
        const downloadUrl = url.resolve(await getWebShopUrl(), demoDataSrc, { responseType: 'stream' })
        const { data } = axios.get(downloadUrl)
        await importDemoData(data)

        cb()
      } catch (e) {
        console.log('error importing demo data', e)
        cb(e)
      }
    })

    socket.on('get-demo-stores', async cb => {
      const apiUrl = url.resolve(await getWebShopUrl(), 'store/demo-stores');
      try {
        const { data } = await axios.get(apiUrl)
        const stores = await Promise.all(data.map(async d => {
          return {
            ...d,
            fileName: d.fileName && url.resolve(await getWebShopUrl(), d.fileName).toString(),
            image: d.image && url.resolve(await getWebShopUrl(), d.image).toString()
          }
        }));
        cb(stores)
      } catch (error) {
        cb([], error)
      }
    })

    socket.on('set-demo-store', async (store, cb) => {
      global.APP_CONFIG.isMaster = true
      await cms.execPostAsync('load:handler')
      if (!store) return cb()

      const { fileName } = store
      const downloadUrl = url.resolve(await getWebShopUrl(), fileName, { responseType: 'stream' })
      const { data } = await axios.get(downloadUrl)
      await importDemoData(data)
      cms.socket.emit('updateRooms')
      cb()
    })
  })
}

async function importDemoData(data) {
  for (const collection in data) {
    if (data.hasOwnProperty(collection)) {
      const documents = data[collection]
      // drop local db, import from response
      await cms.getModel(collection).deleteMany()
      await cms.getModel(collection).create(documents)
    }
  }
}

module.exports.importDemoData = importDemoData
