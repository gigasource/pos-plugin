import { wrapper, makeWrapper } from "../../test-utils";
import dialogCompleteOrder from "../helpers/dialogCompleteOrder";

describe("test call system ui", () => {
  it("should render", () => {
    makeWrapper(dialogCompleteOrder);
    //todo: mock order
    expect(wrapper.html()).toMatchInlineSnapshot(``);
  });
});
