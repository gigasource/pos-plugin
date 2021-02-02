import { ObjectID } from "bson";
import { CRUdDbFactory } from "../crud-db";
import cms from "cms";
import { stringify } from "schemahandler/utils";
import { ref } from "vue";
const group1 = { _id: new ObjectID(), name: "g1", categories: [] };
const group2 = { _id: new ObjectID(), name: "g2", categories: [] };
const category1 = { _id: new ObjectID(), name: "c1", items: [] };
const category2 = { _id: new ObjectID(), name: "c2", items: [] };
const item1 = { _id: new ObjectID(), name: "i1" };
const item2 = { _id: new ObjectID(), name: "i2" };
const item3 = { _id: new ObjectID(), name: "i2" };

beforeAll(async () => {
  const orm = require("schemahandler");
  await orm.connect("mongodb://localhost:27017", "modifier-test");
  // orm.registerSchema("modifier-test", {
  //   groups: [ {
  //     name: String,
  //     categories: [ {
  //       name: String,
  //       items: {
  //         name: String
  //       }
  //     }]
  //   }],
  // })
  const Modifier = cms.getModel("modifier-test");
  await Modifier.remove({});
  await Modifier.create({ groups: [] });
});
describe("test crud-db", () => {
  it("should word", async () => {
    const data = {};
    let dbData;

    const collectionName = "modifier-test";
    const {
      create: createGroup,
      remove: removeGroup,
      update: updateGroup
    } = CRUdDbFactory(data, "groups", collectionName);
    await createGroup(group1);
    await createGroup(group2);
    // expect(stringify(data)).toMatchInlineSnapshot();
    // dbData = await cms.getModel(collectionName).findOne({});
    // expect(stringify(dbData)).toMatchInlineSnapshot();

    await updateGroup(group1, { disable: true });
    expect(stringify(data)).toMatchInlineSnapshot(`
      Object {
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "disable": true,
            "name": "g1",
          },
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "g2",
          },
        ],
      }
    `);
    dbData = await cms.getModel(collectionName).findOne({});
    expect(stringify(dbData)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "disable": true,
            "name": "g1",
          },
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "g2",
          },
        ],
      }
    `);
    await removeGroup(group1);
    expect(stringify(data)).toMatchInlineSnapshot(`
      Object {
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "g2",
          },
        ],
      }
    `);
    const {
      create: createCategory,
      remove: removeCategory,
      update: updateCategory
    } = CRUdDbFactory(data, "groups.0.categories", collectionName);
    await createCategory(category1);
    await createCategory(category2);
    expect(stringify(data)).toMatchInlineSnapshot(`
      Object {
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [
              Object {
                "_id": "ObjectID",
                "items": Array [],
                "name": "c1",
              },
              Object {
                "_id": "ObjectID",
                "items": Array [],
                "name": "c2",
              },
            ],
            "name": "g2",
          },
        ],
      }
    `);
    dbData = await cms.getModel(collectionName).findOne({});
    expect(stringify(dbData)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [
              Object {
                "_id": "ObjectID",
                "items": Array [],
                "name": "c1",
              },
              Object {
                "_id": "ObjectID",
                "items": Array [],
                "name": "c2",
              },
            ],
            "name": "g2",
          },
        ],
      }
    `);
    await updateCategory(category1, { max: 10 });
    await removeCategory(category2);
    expect(stringify(data)).toMatchInlineSnapshot(`
      Object {
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [
              Object {
                "_id": "ObjectID",
                "items": Array [],
                "max": 10,
                "name": "c1",
              },
            ],
            "name": "g2",
          },
        ],
      }
    `);
    dbData = await cms.getModel(collectionName).findOne({});
    expect(stringify(dbData)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [
              Object {
                "_id": "ObjectID",
                "items": Array [],
                "max": 10,
                "name": "c1",
              },
            ],
            "name": "g2",
          },
        ],
      }
    `);
    const {
      create: createItem,
      remove: removeItem,
      update: updateItem
    } = CRUdDbFactory(data, "groups.0.categories.0.items", collectionName);
    await createItem(item1);
    await createItem(item2);
    await createItem(item3);
    await updateItem(item1, {
      name: "m1",
      price: 100
    });
    await updateItem(item2, {
      name: "m2",
      price: 20
    });
    await removeItem(item3);
    expect(stringify(data)).toMatchInlineSnapshot(`
      Object {
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [
              Object {
                "_id": "ObjectID",
                "items": Array [
                  Object {
                    "_id": "ObjectID",
                    "name": "m1",
                    "price": 100,
                  },
                  Object {
                    "_id": "ObjectID",
                    "name": "m2",
                    "price": 20,
                  },
                ],
                "max": 10,
                "name": "c1",
              },
            ],
            "name": "g2",
          },
        ],
      }
    `);
    dbData = await cms.getModel(collectionName).findOne({});
    expect(stringify(dbData)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [
              Object {
                "_id": "ObjectID",
                "items": Array [
                  Object {
                    "_id": "ObjectID",
                    "name": "m1",
                    "price": 100,
                  },
                  Object {
                    "_id": "ObjectID",
                    "name": "m2",
                    "price": 20,
                  },
                ],
                "max": 10,
                "name": "c1",
              },
            ],
            "name": "g2",
          },
        ],
      }
    `);
  });

  it("should work for ref", async () => {
    const data = ref({});
    let dbData;

    const collectionName = "modifier-test";
    const {
      create: createGroup,
      remove: removeGroup,
      update: updateGroup
    } = CRUdDbFactory(data, "value.groups", collectionName);
    await createGroup(group1);
    await createGroup(group2);
    expect(stringify(data.value)).toMatchInlineSnapshot(`
      Object {
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "g1",
          },
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "g2",
          },
        ],
      }
    `);
  });
});
