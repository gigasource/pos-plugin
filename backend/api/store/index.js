const path = require('path')
const uuidv1 = require('uuid')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const https = require('https');
const http = require('http');
const axios = require('axios');
const mongoose = require('mongoose');
const {getExternalSocketIoServer} = require('../../socket-io-server');
const {assignDevice} = require('../../api/support');
const teamRoute = require('./team')
const taskRoute = require('./task')
const staffRoute = require('./staff')
const {DEVICE_TYPE} = require('../devices/constants')
const { createStoreBackUpDb, dbExists } = require('../../restaurant-data-backup/index')

const storeAliasAcceptCharsRegex = /[a-zA-Z-0-9\-]/g
const storeAliasNotAcceptCharsRegex = /([^a-zA-Z0-9\-])/g

const StoreModel = cms.getModel('Store');

// upload-zone
router.get('/upload-zone/prepare', async (req, res) => {
  try {
    const protocol = req.query.url.startsWith('https') ? https: http;
    protocol.get(req.query.url, getRes => {
      if (!getRes.headers['content-type'].startsWith('image')) {
        res.status(400).end('Invalid image. Content type received: ', getRes.headers['content-type'])
      } else if (getRes.headers['content-length'] < 1024) {
        res.status(400).end('Bad request')
      } else {
        res.set('Cache-Control', 'public, max-age=31557600')
        getRes.pipe(res)
      }
    })
  } catch (e) {
    console.log(e)
  }
});

/**
 * Check if provided alias is unique or not
 */
router.post('/validate-alias', async (req, res) => {
  const { store, alias } = req.body
  if (_.trim(alias) === '') {
    res.json({ok: false, message: 'WebShop url must not empty!'})
    return
  }
  if (storeAliasNotAcceptCharsRegex.exec(alias)) {
    res.json({ ok: false, message: 'Valid characters are a-z, A-Z, 0-9 and \'-\' character!'})
    return
  }
  const storeWithAlias = await StoreModel.findOne({ alias: _.toLower(alias) })
  const urlTaken = (storeWithAlias && storeWithAlias._id.toString() !== store)
  res.json(urlTaken ? {message: 'WebShop URL has been taken!'} : {ok: true})
})

/**
 * Check if client domain is available to use for specified store
 */
router.post('/validate-client-domain', async (req, res) => {
  const { store, clientDomain } = req.body
  const storeWithClientDomain = await StoreModel.findOne({ clientDomain })
  const urlTaken = (storeWithClientDomain && storeWithClientDomain._id.toString() !== store)
  res.json(urlTaken ? {message: 'Client domain has been taken!'} : {ok: true})
})

/**
 * Return an unique value which will be used as OnlineOrderStore order id
 * This value will be used by both OnlineOrder & Restaurant to tracking, updating order status
 */
router.get('/order-token', async (req, res) => {
  res.json({ token: uuidv1.v1() })
})

/**
 * Every time a store created, new account will be created with it
 * Create an account which own specified store
 * This account will be used by Restaurant to access OnlineOrder store setting page in Restaurant app.
 */
router.post('/new-store', async (req, res) => {
  if (!req.session.user) {
    res.send(403).end()
    return
  }

  const { createdStore: store, storeOwner: owner } = createStore(req.body, req.session.user._id)
  res.json({ ok: true, store, owner })
})

router.delete('/:storeId', async (req, res) => {
  const { storeId } = req.params
  await deleteStore(storeId)
  res.sendStatus(201)
})

router.post('/new-feedback', async (req, res) => {
  const { storeId, type, feedback } = req.body

  await cms.getModel('Feedback').create({
    storeId,
    type,
    feedback,
    created: new Date()
  })

  res.json({ok: true})
})

