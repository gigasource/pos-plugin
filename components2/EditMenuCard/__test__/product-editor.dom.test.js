import {config, mount} from "@vue/test-utils";
import { wrapper, makeWrapper } from "../../test-utils";
import { mockProduct } from "../../OrderView/__test__/mock_product";
const delay = require("delay");
import _ from 'lodash'
import ProductEditor2 from '../ProductEditor/ProductEditor2';
import {nextTick} from 'vue'
import {
  updateSelectedCategoryLayout,
  updateSelectedProductLayout
} from '../../OrderView/pos-ui-shared';
import StubFactory from '../../StubFactory';
const ignoreComponents = ['Portal', 'PortalTarget', 'MountingPortal', 'portal', 'portal-target']

describe('product-editor', () => {
  it('should show correct', async () => {
    // TODO: update test case
    // updateSelectedCategoryLayout({ name: 'Wine', color: '#FFF', rows: 4, columns: 6,  })
    updateSelectedProductLayout({
      type: 'Article',
      product: mockProduct
    })

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
  })

  // act
})
