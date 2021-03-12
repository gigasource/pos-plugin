import { makeWrapper, wrapper } from '../../../test-utils';
import PosDashboardFunction from '../PosDashboardFunction';

describe("test render", () => {
  test("render", () => {
    makeWrapper(PosDashboardFunction)
    expect(wrapper.html()).toMatchInlineSnapshot()
  })
})
