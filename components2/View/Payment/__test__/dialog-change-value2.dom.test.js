import { makeWrapper, wrapper } from "../../../test-utils";
import dialogChangeValue2 from "../Helpers/dialogChangeValue2";

describe("test", () => {
  it("test render", () => {
    makeWrapper(dialogChangeValue2);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <g-dialog-stub modelvalue="false"
                     overlay-color="#6b6f82"
                     fullscreen="false"
                     overlay-opacity="0.95"
      >
        <div class="dialog-change w-100"
             style="background: white;"
        >
          <g-icon-stub class="dialog-change--close">
            close
          </g-icon-stub>
          <discount-input type="[object Object]"
                          value="0"
          >
          </discount-input>
          <g-snackbar-stub modelvalue="false"
                           timeout="2000"
                           color="#FF4552"
          >
            <div>
              Discount exceeds order value!
            </div>
          </g-snackbar-stub>
        </div>
      </g-dialog-stub>
    `);
  });
});
