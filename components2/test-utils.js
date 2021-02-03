import "../jest.setup";
import _ from 'lodash';
import {config, mount} from "@vue/test-utils";
import {hooks} from "./OrderView/pos-logic";
import {disablePay, payBtnClickable, payPrintMode, showIcon} from "./OrderView/pos-logic-be";
import StubFactory from './StubFactory';

jest.mock("vue-i18n", () => {
  const util = require('util');
  return {
    useI18n() {
      return {
        t(s) {
          if (s === 'dates.dateFormat') return 'DD.MM.YYYY';
          if (s === 'dates.timeFormat') return 'HH:mm';
          if (arguments.length > 1) return [...arguments].map(s => util.inspect(s)).join(' , ')
          return s; // [Consider] return `t('${t}')` to indicate that i18n has been used
        },
        locale: "en"
      };
    }
  };
});
jest.mock("vue-router", () => {
  return {
    useRoute() {
      return {
        query: {
          type: 'default'
        }
      };
    },
    useRouter() {
      return {
        push() {
        }
      };
    }
  };
});

const dayjs = require("dayjs");
export const orm = require("schemahandler");
const syncFlow = require("schemahandler/sync/sync-flow");
const syncPlugin = require("schemahandler/sync/sync-plugin-multi");
const {stringify} = require("schemahandler/utils");
//jest.useFakeTimers("modern").setSystemTime(new Date("2021-01-01").getTime());
require("mockdate").set(new Date("2021-01-01").getTime());

const delay = require("delay");

export const foodTax = {taxes: [5, 10]};
export const drinkTax = {taxes: [16, 32]};

export const cola = {name: "Cola", price: 1.3, quantity: 1, ...drinkTax};
export const fanta = {name: "Fanta", price: 2, quantity: 1, ...drinkTax};
export const rice = {name: "Rice", price: 10, quantity: 1, ...foodTax};
export const ketchup = {name: "Add Ketchup", price: 3, quantity: 1};

beforeAll(async () => {
  //orm.connect({uri: "mongodb://localhost:27017"}, "myproject");
  orm.registerSchema("Order", {
    status: String,
    date: Date,
    vDate: Date,
    items: [{}],
    table: String
  });
  orm("Order").deleteMany().then();
  orm("Commit").deleteMany().then();

  orm.plugin(syncPlugin);
  orm.plugin(syncFlow);
  orm.registerCommitBaseCollection('Order', 'Action');
  orm.plugin(require("../backend/commit/orderCommit"));
  //orm.plugin(require("../backend/commit/actionCommit"));
  orm.registerCollectionOptions("Order");
  orm.emit("commit:flow:setMaster", true);
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

/**
 *
 * @param _component
 * @param options
 * @param useDefaults indicate whether _.defaults will be use for options
 * @returns {*}
 * example: makeWrapper(Order2, {shallow: false});
 */
export const makeWrapper = (_component, options, useDefaults = false) => {
  const defaultOption = {
    props: {},
    global: {
      directives: {
        touch: true
      },
      stubs: {
        'choose-table-dialog': true,
        'dialog-change-value': true,
        'dialog-choose-popup-modifier': true,
        "dialog-config-order-item": true,
        'dialog-confirm-delete': true,
        'dialog-form-input': true,
        'dialog-multi-payment': true,
        'dialog-multi-payment2': true,
        'dialog-new-payment': true,
        'dialog-new-tax-category': true,
        'dialog-product-search-result': true,
        'dialog-text-filter': true,
        'g-avatar': true,
        'g-autocomplete': true,
        'g-badge': true,
        'g-btn': true,
        "g-btn-bs": true,
        'g-card': true,
        'g-card-actions': true,
        'g-card-text': true,
        'g-card-title': true,
        'g-combobox': true,
        'g-dialog': true,
        'g-divider': true,
        "g-icon": true,
        'g-item-group': true,
        'g-file-input': true,
        'g-menu': true,
        "g-overlay": true,
        'g-radio': true,
        'g-select': true,
        'g-simple-table': true,
        'g-spacer': true,
        'g-switch': true,
        'g-table': true,
        'g-tabs': true,
        'g-tab-item': true,
        'g-textarea': true,
        'g-text-field': true,
        'g-text-field-bs': true,
        'g-toolbar': true,
        'g-snackbar': true,
        'g-checkbox': true,
        'g-chip': true,
        'g-select': true,
        'pos-file-input-image': true,
        'pos-order': true,
        'pos-quick-order-toolbar': true,
        //'pos-order-split-order': true,
        'new-reservation-dialog': true,
        'pos-keyboard-full': true,
        'pos-order-keyboard': true,
        'pos-order-move-items': true,
        'pos-order-receipt': true,
        'pos-order-voucher-dialog': true,
        'pos-textfield-new': true,
        'pos-time-picker': true,
        'g-grid-select': StubFactory('g-grid-select'),
        'pos-payment-screen-payment-methods2': true,
        'pos-payment-screen-keyboard2': true,
        'pos-restaurant-payment-order-detail2': true,
        'pos-restaurant-payment-toolbar2': true,
        'scroll-select': true,
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
  }
  const optionResult = useDefaults ? _.defaults(options, defaultOption) : _.merge(defaultOption, options)
  wrapper = mount(component || _component, optionResult);
};

beforeAll(() => (config.renderStubDefaultSlot = true));

import fs from 'fs';
import {PNG} from "pngjs";
global.printFunctions = {
  printPng: async (png) => {
    try {
      const bufferInBase64 = PNG.sync.write(png);
      fs.writeFileSync(__dirname + '/EndOfDay/__test__/__snapshots__/report.png', bufferInBase64);

    } catch (e) {
      console.log('canvasprinter: printPng exception', e)
    }
  },
  print: () => null
}
