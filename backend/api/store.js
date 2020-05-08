const uuidv1 = require('uuid')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const https = require('https');
const http = require('http');

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

// generate unique id for store
router.get('/generate-id', async (req, res) => {
  // TODO: Sync
  const ids = _.map(await cms.getModel('Store').find({}, { id: 1 }), store => store.id)
  let id = 0
  do {
    id++
  } while(_.includes(ids, id.toString()))
  res.status(200).json({ id })
})

// check if provided alias is unique or not
router.post('/validate-alias', async (req, res) => {
  const { store, alias } = req.body
  const storeWithAlias = await cms.getModel('Store').findOne({ alias: _.toLower(alias) })
  const urlTaken = (storeWithAlias && storeWithAlias._id.toString() !== store)
  res.json(urlTaken ? {message: 'WebShop URL has been taken!'} : {ok: true})
})

router.post('/validate-client-domain', async (req, res) => {
  const { store, clientDomain } = req.body
  const storeWithClientDomain = await cms.getModel('Store').findOne({ clientDomain })
  const urlTaken = (storeWithClientDomain && storeWithClientDomain._id.toString() !== store)
  res.json(urlTaken ? {message: 'Client domain has been taken!'} : {ok: true})
})

router.get('/order-token', async (req, res) => {
  res.json({ token: uuidv1.v1() })
})

module.exports = router
