import {
  inventories,
  filter,
  filteredInventory,
  addFilter,
  clearFilter,
  removeFilter
} from "../inventory-logic-ui";
import { nextTick } from "vue";

describe("Test inventory logic ui", function() {
  beforeAll(async () => {
    inventories.value.push({
      name: "Fish",
      unit: "piece",
      stock: 30,
      category: { name: "Food" }
    });
    inventories.value.push({
      name: "Meat",
      unit: "kg",
      stock: 12,
      category: { name: "Food" }
    });
    inventories.value.push({
      name: "Apple",
      unit: "piece",
      stock: 50,
      category: { name: "Fruit" }
    });
    inventories.value.push({
      name: "Banana",
      unit: "piece",
      stock: 15,
      category: { name: "Fruit" }
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
          "category": Object {
            "name": "Food",
          },
          "name": "Fish",
          "stock": 30,
          "unit": "piece",
        },
        Object {
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
          "category": Object {
            "name": "Food",
          },
          "name": "Fish",
          "stock": 30,
          "unit": "piece",
        },
        Object {
          "category": Object {
            "name": "Food",
          },
          "name": "Meat",
          "stock": 12,
          "unit": "kg",
        },
        Object {
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
          "category": Object {
            "name": "Food",
          },
          "name": "Fish",
          "stock": 30,
          "unit": "piece",
        },
        Object {
          "category": Object {
            "name": "Food",
          },
          "name": "Meat",
          "stock": 12,
          "unit": "kg",
        },
        Object {
          "category": Object {
            "name": "Fruit",
          },
          "name": "Apple",
          "stock": 50,
          "unit": "piece",
        },
        Object {
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
});
