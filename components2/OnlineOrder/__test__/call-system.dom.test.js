import { wrapper, makeWrapper } from "../../test-utils";
import CallSystem from "../CallSystem";

describe("test call system ui", () => {
  it("should render", () => {
    makeWrapper(CallSystem);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="call">
        <div class="call-title mb-2">
          <span>
            Call system
          </span>
          <span>
            (Call system config has changed, press 'Update' to apply changes)
          </span>
        </div>
        <div class="row-flex align-items-center justify-start">
          <g-grid-select-stub class="mt-2"
                              items="[object Object],[object Object],[object Object],[object Object],[object Object]"
                              mandatory="true"
                              grid="false"
                              modelvalue="off"
          >
          </g-grid-select-stub>
        </div>
        <div class="action-buttons">
          <g-btn-bs-stub width="80"
                         background-color="#2979FF"
          >
            Update
          </g-btn-bs-stub>
        </div>
        <dialog-text-filter-stub modelvalue="false"
                                 label="Call System IP"
        >
        </dialog-text-filter-stub>
      </div>
    `);
  });
});
