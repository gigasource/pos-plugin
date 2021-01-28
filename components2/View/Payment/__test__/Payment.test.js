import Payment from "../Payment2";
import { wrapper, makeWrapper, setComponent } from "../../../test-utils";
import { getCurrentOrder, prepareOrder } from "../../../OrderView/pos-logic-be";
import { mockOrder } from "../../../OrderView/__test__/mock-order";
beforeAll(() => {
  prepareOrder(mockOrder);
});

describe("test Pos Payment Screen Keyboard", () => {
  it("should render", async () => {
    makeWrapper(Payment);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="payment">
        <div class="payment-main">
          <pos-payment-screen-payment-methods2-stub>
          </pos-payment-screen-payment-methods2-stub>
          <pos-payment-screen-keyboard2-stub>
          </pos-payment-screen-keyboard2-stub>
        </div>
        <pos-restaurant-payment-order-detail2-stub>
        </pos-restaurant-payment-order-detail2-stub>
        <pos-restaurant-payment-toolbar2-stub>
        </pos-restaurant-payment-toolbar2-stub>
      </div>
      <g-snackbar-stub modelvalue="false"
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
    //test discount
  });
  it("test discount", () => {
    const order = getCurrentOrder()
    onAddPaymentMethod
  })
});
