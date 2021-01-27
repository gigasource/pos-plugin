//<editor-fold desc="declare">
import { nextTick } from 'vue'
import {
	loadInventories,
	loadInventoryCategories,
	updateInventory,
	loadInventoryHistories, createInventory, deleteInventory, updateInventoryCategories
} from "../inventory-logic-be";
import _ from 'lodash'
import {inventories, inventoryCategories, inventoryHistories} from "../inventory-logic-ui";
const {stringify} = require("schemahandler/utils");
require("mockdate").set(new Date("2021-01-05").getTime());
const {
  prepareInventoryDb
} = require("../../../backend/inventory/inventory.prepare.test");

jest.mock("cms", () => {
  process.env.USE_GLOBAL_ORM = true;
  const { cmsFactory } = require("../../../test-utils");
  const _cms = cmsFactory("eodDom");
  global.cms = _cms;
  return {
    socket: _cms.feSocket,
    getModel: function(modelName) {
      return _cms.orm(modelName);
    }
  };
});

let cms = global.cms;
let { orm } = cms;
//</editor-fold>

describe("Test inventory logic be", function() {
  beforeAll(async () => {
    await cms.initDemoData();
    cms.triggerFeConnect();
  });
  beforeEach(async () => {
	  await prepareInventoryDb(orm);
	  await loadInventoryCategories();
	  await loadInventories();
	  await loadInventoryHistories();
  })
  it("Case 1: Check load inventories", async () => {
    await nextTick()
    expect(stringify(inventories.value)).toMatchSnapshot();
    expect(stringify(inventoryCategories.value)).toMatchSnapshot();
    expect(stringify(inventoryHistories.value)).toMatchSnapshot()
  });
  it('Case 2: Update inventory', async () => {
  	await updateInventory({
		  ...inventories.value[0],
		  ...{
		  	stock: 20
		  }
	  })
	  expect(stringify(inventories.value)).toMatchSnapshot()
	  expect(stringify(inventoryHistories.value)).toMatchSnapshot()
	  await updateInventory({
		  ...inventories.value[1],
		  ...{
		  	name: 'Lamb',
		  }
	  })
	  await updateInventory({
		  ...inventories.value[2],
		  ...{
		  	category: inventoryCategories.value[1]
		  }
	  })
	  await nextTick()
	  expect(stringify(inventories.value)).toMatchSnapshot()
  })
	it('Case 3: Create inventory', async () => {
		let oldLength = inventories.value.length
		await createInventory({
			name: 'Whiskey',
			category: inventoryCategories.value[2],
			unit: 'l',
			stock: 20
		})
		await nextTick()
		expect(stringify(inventories.value)).toMatchSnapshot()
		expect(inventories.value.length).toEqual(oldLength + 1)
	})
	it('Case 3a: Create inventory with duplicate id', async () => {
		let oldLength = inventories.value.length
		await createInventory({
			name: 'Whiskey',
			category: _.cloneDeep(inventoryCategories.value[2]),
			unit: 'l',
			stock: 20,
			id: '6'
		})
		await nextTick()
		expect(stringify(inventories.value)).toMatchSnapshot()
		expect(inventories.value.length).toEqual(oldLength)
	})
	it('Case 4: Delete inventory', async () => {
		let oldLength = inventories.value.length
		await deleteInventory([
			inventories.value[0]._id,
			inventories.value[2]._id
		])
		await nextTick()
		expect(stringify(inventories.value)).toMatchSnapshot()
		expect(inventories.value.length).toEqual(oldLength - 2)
	})
	it('Case 5: Update and delete category', async () => {
		const addedCategory = [{
			name: 'Cream',
			available: true
		}]
		await updateInventoryCategories([...addedCategory, ...inventoryCategories.value])
		await nextTick()
		expect(stringify(inventoryCategories.value)).toMatchSnapshot()
		const oldValue = _.cloneDeep(inventoryCategories.value)
		await loadInventoryCategories()
		await nextTick()
		expect(inventoryCategories.value.length).toEqual(oldValue.length)
		expect(stringify(inventoryCategories.value)).toMatchSnapshot()
		for (const category of inventoryCategories.value) {
			const oldCategory = oldValue.find(_category => category._id.toString() === _category._id.toString())
			expect(!!oldCategory).toBe(true)
		}
	})
	it('Case 6: Update inventory with object id', async () => {
		await updateInventory({
			...inventories.value[0],
			...{
				category: inventoryCategories.value[1]._id
			}
		})
		await nextTick()
		expect(stringify(inventories.value)).toMatchSnapshot()
		expect(stringify(inventoryCategories.value)).toMatchSnapshot()
		await updateInventory({
			...inventories.value[0],
			...{
				category: inventoryCategories.value[2]._id.toString()
			}
		})
		await nextTick()
		expect(stringify(inventories.value)).toMatchSnapshot()
		expect(stringify(inventoryCategories.value)).toMatchSnapshot()
	})
});
