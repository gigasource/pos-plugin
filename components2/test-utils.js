import "../jest.setup";
import {config, mount} from "@vue/test-utils";
import {hooks} from "./OrderView/pos-logic";
import {disablePay, payBtnClickable, payPrintMode, showIcon} from "./OrderView/pos-logic-be";

jest.mock("vue-i18n", () => {
  return {
    useI18n() {
      return {
        t(t) {
          return t;
        },
        locale: "en"
      };
    }
  };
});

const dayjs = require("dayjs");
export const orm = require("schemahandler");
const syncFlow = require("schemahandler/sync/sync-flow");
const syncPlugin = require("schemahandler/sync/sync-plugin-multi");
const { stringify } = require("schemahandler/utils");
//jest.useFakeTimers("modern").setSystemTime(new Date("2021-01-01").getTime());
require("mockdate").set(new Date("2021-01-01").getTime());

const delay = require("delay");

export const foodTax = { taxes: [5, 10] };
export const drinkTax = { taxes: [16, 32] };

export const cola = { name: "Cola", price: 1.3, quantity: 1, ...drinkTax };
export const fanta = { name: "Fanta", price: 2, quantity: 1, ...drinkTax };
export const rice = { name: "Rice", price: 10, quantity: 1, ...foodTax };
export const ketchup = { name: "Add Ketchup", price: 3, quantity: 1 };

beforeAll(async () => {
  orm.connect({ uri: "mongodb://localhost:27017" }, "myproject");
  orm.registerSchema("Order", {
    inProgress: Boolean,
    items: [{}],
    table: Number
  });
  await orm("Order").deleteMany();
  await orm("Commit").deleteMany();

  orm.plugin(syncPlugin);
  orm.plugin(syncFlow);
  orm.registerCommitBaseCollection("Order");
  orm.plugin(require("../backend/commit/orderCommit"));
  orm.registerCollectionOptions("Order");
  orm.emit("commit:flow:setMaster", true);
});

afterEach(async () => {
  await orm("Order")
    .deleteMany()
    .direct();
  await orm("Commit")
    .deleteMany()
    .direct();
});

export let actions = [];
["showOrderReceipt", "pay", "printOrder"].forEach(e =>
  hooks.on(e, () => actions.push(e))
);
export let expectArray = () => [
  "payBtnClickable",
  payBtnClickable.value,
  "payPrintMode",
  payPrintMode.value,
  "showIcon",
  showIcon.value,
  "disablePay",
  disablePay.value,
  actions
];
//</editor-fold>

//<editor-fold desc="component">
export let component, wrapper;
export function setComponent(_component) {
  component = _component;
}
export const makeWrapper = () => {
  wrapper = mount(component, {
    props: {},
    shallow: true,
    global: {
      directives: {
        touch: true
      },
      stubs: {
        "g-btn-bs": true,
        "g-icon": true,
        "dialog-config-order-item": true,
        "g-overlay": true,
        "g-avatar": true
      },
      mocks: {
        t: a => a,
        $t: a => a,
        $filters: {
          formatCurrency(val, decimals = 2) {
            if (!val || isNaN(val) || Math.floor(val) === val) return val;
            return val.toFixed(decimals);
          }
        }
      }
    }
  });
};

beforeAll(() => (config.renderStubDefaultSlot = true));
