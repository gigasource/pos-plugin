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
import CategoryEditor2 from '../CategoryEditor/CategoryEditor2';
import {nextTick} from 'vue'
import { updateSelectedCategoryLayout } from '../../OrderView/pos-ui-shared';
const ignoreComponents = ['Portal', 'PortalTarget', 'MountingPortal', 'portal', 'portal-target']

describe('category-editor', () => {
  it('should show correct', async () => {
    // TODO: update test case
    updateSelectedCategoryLayout({ name: 'Wine', color: '#FFF', rows: 4, columns: 6,  })

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
  })

  // act
})
