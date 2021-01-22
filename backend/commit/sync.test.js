const mockProducts = require('../../components2/OrderView/__test__/mock_products').mockProducts
const _ = require('lodash')
const ObjectId = require('bson').ObjectId

const { syncFactory } = require('../../test-utils')

const { stringify } = require('schemahandler/utils')

jest.setTimeout(60000)

//<editor-fold desc="prepare test">
const {
  prepareActionCommitTest
} = require('./actionCommit.prepare.test')
const {
  prepareOrderTest,
  checkOrderCreated
} = require('../order/order.prepare.test')
const {
  prepareOrderCommit
} = require('./orderCommit.prepare.test')
//</editor-fold>

let cmsList
let cmsMaster
let cmsClient

beforeAll(async () => {
  cmsList = await syncFactory('syncTest', 2)

  for (let _cms of cmsList) {
    prepareActionCommitTest(_cms)
    prepareOrderCommit(_cms)
    prepareOrderTest(_cms)
    _cms.triggerFeConnect()
  }

  cmsMaster = cmsList[0]
  cmsClient = cmsList[1]
})

beforeEach(async () => {
  for (let _cms of cmsList) {
    await _cms.orm('Order').remove({}).direct()
    await _cms.orm('Commit').remove({}).direct()
    await _cms.orm('Action').remove({}).direct()
  }
})

describe('Sync test', function () {
  it('Case 1: Create order + add product', async (done) => {
    cmsClient.feSocket.on('update-table', async function (order) {
      const orderInDbMaster = await cmsMaster.orm('Order').find({})
      const orderInDbClient = await cmsClient.orm('Order').find({})
      expect(stringify(orderInDbClient)).toMatchSnapshot()
      expect(orderInDbMaster).toEqual(orderInDbClient)
      done()
    })
    const doc = await cmsMaster.orm('Order').create({
      _id: new ObjectId(),
      table: 10,
      status: 'inProgress'
    })
    // add first item
    await cmsMaster.orm('Order').findOneAndUpdate({
      _id: doc._id
    }, {
      $push: {
        items: mockProducts[0]
      }
    }).commit('updateActiveOrder', { table: 10 })
    // add second item
    await cmsMaster.orm('Order').findOneAndUpdate({
      _id: doc._id
    }, {
      $push: {
        items: mockProducts[1]
      }
    }).commit('updateActiveOrder', { table: 10 })
  })

  it('Case 1a: Create order + add product from client', async (done) => {
    cmsMaster.feSocket.on('update-table', async function (order) {
      const orderInDbMaster = await cmsMaster.orm('Order').find({})
      const orderInDbClient = await cmsClient.orm('Order').find({})
      expect(stringify(orderInDbClient)).toMatchSnapshot()
      expect(orderInDbMaster).toEqual(orderInDbClient)
      done()
    })
    const doc = await cmsClient.orm('Order').create({
      _id: new ObjectId(),
      table: 10,
      status: 'inProgress'
    })
    // add first item
    await cmsClient.orm('Order').findOneAndUpdate({
      _id: doc._id
    }, {
      $push: {
        items: mockProducts[0]
      }
    }).commit('updateActiveOrder', { table: 10 })
    // add second item
    await cmsClient.orm('Order').findOneAndUpdate({
      _id: doc._id
    }, {
      $push: {
        items: mockProducts[1]
      }
    }).commit('updateActiveOrder', { table: 10 })
  })

  it('Case 2: Create order + add order + set attribute', async (done) => {
    cmsClient.feSocket.on('update-table', async function (order) {
      const orderInDbMaster = await cmsMaster.orm('Order').find({})
      const orderInDbClient = await cmsClient.orm('Order').find({})
      expect(stringify(orderInDbClient)).toMatchSnapshot()
      expect(orderInDbMaster).toEqual(orderInDbClient)
      done()
    })
    const doc = await cmsMaster.orm('Order').create({
      _id: new ObjectId(),
      table: 10,
      status: 'inProgress'
    })
    // add first item
    await cmsMaster.orm('Order').findOneAndUpdate({
      _id: doc._id
    }, {
      $push: {
        items: mockProducts[0]
      }
    }).commit('updateActiveOrder', { table: 10 })
    // set attribute for order
    await cmsMaster.orm('Order').findOneAndUpdate({
      _id: doc._id
    }, {
      $set: {
        vSum: 100
      }
    })
    // add second item
    await cmsMaster.orm('Order').findOneAndUpdate({
      _id: doc._id
    }, {
      $push: {
        items: mockProducts[1]
      }
    }).commit('updateActiveOrder', { table: 10 })
  })
})
