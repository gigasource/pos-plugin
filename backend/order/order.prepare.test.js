const Hooks = require('schemahandler/hooks/hooks')
const { stringify } = require("schemahandler/utils");

if (!global.globalHooks) {
  global.globalHooks = new Hooks()
}

global.globalHooks.on('prepare:Order', function (cms) {
  require('./index')(cms)
})

/**
 *
 * hook@param orm: orm instance of current test
 * 2 expectations
 */
global.globalHooks.on('check:orderCreated', async function (orm) {
  const ordersList = await orm('Order').find({})
  const commitList = await orm('Commit').find({})
  expect(stringify(ordersList)).toMatchSnapshot()
  expect(stringify(commitList)).toMatchSnapshot()
})


