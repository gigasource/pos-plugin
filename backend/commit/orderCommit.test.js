const orm = require("schemahandler/orm");
const syncFlow = require("schemahandler/sync/sync-flow");
const syncPlugin = require("schemahandler/sync/sync-plugin-multi");
const { stringify } = require("schemahandler/utils");

describe("Order commit test", () => {
  beforeAll(async () => {
    orm.connect({ uri: "mongodb://localhost:27017" }, "myproject");
    orm.registerSchema("Order", {
      inProgress: Boolean,
      items: [{}],
      table: Number
    });
    await orm("Order").deleteMany();
    await orm("Commit").deleteMany();

    orm.plugin(syncPlugin);
    orm.plugin(syncFlow);
    orm.plugin(require("./orderCommit"));
    orm.registerCollectionOptions("Order");
    orm.emit("commit:flow:setMaster", true);
  });

  afterEach(async () => {
    await orm("Order")
      .deleteMany()
      .direct();
    await orm("Commit")
      .deleteMany()
      .direct();
  });

  it("Create duplicate order", async () => {
    const m1 = await orm("Order")
      .create({ table: 10, items: [], inProgress: true })
      .commit("createOrder");
    expect(stringify(m1)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "inProgress": true,
        "items": Array [],
        "table": 10,
      }
    `);
    const m2 = await orm("Order")
      .create({ table: 10, items: [], inProgress: true })
      .commit("createOrder");
    expect(m2).toMatchInlineSnapshot(`undefined`);
  });

  it("Update an order", async () => {
    const m1 = await orm("Order")
      .create({ table: 10, items: [], inProgress: true })
      .commit("createOrder");
    const { items } = await orm("Order")
      .updateOne(
        { _id: m1._id },
        { $push: { items: { name: "fanta", quantity: 1 } } }
      )
      .commit();
    expect(stringify(items)).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "fanta",
          "quantity": 1,
        },
      ]
    `);
    const updatedItem = await orm("Order")
      .updateOne(
        {
          _id: m1._id,
          "items._id": items[0]._id
        },
        { $set: { "items.$.quantity": 3 } }
      )
      .commit("updateActiveOrder", { table: 10 });
    expect(stringify(updatedItem)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "inProgress": true,
        "items": Array [
          Object {
            "name": "fanta",
            "quantity": 3,
          },
        ],
        "table": 10,
      }
    `);
  });

  it("Test raw order", async () => {
    const raw = orm("Order")
      .create({ table: 10 })
      .raw();

    const result = await orm.execChain(raw, true);
    expect(stringify(result)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "items": Array [],
        "table": 10,
      }
    `);
  });
});
