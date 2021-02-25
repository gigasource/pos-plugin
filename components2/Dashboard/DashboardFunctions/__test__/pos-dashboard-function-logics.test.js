import { DashboardFunctionFactory } from "../pos-dashboard-function-logics";
import { nextTick } from "vue";
import cms from "cms";
import { appHooks, user } from "../../../AppSharedStates";
import { currentAppType, appType } from '../../../AppType'
import delay from "delay";
beforeAll(async () => {
  const orm = require("schemahandler");
  orm.connect({ uri: "mongodb://localhost:27017" }, "test");
  const Feature = cms.getModel("Feature");
  await Feature.remove();
  const data = [
    { _id: "5ea3e828edc74651fc2c21e5", enabled: true, name: "editMenuCard" },
    { _id: "5ea3e85fedc74651fc2c21fb", enabled: true, name: "monthlyReport" },
    { _id: "5ea3e820edc74651fc2c21e1", enabled: true, name: "delivery" },
    { _id: "5ea3e818edc74651fc2c21dd", enabled: true, name: "manualTable" },
    { _id: "5ea3e855edc74651fc2c21f7", enabled: true, name: "eodReport" },
    { _id: "5ea3e80bedc74651fc2c21d9", enabled: true, name: "fastCheckout" },
    { _id: "5ea3e849edc74651fc2c21f3", enabled: true, name: "staffReport" },
    { _id: "5ea40084448aba19d0a2d4b6", enabled: true, name: "editTablePlan" },
    { _id: "5ea3e834edc74651fc2c21e9", enabled: true, name: "tablePlan" }
  ];
  await Feature.create(data);
});

describe("test dashboard functions logics", () => {
  test("", async () => {
    appHooks.emit("updateEnabledFeatures");
    user.value = {
      name: "admin",
      role: "admin"
    };
    currentAppType.value = appType.POS_RESTAURANT
    const {
      btnUp,
      btnDown,
      computedBtnGroup1,
      computedBtnGroup2
    } = DashboardFunctionFactory();

    await nextTick();
    await delay(100);
    expect(btnUp[currentAppType.value]).toMatchInlineSnapshot(`
      Array [
        Object {
          "click": [Function],
          "feature": "fastCheckout",
          "icon": "icon-fast-checkout",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "delivery",
          "icon": "icon-order-food",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "tutorial",
          "icon": "icon-tutorial",
          "title": "Tutorial",
        },
      ]
    `);
    expect(btnDown[currentAppType.value]).toMatchInlineSnapshot(`
      Array [
        Object {
          "click": [Function],
          "feature": "orderHistory",
          "icon": "icon-history",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "settings",
          "icon": "icon-dashboard",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "editMenuCard",
          "icon": "icon-menu1",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "eodReport",
          "icon": "icon-calendar",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "monthlyReport",
          "icon": "icon-month_report",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "staffReport",
          "icon": "icon-staff-report",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "editTablePlan",
          "icon": "icon-edit-table-plan",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "printerSettings",
          "icon": "icon-printer-setting",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "customerInfo",
          "icon": "icon-customer-info",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "manageInventory",
          "icon": "icon-inventory",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "onlineOrdering",
          "icon": "icon-online-order-menu",
          "title": undefined,
        },
      ]
    `);
    expect(computedBtnGroup1.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "click": [Function],
          "feature": "fastCheckout",
          "icon": "icon-fast-checkout",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "delivery",
          "icon": "icon-order-food",
          "title": undefined,
        },
      ]
    `);
    expect(computedBtnGroup2.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "click": [Function],
          "feature": "orderHistory",
          "icon": "icon-history",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "settings",
          "icon": "icon-dashboard",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "editMenuCard",
          "icon": "icon-menu1",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "eodReport",
          "icon": "icon-calendar",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "monthlyReport",
          "icon": "icon-month_report",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "staffReport",
          "icon": "icon-staff-report",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "editTablePlan",
          "icon": "icon-edit-table-plan",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "printerSettings",
          "icon": "icon-printer-setting",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "customerInfo",
          "icon": "icon-customer-info",
          "title": undefined,
        },
        Object {
          "click": [Function],
          "feature": "manageInventory",
          "icon": "icon-inventory",
          "title": undefined,
        },
      ]
    `);
  });
});
