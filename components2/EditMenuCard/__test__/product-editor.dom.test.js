/**
 * NOTE:
 * This file contain test cases to test whether ProductEditor render correct or not
 *
 * With valid product layout, it should render product basic info section in the top to allow
 * the user to modify the (name, id, price, isModifier, ...)
 *
 * It's also render printer section which:
 *    - display list of printers,
 *    - a +2 printer button to allow the user
 *    - a no printer button to select none of them
 *
 * It's also display taxes for dineIn tax and takeAway tax
 * It's also display pop-up modifier section to allow the custom or selected predefined modifier
 *
 * -----------
 *
 * It's doesn't contain any test cases to test actions (delete, switch, copy) or change product information
 * It's assume that dependencies component (portal, 'dialog-confirm-delete', 'g-grid-select',
 *    'color-selector','input-number','dialog-text-filter', ... are render correctly with correct input.
 *
 * Issue:
 *   Even though the printers has been set, snapshot doesn't display list of printers (-_- )
 */

import { wrapper, makeWrapper } from "../../test-utils";
import { mockProduct } from "../../OrderView/__test__/mock_product";
const delay = require("delay");
import _ from 'lodash'
import ProductEditor2 from '../ProductEditor/ProductEditor2';
import {nextTick} from 'vue'
import {
  orderLayout, selectCategoryLayout, selectProductLayout,
} from '../../OrderView/pos-ui-shared';
import StubFactory from '../../StubFactory';
import { createEmptyLayout, createEmptyProductLayout } from '../utils';
import { allowSelectPrinter2, dineInTaxes, printers, takeAwayTaxes } from '../ProductEditor/ProductEditorLogic';
const ignoreComponents = ['Portal', 'PortalTarget', 'MountingPortal', 'portal', 'portal-target']

// mock taxes
const mockDineInTaxes = [{ _id: 'di19', item: '19%', value: 19 }, { _id: 'di7', item: '7%', value: 7 }]
const mockTakeAwayTaxes = [{  _id: 'ta19', item: '19%', value: 19 }, { _id: 'ta7', item: '7%', value: 7 }]

// mock printer
const mockPrinters = [{_id: 'pr1', name: 'bar'}, { _id: 'pr2', name: 'kitchen' }]

// mock modifier

describe('product-editor', () => {
  function setupProduct(product, productLayout = {}) {
    // setup order layout
    orderLayout.value = { rows: 1, columns: 3, type: 'default', categories: [
        {
          row: 1, column: 2, top: 0, left: 0,
          products: [
            { product, top: 0, left: 0, ...productLayout}
          ]
        }
      ]}
    selectCategoryLayout({ top: 0, left: 0 })
    selectProductLayout({ top: 0, left: 0 })
  }

  async function expectSnapshot() {
    // wipe-out components (to make dependencies component un-resolvable) to make sure snapshot render prop for stub class
    ProductEditor2.components = {}
    makeWrapper(ProductEditor2, {
      shallow: false,
      global: {
        renderStubDefaultSlot: false,
        stubs: {
          portal: true,
          'dialog-confirm-delete': true,
          'color-selector': true,
          'input-number': true,
          'dialog-text-filter': true,
          'g-select': true,
          'g-switch': true,
          'dialog-product-info': true,
          'dialog-edit-popup-modifiers': true
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

  async function setupEntireRender(product) {
    setupProduct(product)
    await expectSnapshot()
  }

  it('should render text', async () => {
    setupProduct(null, { type: 'Text', name: 'Soft Drink' })
    await expectSnapshot()
  })

  it('should render placeholder product layout', async () => {
    await setupEntireRender({...createEmptyLayout(), ...createEmptyProductLayout()})
  })

  it('should render real product', async () => {
    await setupEntireRender(mockProduct)
  })

  describe('[printer]', () => {
    // entire printer setting won't be render
    it('should not render printer section if product is modifier', async () => {
      await setupEntireRender({ ...mockProduct, isModifier: true })
    })

    describe('[Add printer 2 btn]', () => {
      // printers.value = mockPrinters

      it('should show when product only have 1 printer', async () => {
        await setupEntireRender({ ...mockProduct, isModifier: false,
          /* option below indicate that product has only 1 printer */
          isNoPrint: false, groupPrinter: 'bar', groupPrinter2: null
        })
      })

      it('should not show if no printer selected or 2 printer selected', async () => {
        await setupEntireRender({ ...mockProduct, isModifier: false, isNoPrint: true })
        await setupEntireRender({ ...mockProduct, isModifier: false, isNoPrint: false, groupPrinter: 'bar', groupPrinter2: 'kitchen' })
      })

      it('should not show if this button has been clicked', async () => {
        allowSelectPrinter2()
        await setupEntireRender({ ...mockProduct, isModifier: false, isNoPrint: false, groupPrinter: 'bar', groupPrinter2: null })
      })
    })
  })
})
