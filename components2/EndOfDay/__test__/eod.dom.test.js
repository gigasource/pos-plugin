//<editor-fold desc="declare">
import { makeWrapper, orm, wrapper } from "../../test-utils";

import { nextTick } from "vue";
import PosEndOfDayDatePicker from "../PosEndOfDayDatePicker";
import PosEndOfDayMain from "../PosEndOfDayMain";
import PosEndOfDayDetails from "../PosEndOfDayDetails";
import {
  getEodReportsInMonthCalender,
  getOldestPendingReport,
  getXReport,
  selectedDate
} from "../eod-shared";
import dayjs from "dayjs";
import PosEndOfDayPrintDialog from "../PosEndOfDayPrintDialog";
import PosEndOfDayPrintPendingZReport from "../PosEndOfDayPrintPendingZReport";
import PosEndOfDayToolbar from "../PosEndOfDayToolbar";
import PosEndOfDayReprintZReport from "../PosEndOfDayReprintZReport";
import PosEndOfDayReport from "../PosEndOfDayReport";
import fs from "fs";

const {
  prepareDb,
  prepareReportTest
} = require("../../../backend/order-logic/report.prepare.test");

const { stringify } = require("schemahandler/utils");

const delay = require("delay");

jest.mock("cms", () => {
  process.env.USE_GLOBAL_ORM = true;
  const { cmsFactory } = require("../../../test-utils");
  const _cms = cmsFactory("eodDom");
  global.cms = _cms;
  return {
    socket: _cms.feSocket,
    getModel: function(modelName) {
      return _cms.orm(modelName);
    }
  };
});

let cms = global.cms;

//require('../../../backend/print/print-report/report-index')(cms);

//</editor-fold>

describe("eod test", function() {
  beforeAll(async () => {
    await cms.init();
    await prepareReportTest(cms);
    await require("../../../backend/print/print-report/report-index")(cms);
    await prepareDb(/*cms.*/ orm);
    cms.triggerFeConnect();
  });

  it("case 0 export data", async function() {
    const orders = await orm("Order").find();
    const content = JSON.stringify(orders, null, 4);
    fs.writeFileSync(__dirname + "/mockData.json", content, "utf-8");
  });

  it("case 0a test date", async function() {
    const a = {
      date: new Date()
    };
    expect(JSON.stringify(a)).toMatchInlineSnapshot(
      `"{\\"date\\":\\"2021-01-01T00:00:00.000Z\\"}"`
    );
  });

  it("case 1 date-picker", async function() {
    //order have 1 sent item, add one item -> should display print,
    //todo: fetch data
    //todo: convert singeton -> factory
    //room -> props
    //todo: dashboard: keep-alive
    makeWrapper(PosEndOfDayDatePicker, {
      shallow: true,
      props: {}
    });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot();
  }, 80000);

  it("case 2 PosEndOfDayMain", async function() {
    makeWrapper(PosEndOfDayMain, {
      //shallow: true,
      props: {}
    });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot();
  }, 80000);

  it("case 3 PosEODDetails", async function() {
    //todo: analyse information
    makeWrapper(PosEndOfDayDetails, {
      //shallow: true,
      props: {}
    });
    await getEodReportsInMonthCalender();
    await nextTick();
    await delay(50);
    selectedDate.value = dayjs("05.01.2021", "DD.MM.YYYY").toDate();

    await nextTick();
    await delay(100);
    expect(wrapper.html()).toMatchSnapshot();
  }, 80000);

  it("case 4 PosEODPrintDialog", async function() {
    //todo: getXReport
    //todo: printXReport
    makeWrapper(PosEndOfDayPrintDialog, {
      //shallow: true,
      props: {}
    });
    await getEodReportsInMonthCalender();
    await nextTick();
    await delay(50);
    selectedDate.value = dayjs("05.01.2021", "DD.MM.YYYY").toDate();
    await getXReport();

    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot();
  }, 80000);

  it("case 5 getOldestPendingReport", async function() {
    await getOldestPendingReport();
  }, 80000);

  it("case 7 PosEndOfDayPrintPendingZReport", async function(done) {
    makeWrapper(PosEndOfDayPrintPendingZReport, {
      //shallow: true,
      props: {
        modelValue: true
      }
    });
    await getEodReportsInMonthCalender();
    await nextTick();
    await delay(50);
    selectedDate.value = dayjs("05.01.2021", "DD.MM.YYYY").toDate();
    await getXReport();

    await nextTick();
    await delay(50);
    cms.on("post:endOfDay", report => {
      done();
    });
    wrapper.find("[ok]").trigger("click");
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot();
  }, 80000);

  it("case 8 Toolbar", async function(done) {
    makeWrapper(PosEndOfDayToolbar, {
      //shallow: true,
      props: {
        modelValue: true
      }
    });
    await getEodReportsInMonthCalender();
    await nextTick();
    await delay(50);
    selectedDate.value = dayjs("05.01.2021", "DD.MM.YYYY").toDate();
    await getXReport();

    await nextTick();
    await delay(50);
    cms.on("post:endOfDay", report => {
      done();
    });
    //wrapper.find('[ok]').trigger('click')
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot();
    done();
  }, 80000);

  it("case 9 printXReport", async function(done) {
    makeWrapper(PosEndOfDayPrintDialog, {
      //shallow: true,
      props: {
        modelValue: true
      }
    });
    await getEodReportsInMonthCalender();
    await nextTick();
    await delay(50);
    selectedDate.value = dayjs("05.01.2021", "DD.MM.YYYY").toDate();
    await getXReport();

    await nextTick();
    await delay(50);
    //wrapper.find('[ok]').trigger('click')
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot();
    done();
  }, 80000);

  it("case 10 printZReport", async function(done) {
    makeWrapper(PosEndOfDayPrintDialog, {
      //shallow: true,
      props: {
        modelValue: true
      }
    });
    await getEodReportsInMonthCalender();
    await nextTick();
    await delay(50);
    selectedDate.value = dayjs("05.01.2021", "DD.MM.YYYY").toDate();
    await getXReport();

    await nextTick();
    await delay(50);
    //wrapper.find('[ok]').trigger('click')
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot();
    done();
  }, 80000);

  it("case 11 printZReport", async function(done) {
    makeWrapper(PosEndOfDayReprintZReport, {
      //shallow: true,
      props: {
        modelValue: true
      }
    });
    await getEodReportsInMonthCalender();
    await nextTick();
    await delay(50);
    selectedDate.value = dayjs("05.01.2021", "DD.MM.YYYY").toDate();
    await getXReport();

    await nextTick();
    await delay(50);
    wrapper.find("[print-z]").trigger("click");
    await delay(200);
    expect(wrapper.html()).toMatchSnapshot();
    done();
  }, 80000);

  it("case 12 PosEndOfDayReport", async function() {
    makeWrapper(PosEndOfDayReport, {
      //shallow: true,
      props: {}
    });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot();
  }, 80000);
});
