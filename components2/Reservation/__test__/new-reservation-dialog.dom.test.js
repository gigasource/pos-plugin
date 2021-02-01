require("mockdate").set(new Date("2021/01/28").getTime());
import { makeWrapper, wrapper } from "../../test-utils";
import NewReservationDialog from "../NewReservationDialog2";
import { posSettings } from "../../AppSharedStates";
import { mockReservationSetting, m } from "./reservation-mock-data";

jest.mock("cms", () => {
  const { cmsFactory } = require("../../../test-utils");
  const cms = cmsFactory("pos-restaurant--jest-reservation");
  global.cms = cms;
  return cms;
});

// clear components to enable stubs
NewReservationDialog.components = {};

describe("test scroll select ui", () => {
  it("should render", () => {
    console.log("today", new Date());
    posSettings.value = {
      reservation: mockReservationSetting
    };
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
                                  modelvalue="onlineOrder.today"
                                  items="onlineOrder.today,onlineOrder.tomorrow,31 Jan,01 Feb,02 Feb,03 Feb,04 Feb,05 Feb,06 Feb,07 Feb,08 Feb,09 Feb,10 Feb,11 Feb"
                                  height="250"
                                  itemheight="50"
                                  selected-color="#1271FF"
              >
              </scroll-select-stub>
              <scroll-select-stub class="col-4"
                                  modelvalue
                                  items="1 Guest,2 Guests,3 Guests,4 Guests,5 Guests,6 Guests,7 Guests,8 Guests,9 Guests,10 Guests,11 Guests,12 Guests,13 Guests,14 Guests,15 Guests,16 Guests,17 Guests,18 Guests,19 Guests,20 Guests"
                                  height="250"
                                  itemheight="50"
                                  selected-color="#1271FF"
              >
              </scroll-select-stub>
              <scroll-select-stub class="col-4"
                                  modelvalue
                                  items="07:30,07:35,07:40,07:45,07:50,07:55,08:00,08:05,08:10,08:15,08:20,08:25,08:30,08:35,08:40,08:45,08:50,08:55,09:00,09:05,09:10,09:15,09:20,09:25,09:30,09:35,09:40,09:45,09:50,09:55,10:00,10:05,10:10,10:15,10:20,10:25,10:30,10:35,10:40,10:45,10:50,10:55,11:00,11:05,11:10,11:15,11:20,11:25,11:30,11:35,11:40,11:45,11:50,11:55,12:00,12:05,12:10,12:15,12:20,12:25,12:30,12:35,12:40,12:45,12:50,12:55,13:00,13:05,13:10,13:15,13:20,13:25,13:30,13:35,13:40,13:45,13:50,13:55,14:00,14:05,14:10,14:15,14:20,14:25,14:30,14:35,14:40,14:45,14:50,14:55,15:00,15:05,15:10,15:15,15:20,15:25,15:30,15:35,15:40,15:45,15:50,15:55,16:00,16:05,16:10,16:15,16:20,16:25,16:30,16:35,16:40,16:45,16:50,16:55,17:00,17:05,17:10,17:15,17:20,17:25,17:30,17:35,17:40,17:45,17:50,17:55,18:00,18:05,18:10,18:15,18:20,18:25,18:30,18:35,18:40,18:45,18:50,18:55,19:00,19:05,19:10,19:15,19:20,19:25,19:30,19:35,19:40,19:45,19:50,19:55,20:00,20:05,20:10,20:15,20:20,20:25,20:30,20:35,20:40,20:45,20:50,20:55"
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

  it('should hide time selection when seat limit', async () => {
    console.log("mock-date", new Date());
    cms.orm.registerSchema("Reservation", {
      date: Date,
      noOfGuests: Number,
      status: String,
      note: String,
      customer: {
        name: String,
        phone: String,
        email: String
      }
    });
    await cms.getModel('Reservation').remove({})
    posSettings.value = {
      reservation: {
        ...mockReservationSetting,
        // suppose in Fri 29-01-2021 we only allow maximum 100 seats
        seatLimit: {
          day: ['Fri'], // 2021/01/29 is Fri day,
          seat: 100,
          startTime: '7:30',
          endTime: '11:30'
        }
      }
    };
    // some one has pre-order with 70 seats at 8:00 AM, remain 30 seats
    await cms.getModel('Reservation').create(m({date: '2021/01/29 8:00:00 AM', noOfGuests: 70}))
    // TODO: Now scroll to .... then expect the UI
  })
});
