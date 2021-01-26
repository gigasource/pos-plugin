import { wrapper, makeWrapper } from "../../../test-utils";
import Online from '../Online';

describe("test call system ui", () => {
  it("should render", () => {
    makeWrapper(Online);
    expect(wrapper.html()).toMatchInlineSnapshot();
  });
});
