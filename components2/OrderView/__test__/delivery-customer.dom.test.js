import {makeWrapper, wrapper} from "../../test-utils";
import { deliveryCustomerUiFactory } from '../delivery/delivery-customer-ui'


describe('order-delivery', () => {
  it('should render', () => {
    const Root = {
      name: 'CustomreUIRender',
      setup() {
        const { customerUiRender } =  deliveryCustomerUiFactory()
        return customerUiRender
      }
    }

    makeWrapper(Root, {
      global: {
        stubs: {

        }
      }
    }, false)

    expect(wrapper.html()).toMatchSnapshot()
  })
})
