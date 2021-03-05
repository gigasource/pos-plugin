const { ObjectID } = require('bson')

module.exports = {
  "user": [
    {
      "name": {},
      "date": {}
    }
  ],
  "payment": [
    {
      "type": {},
      "value": {}
    }
  ],
  "items": [
    {
      "id": {},
      "name": {},
      "price": {},
      "tax": {},
      "showPrice": {},
      "printed": {},
      "taxes": [
        {}
      ],
      "date": {},
      "course": {},
      "groupPrinter": {},
      "groupPrinter2": {},
      "uuid": {},
      "originalPrice": {},
      "takeAway": {},
      "modifiers": [
        {
          "name": {},
          "price": {},
          "quantity": {},
          "originalPrice": {},
          "product": {}
        }
      ],
      "quantity": {},
      "cancellationQuantity": {},
      "type": {},
      "vDiscount": {},
      "discount": {},
      "discountUnit": {},
      "discountResistance": {},
      "category": {},
      "excludedFromSales": {},
      "taxPart": {},
      "product": {
        "ref": "Product",
        "autopopulate": false
      },
      "unit": {},
      "attributes": [
        {
          "key": {},
          "value": {}
        }
      ],
      "separate": {},
      "image": {},
      "desc": {},
      "note": {},
      "sent": {},
      "tseMethod": {},
      "isVoucher": {}
    }
  ],
  "cancellationItems": [{}],
  "date": {
    "type": Date
  },
  "vDate": {
    "type": Date
  },
  "customer": {
    "type": ObjectID
  }
}
