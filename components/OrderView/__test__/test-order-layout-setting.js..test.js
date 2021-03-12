import { nextTick } from "vue";
import {
  loadOrderLayoutSetting,
  fontSize,
  changeSize,
  changeCategory,
  category
} from "../order-layout-setting-logic";

it("case 1 : load save", async function() {
  const setting = {
    category: {
      differentSize: false,
      fontSize: "13px",
      singleRow: false,
      size: "64px",
      type: "vertical"
    },
    fontSize: "18px"
  };
  localStorage.setItem("OrderScreenSetting", JSON.stringify(setting));
  loadOrderLayoutSetting();
  expect(category).toMatchInlineSnapshot(`
    Object {
      "differentSize": false,
      "fontSize": "13px",
      "singleRow": false,
      "size": "64px",
      "type": "vertical",
    }
  `);
  expect(fontSize.value).toMatchInlineSnapshot(`"18px"`);
}, 80000);

it("case 2 : changeSize", async function() {
  changeSize(0.5);
  expect(fontSize.value).toMatchInlineSnapshot(`"14.5px"`);
}, 80000);

it("case 3 : changeCategory", async function() {
  changeCategory();
  expect(category).toMatchInlineSnapshot(`
    Object {
      "differentSize": false,
      "fontSize": "13px",
      "singleRow": false,
      "size": "64px",
      "type": "vertical",
    }
  `);
}, 80000);
