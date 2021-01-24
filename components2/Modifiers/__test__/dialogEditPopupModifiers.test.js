import cms from "cms";
import dialogEditPopupModifiers2 from "../dialogEditPopupModifiers2";
import { nextTick, onUpdated, ref } from "vue";
import { stringify } from "schemahandler/utils";
import _ from "lodash";
import { setComponent, wrapper, makeWrapper } from "../../test-utils";
import {
  currentGroup,
  modifiers,
  onCreateItem,
  onSelect,
  onRemoveItem,
  currentGroupIdx,
  categories,
  activeItem,
  onUpdateItem,
  deleteActiveItem
} from "../modifier-ui-logics";
import delay from "delay";
import { ObjectID } from "bson";
import { CRUdFactory } from "../CRUD/crud";
import { CRUdDbFactory } from "../CRUD/crud-db";

// const group1 = { _id: new ObjectID(), name: "g1", categories: [] };
// const group2 = { _id: new ObjectID(), name: "g2", categories: [] };
// const category1 = { _id: new ObjectID(), name: "c1", items: [] };
// const category2 = { _id: new ObjectID(), name: "c2", items: [] };
// const item1 = { _id: new ObjectID(), name: "i1" };
// const item2 = { _id: new ObjectID(), name: "i2" };
// const item3 = { _id: new ObjectID(), name: "i2" };

beforeAll(async () => {
  const Modifier = cms.getModel("Modifier");
  await Modifier.remove({});
  await Modifier.create({ groups: [] });
});

describe("test dialog edit popup modifier UI", () => {
  it("should render", async () => {
    setComponent(dialogEditPopupModifiers2);
    makeWrapper(null, { shallow: true });
    await delay(300); // wait fetch modifiers
    await onCreateItem("groups", "group");
    expect(stringify(currentGroup.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "categories": Array [],
        "name": "New Group",
      }
    `);
    const firstGroupTmp = _.cloneDeep(activeItem.value);
    await onCreateItem(
      `groups.${currentGroupIdx.value}.categories`,
      "category"
    );
    await nextTick();

    const categoryTmp = _.cloneDeep(activeItem.value);
    expect(stringify(modifiers.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [
              Object {
                "_id": "ObjectID",
                "freeItems": 0,
                "items": Array [],
                "mandatory": true,
                "name": "New Category",
                "selectOne": true,
                "type": "category",
              },
            ],
            "name": "New Group",
          },
        ],
      }
    `);
    expect(stringify(categories.value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "freeItems": 0,
          "items": Array [],
          "mandatory": true,
          "name": "New Category",
          "selectOne": true,
          "type": "category",
        },
      ]
    `);
    await onCreateItem(`groups.0.categories.0.items`, "modifier");
    await nextTick();
    expect(stringify(activeItem.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "max": 1,
        "name": "New Modifier",
        "price": 0,
        "type": "modifier",
      }
    `);
    await onRemoveItem(`groups.0.categories.0.items`, activeItem.value);
    await nextTick();
    await delay(50);
    expect(stringify(modifiers.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [
              Object {
                "_id": "ObjectID",
                "freeItems": 0,
                "items": Array [],
                "mandatory": true,
                "name": "New Category",
                "selectOne": true,
                "type": "category",
              },
            ],
            "name": "New Group",
          },
        ],
      }
    `);
    await onCreateItem(`groups.0.categories.0.items`, "modifier");
    await onCreateItem(`groups.0.categories.0.items`, "modifier");
    await onUpdateItem(`groups.0.categories.0.items`, activeItem.value, {
      name: "ketchup"
    });

    await nextTick();
    expect(stringify(modifiers.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [
              Object {
                "_id": "ObjectID",
                "freeItems": 0,
                "items": Array [
                  Object {
                    "_id": "ObjectID",
                    "max": 1,
                    "name": "New Modifier",
                    "price": 0,
                    "type": "modifier",
                  },
                  Object {
                    "_id": "ObjectID",
                    "max": 1,
                    "name": "ketchup",
                    "price": 0,
                    "type": "modifier",
                  },
                ],
                "mandatory": true,
                "name": "New Category",
                "selectOne": true,
                "type": "category",
              },
            ],
            "name": "New Group",
          },
        ],
      }
    `);

    expect(wrapper.text()).toMatchInlineSnapshot(
      `"New Groupadd Group New Categorykeyboard_arrow_rightNew ModifierketchupaddItem addCategory deleteDelete this item Close"`
    );
    await onRemoveItem(`groups.0.categories`, categoryTmp);
    expect(stringify(modifiers.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "New Group",
          },
        ],
      }
    `);
    await onCreateItem(`groups`, "group");
    await onUpdateItem(`groups`, activeItem.value, {
      name: "second group"
    });
    expect(stringify(modifiers.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "New Group",
          },
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "second group",
          },
        ],
      }
    `);
    onSelect({ ...firstGroupTmp }, "group");
    await deleteActiveItem();
    expect(stringify(modifiers.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "second group",
          },
        ],
      }
    `);

    const dbData = await cms.getModel("Modifier").findOne({});
    expect(stringify(dbData)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "second group",
          },
        ],
      }
    `);
  });
});
