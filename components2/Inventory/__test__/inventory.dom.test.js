jest.setTimeout(60000)

import { makeWrapper, orm, wrapper } from '../../test-utils';
import {nextTick} from "vue";
import Inventory from '../Inventory'
import {
  dialog
} from "../inventory-ui-shared";
import _ from 'lodash'
import {
  inventories,
  inventoryCategories,
  filter
} from "../inventory-logic-ui";
import {
  addedCategory
} from "../helpers/dialog-inventory-category-logic";

const { prepareInventoryDb } = require('../../../backend/inventory/inventory.prepare.test')

const delay = require("delay");

jest.mock('cms', () => {
  const { cmsFactory } = require('../../../test-utils')
  const _cms = cmsFactory('inventoryDom')
  global.cms = _cms
  return {
    socket: _cms.feSocket,
    getModel: function (modelName) {
      return _cms.orm(modelName)
    }
  }
})

let cms = global.cms

const {stringify} = require("schemahandler/utils");

describe('Test inventory screen', function () {
  beforeAll(async () => {
    await cms.initDemoData()
    await prepareInventoryDb(cms.orm)
    cms.triggerFeConnect()
  })

  it('Case 1: Inventory', async () => {
    makeWrapper(Inventory, {
      shallow: true,
      props: {
      }
    });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
    expect(inventories.value).toMatchSnapshot()
    expect(inventoryCategories.value).toMatchSnapshot()
  })

  it('Case 2: Category dialog', async () => {
    dialog.value.category = true
    makeWrapper(Inventory, {
      shallow: false,
      props: {
      }
    });
    await nextTick();
    await delay(50);
    const component = wrapper.find("[content-class='dialog-inventory-category']")
    /**
     * First render
     */
    expect(component.html()).toMatchSnapshot()
    /**
     * Add 1 category
     */
    const addCategoryBtn = component.find('[data-jest-addCategory]')
    expect(addCategoryBtn.exists()).toBe(true)
    const oldLength = component.findAll("[class='category-item']").length
    addCategoryBtn.trigger('click')
    await nextTick()
    const categoryItems = wrapper.findAll("[class='category-item']")
    expect(categoryItems.length).toEqual(oldLength + 1)
    const _addedCategory = _.last(categoryItems)
    const textField = _addedCategory.find('g-text-field-bs-stub')
    await textField.trigger('click')
    /**
     * Fake set value
     */
    const a = addedCategory.value
    addedCategory.value[0].name = 'TestCategory'
    await nextTick()
    const completeCategoryBtn = wrapper.find('[data-jest-complete]')
    await completeCategoryBtn.trigger('click')
    await nextTick()
    /**
     * Expect re-render of dialog after open keyboard
     */
    expect(wrapper.find("[content-class='dialog-inventory-category']").html()).toMatchSnapshot()
    await delay(50)
    expect(inventoryCategories.value).toMatchSnapshot()
  })

  it('Case 3: Filter dialog', async () => {
    dialog.value.filter = true
    makeWrapper(Inventory, {
      shallow: false,
      props: {
      }
    });
    await nextTick();
    await delay(50);
    const component = wrapper.find("[data-jest-filter-dialog]")
    expect(component.exists()).toBe(true)
    /**
     * Fake filter action
     */
    filter.value = {
      id: 1,
      stock: [10, 20]
    }
    await nextTick()
    const showFilter = wrapper.find("[class='filter-wrapper']")
    expect(showFilter.html()).toMatchSnapshot()
  })
})

