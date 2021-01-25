//<editor-fold desc="declare">
import {makeWrapper, orm, wrapper} from "../../test-utils";

import {nextTick} from "vue";
import {demoData} from "../../OrderView/__test__/demoData";
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
import {preparePrintReport} from "../../../backend/print/print-report/print-report.prepare.test";

const { prepareDb, prepareReportTest } = require('../../../backend/order-logic/report.prepare.test')

const {stringify} = require("schemahandler/utils");

const delay = require("delay")

jest.mock('cms', () => {
  process.env.USE_GLOBAL_ORM = true
  const { cmsFactory } = require('../../../test-utils')
  const _cms = cmsFactory('eodDom')
  global.cms = _cms
  return {
    socket: _cms.feSocket,
    getModel: function (modelName) {
      return _cms.orm(modelName)
    }
  }
})

let cms = global.cms

//require('../../../backend/print/print-report/report-index')(cms);

//</editor-fold>

describe("eod test", function () {
  beforeAll(async () => {
    await cms.init()
    await prepareReportTest(cms)
    await preparePrintReport(cms);
    await orm("PosSetting").remove({});
    await orm("PosSetting").create(demoData.PosSetting[0]);
    await orm("OrderLayout").remove({});
    await orm("OrderLayout").create(demoData.OrderLayout[0]);
    await orm("Room").remove({});
    await orm("Room").create(demoData.Room);
    await prepareDb(/*cms.*/orm)
    cms.triggerFeConnect()
  });

  it("case 1 date-picker", async function () {
    //order have 1 sent item, add one item -> should display print,
    //todo: fetch data
    //todo: convert singeton -> factory
    //room -> props
    //todo: dashboard: keep-alive
    makeWrapper(PosEndOfDayDatePicker, {
      shallow: true,
      props: {
      }
    });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

  it("case 2 PosEndOfDayMain", async function () {
    makeWrapper(PosEndOfDayMain, {
      //shallow: true,
      props: {
      }
    });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

  it("case 3 PosEODDetails", async function () {
    //todo: analyse information
    makeWrapper(PosEndOfDayDetails, {
      //shallow: true,
      props: {
      }
    });
    await getEodReportsInMonthCalender();
    await nextTick();
    await delay(50);
    selectedDate.value = dayjs('05.01.2021', 'DD.MM.YYYY').toDate();

    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

  it("case 4 PosEODPrintDialog", async function () {
    //todo: getXReport
    //todo: printXReport
    makeWrapper(PosEndOfDayPrintDialog, {
      //shallow: true,
      props: {
      }
    });
    await getEodReportsInMonthCalender();
    await nextTick();
    await delay(50);
    selectedDate.value = dayjs('05.01.2021', 'DD.MM.YYYY').toDate();
    await getXReport()

    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

  it("case 5 getOldestPendingReport", async function () {
    await getOldestPendingReport();
  }, 80000);

  it("case 6 toolbar", async function () {
    makeWrapper(PosEndOfDayPrintDialog, {
      //shallow: true,
      props: {
      }
    });
    await getEodReportsInMonthCalender();
    await nextTick();
    await delay(50);
    selectedDate.value = dayjs('05.01.2021', 'DD.MM.YYYY').toDate();
    await getXReport()

    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

  it("case 7 PosEndOfDayPrintPendingZReport", async function (done) {
    makeWrapper(PosEndOfDayPrintPendingZReport, {
      //shallow: true,
      props: {
        modelValue: true
      }
    });
    await getEodReportsInMonthCalender();
    await nextTick();
    await delay(50);
    selectedDate.value = dayjs('05.01.2021', 'DD.MM.YYYY').toDate();
    await getXReport()

    await nextTick();
    await delay(50);
    wrapper.find('[ok]').trigger('click')
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

});
