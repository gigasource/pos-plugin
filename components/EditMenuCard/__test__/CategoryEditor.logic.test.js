import _ from "lodash";
import { nextTick } from "vue";
import {
  editable,
  loadOrderLayout,
  orderLayout,
  selectCategoryLayout,
  selectedCategoryLayout
} from "../../OrderView/pos-ui-shared";
const delay = require("delay");
import {
  _updateCategory
} from "../CategoryEditor/category-editor-category";

import { changeCategoryColumn } from "../CategoryEditor/category-editor-order-layout";
import { stringify } from 'schemahandler/utils'

import { orm } from "../../test-utils";

import { demoData } from "../../OrderView/__test__/demoData";

describe("Logic:CategoryEditor", () => {
  beforeEach(async () => {
    await orm("OrderLayout").remove({});
    await orm("OrderLayout").create(demoData.OrderLayout[0]);
  });

  // the same to update categories row
  it("should change categories column", async () => {
    await loadOrderLayout();
    await changeCategoryColumn(5);
    await nextTick();
    await delay(100);
    expect(orderLayout.value.columns).toBe(5);
  });

  describe("updateCategory", () => {
    it("should assign change to selectedCategoryLayout", async () => {
      await loadOrderLayout();
      await selectCategoryLayout({ top: 0, left: 0 });
      const currentValue = _.cloneDeep(selectedCategoryLayout.value);
      const change = { row: 1, column: 2, color: "#FFF" };
      // for some reason, _.debounce doesn't work in the test
      await _updateCategory(change);
      await nextTick();
      expect(selectedCategoryLayout.value).toEqual(
        Object.assign({}, currentValue, change)
      );
    });

    it("should create new category layout __if__ forceCreate is true and selectedCategoryLayout._id is null", async () => {
      editable.value = true;
      await loadOrderLayout();
      await selectCategoryLayout({ top: 0, left: 1 }); // select blank category
      console.log(selectedCategoryLayout.value)
      await _updateCategory(
        { name: "Fruit", rows: 1, columns: 2, color: "#FFF" },
        true
      );
      await delay(100);
      editable.value = false;
      await loadOrderLayout();
      // Test case failed but it still running correctly in front-end :$
      expect(stringify(selectedCategoryLayout.value)).toMatchInlineSnapshot(`
        Object {
          "_id": "ObjectID",
          "color": "#FFF",
          "columns": 2,
          "left": 1,
          "name": "Fruit",
          "rows": 1,
          "top": 0,
        }
      `);
    });

    it("should update category __if__ selectedCategoryLayout._id exist", async () => {
      editable.value = true;
      await loadOrderLayout();
      await selectCategoryLayout({ top: 0, left: 0 }); // select existed
      await _updateCategory(
        { name: "Fruit", rows: 1, columns: 2, color: "#FFF" },
        true
      );
      await delay(100);
      editable.value = false;
      await loadOrderLayout();
      expect(_.omit(selectedCategoryLayout.value, "products"))
        .toMatchInlineSnapshot(`
        Object {
          "_id": "5e7ad2185028531d08009e32",
          "color": "#FFF",
          "columns": 2,
          "left": 0,
          "name": "Fruit",
          "rows": 1,
          "top": 0,
        }
      `);
    });
  });
});
