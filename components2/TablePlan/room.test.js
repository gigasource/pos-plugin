import { nextTick } from "vue";

import RoomFactory from "./RoomFactory";
import { mount } from "@vue/test-utils";
import { removeRoomItem } from "./room-logic";
describe("test room ui 1", () => {
  it("should render room", async () => {
    const { fn, hooks } = RoomFactory();
    let room;
    hooks.on("room", _room => {
      room = _room;
    });
    const table1 = {
      name: "table 1",
      location: { x: 5, y: 10 },
      size: { width: 10, height: 10 }
    };
    const table2 = {
      name: "table 2",
      location: { x: 50, y: 50 },
      size: { width: 10, height: 10 }
    };
    const wall1 = {
      name: "wall 1",
      location: { x: 30, y: 10 },
      size: { width: 10, height: 2 }
    };

    const component = fn();
    const wrapper = mount(component, {
      props: {
        roomObjects: [table1, table2, wall1]
      }
    });
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(
      `"<div><div><p> table 1 </p><p> 8.333333333333334 </p></div><div><p> table 2 </p><p> 83.33333333333334 </p></div><div><p> wall 1 </p><p> 50 </p></div></div>"`
    );

    removeRoomItem(room, room.items[0]);
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(
      `"<div><div><p> table 2 </p><p> 83.33333333333334 </p></div><div><p> wall 1 </p><p> 50 </p></div></div>"`
    );
  });
});
