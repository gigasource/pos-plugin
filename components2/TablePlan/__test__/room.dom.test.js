//<editor-fold desc="declare">
import {makeWrapper, orm, wrapper} from "../../test-utils";

import {nextTick} from "vue";
import {demoData} from "../../OrderView/__test__/demoData";
import RestaurantRoom from "../BasicRoom/RestaurantRoom";
import {fetchRooms, onSelectRoom, roomsStates} from "../RoomState";
import EditableRoom from "../EditableRoom/EditableRoom";

const {stringify} = require("schemahandler/utils");

const delay = require("delay");

//</editor-fold>

describe("order-view test", function () {
  beforeAll(async () => {
    await orm("PosSetting").remove({});
    await orm("PosSetting").create(demoData.PosSetting[0]);
    await orm("OrderLayout").remove({});
    await orm("OrderLayout").create(demoData.OrderLayout[0]);
    await orm("Room").remove({});
    await orm("Room").create(demoData.Room);
  });

  it("case 1 room", async function () {
    //order have 1 sent item, add one item -> should display print,
    //todo: fetch data
    //todo: convert singeton -> factory
    //room -> props
    //todo: dashboard: keep-alive
    await fetchRooms()
    const a = roomsStates;
    makeWrapper(RestaurantRoom, {
      shallow: true, props: {
        roomId: roomsStates.value[0].room._id.toString()
      }
    });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

  it("case 2 editable-room", async function () {
    //order have 1 sent item, add one item -> should display print,
    //todo: fetch data
    //todo: convert singeton -> factory
    //room -> props
    //todo: dashboard: keep-alive
    await fetchRooms()
    onSelectRoom(roomsStates.value[0]);
    makeWrapper(EditableRoom, {
      shallow: true
    });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);


});
