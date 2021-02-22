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

async function getDbData(collection) {
  const res = await cms.getModel(collection).find({});
  return stringify(res);
}

let Modifier;
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
  Modifier = cms.getModel("modifier-test");
  await Modifier.remove({});
});
describe("test crud-db", () => {
  it("should word", async () => {
    await Modifier.create({ groups: [] });

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
    await Modifier.create({ groups: [] });

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
  test("case path is empty", async () => {
    await Modifier.create({ groups: [] });

    const obj = ref([]);
    const collectionName = "modifier-test";
    const { create, remove, update } = CRUdDbFactory(
      obj.value,
      "",
      collectionName
    );
    await create({
      name: "item1"
    });
    expect(obj.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "0000000000000000000007d4",
          "name": "item1",
        },
      ]
    `);
    const dbData = await cms.getModel(collectionName).find({});
    expect(stringify(dbData)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "groups": Array [],
        },
        Object {
          "_id": "ObjectID",
          "name": "item1",
        },
      ]
    `);
  });

  test("multiple document in collection", async () => {
    let obj = [];
    const collection = "test-crud-multi";
    await cms.getModel(collection).remove({});
    const { create, remove, update } = CRUdDbFactory(obj, "", collection);
    const item1 = await create({
      name: "item1",
      childs: []
    });

    const item2 = await create({
      name: "item2",
      childs: []
    });

    let dbData = await getDbData(collection);
    expect(dbData).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "childs": Array [],
          "name": "item1",
        },
        Object {
          "_id": "ObjectID",
          "childs": Array [],
          "name": "item2",
        },
      ]
    `);
    const {
      create: createChild,
      remove: removeChild,
      update: updateChild
    } = CRUdDbFactory(obj, "childs", collection, item1._id);
    const child1 = await createChild({
      name: "child1"
    });

    dbData = await getDbData(collection);
    expect(dbData).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "childs": Array [
            Object {
              "_id": "ObjectID",
              "name": "child1",
            },
          ],
          "name": "item1",
        },
        Object {
          "_id": "ObjectID",
          "childs": Array [],
          "name": "item2",
        },
      ]
    `);

    expect(stringify(obj)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "childs": Array [
            Object {
              "_id": "ObjectID",
              "name": "child1",
            },
          ],
          "name": "item1",
        },
        Object {
          "_id": "ObjectID",
          "childs": Array [],
          "name": "item2",
        },
      ]
    `);

    await updateChild(child1, {
      name: "child_modified"
    });
    dbData = await getDbData(collection);
    expect(dbData).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "childs": Array [
            Object {
              "_id": "ObjectID",
              "name": "child_modified",
            },
          ],
          "name": "item1",
        },
        Object {
          "_id": "ObjectID",
          "childs": Array [],
          "name": "item2",
        },
      ]
    `);

    const child2 = await createChild({
      name: "child2"
    });

    dbData = await getDbData(collection);
    expect(dbData).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "childs": Array [
            Object {
              "_id": "ObjectID",
              "name": "child_modified",
            },
            Object {
              "_id": "ObjectID",
              "name": "child2",
            },
          ],
          "name": "item1",
        },
        Object {
          "_id": "ObjectID",
          "childs": Array [],
          "name": "item2",
        },
      ]
    `);

    await removeChild(child1);

    expect(stringify(obj)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "childs": Array [
            Object {
              "_id": "ObjectID",
              "name": "child2",
            },
          ],
          "name": "item1",
        },
        Object {
          "_id": "ObjectID",
          "childs": Array [],
          "name": "item2",
        },
      ]
    `);
    dbData = await getDbData(collection);
    expect(dbData).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "childs": Array [
            Object {
              "_id": "ObjectID",
              "name": "child2",
            },
          ],
          "name": "item1",
        },
        Object {
          "_id": "ObjectID",
          "childs": Array [],
          "name": "item2",
        },
      ]
    `);
  });
});
