import cms from "cms";

import { stringify } from "schemahandler/utils";
import {
  GROUP_PRINTER_COLLECTION_NAME,
  printerHooks,
  onCreateNewPrinterGroup,
  onRemovePrinterGroup,
  onUpdatePrinterGroup,
  selectingPrinterGroup,
  onSelectPrinterGroup,
  printerGroups,
  PrinterSettingFactory,
  selectingPrinterGroupType,
  selectingPrinterGroupIndex,
  SidebarFactory,
  selectingPrinter,
  onSelectPrinter
} from "../pos-print-shared";
import { nextTick } from "vue";

const kitchen_printer1 = {
  name: "k_p1"
};

const kitchen_printer2 = {
  name: "k_p2"
};

const invoice_printer1 = {
  name: "i_p1"
};

beforeAll(async () => {
  const orm = require("schemahandler");
  orm.connect({ uri: "mongodb://localhost:27017" }, "test-printer");
  const GroupPrinter = cms.getModel(GROUP_PRINTER_COLLECTION_NAME);
  await GroupPrinter.remove({});
});
describe("test printer logics", () => {
  //todo: update test
  test("printer groups", async () => {
    await onCreateNewPrinterGroup("kitchen", kitchen_printer1, "kitchen");
    const ip1WithId = await onCreateNewPrinterGroup(
      "invoice",
      invoice_printer1,
      "invoice"
    );
    expect(printerGroups.value).toMatchInlineSnapshot(`
      Object {
        "invoice": Array [
          Object {
            "_id": "0000000000000000000007ce",
            "name": "i_p1",
            "type": "invoice",
          },
        ],
        "kitchen": Array [
          Object {
            "_id": "0000000000000000000007cd",
            "name": "k_p1",
            "type": "kitchen",
          },
        ],
      }
    `);
    const kp2WithId = await onCreateNewPrinterGroup(
      "kitchen",
      kitchen_printer2,
      "kitchen"
    );
    expect(printerGroups.value).toMatchInlineSnapshot(`
      Object {
        "invoice": Array [
          Object {
            "_id": "0000000000000000000007ce",
            "name": "i_p1",
            "type": "invoice",
          },
        ],
        "kitchen": Array [
          Object {
            "_id": "0000000000000000000007cd",
            "name": "k_p1",
            "type": "kitchen",
          },
          Object {
            "_id": "0000000000000000000007cf",
            "name": "k_p2",
            "type": "kitchen",
          },
        ],
      }
    `);
    await onRemovePrinterGroup(kp2WithId, "kitchen");
    expect(printerGroups.value).toMatchInlineSnapshot(`
      Object {
        "invoice": Array [
          Object {
            "_id": "0000000000000000000007ce",
            "name": "i_p1",
            "type": "invoice",
          },
        ],
        "kitchen": Array [
          Object {
            "_id": "0000000000000000000007cd",
            "name": "k_p1",
            "type": "kitchen",
          },
        ],
      }
    `);
    await onUpdatePrinterGroup(
      ip1WithId,
      Object.assign(ip1WithId, {
        name: "New Name",
        otherAttr: "New Attr"
      }),
      "invoice"
    );
    expect(printerGroups.value).toMatchInlineSnapshot(`
      Object {
        "invoice": Array [
          Object {
            "_id": "0000000000000000000007ce",
            "name": "New Name",
            "otherAttr": "New Attr",
            "type": "invoice",
          },
        ],
        "kitchen": Array [
          Object {
            "_id": "0000000000000000000007cd",
            "name": "k_p1",
            "type": "kitchen",
          },
        ],
      }
    `);
  });

  test("test printer setting factory", async () => {
    const {
      nameInputRef,
      ipInputRef,
      openDialog,
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
    } = PrinterSettingFactory();
    const printerGroup1 = await onCreateNewPrinterGroup(
      "kitchen",
      kitchen_printer1,
      "kitchen"
    );

    let dbData = await cms.getModel(GROUP_PRINTER_COLLECTION_NAME).findOne({});
    expect(stringify(dbData)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "name": "k_p1",
        "type": "kitchen",
      }
    `);
    onSelectPrinterGroup(printerGroup1);
    await nextTick();

    expect(selectingPrinterGroupType.value).toMatchInlineSnapshot(`"kitchen"`);
    expect(selectingPrinterGroupIndex.value).toMatchInlineSnapshot(`0`);
    const printer1 = await onCreateNewPrinter({
      ip: "192.168.0.1",
      sound: true,
      name: "printer1"
    });
    await nextTick();
    expect(printerGroups.value).toMatchInlineSnapshot(`
      Object {
        "kitchen": Array [
          Object {
            "_id": "0000000000000000000007cd",
            "name": "k_p1",
            "printers": Array [
              Object {
                "_id": "0000000000000000000007ce",
                "ip": "192.168.0.1",
                "name": "printer1",
                "sound": true,
              },
            ],
            "type": "kitchen",
          },
        ],
      }
    `);
    dbData = await cms.getModel(GROUP_PRINTER_COLLECTION_NAME).findOne({});
    expect(stringify(dbData)).toMatchInlineSnapshot(`
      Object {
        "0": Object {
          "printers": Array [
            Object {
              "_id": "ObjectID",
              "ip": "192.168.0.1",
              "name": "printer1",
              "sound": true,
            },
          ],
        },
        "_id": "ObjectID",
        "name": "k_p1",
        "type": "kitchen",
      }
    `);
    const printer2 = await onCreateNewPrinter({
      ip: "192.168.1.1",
      sound: false,
      name: "printer2"
    });
    onSelectPrinter(printer1);
    await onRemoveSelectingPrinter();
    expect(printerGroups.value).toMatchInlineSnapshot(`
      Object {
        "kitchen": Array [
          Object {
            "_id": "0000000000000000000007cd",
            "name": "k_p1",
            "printers": Array [
              Object {
                "_id": "0000000000000000000007cf",
                "ip": "192.168.1.1",
                "name": "printer2",
                "sound": false,
              },
            ],
            "type": "kitchen",
          },
        ],
      }
    `);
    dbData = await cms.getModel(GROUP_PRINTER_COLLECTION_NAME).findOne({});
    expect(stringify(dbData)).toMatchInlineSnapshot(`
      Object {
        "0": Object {
          "printers": Array [
            Object {
              "_id": "ObjectID",
              "ip": "192.168.1.1",
              "name": "printer2",
              "sound": false,
            },
          ],
        },
        "_id": "ObjectID",
        "name": "k_p1",
        "type": "kitchen",
      }
    `);

    onSelectPrinter(printer2);
    await nextTick();
    selectingPrinter.value.sound = true;
    selectingPrinter.value.name = "printer2_modified";
    await nextTick();
    dbData = await cms.getModel(GROUP_PRINTER_COLLECTION_NAME).findOne({});
    expect(printerGroups.value).toMatchInlineSnapshot(`
      Object {
        "kitchen": Array [
          Object {
            "_id": "0000000000000000000007cd",
            "name": "k_p1",
            "printers": Array [
              Object {
                "_id": "0000000000000000000007cf",
                "ip": "192.168.1.1",
                "name": "printer2_modified",
                "sound": true,
              },
            ],
            "type": "kitchen",
          },
        ],
      }
    `);
    expect(stringify(dbData)).toMatchInlineSnapshot(`
      Object {
        "0": Object {
          "printers": Array [
            Object {
              "_id": "ObjectID",
              "ip": "192.168.1.1",
              "name": "printer2_modified",
              "sound": true,
            },
          ],
        },
        "_id": "ObjectID",
        "name": "k_p1",
        "type": "kitchen",
      }
    `);
  });
  test("sidebar factory", async () => {
    const { sidebarData } = SidebarFactory();
    expect(sidebarData.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "displayChild": true,
          "icon": "icon-restaurant",
          "items": Array [],
          "key": "receiptCategory",
          "title": undefined,
        },
        Object {
          "icon": "icon-invoice_report",
          "title": undefined,
        },
        Object {
          "displayChild": false,
          "icon": "icon-receipt",
          "key": "entireReceipt",
          "title": undefined,
          "type": "entire",
        },
        Object {
          "icon": "icon-general_setting",
          "title": undefined,
        },
      ]
    `);
    await onCreateNewPrinterGroup("kitchen", kitchen_printer1);
    await nextTick();
    expect(sidebarData.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "displayChild": true,
          "icon": "icon-restaurant",
          "items": Array [
            Object {
              "icon": "radio_button_unchecked",
              "title": "k_p1",
            },
          ],
          "key": "receiptCategory",
          "title": undefined,
        },
        Object {
          "icon": "icon-invoice_report",
          "title": undefined,
        },
        Object {
          "displayChild": false,
          "icon": "icon-receipt",
          "key": "entireReceipt",
          "title": undefined,
          "type": "entire",
        },
        Object {
          "icon": "icon-general_setting",
          "title": undefined,
        },
      ]
    `);
  });
});
