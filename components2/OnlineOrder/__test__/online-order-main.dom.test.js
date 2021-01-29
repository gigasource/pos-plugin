import { wrapper, makeWrapper } from "../../test-utils";
import OnlineOrderMain from "../OnlineOrderMain";

jest.setTimeout(60000);

describe("Test render online order", () => {
  it("should render", () => {
    makeWrapper(OnlineOrderMain, {
      shallow: false,
      props: {}
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
