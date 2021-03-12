const mockOrder = {
  table: "10",
  _id: "5fee6600612d45b5ffdcabb7",
  items:
    [{
      groupPrinter: "Bar",
      id: "48",
      name: "Whiskey",
      price: 40,
      product: "5e784d7786e3ec0997b5e39b",
      taxes: [19, 7],
      course: 1,
      quantity: 1,
      _id: "5fee6600612d45b5ffdcabb8",
      vSum: 40,
      vTakeAway: false,
      tax: 19,
      sent: true,
      printed: true,
      vTaxSum: {
        "19": {
          tax: 6.39,
          net: 33.61,
          gross: 40
        }
      }
    }],
  cancellationItems: [],
  takeAway: false,
  status: "inProgress",
  payment: [],
  user: [],
  vSum: 40,
  vDate: "2020-12-31T17:00:00.000Z",
  vTaxSum: {
    '19': {
      tax: 6.39,
      net: 33.61,
      gross: 40
    }
  }
}

module.exports = {
  mockOrder
}
