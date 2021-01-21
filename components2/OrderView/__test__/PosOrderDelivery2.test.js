import {wrapper, makeWrapper} from '../../test-utils';
const delay = require('delay')
import PosOrderDelivery2 from '../delivery/PosOrderDelivery2';

describe('PosOrderDelivery2', () => {
  it('should render', () => {
    makeWrapper(PosOrderDelivery2)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
