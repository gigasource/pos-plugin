import {
  inventories,
  filter,
  filteredInventory,
  addFilter,
  clearFilter,
  removeFilter,
  inventoryCategories
} from "../inventory-logic-ui";
import { nextTick } from "vue";

const moment = require("moment");

/**
 * All date will be 05/01/2021
 */
function genDate() {
  return moment("05.01.2021", "DD.MM.YYYY").toDate();
}

/**
 * In this test, inventoryHistories lacks some attributes
 */
describe("Test inventory logic ui", function() {
  beforeAll(async () => {
    inventories.value.push({
      _id: "1",
      name: "Fish",
      unit: "piece",
      stock: 30,
      category: { name: "Food", _id: "1" }
    });
    inventories.value.push({
      _id: "2",
      name: "Meat",
      unit: "kg",
      stock: 12,
      category: { name: "Food", _id: "1" }
    });
    inventories.value.push({
      _id: "3",
      name: "Apple",
      unit: "piece",
      stock: 50,
      category: { name: "Fruit", _id: "2" }
    });
    inventories.value.push({
      _id: "4",
      name: "Banana",
      unit: "piece",
      stock: 15,
      category: { name: "Fruit", _id: "2" }
    });
    inventoryCategories.value.push({
      _id: "1",
      name: "Food"
    });
    inventoryCategories.value.push({
      _id: "2",
      name: "Fruit"
    });
    inventoryCategories.value.push({
      _id: "3",
      name: "Cream"
    });
  });

  it("Case 1: Test filter inventory", async () => {
    addFilter({
      category: {
        name: "Food"
      }
    });
    await nextTick();
    expect(filter.value).toMatchInlineSnapshot(`
      Object {
        "category": Object {
          "name": "Food",
        },
      }
    `);
    expect(filteredInventory.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "1",
          "category": Object {
            "_id": "1",
            "name": "Food",
          },
          "name": "Fish",
          "stock": 30,
          "unit": "piece",
        },
        Object {
          "_id": "2",
          "category": Object {
            "_id": "1",
            "name": "Food",
          },
          "name": "Meat",
          "stock": 12,
          "unit": "kg",
        },
      ]
    `);
    addFilter({
      name: "Fish"
    });
    await nextTick();
    expect(filter.value).toMatchInlineSnapshot(`
      Object {
        "category": Object {
          "name": "Food",
        },
        "name": "Fish",
      }
    `);
    expect(filteredInventory.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "1",
          "category": Object {
            "_id": "1",
            "name": "Food",
          },
          "name": "Fish",
          "stock": 30,
          "unit": "piece",
        },
      ]
    `);
    clearFilter();
    await nextTick();
    expect(filter.value).toMatchInlineSnapshot(`Object {}`);
    addFilter({
      stock: [12, 31]
    });
    await nextTick();
    expect(filter.value).toMatchInlineSnapshot(`
      Object {
        "stock": Array [
          12,
          31,
        ],
      }
    `);
    expect(filteredInventory.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "1",
          "category": Object {
            "_id": "1",
            "name": "Food",
          },
          "name": "Fish",
          "stock": 30,
          "unit": "piece",
        },
        Object {
          "_id": "2",
          "category": Object {
            "_id": "1",
            "name": "Food",
          },
          "name": "Meat",
          "stock": 12,
          "unit": "kg",
        },
        Object {
          "_id": "4",
          "category": Object {
            "_id": "2",
            "name": "Fruit",
          },
          "name": "Banana",
          "stock": 15,
          "unit": "piece",
        },
      ]
    `);
    removeFilter("stock");
    await nextTick();
    expect(filter.value).toMatchInlineSnapshot(`Object {}`);
    expect(filteredInventory.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "1",
          "category": Object {
            "_id": "1",
            "name": "Food",
          },
          "name": "Fish",
          "stock": 30,
          "unit": "piece",
        },
        Object {
          "_id": "2",
          "category": Object {
            "_id": "1",
            "name": "Food",
          },
          "name": "Meat",
          "stock": 12,
          "unit": "kg",
        },
        Object {
          "_id": "3",
          "category": Object {
            "_id": "2",
            "name": "Fruit",
          },
          "name": "Apple",
          "stock": 50,
          "unit": "piece",
        },
        Object {
          "_id": "4",
          "category": Object {
            "_id": "2",
            "name": "Fruit",
          },
          "name": "Banana",
          "stock": 15,
          "unit": "piece",
        },
      ]
    `);
  });

  it("Case 2: Test inventory categories", () => {
    expect(inventoryCategories.value).toMatchSnapshot();
  });
});
