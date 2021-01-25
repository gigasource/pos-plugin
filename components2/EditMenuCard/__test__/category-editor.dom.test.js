/**
 * NOTE:
 *
 * This file contain test cases to test whether CategoryEditor render correct or not
 *
 * With valid category layout, it should render order layout section in the top to allow
 * the user to modify the number of row or column of category will be display in orderLayout.
 *
 * It display category information (name, color, the number of row, column of product in
 *    this cate which corresponding to rows=4 & cols=6)
 *
 * It also tell us about actions which we can do with selected category:
 *   - switch if it's real category layout
 *   - delete if category doesn't have any product
 *
 * -----------
 *
 * It's doesn't contain any test cases to test actions (delete, switch) or change category information
 * It's assume that dependencies component (portal, 'dialog-confirm-delete', 'g-grid-select',
 *    'color-selector','input-number','dialog-text-filter', ... are render correctly with correct input.
 */
import {
  wrapper,
  makeWrapper,
} from "../../test-utils";
const delay = require("delay");
import CategoryEditor2 from '../CategoryEditor/CategoryEditor2';
import {nextTick} from 'vue'
import { orderLayout, selectCategoryLayout } from '../../OrderView/pos-ui-shared';
import { createEmptyCategoryLayout, createEmptyLayout } from '../utils';
const ignoreComponents = ['Portal', 'PortalTarget', 'MountingPortal', 'portal', 'portal-target']

describe('category-editor', () => {
  async function setup(selectedCategory) {
    orderLayout.value = {
      rows: 1,
      columns: 3,
      type: 'default',
      categories: [
        selectedCategory
      ]
    }

    selectCategoryLayout({ top: 0, left: 0 })

    // wipe-out components (to make dependencies component un-resolvable) to make sure snapshot render prop for stub class
    CategoryEditor2.components = {}

    makeWrapper(CategoryEditor2, {
      shallow: false,
      global: {
        stubs: {
          portal: true,
          'dialog-confirm-delete': true,
          'g-grid-select': true,
          'color-selector': true,
          'input-number': true,
          'dialog-text-filter': true,
        },
        config: {
          isCustomElement: tag => _.includes(ignoreComponents, tag)
        }
      }
    }, false)
    await nextTick()
    await delay(50)
    expect(wrapper.html()).toMatchSnapshot()
  }

  it('should render category with 0 product, allow to switch & delete', async () => {
    // can delete category without any products
    await setup({ _id: '012345', name: 'Wine', color: '#FFF', rows: 4, columns: 6, top: 0, left: 0 })

    // can delete category with empty product - which created in editable mode as a placeholder
    await setup({ _id: '012345', name: 'Wine', color: '#FFF', rows: 4, columns: 6, top: 0, left: 0,
      products: [
        { product: { name: 'prod1', price: 10 }, top: 0, left: 0 },
        { product: { name: 'prod1', price: 20 }, top: 0, left: 1 },
      ]
    })
  })

  it('should render category which has products, allow to switch but not delete', async () => {
    await setup({ _id: '012345', name: 'Wine', color: '#FFF', rows: 4, columns: 6, top: 0, left: 0,
      products: [
        { product: { _id: 'prod1', name: 'prod1', price: 10 }, top: 0, left: 0 }, // real product
        { product: { name: '', price: 0 }, top: 0, left: 1 } // placeholder product
      ]
    })
  })

  it('should render empty category correctly', async () => {
    await setup({...createEmptyLayout(0, 0), ...createEmptyCategoryLayout()})
  })
})
