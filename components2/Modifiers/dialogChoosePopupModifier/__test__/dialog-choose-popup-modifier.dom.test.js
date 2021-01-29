import cms from "cms";
import { onCreateItem } from "../../dialogEditPopupModifier/modifier-ui-logics";
import dialogChoosePopupModifier2 from "../dialogChoosePopupModifier2";
import dialogChoosePopupModifierLogicsFactory from "../dialog-choose-popup-modifier-logics";
import * as Logics from "../dialog-choose-popup-modifier-logics";
import { appHooks } from "../../../AppSharedStates";
import { wrapper, setComponent, makeWrapper } from "../../../test-utils";
import delay from "delay";
import { ObjectID } from "bson";
import { nextTick } from "vue";
import { stringify } from "schemahandler/utils";
let group1, category1, category2, item1, item2, item3, item4, product;
product = {
  name: "Water",
  activePopupModifierGroup: new ObjectID()
};
const {
  internalValue,
  categories,
  enableSaveBtn,
  activeItem,
  onClickModifier,
  getModifierQty,
  onSave
} = dialogChoosePopupModifierLogicsFactory({ product }, { emit: {} });

beforeAll(async () => {
  const orm = require("schemahandler");
  await orm.connect("mongodb://localhost:27017", "Modifiers");
  const Modifier = cms.getModel("Modifiers");
  await Modifier.remove({});
  await Modifier.create({ groups: [] });
  // create 1 group
  appHooks.emit("updateModifiers");
  await delay(100);
  group1 = await onCreateItem("groups", "group", {
    name: "g1",
    _id: product.activePopupModifierGroup
  });
  // create 2 categories in 1st group
  category1 = await onCreateItem("groups.0.categories", "category", {
    name: "c1"
  });
  category2 = await onCreateItem("groups.0.categories", "category", {
    name: "c2",
    mandatory: false,
    selectOne: false
  });
  // create 2 items in 1st category
  item1 = await onCreateItem("groups.0.categories.0.items", "modifier", {
    name: "i1",
    max: 2
  });
  item2 = await onCreateItem("groups.0.categories.0.items", "modifier", {
    name: "i2"
  });
  // create 2 items in 2nd category
  item3 = await onCreateItem("groups.0.categories.1.items", "modifier", {
    name: "i3",
    max: 3
  });
  item4 = await onCreateItem("groups.0.categories.1.items", "modifier", {
    name: "i4"
  });

  await nextTick();
  await delay(50); // wait updating modifiers
  const mock = jest.spyOn(Logics, "default");
  mock.mockImplementation(() => {
    return {
      internalValue,
      categories,
      enableSaveBtn,
      activeItem,
      onClickModifier,
      getModifierQty,
      onSave
    };
  });
});

