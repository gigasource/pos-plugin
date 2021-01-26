import { wrapper, makeWrapper } from "../../test-utils";
import OnlineOrderList from '../OnlineOrderList';

//todo: mock new i18n
describe("test call system ui", () => {
  it("should render", () => {
    makeWrapper(OnlineOrderList);
    expect(wrapper.html()).toMatchInlineSnapshot();
  });
});
