import { mount } from "@vue/test-utils";
import DashboardSidebarUI from './DashboardSidebarUI'
import _ from "lodash";
import { nextTick } from "vue";
import delay from "delay";
import { DashboardSidebarItemsFactory } from "./DashboardSidebarItems";

describe("Test dashboard sidebar factory", () => {
  it("should", async () => {
    const $t = x => x;
    const { refactoredDashboardSidebarItems } = DashboardSidebarItemsFactory(
      $t
    );

    await nextTick();

    expect(refactoredDashboardSidebarItems.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "feature": "tablePlan",
          "icon": "icon-restaurant",
          "items": Array [],
          "title": "sidebar.restaurant",
        },
        Object {
          "feature": "manualTable",
          "icon": "icon-manual-table",
          "title": "sidebar.manualTable",
        },
        Object {
          "feature": "onlineOrdering",
          "icon": "icon-delivery",
          "items": Array [
            Object {
              "badge": "2",
              "badgeColor": "#FF5252",
              "icon": "radio_button_unchecked",
              "iconType": "small",
              "key": "Orders",
              "title": "onlineOrder.dashboard",
            },
            Object {
              "icon": "radio_button_unchecked",
              "iconType": "small",
              "title": "onlineOrder.completedOrders",
            },
            Object {
              "icon": "radio_button_unchecked",
              "iconType": "small",
              "title": "onlineOrder.declinedOrders",
            },
            Object {
              "feature": "onlineOrdering",
              "icon": "icon-services",
              "key": "Service",
              "title": "sidebar.services",
            },
          ],
          "key": "Dashboard",
          "title": "onlineOrder.onlineOrders",
        },
        Object {
          "badge": "1",
          "badgeColor": "#FF5252",
          "feature": "reservation",
          "icon": "icon-reservation",
          "key": "Reservation",
          "title": "sidebar.reservation",
        },
        Object {
          "icon": "icon-functions",
          "title": "sidebar.functions",
        },
      ]
    `);
  });
  it("www", () => {
    const { fn, hooks } = DashboardSidebarUI();

    // hooks
    const component = fn();
    const wrapper = mount(component, {});
    // const {}
  });
});
