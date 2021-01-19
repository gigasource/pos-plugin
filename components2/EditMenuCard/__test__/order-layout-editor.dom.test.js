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
import {nextTick} from 'vue'
import { updateOrderLayout } from '../../OrderView/pos-ui-shared';
import constants from '../EditMenuCardToolbar/constants'
import OrderLayoutEditor2 from '../OrderLayoutEditor2';
import { genScopeId } from '../../utils';

const ignoreComponents = ['Portal', 'PortalTarget', 'MountingPortal', 'portal', 'portal-target']

describe('order-layout-editor', () => {
  it('should show if orderLayout is not initialize', async () => {
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
})
