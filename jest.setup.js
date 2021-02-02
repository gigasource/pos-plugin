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
    return {messages: {
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
    }}
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
  const { ObjectID } = bson
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
