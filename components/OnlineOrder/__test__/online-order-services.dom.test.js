import { wrapper, makeWrapper } from "../../test-utils";
import OnlineOrderServices from "../OnlineOrderServices";

describe("test call system ui", () => {
  it("should render", () => {
    makeWrapper(OnlineOrderServices);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="online-order-services">
        <div class="row-flex">
          <div class="online-order-services__item">
            <g-switch-stub label="onlineOrder.delivery">
            </g-switch-stub>
          </div>
          <div class="online-order-services__item">
            <g-switch-stub label="onlineOrder.pickup">
            </g-switch-stub>
          </div>
        </div>
        <div class="online-order-services__item">
          <div class="online-order-services__title">
            onlineOrder.noteToCustomer
          </div>
          <div class="online-order-services__content">
            <g-textarea-stub modelvalue
                             no-resize="true"
                             outlined="true"
                             rows="5"
                             placeholder="onlineOrder.note..."
            >
            </g-textarea-stub>
          </div>
        </div>
        <div class="row-flex">
          <g-spacer-stub>
          </g-spacer-stub>
          <g-btn-bs-stub background-color="#536DFE"
                         style="margin: 0px; width: 96px;"
                         text-color="white"
          >
            onlineOrder.save
          </g-btn-bs-stub>
        </div>
        <dialog-blogtext-input-stub modelvalue="false"
                                    label="Note"
                                    defaultvalue
        >
        </dialog-blogtext-input-stub>
      </div>
    `);
  });
});
