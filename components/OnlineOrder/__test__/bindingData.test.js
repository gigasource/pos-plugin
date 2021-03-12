/**
 * This file is used to bind data into db
 */

const orm = require('schemahandler')
const dbName = 'pos-restaurant-newest-2' // your dbname in config
const {
	prepareOnlineOrderDb
} = require('../../../backend/online-order/__test__/online-order.prepare.test')

describe('Bind data', function () {
	beforeAll(async () => {
		orm.connect("mongodb://localhost:27017", dbName)
		await prepareOnlineOrderDb(orm)
	})
	it('do nothing', () => {})
})


