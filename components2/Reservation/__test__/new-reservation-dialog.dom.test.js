import { makeWrapper, wrapper } from "../../test-utils";
import NewReservationDialog from "../NewReservationDialog";

describe("test scroll select ui", () => {
  it("should render", () => {
    makeWrapper(NewReservationDialog);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <g-dialog-stub modelvalue="false"
                     fullscreen="true"
                     eager="true"
      >
        <div class="dialog">
          <g-icon-stub class="dialog-icon--close">
            icon-close
          </g-icon-stub>
          <div class="dialog-content">
            <div class="dialog-content--left">
              <scroll-select-stub class="col-4"
                                  modelvalue
                                  items="onlineOrder.today,onlineOrder.tomorrow"
                                  height="250"
                                  itemheight="50"
                                  selected-color="#1271FF"
              >
              </scroll-select-stub>
              <scroll-select-stub class="col-4"
                                  modelvalue
                                  items="1 Guest"
                                  height="250"
                                  itemheight="50"
                                  selected-color="#1271FF"
              >
              </scroll-select-stub>
              <scroll-select-stub class="col-4"
                                  modelvalue
                                  items
                                  height="250"
                                  itemheight="50"
                                  selected-color="#1271FF"
              >
              </scroll-select-stub>
            </div>
            <div class="dialog-content--right">
              <div class="dialog-content__title">
                onlineOrder.makeReservation
              </div>
              <div class="row-flex">
                <g-text-field-bs-stub class="bs-tf__pos"
                                      modelvalue
                                      label="Name"
                                      placeholder="onlineOrder.fillText"
                                      required="true"
                >
                </g-text-field-bs-stub>
                <g-text-field-bs-stub class="bs-tf__pos"
                                      modelvalue
                                      label="settings.tel"
                                      placeholder="onlineOrder.fillNumber"
                                      number="true"
                                      required="true"
                >
                </g-text-field-bs-stub>
              </div>
              <div>
                <div class="label">
                  onlineOrder.note
                </div>
                <g-textarea-stub rows="3"
                                 outlined="true"
                                 modelvalue
                                 placeholder="onlineOrder.fillText"
                                 no-resize="true"
                >
                </g-textarea-stub>
              </div>
              <div class="dialog-action"
                   style="margin-right: -4px;"
              >
                <g-btn-bs-stub width="100"
                               border-color="#424242"
                >
                  onlineOrder.cancel
                </g-btn-bs-stub>
                <g-btn-bs-stub width="140"
                               background-color="#2979FF"
                >
                  onlineOrder.submit
                </g-btn-bs-stub>
              </div>
            </div>
          </div>
          <g-spacer-stub>
          </g-spacer-stub>
          <div class="dialog-keyboard">
            <pos-keyboard-full-stub>
            </pos-keyboard-full-stub>
          </div>
        </div>
      </g-dialog-stub>
    `);
  });
});
