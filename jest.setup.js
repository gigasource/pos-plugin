// orm.connect("mongodb://localhost:27017", "roomTest");

jest.mock('cms', () => {
  const orm = require('schemahandler');
  const {Socket} = require('schemahandler/io/io')
  return {
    getModel(col) {
      return orm(col)
    },
    socket: new Socket()
  }
})

jest.mock('vue-i18n', () => ({
  useI18n() {
    return {
      messages: {
        value: {
          'en': {
            dashboard: {},
            messages: {
              value: {
                en: {
                  onlineOrder: {
                    address: 'address',
                    amount: 'amount',
                    customer: 'customer',
                    delivery: 'delivery',
                    no: 'no',
                    received: 'received',
                    _status: 'status',
                    type: 'type',
                    refund: 'refund',
                    refunded: 'refunded'
                  }
                }
              }
            }
          }
        }
      },
      locale: {
        value: 'en'
      },
      fallbackLocale: {
        value: 'en'
      },
      t: x => x,
    }
  }
}))

jest.mock("vue-router", () => {
  return {
    useRoute() {
      return {
        query: {
          type: 'default'
        }
      };
    },
    useRouter() {
      return {
        push() {
        }
      };
    }
  };
});

jest.mock('bson', () => {
  const bson = jest.requireActual('bson')
  const {ObjectID} = bson
  let current = 1997

  function genBuffer() {
    let hexString = current.toString(16)
    while (hexString.length < 24) {
      hexString = '0' + hexString
    }
    current++
    return hexString
  }

  const _ObjectID = new Proxy(ObjectID, {
    construct(target, args) {
      const objArgs = args.length ? args : [genBuffer()]
      return new ObjectID(...objArgs)
    },
    get(target, p) {
      return Reflect.get(target, p);
    }
  });
  return {
    ObjectID: _ObjectID
  }
})

jest.mock('initPrint', () => {
  const fs = require('fs')
  const {PNG} = require("pngjs")
  let files = ['report1.png', 'report2.png'];
  return {
    setFiles(_files) {
      files = _files;
    },
    init(__dirname, _files) {
      let i = 0;
      if (_files) files = _files;
      global.printFunctions = {
        printPng: async (png) => {
          try {
            const bufferInBase64 = PNG.sync.write(png);
            fs.writeFileSync(`${__dirname}/${files[i]}`, bufferInBase64);
            i++;
          } catch (e) {
            console.log('canvasprinter: printPng exception', e)
          }
        },
        print: () => null
      }
    }
  }
}, {virtual: true})
