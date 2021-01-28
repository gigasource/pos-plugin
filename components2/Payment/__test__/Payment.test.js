import Payment from "../Payment2";
import { wrapper, makeWrapper, setComponent } from "../../test-utils";

describe("test Pos Payment Screen Keyboard", () => {
  it("should render", async () => {
    setComponent(Payment);
    makeWrapper();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="payment">
        <div class="payment-main">
          <pos-payment-screen-payment-methods-stub>
          </pos-payment-screen-payment-methods-stub>
          <pos-payment-screen-keyboard-stub>
          </pos-payment-screen-keyboard-stub>
        </div>
        <pos-restaurant-payment-order-detail-stub>
        </pos-restaurant-payment-order-detail-stub>
        <pos-restaurant-payment-toolbar-stub>
        </pos-restaurant-payment-toolbar-stub>
      </div>
      <g-snackbar-stub modelvalue
                       color="#FFC107"
                       timeout="2000"
                       top="true"
      >
        <div style="color: rgb(255, 69, 82); display: flex; align-items: center;">
          <g-icon-stub color="#FF4552"
                       style="margin-right: 8px;"
          >
            warning
          </g-icon-stub>
          <span>
            payment.alertDiscount
          </span>
        </div>
      </g-snackbar-stub>
      <dialog-change-value-stub>
      </dialog-change-value-stub>
    `);
  });
});
