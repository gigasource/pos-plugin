//<editor-fold desc="declare">
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

import OrderLayoutEditor2 from '../OrderLayoutEditor2';

describe('order-layout-editor', () => {
  it('should show if orderLayout is not initialize', async () => {
    updateOrderLayout(null)
    makeWrapper(OrderLayoutEditor2)
    await nextTick()
    await delay(50)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
