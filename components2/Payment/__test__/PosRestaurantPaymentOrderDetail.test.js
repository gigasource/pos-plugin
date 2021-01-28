import PosRestaurantPaymentOrderDetail2 from "../Helpers/PosRestaurantPaymentOrderDetail2";
import { wrapper, setComponent, makeWrapper } from "../../test-utils";

describe("test Pos Payment Screen Keyboard", () => {
  it("should render", async () => {
    setComponent(PosRestaurantPaymentOrderDetail2);
    makeWrapper();

    //todo: add some item to current order
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="order-detail">
        <div class="order-detail__header">
          <g-avatar-stub size="36">
            <img src
                 alt="true"
            >
          </g-avatar-stub>
          <div class="ml-2">
            <span class="order-detail__header-username">
            </span>
          </div>
          <g-spacer-stub>
          </g-spacer-stub>
          <span class="order-detail__header-title">
            Total
          </span>
          <span class="order-detail__header-value text-red">
            €0
          </span>
        </div>
        <div class="order-detail__content">
        </div>
      </div>
    `);
  });
});
