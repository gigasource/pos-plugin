import { makeWrapper, wrapper } from "../test-utils";
import FirstTimeSetup2 from "./FirstTimeSetup";
import { RequestFactory } from './first-time-setup-shared';
import delay from 'delay';

describe("test first time setup ui", () => {
  test("first time setup ui", () => {
    makeWrapper(FirstTimeSetup2);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="background row-flex align-items-center justify-center">
        <div class="center">
          <div class="dialog-title">
            Welcome to Restaurant+ POS
          </div>
          <g-tabs-stub items="[object Object],[object Object]">
            <g-tab-item-stub item="[object Object]"
                             style="height: 230px; padding-top: 4px;"
            >
              <g-combobox-stub class="w-100 mt-1"
                               modelvalue
                               text-field-component="PosTextField"
                               keep-menu-on-blur="true"
                               clearable="true"
                               skip-search="true"
                               menu-class="menu-autocomplete-setup"
                               items
              >
              </g-combobox-stub>
              <pos-textfield-new-stub class="tf-phone"
                                      label="Phone number"
                                      modelvalue
              >
              </pos-textfield-new-stub>
              <div class="dialog-message--subtext">
                <b>
                  Note:
                </b>
                <span style="font-style: italic; color: rgb(117, 117, 117);">
                  Please contact your local provider to start using the program.
                </span>
              </div>
              <div class="row-flex w-100">
                <g-spacer-stub>
                </g-spacer-stub>
                <div>
                  <g-btn-bs-stub backgroundcolor="#2979FF"
                                 text-color="white"
                                 width="10em"
                                 height="44px"
                                 disabled="false"
                  >
                    Send Request
                  </g-btn-bs-stub>
                </div>
              </div>
            </g-tab-item-stub>
            <g-tab-item-stub item="[object Object]"
                             style="height: 200px; padding-top: 4px;"
            >
              <g-text-field-bs-stub large="true"
                                    class="bs-tf__pos mt-1"
                                    modelvalue
                                    style="margin-bottom: 12px;"
              >
              </g-text-field-bs-stub>
              <div class="dialog-message--subtext">
                <b>
                  Note:
                </b>
                <span style="font-style: italic; color: rgb(117, 117, 117);">
                  Please contact your local provider to start using the program. Internet connection is required.
                </span>
              </div>
              <div class="row-flex justify-end">
                <g-btn-bs-stub backgroundcolor="#2979FF"
                               text-color="white"
                               width="7.5em"
                               height="44px"
                               disabled="false"
                >
                  Connect
                </g-btn-bs-stub>
              </div>
            </g-tab-item-stub>
          </g-tabs-stub>
        </div>
        <dialog-custom-url modelvalue="false">
        </dialog-custom-url>
        <g-btn-stub style="position: absolute; top: 10px; right: 10px;">
          Skip to Demo
        </g-btn-stub>
        <dialog-demo modelvalue="false"
                     mode
                     address
                     phone
        >
        </dialog-demo>
      </div>
    `);
  });
  test("search place logic" ,async() => {
    const { searchPlace, placesSearchResult } = RequestFactory()
    searchPlace('23 duy tan')

    await delay(1000)
    expect(placesSearchResult.value).toMatchInlineSnapshot()
  })
});

