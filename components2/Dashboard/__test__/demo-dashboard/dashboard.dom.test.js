//<editor-fold desc="declare">
import { makeWrapper, wrapper } from "../../../test-utils";

import { nextTick } from "vue";
import Dashboard from "./Dashboard";
import { contentView } from "./dashboard-shared";

const { stringify } = require("schemahandler/utils");

const delay = require("delay");

//</editor-fold>

describe("order-view test", function() {
  it("case 1 dashboard", async function() {
    makeWrapper(Dashboard, {});
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <p>
        1
      </p>
    `);
    contentView.value.name = "TextComp";
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <p>
        c
      </p>
    `);
    contentView.value.name = "TextField";
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <p>
        2
      </p>
    `);
  }, 80000);

});
