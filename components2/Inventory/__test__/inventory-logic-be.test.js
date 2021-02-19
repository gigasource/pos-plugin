//<editor-fold desc="declare">
import { nextTick } from 'vue'
import {
	loadInventories,
	updateInventory,
	createInventory, deleteInventory, removeFromInventory
} from '../inventory-logic-be';
import { inventories, detailInventories } from "../inventory-logic-ui";
import {
	loadCategories,
	loadProducts
} from '../../Product/product-logic-be';
import {
	products,
	categories
} from '../../Product/product-logic';
import {
	createProduct
} from '../../Product/product-logic-be';
import {
	filteredInventoryActions,
	actionFilter
} from '../inventory-ui-shared'
import {
	appType,
	currentAppType
} from '../../AppSharedStates'

const {stringify} = require("schemahandler/utils");
require("mockdate").set(new Date("2021-01-05").getTime());
const moment = require('moment')
const {
  prepareInventoryDb
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
  	currentAppType.value = appType.POS_RESTAURANT
    await cms.initDemoData();
    cms.triggerFeConnect();
  });
  beforeEach(async () => {
	  await prepareInventoryDb(orm);
	  await loadCategories()
	  await loadProducts()
	  await loadInventories();
  })
  it("Case 1: Check load inventories", async () => {
    await nextTick()
    expect(stringify(inventories.value)).toMatchSnapshot();
	  expect(stringify(products.value)).toMatchSnapshot()
	  expect(stringify(categories.value)).toMatchSnapshot()
	  expect(stringify(detailInventories.value)).toMatchSnapshot()
  });
  it('Case 2: Update inventory', async () => {
  	await nextTick()
  	await updateInventory({
		  ...inventories.value[0],
		  ...{
		  	stock: 20
		  }
	  })
	  actionFilter.value = {
  		fromDate: moment('04.01.2021', 'DD.MM.YYYY').toDate(),
			toDate: moment('06.01.2021', 'DD.MM.YYYY').toDate()
		}
		await nextTick()
		await delay(50)
	  expect(stringify(filteredInventoryActions.value)).toMatchSnapshot()
  })
	it('Case 3: Create inventory', async () => {
		let oldLength = inventories.value.length
		const newProduct = await createProduct({id: '7', name: 'Whiskey', category: [categories.value[2]._id]})
		await createInventory({
			id: '7',
			productId: newProduct._id,
			unit: 'l',
			stock: 20
		})
		await nextTick()
		expect(stringify(inventories.value)).toMatchSnapshot()
		expect(stringify(detailInventories.value)).toMatchSnapshot()
		expect(inventories.value.length).toEqual(oldLength + 1)
	})
	it('Case 3a: Create inventory with duplicate id', async () => {
		let oldLength = inventories.value.length
		const newProduct = await createProduct({id: '7', name: 'Whiskey', category: [categories.value[2]._id]})
		await createInventory({
			productId: newProduct._id,
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
		expect(stringify(products.value)).toMatchSnapshot()
		expect(inventories.value.length).toEqual(oldLength - 2)
	})
	it('Case 5: Create inventory with product', async () => {
		await createInventory({
			product: {id: '7', name: 'Whiskey', category: [categories.value[2]._id]},
			unit: 'l',
			stock: 20,
			id: '7'
		})
		await nextTick()
		expect(stringify(inventories.value)).toMatchSnapshot()
		expect(stringify(products.value)).toMatchSnapshot()
	})
	it('Case 5a: Create inventory with product', async () => {
		await updateInventory({
			...detailInventories.value[0],
			product: {
				...detailInventories.value[0].product,
				name: 'Test item'
			}
		})
		await nextTick()
		expect(stringify(inventories.value)).toMatchSnapshot()
		expect(stringify(products.value)).toMatchSnapshot()
	})
});