router.post('/sign-in-requests', async (req, res) => {
  // name: device owner's name enter by device owner
  // role: 'staff' | 'manager'
  let {storeName, googleMapPlaceId, deviceId, role, name, avatar, storeData, pos} = req.body;
  // compatible with old version (without name & role)
  // TODO: remove later
  role = role || 'staff';
  name = name || 'No name';
  if (!storeName || !googleMapPlaceId || !deviceId || !role || !name) return res.status(400).json({error: 'Missing property in request body'});

  const SignInRequestModel = cms.getModel('SignInRequest');

  const existingSignInRequest = await SignInRequestModel.findOne({device: new mongoose.Types.ObjectId(deviceId), status: 'pending'});
  if (existingSignInRequest) return res.status(200).json({message: 'This device already has a pending sign in request'});

  let store = await StoreModel.findOne({googleMapPlaceId}).lean();

  if (pos && !store) {
    // create new store
    const group = await cms.getModel('StoreGroup').findOne({ name: 'Unassigned' })
    const { country, phone, zipCode, address, location } = storeData;
    const data = {
      settingName: storeName,
      settingAddress: address,
      groups: [group._id.toString()],
      googleMapPlaceId: googleMapPlaceId,
      country: { name: country } || { name: 'Germany', locale: 'de-DE' },
      phone: phone,
      zipCode: zipCode,
    };

    if (location) {
      const { lat, lng } = location
      Object.assign(data, {
        coordinates: { lat, long: lng },
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      })
    }

    const { createdStore } = await createStore(data, null, true)
    store = createdStore._doc
    await createStoreBackUpDb(store._id.toString());
  }

  const request = await SignInRequestModel.create({
    device: deviceId,
    status: 'pending',
    requestStoreName: storeName,
    googleMapPlaceId,
    createdAt: new Date(),
    ...store && {store: store._id},
    role,
    name,
    ...avatar && {avatar},
    storeData: storeData || {},
    pos
  });

  const device = await cms.getModel('Device').findById(deviceId);
  const result = {
    deviceId: device._id,
    deviceName: device.name,
    deviceLocation: device.metadata && device.metadata.deviceLocation || 'N/A',
    ...store && {storeName: store.settingName || store.name, storeId: store._id},
    ...request._doc,
    role
  }

  const storeDataInResponse = store ? { _id: store._id.toString(), ...store } : store;
  const response = Object.assign({}, request._doc, { storeData: storeDataInResponse });

  if (pos && store) {
    await cms.getModel('Device').findOneAndUpdate({ _id: deviceId }, { storeId: store._id })
    await cms.getModel('Store').findOneAndUpdate({ _id: store._id }, { $push: { devices: deviceId } })
    const storeDevices = await cms.getModel('Device').find({ storeId: store._id, deviceType: { $ne: 'gsms' } }).lean()
    if (!(await dbExists(store._id.toString()))) response.isFirstDevice = true
  }

  cms.socket.emit('newSignInRequest', {..._.omit(result, ['store', 'device']), ...store && {storeId: store._id}});
  cms.emit('newSignInRequest', result);
  res.status(201).json(response);
});

router.get('/sign-in-requests', async (req, res) => {
  const {status} = req.query;

  const requests = await getRequestsFromDb({...status && {status}});

  res.status(200).json(requests.map(({device, store, storeFromGoogleMap, role, name, ...e}) => {
    if (!device) return null;
    if (!store) store = storeFromGoogleMap

    return {
      deviceId: device._id,
      deviceName: device.name,
      deviceLocation: device.metadata && device.metadata.deviceLocation || 'N/A',
      deviceType: device.deviceType || DEVICE_TYPE.POS,
      ...store && {storeName: store.settingName || store.name, storeId: store._id},
      ...e,
    }
  }).filter(e => !!e));
});

