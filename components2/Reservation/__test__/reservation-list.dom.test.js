import { makeWrapper, wrapper } from "../../test-utils";
import ReservationsList from "../ReservationsList";

describe("test scroll select ui", () => {
  it("should render", () => {
    makeWrapper(ReservationsList);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="reservation">
        <div class="reservation-header">
          <div class="reservation-header__day">
            onlineOrder.backToday
          </div>
          <g-select-stub text-field-component="GTextFieldBs"
                         items="[object Object],[object Object],[object Object]"
                         modelvalue="all"
          >
          </g-select-stub>
          <div>
          </div>
          <g-spacer-stub>
          </g-spacer-stub>
          <g-btn-bs-stub background-color="#2979FF"
                         icon="icon-reservation_make"
          >
            onlineOrder.makeReservation
          </g-btn-bs-stub>
        </div>
        <div class="reservation-tab">
          <div class="reservation-tab__header">
            <div class="reservation-tab__header--left">
              <g-icon-stub>
                fas fa-long-arrow-alt-left
              </g-icon-stub>
            </div>
            <div class="reservation-tab__header--right">
              <g-icon-stub>
                fas fa-long-arrow-alt-right
              </g-icon-stub>
            </div>
          </div>
          <div class="reservation-tab__content">
            <div class="reservation-tab__content-row"
                 id="00h"
            >
              <div class="reservation-tab__content-row--hour">
                00h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="01h"
            >
              <div class="reservation-tab__content-row--hour">
                01h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="02h"
            >
              <div class="reservation-tab__content-row--hour">
                02h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="03h"
            >
              <div class="reservation-tab__content-row--hour">
                03h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="04h"
            >
              <div class="reservation-tab__content-row--hour">
                04h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="05h"
            >
              <div class="reservation-tab__content-row--hour">
                05h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="06h"
            >
              <div class="reservation-tab__content-row--hour">
                06h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="07h"
            >
              <div class="reservation-tab__content-row--hour">
                07h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="08h"
            >
              <div class="reservation-tab__content-row--hour">
                08h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="09h"
            >
              <div class="reservation-tab__content-row--hour">
                09h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="10h"
            >
              <div class="reservation-tab__content-row--hour">
                10h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="11h"
            >
              <div class="reservation-tab__content-row--hour">
                11h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="12h"
            >
              <div class="reservation-tab__content-row--hour">
                12h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="13h"
            >
              <div class="reservation-tab__content-row--hour">
                13h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="14h"
            >
              <div class="reservation-tab__content-row--hour">
                14h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="15h"
            >
              <div class="reservation-tab__content-row--hour">
                15h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="16h"
            >
              <div class="reservation-tab__content-row--hour">
                16h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="17h"
            >
              <div class="reservation-tab__content-row--hour">
                17h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="18h"
            >
              <div class="reservation-tab__content-row--hour">
                18h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="19h"
            >
              <div class="reservation-tab__content-row--hour">
                19h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="20h"
            >
              <div class="reservation-tab__content-row--hour">
                20h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="21h"
            >
              <div class="reservation-tab__content-row--hour">
                21h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="22h"
            >
              <div class="reservation-tab__content-row--hour">
                22h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
            <div class="reservation-tab__content-row"
                 id="23h"
            >
              <div class="reservation-tab__content-row--hour">
                23h
              </div>
              <div class="flex-grow-1">
              </div>
            </div>
          </div>
        </div>
        <new-reservation-dialog-stub modelvalue="false"
                                     edit="false"
        >
        </new-reservation-dialog-stub>
        <g-dialog-stub modelvalue="false"
                       width="338"
        >
          <g-card-stub>
            <g-card-title-stub class="justify-center">
              <div class="fs-large fw-700 pt-3">
                Notice
              </div>
            </g-card-title-stub>
            <g-card-text-stub class="ta-center">
              You cannot modify a marked-as-arrived reservation.
            </g-card-text-stub>
            <g-divider-stub color="#9e9e9e"
                            inset="true"
            >
            </g-divider-stub>
            <g-card-actions-stub style="justify-content: center;">
              <g-btn-bs-stub text-color="#536DFE">
                Close
              </g-btn-bs-stub>
            </g-card-actions-stub>
          </g-card-stub>
        </g-dialog-stub>
        <g-dialog-stub modelvalue="false"
                       width="422"
        >
          <g-card-stub>
            <g-card-title-stub>
              <p class="fs-large-3">
                Delete Reservation
              </p>
            </g-card-title-stub>
            <g-card-text-stub>
              <p class="ta-center pa-3">
                Are you sure you want to delete the following reservation?
              </p>
              <p class="fw-700 ta-center">
                <span class="mr-1">
                </span>
                <span class="mr-1">
                </span>
                <span class="mr-1">
                </span>
              </p>
            </g-card-text-stub>
            <g-card-actions-stub class="pa-3">
              <g-btn-bs-stub text-color="#424242">
                Cancel
              </g-btn-bs-stub>
              <g-btn-bs-stub width="80"
                             background-color="#FF5252"
                             text-color="white"
              >
                Delete
              </g-btn-bs-stub>
            </g-card-actions-stub>
          </g-card-stub>
        </g-dialog-stub>
      </div>
    `);
  });
});
