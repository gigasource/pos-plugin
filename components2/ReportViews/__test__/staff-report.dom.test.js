//<editor-fold desc="declare">
import {makeWrapper, orm, wrapper} from "../../test-utils";

import {nextTick} from "vue";
import {demoData} from "../../OrderView/__test__/demoData";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import StaffReportView from "../StaffReportView";
import {currentDate, getListUsers, getStaffReport, printStaffReport, selectedStaff, staffs} from "../staf-report-logic";
import _ from 'lodash';

dayjs.extend(customParseFormat)

const {prepareDb, prepareReportTest} = require('../../../backend/order-logic/report.prepare.test')

const {stringify} = require("schemahandler/utils");

const delay = require("delay")

jest.mock('cms', () => {
  process.env.USE_GLOBAL_ORM = true
  const {cmsFactory} = require('../../../test-utils')
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

    await prepareDb(/*cms.*/orm)
    cms.triggerFeConnect()
  });

  it("case 0 getListUsers", async function () {
    await getListUsers();
    currentDate.value = dayjs('05.01.2021', 'DD.MM.YYYY').toDate();
    await getStaffReport();
  }, 80000);

  it("case 1 StaffReportView", async function () {
    currentDate.value = dayjs('05.01.2021', 'DD.MM.YYYY').toDate();

    makeWrapper(StaffReportView, {
      //shallow: true,
      props: {}
    });

    //await getMonthReport();
    await delay(200);
    await nextTick();

    selectedStaff.value = _.find(staffs.value, {name: 'Waiter 2'});
    await delay(200);
    await nextTick();
    printStaffReport();
    await delay(200);
    await nextTick();
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

});
