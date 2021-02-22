import { makeWrapper, wrapper } from "../../test-utils";
import PosPrinterSetting from "../PosPrinterSetting";
import cms from "cms";
import delay from 'delay'
import {
  fetchPrinterGroups,
  GROUP_PRINTER_COLLECTION_NAME,
  onCreateNewPrinterGroup,
  onSelectPrinterGroup,
  PrinterSettingFactory
} from "../pos-print-logics";

import * as Logics from "../pos-print-logics";

const kitchen_printer1 = {
  name: "k_p1"
};

const kitchen_printer2 = {
  name: "k_p2"
};

const invoice_printer1 = {
  name: "i_p1"
};

const {
  nameInputRef,
  ipInputRef,
  openDialog,
  selectingPrinter,
  onSelectPrinterType,
  testPrinter,
  loadUsbPrinters,
  usbPrinterSelectModel,
  usbPrinters,
  fontSizeList,
  marginSizeList,
  listReceipt,
  updateSettings,
  onCreateNewPrinter,
  onRemoveSelectingPrinter,
  onSelectPrinter,
  showDialog
} = PrinterSettingFactory();
beforeAll(async () => {
  const orm = require("schemahandler");
  orm.connect({ uri: "mongodb://localhost:27017" }, "test-printer");
  const GroupPrinter = cms.getModel(GROUP_PRINTER_COLLECTION_NAME);
  await GroupPrinter.remove({});
  const mock = jest.spyOn(Logics, "PrinterSettingFactory");
  mock.mockImplementation(() => {
    return {
      nameInputRef,
      ipInputRef,
      openDialog,
      selectingPrinter,
      onSelectPrinterType,
      testPrinter,
      loadUsbPrinters,
      usbPrinterSelectModel,
      usbPrinters,
      fontSizeList,
      marginSizeList,
      listReceipt,
      updateSettings,
      onCreateNewPrinter,
      onRemoveSelectingPrinter,
      onSelectPrinter,
      showDialog
    };
  });
});
describe("test ui", () => {
  test("test printer setting ui", async () => {
    // await fetchPrinterGroups()

    const kp1 = await onCreateNewPrinterGroup(
      "kitchen",
      kitchen_printer1,
      "kitchen"
    );
    onSelectPrinterGroup(kp1);
    const p1 = await onCreateNewPrinter({
      ip: "192.168.1.1",
      sound: false,
      name: "printer2"
    });
    onSelectPrinter(p1);
    makeWrapper(PosPrinterSetting);
    await delay(100)
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="configuration">
        <div class="config">
          <g-text-field-bs-stub label="settings.name"
                                modelvalue="k_p1"
          >
          </g-text-field-bs-stub>
        </div>
        <div class="config">
          <p class="title">
            settings.thermalPrinter
          </p>
          <div class="row-flex flex-wrap">
            <div class="printer">
              settings.networkPrinter
            </div>
            <div class="printer">
              settings.usb
            </div>
            <div class="printer">
              settings.Integrate
            </div>
            <div class="printer">
              settings.reset
            </div>
          </div>
        </div>
        <g-divider-stub inset="true">
        </g-divider-stub>
        <g-divider-stub class="mt-2"
                        inset="true"
        >
        </g-divider-stub>
        <div class="switch-group">
          <g-switch-stub label="settings.splitArticles">
          </g-switch-stub>
          <g-switch-stub label="settings.groupArticles">
          </g-switch-stub>
          <g-switch-stub label="settings.sound"
                         modelvalue="false"
          >
          </g-switch-stub>
          <g-switch-stub label="settings.escPos">
          </g-switch-stub>
          <g-switch-stub label="TSC POS">
          </g-switch-stub>
        </div>
        <div class="title"
             style="margin-left: 12px;"
        >
          settings.receiptFontSize
        </div>
        <g-grid-select-stub mandatory="true"
                            grid="false"
                            items="1,2,3"
                            style="margin-left: 12px; padding-top: 4px;"
        >
        </g-grid-select-stub>
        <div class="title"
             style="margin-left: 12px;"
        >
          settings.receiptTopMargin
        </div>
        <g-grid-select-stub mandatory="true"
                            grid="false"
                            items="0,1,2,3,4"
                            style="margin-left: 12px; padding-top: 4px;"
        >
        </g-grid-select-stub>
        <g-divider-stub inset="true"
                        class="mt-2 mb-2"
        >
        </g-divider-stub>
        <div class="title"
             style="margin-left: 12px;"
        >
          Default tax
        </div>
        <div class="row-flex"
             style="margin-left: 12px;"
        >
          <div class="col-3">
            restaurant.product.dineInTax
          </div>
          <g-grid-select-stub mandatory="true"
                              return-object="true"
                              item-cols="auto"
                              items="[object Object]"
                              item-value="_id"
                              style="margin-left: 12px;"
          >
          </g-grid-select-stub>
        </div>
        <div class="row-flex"
             style="margin-left: 12px; margin-top: 8px;"
        >
          <div class="col-3">
            restaurant.product.takeAwayTax
          </div>
          <g-grid-select-stub mandatory="true"
                              return-object="true"
                              item-cols="auto"
                              items="[object Object]"
                              item-value="_id"
                              style="margin-left: 12px;"
          >
          </g-grid-select-stub>
        </div>
        <dialog-form-input-stub modelvalue="false">
        </dialog-form-input-stub>
      </div>
    `);
  });
});
