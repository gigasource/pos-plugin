import PosRestaurantPaymentToolbar2 from "../Helpers/PosRestaurantPaymentToolbar2";
import { wrapper, setComponent, makeWrapper } from "../../../test-utils";

describe("test Pos Payment Screen Keyboard", () => {
  it("should render", async () => {
    setComponent(PosRestaurantPaymentToolbar2);
    makeWrapper();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <g-toolbar-stub color="#eee"
                      height="100%"
                      elevation="0"
      >
        <g-btn-bs-stub icon="icon-back">
          ui.back
        </g-btn-bs-stub>
        <g-btn-bs-stub icon="icon-promotion">
          fnBtn.paymentFunctions.promotion
        </g-btn-bs-stub>
        <g-spacer-stub>
        </g-spacer-stub>
        <g-btn-bs-stub icon="icon-print2"
                       disabled="true"
        >
          fnBtn.paymentFunctions.bill
        </g-btn-bs-stub>
        <g-btn-bs-stub class="col-2"
                       background-color="#2979FF"
                       disabled="true"
        >
          fnBtn.paymentFunctions.pay
        </g-btn-bs-stub>
      </g-toolbar-stub>
    `);
  });
});
