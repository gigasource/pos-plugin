import { makeWrapper, wrapper } from "../../../test-utils";
import DiscountInput2 from "../Helpers/DiscountInput2";

describe("test", () => {
  it("test render", () => {
    makeWrapper(DiscountInput2);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="discount h-100">
        <div class="discount-content">
          <div class="w-10 mx-2">
            <div class="fw-700 ta-center fs-small">
              discount.percent (%)
            </div>
            <scroll-select-stub modelvalue="0"
                                items="5,10,15,20,25,30,40,50"
                                height="200"
                                class
                                itemheight="40"
                                selected-color="#1271FF"
            >
            </scroll-select-stub>
          </div>
          <div class="w-10 mx-2">
            <div class="fw-700 ta-center fs-small">
              discount.amount ('common.currency' , undefined)
            </div>
            <scroll-select-stub modelvalue="0"
                                items="1,2,5,10,15,20,30,50"
                                height="200"
                                class
                                itemheight="40"
                                selected-color="#1271FF"
            >
            </scroll-select-stub>
          </div>
          <div class="flex-grow-1 ml-3">
            <div class="fw-700 ml-1">
              discount.discount
            </div>
            <pos-textfield-new-stub label="discount.custom ('common.currency' , undefined)"
                                    modelvalue="0"
            >
            </pos-textfield-new-stub>
            <div class="fw-700 fs-small ml-1 mb-1">
              discount.quickDiscount
            </div>
            <div class="discount-quick">
            </div>
          </div>
        </div>
        <div class="discount-keyboard">
          <pos-keyboard-full-stub type="numeric">
          </pos-keyboard-full-stub>
        </div>
      </div>
    `);
  });
});
