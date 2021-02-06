const _ = require('lodash')
const {ObjectID} = require("bson");

function compact(arr) {
  return _.uniqWith(arr.map(item => ({
    product: item.product,
    quantity: _.sumBy(arr, item2 => {
      if(item.product === item2.product)
        return item2.quantity
      return 0
    })
  })), _.isEqual)
}

module.exports = cms => {
  //update inventory after finishing order
  cms.on('run:closeOrder', async (commit, order) => {
    const { items } = order
    const ids = items.map(item => {
      if(item.modifiers && item.modifiers.length > 0) {
        return [item.product, ...item.modifiers.map(m => new ObjectID(m.product))]
      }
      return item.product
    }).flat()
    const quantities = compact(items.map(item => {
      if(item.modifiers && item.modifiers.length > 0) {
        const modifiers = compact(item.modifiers)
        return [{
          product: item.product.toString(),
          quantity: item.quantity
        }, ...modifiers]
      }
      return {
        product: item.product.toString(),
        quantity: item.quantity
      }
    }).flat())
    const products = await cms.getModel('Product').find({_id: {$in: ids}})
    let ingredientChanges = []
    for(const product of products) {
      const quantity = quantities.find(q => q.product === product._id.toString())['quantity']
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
      if(!change.amount) continue;
      await cms.getModel('Inventory').findOneAndUpdate({
        _id: change.inventory
      }, {
        $inc: {
          stock: 0 - change.amount
        },
        lastUpdateTimestamp: time
      })

      const category = (await cms.getModel('Inventory').findOne({_id: change.inventory})).category

      const history = {
        inventory: change.inventory,
        category,
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
