import {
  customers,
  onCreateCustomer,
  onRemoveCustomer,
  onUpdateCustomer,
  customerDialogData,
  onSelectCustomer,
  onAddAddress,
  onRemoveAddress
} from "../customer-ui-logics";
import { ObjectID } from "bson";
import { stringify } from "schemahandler/utils";
import { toRaw } from "vue";
jest.mock("cms", () => {
  process.env.USE_GLOBAL_ORM = true;
  const { cmsFactory } = require("../../../test-utils");
  const _cms = cmsFactory("customer-logics");
  global.cms = _cms;
  return {
    socket: _cms.feSocket,
    getModel: function(modelName) {
      return _cms.orm(modelName);
    }
  };
});

let cms = global.cms;
let { orm } = cms;

beforeAll(async () => {
  const Customer = cms.getModel("Customer");
  await Customer.remove({});
});

async function getDbData() {
  const Customer = cms.getModel("Customer");
  return stringify(await Customer.find({}));
}
describe("test customer logics", () => {
  test("add, remove, update customer", async () => {
    const customer1 = await onCreateCustomer({
      _id: new ObjectID(),
      name: "customer 1",
      phone: "0932101585"
    });

    expect(stringify(customers.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "name": "customer 1",
          "phone": "0932101585",
        },
      ]
    `);
    let dbData = await getDbData();
    expect(stringify(customers.value)).toEqual(dbData);
    const customer2 = await onCreateCustomer({
      _id: new ObjectID(),
      name: "customer 2",
      phone: "0932151080"
    });
    expect(stringify(customers.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "name": "customer 1",
          "phone": "0932101585",
        },
        Object {
          "_id": "ObjectID",
          "name": "customer 2",
          "phone": "0932151080",
        },
      ]
    `);
    dbData = await getDbData();
    expect(stringify(customers.value)).toEqual(dbData);
    await onUpdateCustomer(customer2._id, {
      modified: true
    });
    expect(stringify(customers.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "name": "customer 1",
          "phone": "0932101585",
        },
        Object {
          "_id": "ObjectID",
          "modified": true,
          "name": "customer 2",
          "phone": "0932151080",
        },
      ]
    `);
    dbData = await getDbData();
    expect(stringify(customers.value)).toEqual(dbData);

    await onRemoveCustomer(customer1);
    expect(stringify(customers.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "modified": true,
          "name": "customer 2",
          "phone": "0932151080",
        },
      ]
    `);
    dbData = await getDbData();
    expect(stringify(customers.value)).toEqual(dbData);

    await onRemoveCustomer(customer1);
    expect(stringify(customers.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "modified": true,
          "name": "customer 2",
          "phone": "0932151080",
        },
      ]
    `);
    dbData = await getDbData();
    expect(stringify(customers.value)).toEqual(dbData);
  });
  test("add address", async () => {
    const customer1 = await onCreateCustomer({
      _id: new ObjectID(),
      name: "customer1",
      phone: "0912345678",
      addresses: []
    });
    onSelectCustomer(customer1);
    const address1 = onAddAddress({
      address: "72 TDN",
      city: "DN"
    });
    expect(stringify(toRaw(customerDialogData))).toMatchInlineSnapshot(`
      Object {
        "addresses": Array [
          Object {
            "_id": "ObjectID",
            "address": "72 TDN",
            "city": "DN",
            "house": "",
            "street": "",
            "zipcode": "",
          },
        ],
        "name": "0912345678",
        "phone": "",
      }
    `);
    const address2 = onAddAddress({
      address: "15 NDT",
      city: "HN"
    });
    expect(stringify(toRaw(customerDialogData))).toMatchInlineSnapshot(`
      Object {
        "addresses": Array [
          Object {
            "_id": "ObjectID",
            "address": "72 TDN",
            "city": "DN",
            "house": "",
            "street": "",
            "zipcode": "",
          },
          Object {
            "_id": "ObjectID",
            "address": "15 NDT",
            "city": "HN",
            "house": "",
            "street": "",
            "zipcode": "",
          },
        ],
        "name": "0912345678",
        "phone": "",
      }
    `);
    onRemoveAddress(address1);
    expect(stringify(toRaw(customerDialogData))).toMatchInlineSnapshot(`
      Object {
        "addresses": Array [
          Object {
            "_id": "ObjectID",
            "address": "15 NDT",
            "city": "HN",
            "house": "",
            "street": "",
            "zipcode": "",
          },
        ],
        "name": "0912345678",
        "phone": "",
      }
    `);
  });
});