router.get('/sign-in-requests/:requestId', async (req, res) => {
  const {requestId} = req.params;
  if (!requestId) res.status(400).json({error: 'Missing sign-in request ID in API request'});

  const requests = await getRequestsFromDb({_id: new mongoose.Types.ObjectId(requestId)});

  if (requests && requests.length) {
    let {device, store, storeFromGoogleMap, role, name, ...e} = requests[0];
    if (!store) store = storeFromGoogleMap;

    res.status(200).json({request: {
        deviceId: device._id,
        deviceName: device.name,
        deviceLocation: device.metadata && device.metadata.deviceLocation || 'N/A',
        ...store && {storeName: store.settingName || store.name, storeId: store._id},
        ...e,
      }});
  } else {
    res.status(200).json({request: null});
  }
});

router.get('/sign-in-requests/device-pending/:deviceId', async (req, res) => {
  const {deviceId} = req.params;
  if (!deviceId) return res.status(400).json({error: 'Missing deviceId in URL'});

  const requests = await getRequestsFromDb({device: new mongoose.Types.ObjectId(deviceId)});

  if (requests && requests.length) {
    const {status} = requests[0];
    res.status(200).json({request: {status}});
  } else {
    res.status(200).json({request: null});
  }
});

router.put('/sign-in-requests/:requestId', async (req, res) => {
  const {requestId} = req.params;
  if (!requestId)
    return res.status(400).json({error: 'Missing requestId in URL'});

  let {status, storeId} = req.body;
  const update = {
    ...status && {status},
    ...storeId && {store: storeId},
  }

  const request = await cms.getModel('SignInRequest').findOneAndUpdate({_id: requestId}, update, {new: true});
  const StaffModel = cms.getModel('Staff')

  let staff;
  if (status === 'approved') {
    staff = await StaffModel.findOne({
      device: request.device._id,
      store: storeId,
    })

    if(!staff) {
      staff = await StaffModel.create({
        name: request.name,
        role: request.role,
        device: request.device._id,
        store: storeId,
        active: true,
        avatar: request.avatar || ''
      })
    } else {
      staff = await StaffModel.updateOne({ _id: staff._id }, {
        name: request.name,
        role: request.role,
        active: true,
        avatar: request.avatar || staff.avatar || ''
      }, { new: true })
    }

    await assignDevice(request.device._id, request.store);
  }

  if (status === 'approved') {
    // fallback
    if (request.pos) {
      await initApprovedDevice(request.store._id, request.device._id)
    }
    await getExternalSocketIoServer().emitToPersistent(request.device._id, 'approveSignIn', [request.device._id, staff._doc]);
    // new R+
    await getExternalSocketIoServer().emitToPersistent(request.device._id, 'approveSignIn_v2', [{
      clientId: request.device._id,
      requestId: request._id,
      storeId: request.store._id.toString(),
      storeName: request.store.name || request.store.settingName,
      storeAlias: request.store.alias,
      storeLocale: request.store.country ? request.store.country.locale : 'en'
    }]);
  } else if (status === 'notApproved') {
    if (storeId) {
      const store = await cms.getModel('Store').findById(storeId)
      const devices = await cms.getModel('Device').find({storeId})
      if (devices.length < 2 && store.autoGenerated) {
        // delete store
        await deleteStore(storeId)
      }
      await cms.getModel('Store').findOneAndUpdate({ _id: storeId }, {
        $pull: {
          devices: request.device._id
        }
      })
      await cms.getModel('Device').findOneAndUpdate({_id: request.device._id}, {storeId: null})
    }
    // fallback
    await getExternalSocketIoServer().emitToPersistent(request.device._id, 'denySignIn', [request.device._id]);
    // new R+
    await getExternalSocketIoServer().emitToPersistent(request.device._id, 'denySignIn_v2', [{
      clientId: request.device._id,
      requestId: request._id,
    }]);
  }

  res.status(200).json(request._doc);
});

