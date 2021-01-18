const { stringify } = require("schemahandler/utils");

function prepareOrderTest(cms) {
  require('./index')(cms)
}

/**
 *
 * 2 expectations
 */
async function checkOrderCreated(orm) {
  const ordersList = await orm('Order').find({})
  const commitList = await orm('Commit').find({})
  expect(stringify(ordersList)).toMatchSnapshot()
  expect(stringify(commitList)).toMatchSnapshot()
}

module.exports = {
  prepareOrderTest,
  checkOrderCreated
}


