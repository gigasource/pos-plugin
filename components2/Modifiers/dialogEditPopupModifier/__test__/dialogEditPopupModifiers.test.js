import cms from "cms";
import dialogEditPopupModifiers2 from "../dialogEditPopupModifiers2";
import { nextTick } from "vue";
import { stringify } from "schemahandler/utils";
import _ from "lodash";
import { makeWrapper, wrapper } from "../../../test-utils";
import {
  activeItem,
  categories,
  currentGroup,
  currentGroupIdx,
  modifierGroups,
  onCreateItem,
  onDeleteActiveItem,
  onDuplicate,
  onRemoveItem,
  onSelect,
  onUpdateItem
} from "../modifier-ui-logics";
import delay from "delay";
import { isSameId } from "../../../utils";

// const group1 = { _id: new ObjectID(), name: "g1", categories: [] };
// const group2 = { _id: new ObjectID(), name: "g2", categories: [] };
// const category1 = { _id: new ObjectID(), name: "c1", items: [] };
// const category2 = { _id: new ObjectID(), name: "c2", items: [] };
// const item1 = { _id: new ObjectID(), name: "i1" };
// const item2 = { _id: new ObjectID(), name: "i2" };
// const item3 = { _id: new ObjectID(), name: "i2" };

jest.setTimeout(10000)
beforeAll(async () => {
  const orm = require('schemahandler')
  await orm.connect("mongodb://localhost:27017", "Modifiers");
  const Modifier = cms.getModel("Modifiers");
  await Modifier.remove({});
  await Modifier.create({ groups: [] });
});
describe("test dialog edit popup modifier UI", () => {
  it("should render", async () => {
    makeWrapper(dialogEditPopupModifiers2, { shallow: true });
    await delay(300); // wait fetch modifiers
    await onCreateItem("groups", "group");
    await nextTick()
    expect(stringify(currentGroup.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "categories": Array [],
        "name": "New Group",
        "type": "group",
      }
    `);

    const firstGroupTmp = _.cloneDeep(activeItem.value);
    await onCreateItem(
      `groups.${currentGroupIdx.value}.categories`,
      "category"
    );
    await nextTick();
    const categoryTmp = _.cloneDeep(activeItem.value);
    expect(stringify(modifierGroups.value)).toMatchInlineSnapshot(`
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
            "type": "group",
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
    expect(stringify(modifierGroups.value)).toMatchInlineSnapshot(`
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
            "type": "group",
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
    expect(stringify(modifierGroups.value)).toMatchInlineSnapshot(`
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
            "type": "group",
          },
        ],
      }
    `);

    expect(wrapper.text()).toMatchInlineSnapshot(
      `"New Groupadd Group New Categorykeyboard_arrow_rightNew ModifierketchupaddItem addCategory Group printerdeleteDelete this item Close"`
    );
    await onRemoveItem(`groups.0.categories`, categoryTmp);
    await nextTick()
    expect(stringify(modifierGroups.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "New Group",
            "type": "group",
          },
        ],
      }
    `);
    await onCreateItem(`groups`, "group");
    await nextTick()
    await onUpdateItem(`groups`, activeItem.value, {
      name: "second group"
    });
    await nextTick()
    expect(stringify(modifierGroups.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "New Group",
            "type": "group",
          },
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "second group",
            "type": "group",
          },
        ],
      }
    `);
    onSelect({ ...firstGroupTmp }, "group");
    await nextTick()
    await onDeleteActiveItem();
    await nextTick()
    expect(stringify(modifierGroups.value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "second group",
            "type": "group",
          },
        ],
      }
    `);

    const dbData = await cms.getModel("Modifiers").findOne({});
    expect(stringify(dbData)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "groups": Array [
          Object {
            "_id": "ObjectID",
            "categories": Array [],
            "name": "second group",
            "type": "group",
          },
        ],
      }
    `);
    const firstCategory = await onCreateItem(
      `groups.${currentGroupIdx.value}.categories`,
      "category"
    );
    await onDuplicate();
    await nextTick()
    expect(modifierGroups.value.groups.length).toEqual(2);
    expect(modifierGroups.value.groups[1].categories.length).toEqual(1);
    expect(
      isSameId(
        modifierGroups.value.groups[1].categories[0],
        modifierGroups.value.groups[0].categories[0]
      )
    ).toBeFalsy();
  });
});