router.get('/sign-in-requests/by-store/:storeId', async (req, res) => {
  const { storeId } = req.params
  if (!storeId) return res.status(400).json({error: 'Missing storeId!'})

  const requests = await cms.getModel('SignInRequest').find({
    store: new mongoose.Types.ObjectId(storeId),
    status: 'pending'
  })
  res.status(200).json(requests.map(r => _.pick(r, ['_id', 'name', 'role'])))
})

function getRequestsFromDb(conditions) {
  const aggregateSteps = [];

  if (typeof conditions === 'object') aggregateSteps.push({$match: conditions});

  aggregateSteps.push({
    $lookup: {
      from: 'stores',
      localField: 'store',
      foreignField: '_id',
      as: 'store',
    },
  });

  aggregateSteps.push({
    $unwind: {
      path: '$store',
      preserveNullAndEmptyArrays: true
    }
  });

  aggregateSteps.push({
    $lookup: {
      from: 'stores',
      localField: 'googleMapPlaceId',
      foreignField: 'googleMapPlaceId',
      as: 'storeFromGoogleMap',
    },
  });

  aggregateSteps.push({
    $unwind: {
      path: '$storeFromGoogleMap',
      preserveNullAndEmptyArrays: true
    }
  });

  aggregateSteps.push({
    $lookup: {
      from: 'devices',
      localField: 'device',
      foreignField: '_id',
      as: 'device',
    },
  });

  aggregateSteps.push({
    $unwind: {
      path: '$device',
      preserveNullAndEmptyArrays: true
    }
  });

  return cms.getModel('SignInRequest').aggregate(aggregateSteps);
}

async function getGooglePlaceByText(placeName) {
  const {mapsApiKey} = global.APP_CONFIG;
  if (!mapsApiKey) return null;

  const searchApiUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
  let {data: searchResult} = await axios.get(searchApiUrl, {
    params: {
      key: mapsApiKey,
      input: placeName,
      fields: 'place_id,geometry',
      inputtype: 'textquery'
    }
  });
  if (searchResult.candidates && searchResult.candidates.length) {
    return searchResult.candidates[0];
  } else {
    return null;
  }
}

async function getPlaceDetail(googlePlaceId) {
  const {mapsApiKey} = global.APP_CONFIG;
  if (!mapsApiKey)
    return null;
  try {
    const placeDetailUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const { data } = await axios.get(placeDetailUrl, {
      params: {
        key: mapsApiKey,
        place_id: googlePlaceId,
        fields: 'geometry'
      }
    })
    return data;
  } catch (e) {
    return null;
  }
}

async function placeAutocomplete(placeName){
  const {mapsApiKey} = global.APP_CONFIG;
  if (!mapsApiKey)
    return [];

  try {
    const autocompleteApiUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
    const { data: autocompleteResult } = await axios.get(autocompleteApiUrl, {
      params: {
        key: mapsApiKey,
        input: placeName,
        language: 'en',
        types: 'establishment'
      }
    })

    if (autocompleteResult && autocompleteResult.predictions && autocompleteResult.predictions.length) {
      return autocompleteResult.predictions.map(prediction => ({
        name: prediction.description,
        placeId: prediction.place_id
      }))
    }
  } catch (e) {
    console.log('error:', e)
  }

  return []
}

router.get('/google-places', async (req, res) => {
  try {
    const { searchPlace } = req.query
    if (searchPlace) {
      const places = await placeAutocomplete(searchPlace) || {}
      res.json(places)
    } else {
      res.json([])
    }
  } catch (e) {
    res.status(400).end()
  }
})

router.get('/basic-info', async (req, res) => {
  const stores = await StoreModel.find({}, {id: 1, name: 1, settingName: 1, alias: 1, logoImageSrc: 1, groups: 1});
  res.json(stores);
})

router.use('/staff', staffRoute)
router.use('/team', teamRoute)
router.use('/task', taskRoute)

router.get('/delivery-forward', async (req, res) => {
  const { id } = req.query
  if(!id) {
    res.json({
      ok: false
    })
  }
  const store = await cms.getModel('Store').findOne({ id })
  if(!store) {
    res.json({
      ok: false
    })
  }
  res.json({
    ok: true,
    store
  })
})

