const _ = require('lodash')

module.exports = cms => {
  //update inventory after finishing order
  cms.post('run:closeOrder', async (commit, order) => {
    const { items } = order
    const ids = items.map(item => item.product)
    const products = await cms.getModel('Product').find({_id: {$in: ids}})
    let ingredientChanges = []
    for(const product of products) {
      const quantity = items.find(item => item.product.toString() === product._id.toString())['quantity']
      ingredientChanges.push(product.ingredients.map(ingredient => ({
        inventory: ingredient.inventory,
        amount: ingredient.amount * quantity
      })))
    }
    ingredientChanges = _.map(_.groupBy(ingredientChanges.flat(), 'inventory'), (value, key) => ({
      inventory: key,
      amount: value.reduce((acc, val) => (acc + +val.amount), 0)
    }))
    const time = new Date()
    for(const change of ingredientChanges) {
      const update = await cms.getModel('Inventory').findOneAndUpdate({
        _id: change.inventory
      }, {
        $inc: {
          stock: 0 - change.amount
        },
        lastUpdateTimestamp: time
      })
      const history = {
        inventory: change.inventory,
        category: update.category,
        amount: change.amount,
        type: 'remove',
        date: time,
        reason: 'Food order'
      }
      await cms.getModel('InventoryHistory').create(history)
    }
    cms.socket.emit('changeInventory')
  })
}
