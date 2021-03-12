import { h, KeepAlive, computed, nextTick, ref, watch } from "vue";
import { fetchRooms, roomsStates } from "../../../TablePlan/RoomState";
import RestaurantRoom from "../../../TablePlan/BasicRoom/RestaurantRoom";
import { makeWrapper, orm, wrapper } from "../../../test-utils";
import PosOrderManualTable from "../../../TablePlan/BasicRoom/ManualTable/PosOrderManualTable";
import { demoData } from "../../../OrderView/__test__/demoData";
import delay from "delay";

beforeAll(async () => {
  const orm = require("schemahandler");
  orm.connect("mongodb://localhost:27017", "dashboard-test");
  await orm("Room").remove({});
  await orm("Room").create(demoData.Room);
});

describe("demo dashboard with multiple room", () => {
  test("", async () => {
    const activeScreen = ref("KeptAliveRoomViews");
    const selectingRoomId = ref("");
    await nextTick();
    const countRoomHooks = {};
    //todo:
    for (let idx = 0; idx < 3; idx++) {
      countRoomHooks[`room${idx}`] = {
        activated: 0,
        deactivated: 0,
        mounted: 0,
        beforeMount: 0,
        unmounted: 0
      };
    }
    const RoomsViews = ref({});
    watch(
      () => roomsStates.value,
      () => {
        const views = {};
        roomsStates.value.forEach((roomState, idx) => {
          const Tmp = Object.assign({}, RestaurantRoom, {
            activated() {
              countRoomHooks[`room${idx}`]["activated"]++;
            },
            deactivated() {
              countRoomHooks[`room${idx}`]["deactivated"]++;
            },
            mounted() {
              countRoomHooks[`room${idx}`]["mounted"]++;
            },
            beforeMount() {
              countRoomHooks[`room${idx}`]["beforeMount"]++;
            },
            unmounted() {
              countRoomHooks[`room${idx}`]["unmounted"]++;
            }
          });
          views[roomState.room._id.toString()] = h(Tmp, {
            roomId: roomState.room._id.toString()
          });
        });
        RoomsViews.value = views;
      },
      { deep: true }
    );

    const countDashboardHooks = {
      KeptAliveRoomViews: {
        activated: 0,
        deactivated: 0,
        mounted: 0,
        beforeMount: 0,
        unmounted: 0
      },
      ManualTableView: {
        activated: 0,
        deactivated: 0,
        mounted: 0,
        beforeMount: 0,
        unmounted: 0
      }
    };
    const KeptAliveRoomViews = {
      name: "KeptAliveRoomViews",
      setup() {
        return () =>
          selectingRoomId.value
            ? h(KeepAlive, {}, h(RoomsViews.value[selectingRoomId.value]))
            : null;
      },
      activated() {
        countDashboardHooks["KeptAliveRoomViews"]["activated"]++;
      },
      deactivated() {
        countDashboardHooks["KeptAliveRoomViews"]["deactivated"]++;
      },
      mounted() {
        countDashboardHooks["KeptAliveRoomViews"]["mounted"]++;
      },
      beforeMount() {
        countDashboardHooks["KeptAliveRoomViews"]["beforeMount"]++;
      },
      unmounted() {
        countDashboardHooks["KeptAliveRoomViews"]["unmounted"]++;
      }
    };
    const ManualTableView = {
      name: "ManualTableView",
      setup() {
        return () => <PosOrderManualTable> </PosOrderManualTable>;
      },
      activated() {
        countDashboardHooks["ManualTableView"]["activated"]++;
      },
      deactivated() {
        countDashboardHooks["ManualTableView"]["deactivated"]++;
      },
      mounted() {
        countDashboardHooks["ManualTableView"]["mounted"]++;
      },
      beforeMount() {
        countDashboardHooks["ManualTableView"]["beforeMount"]++;
      },
      unmounted() {
        countDashboardHooks["ManualTableView"]["unmounted"]++;
      }
    };

    const DashBoardViews = {
      KeptAliveRoomViews,
      ManualTableView
    };

    const Dashboard = {
      name: "Dashboard",
      setup() {
        fetchRooms();
        watch(
          () => roomsStates.value.length,
          () => {
            if (!selectingRoomId.value) {
              selectingRoomId.value = roomsStates.value[0].room._id.toString();
            }
          }
        );
        return () => (
          <KeepAlive>{h(DashBoardViews[activeScreen.value])}</KeepAlive>
        );
      }
    };

    makeWrapper(Dashboard);
    await nextTick();
    await delay(100);

    function stringify(obj) {
      return obj;
      return JSON.stringify(obj).replace(/"/g, "");
    }
    expect(stringify(countRoomHooks)).toMatchInlineSnapshot(`
      Object {
        "room0": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 0,
          "mounted": 1,
          "unmounted": 0,
        },
        "room1": Object {
          "activated": 0,
          "beforeMount": 0,
          "deactivated": 0,
          "mounted": 0,
          "unmounted": 0,
        },
        "room2": Object {
          "activated": 0,
          "beforeMount": 0,
          "deactivated": 0,
          "mounted": 0,
          "unmounted": 0,
        },
      }
    `);
    selectingRoomId.value = roomsStates.value[1].room._id.toString();
    await nextTick();
    expect(stringify(countRoomHooks)).toMatchInlineSnapshot(`
      Object {
        "room0": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
        "room1": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 0,
          "mounted": 1,
          "unmounted": 0,
        },
        "room2": Object {
          "activated": 0,
          "beforeMount": 0,
          "deactivated": 0,
          "mounted": 0,
          "unmounted": 0,
        },
      }
    `);
    selectingRoomId.value = roomsStates.value[2].room._id.toString();
    await nextTick();
    expect(stringify(countRoomHooks)).toMatchInlineSnapshot(`
      Object {
        "room0": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
        "room1": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
        "room2": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 0,
          "mounted": 1,
          "unmounted": 0,
        },
      }
    `);

    expect(stringify(countRoomHooks)).toMatchInlineSnapshot(`
      Object {
        "room0": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
        "room1": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
        "room2": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 0,
          "mounted": 1,
          "unmounted": 0,
        },
      }
    `);
    expect(stringify(countDashboardHooks)).toMatchInlineSnapshot(`
      Object {
        "KeptAliveRoomViews": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 0,
          "mounted": 1,
          "unmounted": 0,
        },
        "ManualTableView": Object {
          "activated": 0,
          "beforeMount": 0,
          "deactivated": 0,
          "mounted": 0,
          "unmounted": 0,
        },
      }
    `);
    selectingRoomId.value = roomsStates.value[0].room._id.toString();
    await nextTick();
    expect(stringify(countRoomHooks)).toMatchInlineSnapshot(`
      Object {
        "room0": Object {
          "activated": 2,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
        "room1": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
        "room2": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
      }
    `);
    activeScreen.value = "ManualTableView";
    await nextTick();

    expect(stringify(countDashboardHooks)).toMatchInlineSnapshot(`
      Object {
        "KeptAliveRoomViews": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
        "ManualTableView": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 0,
          "mounted": 1,
          "unmounted": 0,
        },
      }
    `);
    expect(stringify(countRoomHooks)).toMatchInlineSnapshot(`
      Object {
        "room0": Object {
          "activated": 2,
          "beforeMount": 1,
          "deactivated": 2,
          "mounted": 1,
          "unmounted": 0,
        },
        "room1": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
        "room2": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
      }
    `);
    activeScreen.value = "KeptAliveRoomViews";
    await nextTick();

    expect(stringify(countDashboardHooks)).toMatchInlineSnapshot(`
      Object {
        "KeptAliveRoomViews": Object {
          "activated": 2,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
        "ManualTableView": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
      }
    `);
    expect(stringify(countRoomHooks)).toMatchInlineSnapshot(`
      Object {
        "room0": Object {
          "activated": 3,
          "beforeMount": 1,
          "deactivated": 2,
          "mounted": 1,
          "unmounted": 0,
        },
        "room1": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
        "room2": Object {
          "activated": 1,
          "beforeMount": 1,
          "deactivated": 1,
          "mounted": 1,
          "unmounted": 0,
        },
      }
    `);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
