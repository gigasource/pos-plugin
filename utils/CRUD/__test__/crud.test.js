import { CRUdFactory } from '../crud';
import { ObjectID } from 'bson';
import { stringify } from 'schemahandler/utils';

const item1 = { name: "item1", _id: new ObjectID() };
const item2 = { name: "item2", _id: new ObjectID() };
describe("test crud", () => {
  it("crud should work", () => {
    const data = {}
    const { create, remove, update } = CRUdFactory(data, "value");
    create(item1);
    expect(stringify(data.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "name": "item1",
        },
      ]
    `);
    create(item2);
    expect(stringify(data.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "name": "item1",
        },
        Object {
          "_id": "ObjectID",
          "name": "item2",
        },
      ]
    `);
    update(item2, { name: "item3" });
    expect(stringify(data.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "name": "item1",
        },
        Object {
          "_id": "ObjectID",
          "name": "item3",
        },
      ]
    `);
    remove(item2);
    expect(stringify(data.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "name": "item1",
        },
      ]
    `);
  });
  it("it should work for document type", () => {
    const parent1 = { name: "d1", _id: new ObjectID() };
    const parent2 = { name: "m1", _id: new ObjectID() };
    const child1 = { name: "c1", _id: new ObjectID() };
    const child2 = { name: "c2", _id: new ObjectID() };
    const data = {}
    const {
      create: createParent,
      remove: removeParent,
      update: updateParent,
    } = CRUdFactory(data, "parents");
    const {
      create: createChild,
      remove: removeChild,
      update: updateChild
    } = CRUdFactory(data, "parents[0].childs");
    createParent(parent1);
    createParent(parent2);
    expect(stringify(data)).toMatchInlineSnapshot(`
      Object {
        "parents": Array [
          Object {
            "_id": "ObjectID",
            "name": "d1",
          },
          Object {
            "_id": "ObjectID",
            "name": "m1",
          },
        ],
      }
    `);
    createChild(child1);
    createChild(child2);
    expect(stringify(data)).toMatchInlineSnapshot(`
      Object {
        "parents": Array [
          Object {
            "_id": "ObjectID",
            "childs": Array [
              Object {
                "_id": "ObjectID",
                "name": "c1",
              },
              Object {
                "_id": "ObjectID",
                "name": "c2",
              },
            ],
            "name": "d1",
          },
          Object {
            "_id": "ObjectID",
            "name": "m1",
          },
        ],
      }
    `);
  });
});
