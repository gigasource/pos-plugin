import { wrapper, makeWrapper } from "../../test-utils";
import OnlineOrderMain from "../OnlineOrderMain";

describe("test call system ui", () => {
  it("should render", () => {
    makeWrapper(OnlineOrderMain);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="main">
        <div class="pending-orders pr-2">
          <div class="header">
            <span>
              onlineOrder.pendingOrders
            </span>
            0
            <g-spacer-stub>
            </g-spacer-stub>
          </div>
          <div class="content">
          </div>
        </div>
        <div class="kitchen-orders pl-2">
          <div class="header">
            onlineOrder.sentToKitchen
          </div>
          <div class="content">
            <div class="kitchen-orders--empty">
              <p>
                onlineOrder.noKitchen
              </p>
            </div>
          </div>
        </div>
        <dialog-complete-order-stub modelvalue="[object Object]">
        </dialog-complete-order-stub>
        <dialog-text-filter-stub label="Reason">
        </dialog-text-filter-stub>
        <new-reservation-dialog-stub>
        </new-reservation-dialog-stub>
      </div>
    `);
  });
});
