//<editor-fold desc="declare">
import {makeWrapper, orm, wrapper} from "../../test-utils";

import {nextTick} from "vue";
import {demoData} from "../../OrderView/__test__/demoData";
import PosMonthReport from "../PosMonthReport";
import PosMonthReportSetting from "../PosMonthReportSetting";
import PosMonthSelect from "../PosMonthSelect";
import {monthReportTo} from "../month-report-shared";
import dayjs from "dayjs";
import moment from "moment";

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
    await require('../../../backend/print/print-report/report-index')(cms);

    await orm("PosSetting").remove({});
    await orm("PosSetting").create(demoData.PosSetting[0]);
    await orm("OrderLayout").remove({});
    await orm("OrderLayout").create(demoData.OrderLayout[0]);
    await orm("Room").remove({});
    await orm("Room").create(demoData.Room);
    await prepareDb(/*cms.*/orm)
    cms.triggerFeConnect()
  });

  it("case 1 PosMonthReport", async function () {
    makeWrapper(PosMonthReport, {
      //shallow: true,
      props: {
      }
    });

    //await getMonthReport();
    await delay(200);
    await nextTick();
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

  it("case 2 PosMonthReportSetting", async function () {
    makeWrapper(PosMonthReportSetting, {
      //shallow: true,
      props: {
      }
    });

    //await getMonthReport();
    await delay(200);
    await nextTick();
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

  it("case 3 PosMonthSelect", async function () {
    makeWrapper(PosMonthSelect, {
      //shallow: true,
      props: {
      }
    });

    //await getMonthReport();
    wrapper.find('[previous]').trigger('click')
    await delay(200);
    await nextTick();
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

  it("case 4 PosMonthSelect 2", async function () {
    makeWrapper(PosMonthSelect, {
      //shallow: true,
      props: {
      }
    });
    //const a = dayjs;
    monthReportTo.value = moment('20.02.2021', 'DD.MM.YYYY').toDate();
    const a = monthReportTo
    //await getMonthReport();
    //wrapper.find('[previous]').trigger('click')
    await delay(200);
    await nextTick();
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

});