async function createStore(data, userId, auto) {
  let {settingName, settingAddress, groups, country, googleMapPlaceId, coordinates, location, zipCode, phone} = data
  const stores = await StoreModel.find({}, { id: 1, alias: 1 })

  // generate unique store id
  const ids = _.map(stores, s => s.id)
  let id = 0
  do { id++ }
  while(_.includes(ids, id.toString()))

  // generate unique store alias
  const aliases = _.map(stores, s => s.alias)
  let lowerStoreSettingName = _.join(_.filter(_.toLower(settingName), x => x.match(storeAliasAcceptCharsRegex)), '')
  let alias
  let aliasIndex = 0
  do {
    alias = lowerStoreSettingName + (aliasIndex === 0 ? '' : `-${aliasIndex}`)
    aliasIndex++
  } while (_.includes(aliases, alias))

  // Get Google Map Place ID of store if it's not present
  if (!googleMapPlaceId) {
    let restaurantPlace = await getGooglePlaceByText(`${settingName} ${settingAddress}`);
    if (!restaurantPlace) restaurantPlace = await getGooglePlaceByText(settingAddress)

    if (restaurantPlace) {
      const { place_id, geometry: {location: {lat, lng}} } = restaurantPlace
      googleMapPlaceId = place_id

      coordinates = {long: lng, lat}
      location = {
        type: 'Point',
        coordinates: [lng, lat]
      }
    }
  } else {
    try {
      const { result: { geometry: {location: {lat, lng}} } } = await getPlaceDetail(googleMapPlaceId);
      coordinates = {long: lng, lat}
      location = {
        type: 'Point',
        coordinates: [lng, lat]
      }
    } catch (e) {
      console.log('Cannot get geometry information')
    }
  }

  // create store
  const createdStore = await StoreModel.create({
    id, settingName, settingAddress, alias, groups, country,
    addedDate: new Date(),
    autoGenerated: auto,
    name: settingName,
    devices: [],
    openHours: [
      {
        dayInWeeks: [true, true, true, true, true, true, true],
        openTime: '06:30',
        closeTime: '22:30',
        deliveryStart: '06:30',
        deliveryEnd: '22:30'
      }
    ],
    pickup: true,
    delivery: false,
    deliveryFee: {
      acceptOrderInOtherZipCodes: false,
      defaultFee: 0,
      type: 'zipCode',
      zipCodeFees: [],
      distanceFees: []
    },
    orderTimeOut: 3,
    deliveryTimeInterval: 15,
    gSms: {
      enabled: true,
      timeToComplete: 30,
      autoAccept: true,
      devices: []
    },
    reservationSetting: {
      activeReservation: true,
      soundNotification: true,
      hideEmpty: null,
      emailConfirmation: true,
      removeOverdueAfter: 30,
      maxGuest: 20,
      maxDay: 7
    },
    printers: [
      "Kitchen"
    ],
    ...googleMapPlaceId ? {googleMapPlaceId} : {},
    ...location && { location },
    ...coordinates && { coordinates },
    ...zipCode && { zipCode },
    ...phone && { phone }
  })

  const deviceRole = await cms.getModel('Role').findOne({name: 'device'})

  // create store owner
  const storeOwner = await cms.getModel('User').create({
    name: `${settingName}__owner`,
    username: `${alias}__owner__${new Date().getTime()}`,
    password: new Date().getTime(),
    store: createdStore._id,
    createBy: userId,
    role: deviceRole._id,
    active: true,
    permissions: [{ permission: 'manageStore', value: true }]
  })
  await createStoreBackUpDb(createdStore._id.toString());

  return { createdStore, storeOwner }
}

