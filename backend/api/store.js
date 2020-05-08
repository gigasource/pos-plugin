const uuidv1 = require('uuid')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const https = require('https');
const http = require('http');

const storeAliasAcceptCharsRegex = /[a-zA-Z-0-9\-]/g
const storeAliasNotAcceptCharsRegex = /([^a-zA-Z0-9\-])/g

// upload-zone
router.get('/upload-zone/prepare', async (req, res) => {
  try {
    const protocol = req.query.url.startsWith('https') ? https: http;
    protocol.get(req.query.url, getRes => {
      if (getRes.headers['content-length'] < 1024) {
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
  const storeWithAlias = await cms.getModel('Store').findOne({ alias: _.toLower(alias) })
  const urlTaken = (storeWithAlias && storeWithAlias._id.toString() !== store)
  res.json(urlTaken ? {message: 'WebShop URL has been taken!'} : {ok: true})
})

/**
 * Check if client domain is available to use for specified store
 */
router.post('/validate-client-domain', async (req, res) => {
  const { store, clientDomain } = req.body
  const storeWithClientDomain = await cms.getModel('Store').findOne({ clientDomain })
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

  const {settingName, settingAddress, groups, country} = req.body

  const stores = await cms.getModel('Store').find({}, { id: 1, alias: 1 })

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

  // create store
  const createdStore = await cms.getModel('Store').create({
    id, settingName, settingAddress, alias, groups, country,
    addedDate: new Date(),
    openHours: [
      {
        dayInWeeks: [true, true, true, true, true, true, true],
        openTime: '06:30',
        closeTime: '22:30'
      }
    ],
    pickup: true,
    delivery: true,
    deliveryFee: {
      acceptOrderInOtherZipCodes: true,
      defaultFee: 0,
      fees: []
    }
  })

  const deviceRole = await cms.getModel('Role').findOne({name: 'device'})

  // create store owner
  const storeOwner = await cms.getModel('User').create({
    name: `${settingName}__owner`,
    username: `${alias}__owner__${new Date().getTime()}`,
    password: new Date().getTime(),
    store: createdStore._id,
    createBy: req.session.user._id,
    role: deviceRole._id,
    active: true,
    permissions: [{ permission: 'manageStore', value: true }]
  })

  res.json({
    ok: true,
    store: createdStore,
    owner: storeOwner
  })
})

module.exports = router