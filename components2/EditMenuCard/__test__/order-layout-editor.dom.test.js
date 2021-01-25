import {
  wrapper,
  makeWrapper,
} from "../../test-utils";
const delay = require("delay");
import OrderLayoutEditor2 from '../OrderLayoutEditor2';
import {nextTick} from 'vue'
import {genScopeId} from '../../utils';
import { orderLayout } from '../../OrderView/pos-ui-shared';

const ignoreComponents = ['Portal', 'PortalTarget', 'MountingPortal', 'portal', 'portal-target']

// Assume that portal-vue code work as expected!!!!
// Issue: Cannot install Portal-vue plugin
//      tested with global: { plugins: [PortalViewPlugin] ...}
//      error: can't call useWormHole outside of setup() method

describe('order-layout-editor', () => {
  it('should hide add button if orderLayout is initialized', async () => {
    orderLayout.value = { categories: [] }

    const Root = {
      name: 'Root',
      components: {OrderLayoutEditor2},
      setup() {
        return genScopeId(() => <div>
          <order-layout-editor2></order-layout-editor2>
        </div>)
      }
    }

    makeWrapper(Root, {
      shallow: false,
      global: {
        stubs: {
          portal: true,
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

  it('should show add button if orderLayout is not initialized with predefined dialog { column=4, row=2 }', async () => {
    orderLayout.value = null

    const Root = {
      name: 'Root',
      components: {OrderLayoutEditor2},
      setup() {
        return genScopeId(() => <div>
          <order-layout-editor2></order-layout-editor2>
        </div>)
      }
    }

    makeWrapper(Root, {
      shallow: false,
      global: {
        stubs: {
          portal: true,
          'dialog-form-input': false, // using real component to show inside slots
          'pos-textfield-new': false
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
})
