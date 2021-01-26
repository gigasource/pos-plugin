import { wrapper, makeWrapper } from "../../test-utils";
import OnlineOrderServices from "../OnlineOrderServices";
import OnlineOrderSetting from "../OnlineOrderSetting";
import ValuePicker from "../ValuePicker";

describe("test call system ui", () => {
  it("should render", () => {
    makeWrapper(ValuePicker);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="picker-wrapper">
        <g-text-field-bs-stub placeholder="onlineOrder.customTime"
                              modelvalue
        >
        </g-text-field-bs-stub>
        <dialog-number-filter-stub modelvalue="false"
                                   label="Custom time"
        >
        </dialog-number-filter-stub>
      </div>
    `);
  });
});
