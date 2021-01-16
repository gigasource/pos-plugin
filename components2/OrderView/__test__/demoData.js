export const demoData = {
  "PosSetting": [
    {
      "_id": "5e1d89db00971c2ac29fccc9",
      "companyInfo": {
        "name": "Gigasource",
        "address": "1 A Street, XYZ 9999",
        "telephone": "0123 456 789",
        "taxNumber": "9999 9999 9999"
      },
      "onlineDevice": {
        "id": null,
        "sound": true,
        "soundLoop": "repeat"
      },
      "defaultPrepareTime": 30,
      "onlineOrderSorting": "time",
      "printerGeneralSetting": {
        "entireReceipt": 0
      }
    }
  ],
  "Terminal": [
    {
      "_id": "5dfb2023874421344a7203c2",
      "name": "Terminal 1",
      "thermalPrinters": [
        {
          "_id": "5dfb217296714b382ee3ed83",
          "printerType": "ip",
          "ip": "192.168.10.60",
          "merge": "true"
        }
      ]
    }
  ],
  "Category": [
    {
      "_id": "5df6f31ba037304c8b0df66c",
      "name": "Drink",
      "position": 1
    },
    {
      "_id": "5df6f5ee7854273fa4fd98a4",
      "name": "Electronic",
      "position": 2
    },
    {
      "_id": "5df6f5e27854273fa4fd98a1",
      "name": "Material",
      "position": 3
    },
    {
      "_id": "5df6f5cd7854273fa4fd989b",
      "name": "Sport",
      "position": 4
    },
    {
      "_id": "5df6f5dd7854273fa4fd989e",
      "name": "Wine",
      "position": 5
    }
  ],
  "Product": [
    {
      "category": "5df6f31ba037304c8b0df66c",
      "name": "Cola",
      "price": 98,
      "tax": 19,
      "layouts": [
        {
          "color": "#FBE4EC",
          "order": 0,
          "device": "pos"
        }
      ],
      "id": 1
    },
    {
      "category": "5df6f31ba037304c8b0df66c",
      "name": "Pepsi",
      "price": 35,
      "tax": 0,
      "layouts": [
        {
          "color": "#FBE4EC",
          "order": 1,
          "device": "pos"
        }
      ],
      "id": 2
    },
    {
      "_id": "5e784d7786e3ec0997b5e341",
      "category": "5df6f31ba037304c8b0df66c",
      "name": "Water",
      "price": 67,
      "tax": 7,
      "layouts": [
        {
          "color": "#FBE4EC",
          "order": 2,
          "device": "pos"
        }
      ],
      "id": "3",
      "isNoPrint": true
    },
    {
      "_id": "5e784d7786e3ec0997b5e343",
      "category": "5df6f31ba037304c8b0df66c",
      "name": "Soda",
      "price": 20,
      "tax": 19,
      "layouts": [
        {
          "color": "#FBE4EC",
          "order": 3,
          "device": "pos"
        }
      ],
      "id": "4",
      "attributes": [],
      "groupPrinter": "5e7864b186e3ec0997b5e48e",
      "tax2": 7,
      "option": {}
    },
    {
      "_id": "5e784d7786e3ec0997b5e345",
      "category": "5df6f31ba037304c8b0df66c",
      "name": "Green Tea",
      "price": 39,
      "tax": 7,
      "layouts": [
        {
          "color": "#FBE4EC",
          "order": 4,
          "device": "pos"
        }
      ],
      "id": "5",
      "groupPrinter": "5e7864c486e3ec0997b5e492"
    },
    {
      "_id": "5e784d7786e3ec0997b5e347",
      "category": "5df6f31ba037304c8b0df66c",
      "name": "Black Tea",
      "price": 1,
      "tax": 0,
      "layouts": [
        {
          "color": "#FBE4EC",
          "order": 5,
          "device": "pos"
        }
      ],
      "id": "6",
      "groupPrinter": "5e7864b186e3ec0997b5e48e"
    },
    {
      "_id": "5e784d7786e3ec0997b5e349",
      "category": "5df6f31ba037304c8b0df66c",
      "name": "Coffee",
      "price": 64,
      "tax": 19,
      "layouts": [
        {
          "color": "#FBE4EC",
          "order": 6,
          "device": "pos"
        }
      ],
      "id": "7",
      "groupPrinter": "5e7864b186e3ec0997b5e48e"
    },
    {
      "_id": "5e784d7786e3ec0997b5e34b",
      "category": "5df6f31ba037304c8b0df66c",
      "name": "Lemonade",
      "price": 48,
      "tax": 0,
      "layouts": [
        {
          "color": "#FBE4EC",
          "order": 7,
          "device": "pos"
        }
      ],
      "id": "8",
      "groupPrinter": "5e7864b186e3ec0997b5e48e"
    },
    {
      "_id": "5e784d7786e3ec0997b5e34d",
      "category": "5df6f31ba037304c8b0df66c",
      "name": "Milkshake",
      "price": 12,
      "tax": 0,
      "layouts": [
        {
          "color": "#FBE4EC",
          "order": 8,
          "device": "pos"
        }
      ],
      "id": "9",
      "groupPrinter": "5e7864c486e3ec0997b5e492"
    },
    {
      "category": "5df6f31ba037304c8b0df66c",
      "name": "Milk",
      "price": 76,
      "tax": 19,
      "layouts": [
        {
          "color": "#FBE4EC",
          "order": 9,
          "device": "pos"
        }
      ],
      "id": 10
    },
    {
      "_id": "5e784d7786e3ec0997b5e351",
      "category": "5df6f31ba037304c8b0df66c",
      "name": "Juice",
      "price": 80,
      "tax": 0,
      "layouts": [
        {
          "color": "#FBE4EC",
          "order": 10,
          "device": "pos"
        }
      ],
      "id": "11",
      "groupPrinter": "5e7864b186e3ec0997b5e48e"
    },
    {
      "category": "5df6f5cd7854273fa4fd989b",
      "name": "Soccer ball",
      "price": 3,
      "tax": 0,
      "layouts": [
        {
          "color": "#CE93D8",
          "order": 0,
          "device": "pos"
        }
      ],
      "id": 12
    },
    {
      "category": "5df6f5cd7854273fa4fd989b",
      "name": "Tennis ball",
      "price": 32,
      "tax": 0,
      "layouts": [
        {
          "color": "#CE93D8",
          "order": 1,
          "device": "pos"
        }
      ],
      "id": 13
    },
    {
      "category": "5df6f5cd7854273fa4fd989b",
      "name": "Net",
      "price": 89,
      "tax": 0,
      "layouts": [
        {
          "color": "#CE93D8",
          "order": 2,
          "device": "pos"
        }
      ],
      "id": 14
    },
    {
      "category": "5df6f5cd7854273fa4fd989b",
      "name": "Gloves",
      "price": 22,
      "tax": 0,
      "layouts": [
        {
          "color": "#CE93D8",
          "order": 3,
          "device": "pos"
        }
      ],
      "id": 15
    },
    {
      "category": "5df6f5cd7854273fa4fd989b",
      "name": "Helmet",
      "price": 73,
      "tax": 0,
      "layouts": [
        {
          "color": "#CE93D8",
          "order": 4,
          "device": "pos"
        }
      ],
      "id": 16
    },
    {
      "category": "5df6f5cd7854273fa4fd989b",
      "name": "Running Shoes",
      "price": 76,
      "tax": 19,
      "layouts": [
        {
          "color": "#CE93D8",
          "order": 5,
          "device": "pos"
        }
      ],
      "id": 17
    },
    {
      "category": "5df6f5cd7854273fa4fd989b",
      "name": "Racquet",
      "price": 4,
      "tax": 7,
      "layouts": [
        {
          "color": "#CE93D8",
          "order": 6,
          "device": "pos"
        }
      ],
      "id": 18
    },
    {
      "category": "5df6f5cd7854273fa4fd989b",
      "name": "Bat",
      "price": 32,
      "tax": 7,
      "layouts": [
        {
          "color": "#CE93D8",
          "order": 7,
          "device": "pos"
        }
      ],
      "id": 19
    },
    {
      "category": "5df6f5cd7854273fa4fd989b",
      "name": "Stick",
      "price": 3,
      "tax": 19,
      "layouts": [
        {
          "color": "#CE93D8",
          "order": 8,
          "device": "pos"
        }
      ],
      "id": 20
    },
    {
      "category": "5df6f5cd7854273fa4fd989b",
      "name": "Club",
      "price": 42,
      "tax": 19,
      "layouts": [
        {
          "color": "#CE93D8",
          "order": 9,
          "device": "pos"
        }
      ],
      "id": 21
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Wood",
      "price": 84,
      "tax": 19,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 0,
          "device": "pos"
        }
      ],
      "id": 22
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Metal",
      "price": 87,
      "tax": 7,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 1,
          "device": "pos"
        }
      ],
      "id": 23
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Glass",
      "price": 37,
      "tax": 19,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 2,
          "device": "pos"
        }
      ],
      "id": 24
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Cement",
      "price": 58,
      "tax": 7,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 3,
          "device": "pos"
        }
      ],
      "id": 25
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Paper",
      "price": 41,
      "tax": 7,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 4,
          "device": "pos"
        }
      ],
      "id": 26
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Plastic",
      "price": 78,
      "tax": 0,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 5,
          "device": "pos"
        }
      ],
      "id": 27
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Nilon",
      "price": 70,
      "tax": 0,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 6,
          "device": "pos"
        }
      ],
      "id": 28
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Cotton",
      "price": 73,
      "tax": 7,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 7,
          "device": "pos"
        }
      ],
      "id": 29
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Bronze",
      "price": 24,
      "tax": 19,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 8,
          "device": "pos"
        }
      ],
      "id": 30
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Iron",
      "price": 9,
      "tax": 0,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 9,
          "device": "pos"
        }
      ],
      "id": 31
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Silver",
      "price": 13,
      "tax": 0,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 10,
          "device": "pos"
        }
      ],
      "id": 32
    },
    {
      "category": "5df6f5e27854273fa4fd98a1",
      "name": "Gold",
      "price": 2,
      "tax": 19,
      "layouts": [
        {
          "color": "#B2EBF2",
          "order": 11,
          "device": "pos"
        }
      ],
      "id": 33
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "Laptop",
      "price": 29,
      "tax": 0,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 0,
          "device": "pos"
        }
      ],
      "id": 34
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "Camera",
      "price": 57,
      "tax": 19,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 1,
          "device": "pos"
        }
      ],
      "id": 35
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "Refrigerator",
      "price": 47,
      "tax": 0,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 2,
          "device": "pos"
        }
      ],
      "id": 36
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "Oven",
      "price": 10,
      "tax": 0,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 3,
          "device": "pos"
        }
      ],
      "id": 37
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "Television",
      "price": 91,
      "tax": 0,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 4,
          "device": "pos"
        }
      ],
      "id": 38
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "Radio",
      "price": 68,
      "tax": 7,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 5,
          "device": "pos"
        }
      ],
      "id": 39
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "MP3 player",
      "price": 6,
      "tax": 7,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 6,
          "device": "pos"
        }
      ],
      "id": 40
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "Fan",
      "price": 41,
      "tax": 0,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 7,
          "device": "pos"
        }
      ],
      "id": 41
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "Mobile phone",
      "price": 2,
      "tax": 0,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 8,
          "device": "pos"
        }
      ],
      "id": 42
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "Projector",
      "price": 75,
      "tax": 7,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 9,
          "device": "pos"
        }
      ],
      "id": 43
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "Monitor",
      "price": 21,
      "tax": 0,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 10,
          "device": "pos"
        }
      ],
      "id": 44
    },
    {
      "category": "5df6f5ee7854273fa4fd98a4",
      "name": "Lamp",
      "price": 33,
      "tax": 19,
      "layouts": [
        {
          "color": "#C8E6C9",
          "order": 11,
          "device": "pos"
        }
      ],
      "id": 45
    },
    {
      "_id": "5e784d7786e3ec0997b5e397",
      "category": "5df6f5dd7854273fa4fd989e",
      "name": "Brandy",
      "price": 95,
      "tax": 19,
      "layouts": [
        {
          "color": "#DCE775",
          "order": 0,
          "device": "pos"
        }
      ],
      "id": "46",
      "isNoPrint": true,
      "tax2": 19
    },
    {
      "_id": "5e784d7786e3ec0997b5e399",
      "category": "5df6f5dd7854273fa4fd989e",
      "name": "Baijiu",
      "price": 12,
      "tax": 19,
      "layouts": [
        {
          "color": "#DCE775",
          "order": 1,
          "device": "pos"
        }
      ],
      "id": "47",
      "groupPrinter": "5e7864c486e3ec0997b5e492",
      "tax2": 7,
      "option": {}
    },
    {
      "_id": "5e784d7786e3ec0997b5e39b",
      "category": "5df6f5dd7854273fa4fd989e",
      "name": "Whiskey",
      "price": 40,
      "tax": 19,
      "layouts": [
        {
          "_id": "5e784d7786e3ec0997b5e39c",
          "color": "#DCE775",
          "order": 2,
          "device": "pos"
        }
      ],
      "id": "48",
      "groupPrinter": "5e7864b186e3ec0997b5e48e",
      "tax2": 7,
      "option": {}
    },
    {
      "category": "5df6f5dd7854273fa4fd989e",
      "name": "Vermouth",
      "price": 18,
      "tax": 7,
      "layouts": [
        {
          "color": "#DCE775",
          "order": 3,
          "device": "pos"
        }
      ],
      "id": 49
    },
    {
      "_id": "5e784d7786e3ec0997b5e39f",
      "category": "5df6f5dd7854273fa4fd989e",
      "name": "Mezcal",
      "price": 66,
      "tax": 19,
      "layouts": [
        {
          "color": "#DCE775",
          "order": 4,
          "device": "pos"
        }
      ],
      "id": "50",
      "groupPrinter": "5e7864c486e3ec0997b5e492",
      "groupPrinter2": "5e7864b186e3ec0997b5e48e"
    },
    {
      "_id": "5e784d7786e3ec0997b5e3a1",
      "category": "5df6f5dd7854273fa4fd989e",
      "name": "Pisco",
      "price": 96,
      "tax": 19,
      "layouts": [
        {
          "color": "#DCE775",
          "order": 5,
          "device": "pos"
        }
      ],
      "id": "51",
      "groupPrinter": "5e7864b186e3ec0997b5e48e"
    },
    {
      "_id": "5e784d7786e3ec0997b5e3a3",
      "category": "5df6f5dd7854273fa4fd989e",
      "name": "Gin",
      "price": 27,
      "tax": 19,
      "layouts": [
        {
          "_id": "5e784d7786e3ec0997b5e3a4",
          "color": "#DCE775",
          "order": 6,
          "device": "pos"
        }
      ],
      "id": "52",
      "groupPrinter": "5e7864b186e3ec0997b5e48e"
    },
    {
      "_id": "5e784d7786e3ec0997b5e3a5",
      "category": "5df6f5dd7854273fa4fd989e",
      "name": "Tequila",
      "price": 43,
      "tax": 0,
      "layouts": [
        {
          "_id": "5e784d7786e3ec0997b5e3a6",
          "color": "#DCE775",
          "order": 7,
          "device": "pos"
        }
      ],
      "id": "53",
      "groupPrinter": "5e7864b186e3ec0997b5e48e"
    },
    {
      "_id": "5e784d7786e3ec0997b5e3a7",
      "category": "5df6f5dd7854273fa4fd989e",
      "name": "Bourbon",
      "price": 83,
      "tax": 7,
      "layouts": [
        {
          "color": "#DCE775",
          "order": 8,
          "device": "pos"
        }
      ],
      "id": "54"
    },
    {
      "_id": "5e784d7786e3ec0997b5e3a9",
      "category": "5df6f5dd7854273fa4fd989e",
      "name": "Vodka",
      "price": 63,
      "tax": 0,
      "layouts": [
        {
          "color": "#DCE775",
          "order": 9,
          "device": "pos"
        }
      ],
      "id": "55",
      "isNoPrint": true
    },
    {
      "_id": "5e79d04e5028531d08009cb5",
      "attributes": [],
      "name": "Pudding",
      "price": 1,
      "isModifier": true,
      "id": "101"
    },
    {
      "_id": "5e79cfc75028531d08009ca5",
      "attributes": [],
      "isModifier": true,
      "name": "Olive",
      "price": 1,
      "id": "100",
      "option": {}
    },
    {
      "_id": "5e79d0205028531d08009cab",
      "isModifier": true,
      "name": "Ice",
      "price": 0,
      "id": "99",
      "groupPrinter": "5e7864b186e3ec0997b5e48e"
    }
  ],
  "OrderLayout": [
    {
      "_id": "5e734c40be94c10a2f2a8c58",
      "categories": [
        {
          "products": [
            {
              "_id": "5e7ad4245028531d08009e39",
              "product": null,
              "top": 0,
              "left": 0,
              "color": "#EAEAEA",
              "type": "Text",
              "text": "Soft Drink"
            },
            {
              "_id": "5e7c99d32526c64008ced684",
              "product": "5e784d7786e3ec0997b5e343",
              "color": "#B2EBF2",
              "top": 1,
              "left": 0,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced685",
              "top": 0,
              "left": 1,
              "type": "Text",
              "text": "Wine"
            },
            {
              "_id": "5e7c99d32526c64008ced686",
              "product": "5e784d7786e3ec0997b5e39b",
              "color": "#C8E6C9",
              "top": 1,
              "left": 1,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced687",
              "product": "5e784d7786e3ec0997b5e3a5",
              "color": "#C8E6C9",
              "top": 2,
              "left": 1,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced688",
              "product": "5e784d7786e3ec0997b5e399",
              "color": "#C8E6C9",
              "top": 3,
              "left": 1,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced689",
              "product": "5e784d7786e3ec0997b5e3a3",
              "color": "#C8E6C9",
              "top": 4,
              "left": 1,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced68a",
              "product": "5e784d7786e3ec0997b5e397",
              "color": "#C8E6C9",
              "top": 1,
              "left": 2,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced68b",
              "product": "5e784d7786e3ec0997b5e39f",
              "color": "#C8E6C9",
              "top": 2,
              "left": 2,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced68c",
              "product": "5e784d7786e3ec0997b5e3a9",
              "color": "#C8E6C9",
              "top": 3,
              "left": 2,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced68d",
              "product": "5e784d7786e3ec0997b5e3a7",
              "color": "#C8E6C9",
              "top": 4,
              "left": 2,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced68e",
              "product": "5e784d7786e3ec0997b5e3a1",
              "color": "#C8E6C9",
              "top": 1,
              "left": 3,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced68f",
              "top": 5,
              "left": 0,
              "type": "Text",
              "text": "Other"
            },
            {
              "_id": "5e7c99d32526c64008ced690",
              "product": "5e784d7786e3ec0997b5e349",
              "color": "#FFF59D",
              "top": 6,
              "left": 0,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced691",
              "product": "5e784d7786e3ec0997b5e34b",
              "color": "#FFF59D",
              "top": 7,
              "left": 0,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced692",
              "product": "5e784d7786e3ec0997b5e34d",
              "color": "#FFF59D",
              "top": 8,
              "left": 0,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced693",
              "product": "5e784d7786e3ec0997b5e347",
              "color": "#FFF59D",
              "top": 9,
              "left": 0,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced694",
              "top": 0,
              "left": 5,
              "text": "Topping",
              "type": "Text"
            },
            {
              "_id": "5e7c99d32526c64008ced695",
              "product": "5e79d04e5028531d08009cb5",
              "color": "#CE93D8",
              "top": 1,
              "left": 5,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced696",
              "product": "5e79cfc75028531d08009ca5",
              "color": "#CE93D8",
              "top": 2,
              "left": 5,
              "type": "Article"
            },
            {
              "_id": "5e7c99d32526c64008ced697",
              "product": "5e79d0205028531d08009cab",
              "color": "#CE93D8",
              "top": 3,
              "left": 5,
              "type": "Article"
            },
            {
              "_id": "5e7d655c2526c64008ced73f",
              "product": "5e784d7786e3ec0997b5e341",
              "color": "#FFAB91",
              "top": 7,
              "left": 1,
              "type": "Article"
            },
            {
              "_id": "5e7d655c2526c64008ced740",
              "product": "5e784d7786e3ec0997b5e351",
              "color": "#FFAB91",
              "top": 8,
              "left": 1,
              "type": "Article"
            },
            {
              "_id": "5e7d655c2526c64008ced741",
              "product": "5e784d7786e3ec0997b5e345",
              "color": "#FFAB91",
              "top": 9,
              "left": 1,
              "type": "Article"
            }
          ],
          "_id": "5e7ad2185028531d08009e32",
          "top": 0,
          "left": 0,
          "name": "Drink",
          "rows": 10,
          "columns": 6,
          "color": "#B2EBF2"
        }
      ],
      "columns": 5,
      "rows": 2,
      "type": "default"
    }
  ],
  "GroupPrinter": [
    {
      "_id": "5e7864b186e3ec0997b5e48e",
      "name": "Bar",
      "printer": "HP M176n",
      "type": "kitchen",
      "printers": [
        {
          "hardwares": [],
          "includes": [],
          "_id": "5e81774685fb2d03dda95cd0",
          "printerType": "ip",
          "ip": "192.168.10.60",
          "escPOS": true,
          "merge": "true"
        }
      ],
      "defaultDineInTax": 19,
      "defaultTakeAwayTax": 7,
      "showDineInTax": false
    },
    {
      "_id": "5e7864c486e3ec0997b5e492",
      "name": "Kitchen",
      "printer": "HP Tango X Printer",
      "type": "kitchen",
      "printers": [
        {
          "hardwares": [],
          "includes": [],
          "_id": "5e81631d85fb2d03dda918c1",
          "printerType": "ip",
          "ip": "192.168.10.60",
          "merge": true,
          "escPOS": true,
          "fontSize": 1,
          "marginTop": 0
        }
      ],
      "defaultDineInTax": 19,
      "defaultTakeAwayTax": 7,
      "showDineInTax": true
    },
    {
      "_id": "5e815f3a85fb2d03dda917d2",
      "name": "Invoice",
      "printers": [
        {
          "hardwares": [],
          "includes": [],
          "_id": "5e81614c85fb2d03dda91809",
          "printerType": "ip",
          "ip": "192.168.10.60",
          "merge": true,
          "sound": true,
          "escPOS": true,
          "fontSize": 3,
          "marginTop": 2
        }
      ],
      "type": "invoice",
      "defaultDineInTax": 19,
      "defaultTakeAwayTax": 7,
      "showDineInTax": true
    }
  ],
  "SystemConfig": [
    {
      "_id": "5ea90953448aba19d0b0e7d3",
      "type": "I18n",
      "content": {
        "locale": "de"
      }
    }
  ],
  "Room": [
    {
      "_id": "5e7ca4bd5eb24b13bf72f0f9",
      "name": "2nd Floor",
      "order": 1,
      "roomObjects": [
        {
          "location": {
            "x": 249.640625,
            "y": 26.53125
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e7ca8e05eb24b13bf72f1de",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "1",
          "takeAway": false
        },
        {
          "location": {
            "x": 354.3984375,
            "y": 26.8125
          },
          "size": {
            "width": 78.5078125,
            "height": 69.9140625
          },
          "_id": "5e81da8a85fb2d03dda968cd",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "5",
          "takeAway": false
        },
        {
          "location": {
            "x": 464.87890625,
            "y": 27.5546875
          },
          "size": {
            "width": 78.5078125,
            "height": 69.9140625
          },
          "_id": "5e81da9f85fb2d03dda968da",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "6",
          "takeAway": false
        },
        {
          "location": {
            "x": 573.046875,
            "y": 26.1640625
          },
          "size": {
            "width": 78.5078125,
            "height": 69.9140625
          },
          "_id": "5e81daac85fb2d03dda968e3",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "7",
          "takeAway": false
        },
        {
          "location": {
            "x": 679.296875,
            "y": 29.40234375
          },
          "size": {
            "width": 78.12890625,
            "height": 68.10546875
          },
          "_id": "5e81daad85fb2d03dda968e6",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "8",
          "takeAway": false
        },
        {
          "location": {
            "x": 577.04296875,
            "y": 504.8515625
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81dae885fb2d03dda96905",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "14",
          "takeAway": false
        },
        {
          "location": {
            "x": 678.82421875,
            "y": 500.2890625
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81dae985fb2d03dda96908",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "15",
          "takeAway": false
        },
        {
          "location": {
            "x": 678.2890625,
            "y": 113.8671875
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81dae985fb2d03dda9690b",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "25",
          "takeAway": false
        },
        {
          "location": {
            "x": 679.796875,
            "y": 201.6015625
          },
          "size": {
            "width": 79.7109375,
            "height": 210.75390625
          },
          "_id": "5e81db0d85fb2d03dda9691c",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "Bar",
          "takeAway": false
        },
        {
          "location": {
            "x": 472.53515625,
            "y": 415.0625
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81db4685fb2d03dda96947",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "26",
          "takeAway": false
        },
        {
          "location": {
            "x": 578.46875,
            "y": 411.203125
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81db4685fb2d03dda9694a",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "27",
          "takeAway": false
        },
        {
          "location": {
            "x": 366.01953125,
            "y": 504.69140625
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81db4685fb2d03dda9694d",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "28",
          "takeAway": false
        },
        {
          "location": {
            "x": 473.05859375,
            "y": 505.61328125
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81db4785fb2d03dda96950",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "29",
          "takeAway": false
        },
        {
          "location": {
            "x": 7.08984375,
            "y": 330.05859375
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81db6585fb2d03dda9696d",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "30",
          "takeAway": false
        },
        {
          "location": {
            "x": 4.92578125,
            "y": 152.61328125
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81db6585fb2d03dda96970",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "31",
          "takeAway": false
        },
        {
          "location": {
            "x": 7.3046875,
            "y": 239.09375
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81db6585fb2d03dda96973",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "32",
          "takeAway": false
        },
        {
          "location": {
            "x": 200.8515625,
            "y": 238.875
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81db7b85fb2d03dda9698b",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "34",
          "takeAway": false
        },
        {
          "location": {
            "x": 101.74609375,
            "y": 240.140625
          },
          "size": {
            "width": 80.296875,
            "height": 72.39453125
          },
          "_id": "5e81db7c85fb2d03dda9698e",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "35",
          "takeAway": false
        },
        {
          "location": {
            "x": 14,
            "y": 414.984375
          },
          "size": {
            "width": 253.67578125,
            "height": 17.6796875
          },
          "_id": "5e81dba485fb2d03dda969af",
          "type": "wall",
          "bgColor": "#86592D"
        }
      ]
    },
    {
      "_id": "5e7ca5485eb24b13bf72f102",
      "name": "Bar1",
      "order": 3,
      "roomObjects": [
        {
          "location": {
            "x": 291.4296875,
            "y": 41.140625
          },
          "size": {
            "width": 158,
            "height": 117
          },
          "_id": "5e7ca8e45eb24b13bf72f1e1",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "3",
          "takeAway": false
        },
        {
          "location": {
            "x": 44.83984375,
            "y": 238.21484375
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e7d72d776400806c419744e",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "16",
          "takeAway": false
        },
        {
          "location": {
            "x": 48.49609375,
            "y": 13.5078125
          },
          "size": {
            "width": 98.2265625,
            "height": 197.6953125
          },
          "_id": "5e7d72d976400806c4197452",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "17",
          "takeAway": false
        },
        {
          "location": {
            "x": 470.9609375,
            "y": 484.03125
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e7d72db76400806c4197456",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "18",
          "takeAway": false
        },
        {
          "location": {
            "x": 517.484375,
            "y": 43.140625
          },
          "size": {
            "width": 193.24609375,
            "height": 111.64453125
          },
          "_id": "5e7d72de76400806c419745a",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "19",
          "takeAway": false
        },
        {
          "location": {
            "x": 616.84375,
            "y": 235.36328125
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e7d72e076400806c419745e",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "20",
          "takeAway": false
        },
        {
          "location": {
            "x": 616.4921875,
            "y": 485.6796875
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e7d72e376400806c4197462",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "21",
          "takeAway": false
        },
        {
          "location": {
            "x": 46.4375,
            "y": 491.3125
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e7d72e676400806c4197466",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "22",
          "takeAway": false
        },
        {
          "location": {
            "x": 47.6640625,
            "y": 366.921875
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e7d72e876400806c419746a",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "23",
          "takeAway": false
        },
        {
          "location": {
            "x": 619.06640625,
            "y": 361.2890625
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e7d72ec76400806c419746e",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "24",
          "takeAway": false
        },
        {
          "location": {
            "x": 317.75,
            "y": 483.3671875
          },
          "size": {
            "width": 106.8125,
            "height": 102.6171875
          },
          "_id": "5e7dbb962526c64008ced9fa",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "2",
          "takeAway": false
        }
      ]
    },
    {
      "_id": "5e8161724b36c504c86cf049",
      "name": "Garden",
      "order": 4,
      "roomObjects": [
        {
          "location": {
            "x": 43.15234375,
            "y": 50.203125
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e81617d4b36c504c86cf04d",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "4",
          "takeAway": false
        },
        {
          "location": {
            "x": 180.73046875,
            "y": 50.95703125
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e8161814b36c504c86cf052",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "9",
          "takeAway": false
        },
        {
          "location": {
            "x": 318.89453125,
            "y": 52.87109375
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e81618a4b36c504c86cf059",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "10",
          "takeAway": false
        },
        {
          "location": {
            "x": 459.484375,
            "y": 55.0703125
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e81618b4b36c504c86cf05c",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "11",
          "takeAway": false
        },
        {
          "location": {
            "x": 611,
            "y": 56.71484375
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e81618f4b36c504c86cf063",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "12",
          "takeAway": false
        },
        {
          "location": {
            "x": 42.8984375,
            "y": 201.046875
          },
          "size": {
            "width": 99.46875,
            "height": 188.01953125
          },
          "_id": "5e8164884b36c504c86cf120",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "13",
          "takeAway": false
        },
        {
          "location": {
            "x": 322.296875,
            "y": 440.55078125
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e846fd8e53bf11f004b2aa1",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "36",
          "takeAway": false
        },
        {
          "location": {
            "x": 461.79296875,
            "y": 443.59375
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e846fd8e53bf11f004b2aa4",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "37",
          "takeAway": false
        },
        {
          "location": {
            "x": 613.10546875,
            "y": 443.28125
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e846fd8e53bf11f004b2aa7",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "38",
          "takeAway": false
        },
        {
          "location": {
            "x": 44.15625,
            "y": 442.71484375
          },
          "size": {
            "width": 99.83203125,
            "height": 97.12109375
          },
          "_id": "5e846ff5e53bf11f004b2ac3",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "39",
          "takeAway": false
        },
        {
          "location": {
            "x": 182.45703125,
            "y": 439.91015625
          },
          "size": {
            "width": 100,
            "height": 100
          },
          "_id": "5e846ff6e53bf11f004b2ac6",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "40",
          "takeAway": false
        },
        {
          "location": {
            "x": 613.08984375,
            "y": 204.47265625
          },
          "size": {
            "width": 99.46875,
            "height": 188.01953125
          },
          "_id": "5e847071e53bf11f004b2b11",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "41",
          "takeAway": false
        },
        {
          "location": {
            "x": 461.109375,
            "y": 204.078125
          },
          "size": {
            "width": 99.46875,
            "height": 188.01953125
          },
          "_id": "5e847071e53bf11f004b2b14",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "42",
          "takeAway": false
        },
        {
          "location": {
            "x": 321.0859375,
            "y": 203.22265625
          },
          "size": {
            "width": 99.46875,
            "height": 188.01953125
          },
          "_id": "5e847072e53bf11f004b2b17",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "43",
          "takeAway": false
        },
        {
          "location": {
            "x": 181.7109375,
            "y": 202.828125
          },
          "size": {
            "width": 99.46875,
            "height": 188.01953125
          },
          "_id": "5e847074e53bf11f004b2b1a",
          "type": "table",
          "bgColor": "#FFF9C4",
          "name": "44",
          "takeAway": false
        },
        {
          "location": {
            "x": 15.8671875,
            "y": 165.7734375
          },
          "size": {
            "width": 256.1875,
            "height": 10
          },
          "_id": "5e8470d0e53bf11f004b2b45",
          "type": "wall",
          "bgColor": "#86592D"
        },
        {
          "location": {
            "x": 16.80859375,
            "y": 412.85546875
          },
          "size": {
            "width": 253.46484375,
            "height": 10
          },
          "_id": "5e8470d7e53bf11f004b2b4a",
          "type": "wall",
          "bgColor": "#86592D"
        },
        {
          "location": {
            "x": 583.75,
            "y": 0
          },
          "size": {
            "width": 7.984375,
            "height": 156.15625
          },
          "_id": "5e8470f2e53bf11f004b2b59",
          "type": "wall",
          "bgColor": "#86592D"
        },
        {
          "location": {
            "x": 583.96484375,
            "y": 443.84375
          },
          "size": {
            "width": 7.984375,
            "height": 156.15625
          },
          "_id": "5e847114e53bf11f004b2b6c",
          "type": "wall",
          "bgColor": "#86592D",
          "name": "45"
        },
        {
          "location": {
            "x": 583.05859375,
            "y": 204.8203125
          },
          "size": {
            "width": 8.68359375,
            "height": 189.70703125
          },
          "_id": "5e84711ce53bf11f004b2b71",
          "type": "wall",
          "bgColor": "#86592D",
          "name": "46"
        },
        {
          "location": {
            "x": 295.79296875,
            "y": 0.2890625
          },
          "size": {
            "width": 7.984375,
            "height": 156.15625
          },
          "_id": "5e847140e53bf11f004b2b8c",
          "type": "wall",
          "bgColor": "#86592D",
          "name": "47"
        },
        {
          "location": {
            "x": 296.5625,
            "y": 443.84375
          },
          "size": {
            "width": 7.984375,
            "height": 156.15625
          },
          "_id": "5e847145e53bf11f004b2b91",
          "type": "wall",
          "bgColor": "#86592D",
          "name": "48"
        }
      ]
    }
  ]
}
