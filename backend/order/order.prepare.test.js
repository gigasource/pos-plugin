const Hooks = require('schemahandler/hooks/hooks')

if (!global.hooks) {
  global.hooks = new Hooks()
}

hooks.on('prepare:Order', function (cms) {
  require('./index')(cms)
})

/**
 *
 * hook@param orm: orm instance of current test
 * 2 expectations
 */
hooks.on('check:orderCreated', async function (orm) {
  const ordersList = await orm('Order').find({})
  const commitList = await orm('Commit').find({})
  expect(ordersList).toMatchSnapshot()
  expect(commitList).toMatchSnapshot()
})


