import { wrapper, makeWrapper } from "../../test-utils";
import OnlineOrderServices from "../OnlineOrderServices";
import OnlineOrderSetting from "../OnlineOrderSetting";

describe("test call system ui", () => {
  it("should render", () => {
    makeWrapper(OnlineOrderSetting);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="online-order-setting">
        <div class="online-order-setting__title">
          onlineOrder.settings.onlineOrderSettings
        </div>
        <div class="online-order-setting__content">
          <div class="row-flex"
               style="flex-wrap: wrap;"
          >
            <div class="col-6">
              <div>
                onlineOrder.settings.status
              </div>
              <div style="font-style: italic;">
                <span>
                  Not connected
                </span>
              </div>
            </div>
            <div class="col-6">
              <div>
                onlineOrder.settings.webshopUrl
              </div>
              <div>
                <span style="font-style: italic; color: rgb(83, 109, 254);">
                </span>
              </div>
            </div>
            <div class="col-6 mt-3">
              <g-btn-stub flat="true"
                          background-color="#1271ff"
                          text-color="#fff"
                          uppercase="false"
              >
                Reset Online Orders
              </g-btn-stub>
            </div>
            <div class="col-6 mt-3">
              <div class="row-flex">
                <g-switch-stub class="ml-3"
                               label="Template Data"
                               modelvalue="false"
                >
                </g-switch-stub>
              </div>
              <g-btn-stub class="mt-2"
                          flat="true"
                          background-color="#1271ff"
                          text-color="#fff"
                          uppercase="false"
                          disabled="false"
              >
                Import demo data
              </g-btn-stub>
            </div>
          </div>
          <g-divider-stub style="margin-top: 20px;">
          </g-divider-stub>
        </div>
        <div class="online-order-setting__title">
          onlineOrder.settings.generalSettings
        </div>
        <div class="online-order-setting__content">
          <div>
            <b>
              onlineOrder.settings.timeToComplete
            </b>
          </div>
          <g-row-stub>
            <g-grid-select-stub grid="false"
                                items="15,30,45,60"
                                mandatory="true"
            >
            </g-grid-select-stub>
          </g-row-stub>
          <div style="margin-top: 16px;">
            <b>
              onlineOrder.settings.sound
            </b>
          </div>
          <g-switch-stub label="onlineOrder.settings.hasSound">
          </g-switch-stub>
          <div style="margin-top: 16px;">
            <b>
              onlineOrder.settings.playNotificationSound
            </b>
          </div>
          <g-grid-select-stub grid="false"
                              item-cols="4"
                              items="[object Object],[object Object],[object Object]"
                              mandatory="true"
          >
          </g-grid-select-stub>
          <div style="margin-top: 16px;">
            <b>
              onlineOrder.settings.sorting
            </b>
          </div>
          <g-grid-select-stub grid="false"
                              items="[object Object],[object Object]"
                              mandatory="true"
          >
          </g-grid-select-stub>
        </div>
        <dialog-form-input-stub modelvalue="false">
        </dialog-form-input-stub>
      </div>
    `);
  });
});
