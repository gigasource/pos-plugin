//<editor-fold desc="declare">
import {makeWrapper, orm, wrapper} from "../../test-utils";

import {nextTick} from "vue";
import {demoData} from "../../OrderView/__test__/demoData";
import RestaurantRoom from "../../TablePlan/BasicRoom/RestaurantRoom2";
import {fetchRooms, onSelectRoom, roomsStates} from "../../TablePlan/RoomState";
import EditableRoom from "../../TablePlan/EditableRoom/EditableRoom";
import PosEndOfDayDatePicker from "../PosEndOfDayDatePicker";

const {stringify} = require("schemahandler/utils");

const delay = require("delay");

//</editor-fold>

describe("eod test", function () {
  beforeAll(async () => {
    await orm("PosSetting").remove({});
    await orm("PosSetting").create(demoData.PosSetting[0]);
    await orm("OrderLayout").remove({});
    await orm("OrderLayout").create(demoData.OrderLayout[0]);
    await orm("Room").remove({});
    await orm("Room").create(demoData.Room);
  });

  it("case 1 date-picker", async function () {
    //order have 1 sent item, add one item -> should display print,
    //todo: fetch data
    //todo: convert singeton -> factory
    //room -> props
    //todo: dashboard: keep-alive
    await fetchRooms()
    makeWrapper(PosEndOfDayDatePicker, {
      shallow: true,
      props: {

      }
    });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);


});
