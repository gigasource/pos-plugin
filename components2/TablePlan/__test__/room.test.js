import { nextTick } from "vue";

import RoomFactory from "../RoomFactory";
import { mount } from "@vue/test-utils";
import { removeRoomObject } from "../room-logic";
import { onSelectObject, selectingObject} from '../room-state'
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
      `"<div style=\\"position: relative;\\"><div style=\\"position: absolute; left: 5px; top: 10px; background: green;\\"><p> table 1 </p></div><div style=\\"position: absolute; left: 50px; top: 50px; background: green;\\"><p> table 2 </p></div><div style=\\"position: absolute; left: 30px; top: 10px; background: green;\\"><p> wall 1 </p></div></div>"`
    );

    removeRoomObject(room, room.roomObjects[0]);
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(
      `"<div style=\\"position: relative;\\"><div style=\\"position: absolute; left: 50px; top: 50px; background: green;\\"><p> table 2 </p></div><div style=\\"position: absolute; left: 30px; top: 10px; background: green;\\"><p> wall 1 </p></div></div>"`
    );
  });

  it("should change selecting object when click on an object", async() => {
    const { fn, hooks } = RoomFactory();
    let room;
    hooks.on("room", _room => {
      room = _room;
    });

    const table1 = {
      name: "table1",
      location: { x: 5, y: 10 },
      size: { width: 10, height: 10 }
    };
    const table2 = {
      name: "table2",
      location: { x: 50, y: 50 },
      size: { width: 10, height: 10 }
    };
    const wall1 = {
      name: "wall1",
      location: { x: 30, y: 10 },
      size: { width: 10, height: 2 }
    };

    const component = fn();
    const wrapper = mount(component, {
      props: {
        roomObjects: [table1, table2, wall1]
      }
    });
    expect(selectingObject.value).toBeFalsy()
    const table1El = wrapper.get("#table1")
    await table1El.trigger("click")
    expect(selectingObject.value.name).toBe("table1")
  })
});
