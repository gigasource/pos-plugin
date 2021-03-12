import {
  inventories,
  filter,
  filteredInventory,
  addFilter,
  clearFilter,
  removeFilter
} from "../inventory-logic-ui";
import { products, categories } from "../../Product/product-logic";
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
      productId: "1",
      unit: "piece",
      stock: 30
    });
    inventories.value.push({
      _id: "2",
      productId: "2",
      unit: "kg",
      stock: 12
    });
    inventories.value.push({
      _id: "3",
      productId: "3",
      unit: "piece",
      stock: 50
    });
    inventories.value.push({
      _id: "4",
      productId: "4",
      unit: "piece",
      stock: 15
    });
    products.value.push({
      _id: "1",
      category: ["1"],
      name: "Fish"
    });
    products.value.push({
      _id: "2",
      category: ["1"],
      name: "Meat"
    });
    products.value.push({
      _id: "3",
      category: ["2"],
      name: "Apple"
    });
    products.value.push({
      _id: "4",
      category: ["2"],
      name: "Banana"
    });
    categories.value.push({
      _id: "1",
      name: "Food"
    });
    categories.value.push({
      _id: "2",
      name: "Fruit"
    });
    categories.value.push({
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
          "product": Object {
            "_id": "1",
            "category": Array [
              Object {
                "_id": "1",
                "available": false,
                "name": "Food",
              },
            ],
            "name": "Fish",
          },
          "productId": "1",
          "stock": 30,
          "unit": "piece",
        },
        Object {
          "_id": "2",
          "product": Object {
            "_id": "2",
            "category": Array [
              Object {
                "_id": "1",
                "available": false,
                "name": "Food",
              },
            ],
            "name": "Meat",
          },
          "productId": "2",
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
          "product": Object {
            "_id": "1",
            "category": Array [
              Object {
                "_id": "1",
                "available": false,
                "name": "Food",
              },
            ],
            "name": "Fish",
          },
          "productId": "1",
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
          "product": Object {
            "_id": "1",
            "category": Array [
              Object {
                "_id": "1",
                "available": false,
                "name": "Food",
              },
            ],
            "name": "Fish",
          },
          "productId": "1",
          "stock": 30,
          "unit": "piece",
        },
        Object {
          "_id": "2",
          "product": Object {
            "_id": "2",
            "category": Array [
              Object {
                "_id": "1",
                "available": false,
                "name": "Food",
              },
            ],
            "name": "Meat",
          },
          "productId": "2",
          "stock": 12,
          "unit": "kg",
        },
        Object {
          "_id": "4",
          "product": Object {
            "_id": "4",
            "category": Array [
              Object {
                "_id": "2",
                "available": false,
                "name": "Fruit",
              },
            ],
            "name": "Banana",
          },
          "productId": "4",
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
          "product": Object {
            "_id": "1",
            "category": Array [
              Object {
                "_id": "1",
                "available": false,
                "name": "Food",
              },
            ],
            "name": "Fish",
          },
          "productId": "1",
          "stock": 30,
          "unit": "piece",
        },
        Object {
          "_id": "2",
          "product": Object {
            "_id": "2",
            "category": Array [
              Object {
                "_id": "1",
                "available": false,
                "name": "Food",
              },
            ],
            "name": "Meat",
          },
          "productId": "2",
          "stock": 12,
          "unit": "kg",
        },
        Object {
          "_id": "3",
          "product": Object {
            "_id": "3",
            "category": Array [
              Object {
                "_id": "2",
                "available": false,
                "name": "Fruit",
              },
            ],
            "name": "Apple",
          },
          "productId": "3",
          "stock": 50,
          "unit": "piece",
        },
        Object {
          "_id": "4",
          "product": Object {
            "_id": "4",
            "category": Array [
              Object {
                "_id": "2",
                "available": false,
                "name": "Fruit",
              },
            ],
            "name": "Banana",
          },
          "productId": "4",
          "stock": 15,
          "unit": "piece",
        },
      ]
    `);
  });
});