describe("test dialog choose popup modifier ui", () => {
  it("should render", async () => {
    makeWrapper(dialogChoosePopupModifier2, {
      props: { product }
    });
    //test case: selectOne = true
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <g-dialog-stub width="60%">
        <g-card-stub class="pt-3 pr-4 pb-3 pl-4">
          <g-card-title-stub>
            <div class="row-flex flex-grow-1">
              <div class="flex-grow-1">
                Water
              </div>
              <g-icon-stub>
                icon-close
              </g-icon-stub>
            </div>
          </g-card-title-stub>
          <g-card-text-stub>
            <div>
              <span>
                c1
              </span>
              <span style="color: rgb(255, 68, 82);">
                *
              </span>
            </div>
            <div class="mt-2 mb-3">
              <g-grid-select-stub items="[object Object],[object Object]"
                                  grid="false"
                                  return-object="true"
                                  multiple="false"
                                  mandatory="true"
              >
              </g-grid-select-stub>
            </div>
            <div>
              <span>
                c2
              </span>
            </div>
            <div class="mt-2 mb-3">
              <g-grid-select-stub items="[object Object],[object Object]"
                                  grid="false"
                                  return-object="true"
                                  multiple="true"
                                  mandatory="false"
                                  modelvalue
              >
              </g-grid-select-stub>
            </div>
          </g-card-text-stub>
          <g-card-actions-stub>
            <g-btn-stub background-color="#2979FF"
                        text-color="#fff"
                        disabled="true"
            >
              Save
            </g-btn-stub>
          </g-card-actions-stub>
        </g-card-stub>
      </g-dialog-stub>
    `);
    onClickModifier(item1, category1);
    expect(getModifierQty(item1)).toEqual(1);
    onClickModifier(item2, category1);
    expect(getModifierQty(item1)).toEqual(0);
    expect(getModifierQty(item2)).toEqual(1);
    //test quantity
    onClickModifier(item1, category1);
    onClickModifier(item1, category1);
    expect(getModifierQty(item1)).toEqual(2);
    onClickModifier(item1, category1);
    expect(getModifierQty(item1)).toEqual(0);
    expect(activeItem(category1).value).toMatchInlineSnapshot(`null`);
    onClickModifier(item1, category1);
    expect(stringify(activeItem(category1).value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "max": 2,
        "name": "i1",
        "price": 0,
        "type": "modifier",
      }
    `);
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <g-dialog-stub width="60%">
        <g-card-stub class="pt-3 pr-4 pb-3 pl-4">
          <g-card-title-stub>
            <div class="row-flex flex-grow-1">
              <div class="flex-grow-1">
                Water
              </div>
              <g-icon-stub>
                icon-close
              </g-icon-stub>
            </div>
          </g-card-title-stub>
          <g-card-text-stub>
            <div>
              <span>
                c1
              </span>
              <span style="color: rgb(255, 68, 82);">
                *
              </span>
            </div>
            <div class="mt-2 mb-3">
              <g-grid-select-stub items="[object Object],[object Object]"
                                  grid="false"
                                  return-object="true"
                                  multiple="false"
                                  mandatory="true"
                                  modelvalue="[object Object]"
              >
              </g-grid-select-stub>
            </div>
            <div>
              <span>
                c2
              </span>
            </div>
            <div class="mt-2 mb-3">
              <g-grid-select-stub items="[object Object],[object Object]"
                                  grid="false"
                                  return-object="true"
                                  multiple="true"
                                  mandatory="false"
                                  modelvalue
              >
              </g-grid-select-stub>
            </div>
          </g-card-text-stub>
          <g-card-actions-stub>
            <g-btn-stub background-color="#2979FF"
                        text-color="#fff"
                        disabled="false"
            >
              Save
            </g-btn-stub>
          </g-card-actions-stub>
        </g-card-stub>
      </g-dialog-stub>
    `);
    onClickModifier(item2, category1);
    expect(stringify(activeItem(category1).value)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "max": 1,
        "name": "i2",
        "price": 0,
        "type": "modifier",
      }
    `);

    //test case: selectOne = false
    onClickModifier(item3, category2);
    onClickModifier(item4, category2);
    onClickModifier(item3, category2);
    onClickModifier(item3, category2);
    expect(stringify(activeItem(category2).value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "max": 3,
          "name": "i3",
          "price": 0,
          "type": "modifier",
        },
        Object {
          "_id": "ObjectID",
          "max": 1,
          "name": "i4",
          "price": 0,
          "type": "modifier",
        },
      ]
    `);
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <g-dialog-stub width="60%">
        <g-card-stub class="pt-3 pr-4 pb-3 pl-4">
          <g-card-title-stub>
            <div class="row-flex flex-grow-1">
              <div class="flex-grow-1">
                Water
              </div>
              <g-icon-stub>
                icon-close
              </g-icon-stub>
            </div>
          </g-card-title-stub>
          <g-card-text-stub>
            <div>
              <span>
                c1
              </span>
              <span style="color: rgb(255, 68, 82);">
                *
              </span>
            </div>
            <div class="mt-2 mb-3">
              <g-grid-select-stub items="[object Object],[object Object]"
                                  grid="false"
                                  return-object="true"
                                  multiple="false"
                                  mandatory="true"
                                  modelvalue="[object Object]"
              >
              </g-grid-select-stub>
            </div>
            <div>
              <span>
                c2
              </span>
            </div>
            <div class="mt-2 mb-3">
              <g-grid-select-stub items="[object Object],[object Object]"
                                  grid="false"
                                  return-object="true"
                                  multiple="true"
                                  mandatory="false"
                                  modelvalue="[object Object],[object Object]"
              >
              </g-grid-select-stub>
            </div>
          </g-card-text-stub>
          <g-card-actions-stub>
            <g-btn-stub background-color="#2979FF"
                        text-color="#fff"
                        disabled="false"
            >
              Save
            </g-btn-stub>
          </g-card-actions-stub>
        </g-card-stub>
      </g-dialog-stub>
    `);
    onClickModifier(item3, category2);
    expect(stringify(activeItem(category2).value)).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "max": 1,
          "name": "i4",
          "price": 0,
          "type": "modifier",
        },
      ]
    `);
  });
});
