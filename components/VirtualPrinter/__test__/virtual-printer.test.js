import { makeWrapper, wrapper } from '../../test-utils';
import VirtualPrinterView from '../VirtualPrinterView';

describe("test virtual printer ui", () => {
  test("virtual printer ui", () => {
    makeWrapper(VirtualPrinterView)
    expect(wrapper.html()).toMatchInlineSnapshot()
  })
})
