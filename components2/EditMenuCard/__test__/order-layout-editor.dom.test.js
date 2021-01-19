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
import { Portal } from 'portal-vue'

describe('order-layout-editor', () => {
  it('should show if orderLayout is not initialize', async () => {
    updateOrderLayout(null)
    const Root = {
      name: 'Root',
      components: {OrderLayoutEditor2, Portal},
      setup() {
        return genScopeId(() => <div>
          <order-layout-editor2></order-layout-editor2>
          <portal to={constants.portalLeftButtons}></portal>
        </div>)
      }
    }
    makeWrapper(Root, {
      global: {
        stubs: {
          'order-layout-editor2-stub': false
        }
      }
    })
    await nextTick()
    await delay(50)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
