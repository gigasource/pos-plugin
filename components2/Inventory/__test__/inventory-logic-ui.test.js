import {
  inventories,
  filter,
  filteredInventory,
  addFilter,
  clearFilter,
  removeFilter,
  inventoryHistories,
  inventoryCategories,
  filteredInventoryHistories
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
      category: { name: "Food" }
    });
    inventories.value.push({
      _id: "2",
      name: "Meat",
      unit: "kg",
      stock: 12,
      category: { name: "Food" }
    });
    inventories.value.push({
      _id: "3",
      name: "Apple",
      unit: "piece",
      stock: 50,
      category: { name: "Fruit" }
    });
    inventories.value.push({
      _id: "4",
      name: "Banana",
      unit: "piece",
      stock: 15,
      category: { name: "Fruit" }
    });
    inventoryCategories.value.push({
      name: "Fruit"
    });
    inventoryCategories.value.push({
      name: "Food"
    });
    inventoryHistories.value.push({
      amount: 30,
      inventory: "3",
      type: "add",
      date: genDate()
    });
    inventoryHistories.value.push({
      amount: 10,
      inventory: "3",
      type: "add",
      date: genDate()
    });
    inventoryHistories.value.push({
      amount: 10,
      inventory: "3",
      type: "remove",
      date: genDate()
    });
    inventoryHistories.value.push({
      amount: 25,
      inventory: "2",
      type: "add",
      date: genDate()
    });
  });

  it("Case 1: Test filter inventory", async () => {
    addFilter({
      category: "Food"
    });
    await nextTick();
    expect(filter.value).toMatchInlineSnapshot(`
      Object {
        "category": "Food",
      }
    `);
    expect(filteredInventory.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "1",
          "category": Object {
            "name": "Food",
          },
          "name": "Fish",
          "stock": 30,
          "unit": "piece",
        },
        Object {
          "_id": "2",
          "category": Object {
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
        "category": "Food",
        "name": "Fish",
      }
    `);
    expect(filteredInventory.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "1",
          "category": Object {
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
            "name": "Food",
          },
          "name": "Fish",
          "stock": 30,
          "unit": "piece",
        },
        Object {
          "_id": "2",
          "category": Object {
            "name": "Food",
          },
          "name": "Meat",
          "stock": 12,
          "unit": "kg",
        },
        Object {
          "_id": "4",
          "category": Object {
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
            "name": "Food",
          },
          "name": "Fish",
          "stock": 30,
          "unit": "piece",
        },
        Object {
          "_id": "2",
          "category": Object {
            "name": "Food",
          },
          "name": "Meat",
          "stock": 12,
          "unit": "kg",
        },
        Object {
          "_id": "3",
          "category": Object {
            "name": "Fruit",
          },
          "name": "Apple",
          "stock": 50,
          "unit": "piece",
        },
        Object {
          "_id": "4",
          "category": Object {
            "name": "Fruit",
          },
          "name": "Banana",
          "stock": 15,
          "unit": "piece",
        },
      ]
    `);
  });

  it("Case 2: Test inventory histories", async () => {
    expect(inventoryHistories.value).toMatchSnapshot();
    expect(filteredInventoryHistories.value).toMatchSnapshot();
  });
});