async function deleteStore(storeId) {
  // remove store
  await cms.getModel('Store').deleteOne({_id: storeId})

  // remove products
  await cms.getModel('Product').deleteMany({store: storeId})

  // remove discounts
  await cms.getModel('Discount').deleteMany({store: storeId})

  // remove store owner user
  const deviceRole = await cms.getModel('Role').findOne({name: 'device'})
  await cms.getModel('User').deleteOne({role: deviceRole._id, store: storeId})
}

async function initApprovedDevice(storeId, deviceId) {
  await cms.getModel('Device').findOneAndUpdate({ _id: deviceId }, {
    features: {
      fastCheckout: true,
      manualTable: true,
      delivery: true,
      editMenuCard: true,
      tablePlan: true,
      onlineOrdering: false,
      editTablePlan: true,
      staffReport: true,
      eodReport: true,
      monthlyReport: true,
      remoteControl: true,
      proxy: true,
      alwaysOn: true,
      reservation: false,
      startOnBoot: false
    }
  })

  const storeDevices = await cms.getModel('Device').find({ storeId, deviceType: { $ne: 'gsms' } }).lean()
  const isFirstDevice = !(await dbExists(storeId));
  if (isFirstDevice) {
    const store = await StoreModel.findById(storeId)
    const demoData = store.demoDataSrc;
    if (demoData)
      await getExternalSocketIoServer().emitToPersistent(deviceId, 'import-init-data', demoData)
  }

  return isFirstDevice
}

async function setMasterDevice(storeId, deviceId) {
  const storeDevices = await cms.getModel('Device').find({ storeId })
  await cms.getModel('Device').updateMany({ _id: { $in: storeDevices.map(d => d._id) } }, { master: false })
  await cms.getModel('Device').findOneAndUpdate({ _id: deviceId }, { master: true })
  const devices = await cms.getModel('Device').find({ storeId, deviceType: { $ne: 'gsms' }, paired: true }).lean();
  devices.forEach(device => {
    console.log(`Sending master ip to ${device._id.toString()}`);
    getExternalSocketIoServer().emitToPersistent(device._id.toString(), 'updateMasterDevice', [deviceId]);
  })
}

router.put('/demo-data/:storeId', async (req, res) => {
  const { storeId } = req.params
  if (!storeId) return res.sendStatus(400)

  const store = await StoreModel.findById(storeId)
  if (!store) return res.sendStatus(400)

  const { filePath } = req.body
  if (filePath) {
    await StoreModel.findOneAndUpdate({ _id: storeId }, {
      demoDataSrc: filePath
    })
  }

  res.sendStatus(200)
})

router.get('/demo-data/:storeId', async (req, res) => {
  const { storeId } = req.params
  if (!storeId) return res.sendStatus(400)

  const store = await StoreModel.findById(storeId)
  if (!store) return res.sendStatus(400)
  const demoDataSrc = store.demoDataSrc

  res.status(200).json({ demoDataSrc })
})

router.get('/demo-stores', async (req, res) => {
  const templateFolderPath = '/store-demo-data/template'
  const { data } = await axios.get(
    `http://localhost:${global.APP_CONFIG.port}/cms-files/file-metadata?folderPath=${templateFolderPath}`)
  let files = []

  if (data && data.length) {
    files = data.filter(f => !f.isFolder && f.fileName.endsWith('.json')).map(({ fileName }) =>
      ({ fileName: `/cms-files/files/view/${templateFolderPath}/${fileName}` }))
    for (const file of files) {
      const fileName = path.basename(file.fileName, '.json')
      const storeId = fileName.split('-')[2]
      const store = await StoreModel.findById(storeId).lean()
      file.image = store.demoImgSrc
      file.storeId = storeId
      file.storeName = store.name || store.settingName
    }
  }

  res.status(200).json(files)
})

module.exports = router
module.exports.createStore = createStore
module.exports.deleteStore = deleteStore
module.exports.setMasterDevice = setMasterDevice
