const express = require('express')

const router = express.Router()
const storeModel = cms.getModel('Store');

async function getNewDeviceCode(id) {
  if (!id) return
  let code = 0

  const store = await storeModel.findOne({ id })
  const devices = store.gSms.devices
  if (!devices || !devices.length) return code

  code = (+devices.sort((cur, next) => next.code - cur.code)[0].code || 0) + 1
  return code
}

router.post('/register', async (req, res) => {
  //todo remove query in later versions
  let { storeId, name } = req.body

  if (!storeId) storeId = req.query.storeId
  if (!name) name = req.query.name

  if (!storeId) return res.sendStatus(400)

  try {
    const deviceCode = await getNewDeviceCode(storeId)
    const store = await storeModel.findOne({ id: storeId })
    const accept = (store.gSms && store.gSms.autoAccept)

    await storeModel.findOneAndUpdate({ id: storeId }, {
      $push: {
        'gSms.devices': {
          name: name,
          code: deviceCode,
          registered: accept,
          total: 0,
          orders: 0,
          lastSeen: null
        }
      }
    })

    const updatedStore = await storeModel.findOne({ id: storeId })
    const { _id, code } = updatedStore.gSms.devices.find(i => i.code === deviceCode + '')

    res.status(200).json({
      deviceCode: code,
      id: _id,
      storeName: updatedStore.name || updatedStore.settingName,
      storeAlias: updatedStore.alias
    })

    console.debug(`sentry:deviceName=${name},eventType=pair,storeId=${storeId}`,
      `2. Online-order: Registered demo client ${name} `)
    //emit to frontend, refresh device list
    cms.socket.emit('loadStore', storeId)
  } catch (e) {
    console.log(e)
    res.status(500).send('Encountered an error while registering!')
    console.debug(`sentry:deviceName=${name},eventType=pair,storeId=${storeId}`,
      `2a. Online-order: Failed to register demo client ${name}`, e)
  }
})

router.post('/unregister', async (req, res) => {
  //todo remove query in later versions
  let { storeId, deviceId, deviceName } = req.body

  if (!storeId) storeId = req.query.storeId
  if (!deviceId) deviceId = req.query.deviceId
  if (!deviceName) deviceName = req.query.deviceName

  if (!deviceId || !storeId) return res.sendStatus(400)

  try {
    await storeModel.findOneAndUpdate({ id: storeId }, {
      $pull: {
        'gSms.devices': { _id: deviceId }
      }
    })
    res.status(200).json({ message: `Unregistered ${deviceName} successfully` })

    console.debug(`sentry:deviceName=${deviceName},eventType=pair,storeId=${storeId}`,
      `Online-order: Successfully unregistered demo client ${deviceName}`)
    //emit to frontend, refresh device list
    cms.socket.emit('loadStore', storeId)
  } catch (e) {
    console.log(e)
    res.status(500).send('Encountered an error while unregistering!')
    console.debug(`sentry:deviceName=${deviceName},eventType=pair,storeId=${storeId}`,
      `Online-order: Failed to unregister demo client ${deviceName}`, e)
  }
})

router.get('/google-my-business-id', async (req, res) => {
  const storeId = req.query.storeId
  const store = await storeModel.findOne({ _id: storeId })
  if (!store)
    res.status(400).end();
  else
    res.status(200).json({ googleMyBusinessId: store.googleMyBusinessId })
})

router.get('/revenue-monthly-report', async (req, res) => {
  const storeId = req.query.storeId
  const store = await storeModel.findOne({ _id: storeId })
  if (!store)
    res.status(400).end()
  else
    res.status(200).json({
      prevMonthReport: store.prevMonthReport,
      currentMonthReport: store.currentMonthReport
    })
})

module.exports = router
module.exports.getNewDeviceCode = getNewDeviceCode
