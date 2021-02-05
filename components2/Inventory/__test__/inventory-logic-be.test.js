//<editor-fold desc="declare">
import { nextTick } from 'vue'
import {
	loadInventories,
	loadInventoryCategories,
	updateInventory,
	createInventory, deleteInventory, updateInventoryCategories, removeFromInventory
} from '../inventory-logic-be';
import _ from 'lodash'
import { inventories, inventoryCategories } from "../inventory-logic-ui";
import {
	filteredInventoryHistories,
	historyFilter
} from '../inventory-ui-shared'
import {appType, currentAppType} from "../../AppSharedStates";
const {stringify} = require("schemahandler/utils");
require("mockdate").set(new Date("2021-01-05").getTime());
const moment = require('moment')
const {
  prepareInventoryDb,
	prepareInventoryRetailDb
} = require("../../../backend/inventory/inventory.prepare.test");
const delay = require('delay')

jest.mock("cms", () => {
  process.env.USE_GLOBAL_ORM = true;
  const { cmsFactory } = require("../../../test-utils");
  const _cms = cmsFactory("inventoryBe");
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
  })
  it("Case 1: Check load inventories", async () => {
    await nextTick()
    expect(stringify(inventories.value)).toMatchSnapshot();
    expect(stringify(inventoryCategories.value)).toMatchSnapshot();
  });
  it('Case 2: Update inventory', async () => {
  	await nextTick()
  	await updateInventory({
		  ...inventories.value[0],
		  ...{
		  	stock: 20
		  }
	  })
	  const a = inventories.value
	  historyFilter.value = {
  		fromDate: moment('04.01.2021', 'DD.MM.YYYY').toDate(),
			toDate: moment('06.01.2021', 'DD.MM.YYYY').toDate()
		}
		await nextTick()
		await delay(50)
	  expect(stringify(filteredInventoryHistories.value)).toMatchSnapshot()
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

/**
 * @desc db test is:
 * [
		 {name: 'Fish', category: foodCategory._id, unit: 'kg', stock: 30, id: '1', lastUpdateTimestamp: genDate(), price: 30, unitCostPrice: 10, isFavorite: false, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: true, manualPrice: false, hasComboIngredient: false, attributes: [], comboIngredient: []},
		 {name: 'Meat', category: foodCategory._id, unit: 'kg', stock: 50, id: '2', lastUpdateTimestamp: genDate(), price: 20, unitCostPrice: 15, isFavorite: true, isVoucher: false, isActive: true, isRefundable: true, showOnOrderScreen: true, manualPrice: true, hasComboIngredient: false, attributes: [], comboIngredient: []},
		 {name: 'Pork', category: foodCategory._id, unit: 'kg', stock: 60.22, id: '3', lastUpdateTimestamp: genDate(), price: 55, unitCostPrice: 30, isFavorite: true, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: true, manualPrice: false, hasComboIngredient: false, attributes: [], comboIngredient: []},
		 {name: 'Apple', category: fruitCategory._id, unit: 'piece', stock: 100, id: '4', lastUpdateTimestamp: genDate(), price: 100, unitCostPrice: 50, isFavorite: true, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: false, manualPrice: false, hasComboIngredient: false, attributes: [{color: 'red'}], comboIngredient: []},
		 {name: 'Banana', category: fruitCategory._id, unit: 'piece', stock: 10, id: '5', lastUpdateTimestamp: genDate(), price: 17, unitCostPrice: 4, isFavorite: true, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: true, manualPrice: false, hasComboIngredient: false, attributes: [{size: 'big'}], comboIngredient: []},
		 {name: 'Vodka', category: drinkCategory.subCategory[0]._id, unit: 'l', stock: 5.5, id: '6', lastUpdateTimestamp: genDate(), price: 44, unitCostPrice: 22, isFavorite: true, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: true, manualPrice: false, hasComboIngredient: false, attributes: [], comboIngredient: []},
     {name: 'ComboFishMeat', category: foodCategory._id, unit: 'piece', stock: 1, id: '7', lastUpdateTimestamp: genDate(), price: 55, unitCostPrice: inventories[0].unitCostPrice * 20 + inventories[1].unitCostPrice, isFavorite: true, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: true, manualPrice: false, hasComboIngredient: true, attributes: [], comboIngredient: [{ _id: inventories[0]._id, quantity: 20 },  { _id: inventories[1]._id, quantity: 1 }]}
 ]
 */
describe("Test inventory logic be for retail", function () {
	beforeAll(async () => {
		await cms.initDemoData();
		cms.triggerFeConnect();
		currentAppType.value = appType.POS_RETAIL
	});

	beforeEach(async () => {
		await prepareInventoryRetailDb(orm)
		await loadInventoryCategories()
		await loadInventories()
	})

	it("Case 1: Check load inventories", async () => {
		await nextTick()
		expect(stringify(inventories.value)).toMatchSnapshot();
		expect(stringify(inventoryCategories.value)).toMatchSnapshot();
	});

	it('Case 2: Test remove item from category', async () => {
		await nextTick()
		await removeFromInventory([
			{
				_id: inventories.value[0]._id,
				quantity: 5
			},
			{
				_id: inventories.value[6]._id,
				quantity: 1
			}
		])
		await nextTick()
		await delay(50)
		expect(stringify(inventories.value)).toMatchSnapshot();
	})

	it('Case 2a: Test remove item from inventory fail', async () => {
		await nextTick()
		const result = await removeFromInventory([
			{
				_id: inventories.value[0]._id,
				quantity: 11
			},
			{
				_id: inventories.value[6]._id,
				quantity: 2
			}
		])
		await nextTick()
		await delay(50)
		expect(stringify(result)).toMatchSnapshot()
	})
})
