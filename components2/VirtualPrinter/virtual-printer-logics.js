import { computed, reactive } from 'vue';

// Should map to backend/print-report/virtual-printer.js
// TODO: Both backend and front-end use query so we need to move all collection name to constants file
const VIRTUAL_REPORT_COLLECTION = 'VirtualReport'
const GROUP_PRINTER_COLLECTION = 'GroupPrinter'
const OUT_DATED_VREPORT_TIME_IN_DAYS = 2

// NOTE: clear timer will be remove when cms core added auto clean feature
const MILLISECONS_PER_DAY = 86400000

export const state = reactive({
  start: 0,       // paging
  take: 5,
  reportCount: 0, // total report
  reports: [],    // loaded reports -- lazy load
  loading: false, // loading or not
  mode: 'all',    // view mode. available values: all | bon | receipt
  printerGroupFilter: 'all',  // printer which report has been printed
  printerGroups: []
})

export const filteredReports = computed(() => {
  let reports = []
  switch (state.mode) {
    case 'all':
      reports = state.reports;
      break;
    case 'bon':
      reports = state.reports.filter(r => r.type === 'kitchen')
      break;
    case 'receipt':
      reports = state.reports.filter(r => r.type === 'invoice' || r.type === 'entireReceipt')
  }

  if (state.printerGroupFilter === 'all')
    return reports
  else
    return reports.filter(r => r.printerGroupId === state.printerGroupFilter)
})

export async function loadReports() {
  state.start = 0;
  // console.log('Stores/VirtualPrinterView:loadReports')
  try {
    const vrs = await cms.getModel(VIRTUAL_REPORT_COLLECTION).find({}, {}, { skip: 0, limit: state.take }).sort([['created', -1]])
    if (vrs.length) {
      state.reports = vrs
      state.start = state.reports.length
    }
    // console.log('Stores/VirtualPrinterView:loadReports completed!')
  } catch (e) {
    // console.log('Stores/VirtualPrinterView:loadReports failed!', e)
  }
}

export async function loadMoreReports() {
  try {
    // console.log('Stores/VirtualPrinterView:loadMoreReports')
    const vrs = await cms.getModel(VIRTUAL_REPORT_COLLECTION).find({}, {}, { skip: state.start, limit: state.take }).sort([['created', -1]])
    if (vrs.length) {
      state.reports = [...state.reports, ...vrs]
      state.start = state.reports.length
    }
    // console.log('Stores/VirtualPrinterView:loadMoreReports completed!')
  } catch (e) {
    // console.log('Stores/VirtualPrinterView:loadMoreReports failed!', e)
  }
}

export async function loadReportCount() {
  try {
    // console.log('Stores/VirtualPrinterView:getVirtualReportCount')
    state.reportCount = await cms.getModel(VIRTUAL_REPORT_COLLECTION).count()
  } catch (e) {
    // console.log('Stores/VirtualPrinterView:getVirtualReportCount exception', e)
  }
}

export async function loadPrinterGroups() {
  try {
    // console.log('Stores/VirtualPrinterView:loadPrinterGroups')
    const groupPrinters = await cms.getModel(GROUP_PRINTER_COLLECTION).find({})
    groupPrinters.unshift({ _id: 'all', name: 'All' })
    state.printerGroups = groupPrinters
    // console.log('Stores/VirtualPrinterView:loadPrinterGroups completed')
  } catch (e) {
    // console.log('Stores/VirtualPrinterView:loadPrinterGroups failed', e)
  }
}

export async function dismiss() {
  try {
    // console.log('Stores/VirtualPrinterView:dismiss')
    await cms.getModel(VIRTUAL_REPORT_COLLECTION).remove({})
    state.reportCount = 0
    state.reports = []
    state.start = state.reports.length
  } catch (e) {
    // console.log('Stores/VirtualPrinterView:dismiss exception', e)
  }
}

export function setReports(reports) {
  state.reports = reports
  state.start = state.reports.length
}

export function selectMode(mode) {
  state.mode = mode
}

export function selectPrinterGroup(val) {
  state.printerGroupFilter = val
}

let clearVirtualReportTimerId = -1;
export async function initVirtualPrinterData() {
  await loadReportCount()
  await loadPrinterGroups()
  clearVirtualReportTimerId = setInterval(async () => {
    await cms.getModel(VIRTUAL_REPORT_COLLECTION).remove({
      created: {
        $lt: dayjs().subtract(OUT_DATED_VREPORT_TIME_IN_DAYS, 'day')
      }
    })
  }, MILLISECONS_PER_DAY)
}

export function clearVirtualReportTimer() {
  clearInterval(clearVirtualReportTimerId)
}
