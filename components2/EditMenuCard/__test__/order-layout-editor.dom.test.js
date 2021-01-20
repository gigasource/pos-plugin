import {
  actions,
  cola,
  drinkTax,
  expectArray,
  fanta,
  foodTax,
  ketchup,
  rice,
  component,
  wrapper,
  makeWrapper,
  orm,
  setComponent
} from "../../test-utils";
const delay = require("delay");
import OrderLayoutEditor2 from '../OrderLayoutEditor2';
import {nextTick} from 'vue'
import {updateOrderLayout} from '../../OrderView/pos-ui-shared';
import {genScopeId} from '../../utils';

const ignoreComponents = ['Portal', 'PortalTarget', 'MountingPortal', 'portal', 'portal-target']

// Assume that portal-vue code work as expected!!!!
// Issue: Cannot install Portal-vue plugin
//      tested with global: { plugins: [PortalViewPlugin] ...}
//      error: can't call useWormHole outside of setup() method

describe('order-layout-editor', () => {
  it('should show add order layout if orderLayout is not initialize', async () => {
    updateOrderLayout(null)

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

  it('should hide add button if orderLayout is initialized', async () => {
    updateOrderLayout({ categories: [], row: 2, column: 4 })

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
    updateOrderLayout({ categories: [], row: 2, column: 4 })

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
          'dialog-form-input': false,
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
