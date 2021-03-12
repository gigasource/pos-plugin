import { wrapper, makeWrapper } from "../../test-utils";
import dateRangePicker from "../dateRangePicker";

describe("test call system ui", () => {
  it("should render", () => {
    makeWrapper(dateRangePicker);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="date-range-picker">
        <div class="date-range-picker__nav left">
          <g-icon-stub>
            chevron_left
          </g-icon-stub>
        </div>
        <g-menu-stub modelvalue="false"
                     minwidth="100"
                     maxwidth="333"
                     nudge-bottom="10"
                     nudge-left="70"
                     closeonclick="true"
                     contentfillwidth="false"
                     content-class="aw-date-range-picker-content"
        >
          <div class="date-range-picker__container">
            <div class="arrow-top">
            </div>
            <div style="display: flex; margin-bottom: 10px;">
              <div style="width: 50%;">
                <div class="date-range-picker__label">
                  onlineOrder.from
                </div>
                <g-menu-stub modelvalue="false"
                             nudge-bottom="10"
                             content-class="date-picker-content"
                >
                  <g-date-picker-stub max="2021-01-01"
                                      type="date"
                                      no-title="true"
                  >
                  </g-date-picker-stub>
                </g-menu-stub>
              </div>
              <div style="width: 50%;">
                <div class="date-range-picker__label">
                  onlineOrder.to
                </div>
                <g-menu-stub modelvalue="false"
                             nudge-bottom="10"
                             content-class="date-picker-content"
                >
                  <g-date-picker-stub min="2021-01-01"
                                      max="2021-01-01"
                                      type="date"
                                      no-title="true"
                  >
                  </g-date-picker-stub>
                </g-menu-stub>
              </div>
            </div>
            <g-btn-bs-stub height="40"
                           width="100%"
                           background-color="#1976D2"
                           text-color="#fff"
            >
              Confirm
            </g-btn-bs-stub>
            <g-divider-stub style="margin: 8px 0px;"
                            color="#e0e0e0"
            >
            </g-divider-stub>
            <div class="row-flex flex-wrap w-100 justify-between">
              <g-btn-bs-stub class="mb-2"
                             height="40"
                             background-color="#E0E0E0"
              >
                onlineOrder.today
              </g-btn-bs-stub>
              <g-btn-bs-stub class="mb-2"
                             height="40"
                             background-color="#E0E0E0"
              >
                onlineOrder.yesterday
              </g-btn-bs-stub>
              <g-btn-bs-stub class="mb-2"
                             height="40"
                             background-color="#E0E0E0"
              >
                onlineOrder.thisWeek
              </g-btn-bs-stub>
              <g-btn-bs-stub height="40"
                             background-color="#E0E0E0"
              >
                onlineOrder.thisMonth
              </g-btn-bs-stub>
            </div>
          </div>
        </g-menu-stub>
        <div class="date-range-picker__nav right">
          <g-icon-stub>
            chevron_right
          </g-icon-stub>
        </div>
      </div>
    `);
  });
});
