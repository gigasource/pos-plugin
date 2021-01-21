//orm.connect("mongodb://localhost:27017", "roomTest");

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

jest.mock('vue-i18n', () => {
  return {
    useI18n() {
      return {
        t: x => x,
        locale: {
          value: 'en'
        }
      }
    }
  }
})

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
