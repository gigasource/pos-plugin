import {
  wrapper,
  makeWrapper,
} from "../../test-utils";
const delay = require("delay");
import {nextTick} from 'vue'
import {
  orderLayout,
  ProductEditModes,
  selectCategoryLayout,
  selectProductLayout,
  view
} from '../../OrderView/pos-ui-shared';
import _ from 'lodash';
import { mockProduct } from '../../OrderView/__test__/mock_product';
const ignoreComponents = ['Portal', 'PortalTarget', 'MountingPortal', 'portal', 'portal-target']
import ProductEditorToolbarButtons from '../ProductEditor/ProductEditorToolbarButtons';

describe('product-editor-toolbar', () => {
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
    ProductEditorToolbarButtons.components = {}
    makeWrapper(ProductEditorToolbarButtons, {
      shallow: false,
      global: {
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

  it('should render, allow switch, copy, delete when product is real', async () => {
    setupProduct(mockProduct, { _id: 'prodLayoutId' })
    await expectSnapshot()
  })

  it('should render, not allow to switch, copy, delete when product is empty', async () => {
    setupProduct({...mockProduct})
    await expectSnapshot()
  })

  it('should render switch to ingredient mode when current mode is basic', async () => {
    view.value.mode = ProductEditModes.basic
    setupProduct({...mockProduct})
    await expectSnapshot()
  })

  it('should render switch to basic mode when current mode is ingredient', async () => {
    view.value.mode = ProductEditModes.ingredient
    setupProduct({...mockProduct})
    await expectSnapshot()
  })
});
