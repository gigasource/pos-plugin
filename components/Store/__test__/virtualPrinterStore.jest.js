import { dismiss, filteredReports } from '../virtualPrinterStore'

describe('VirtualPrinterStore', () => {
  function initState() {
    return {
      start: 0,
      take: 5,
      reportCount: 5,
      reports: [
        { type: 'kitchen', printerGroupId: 1 },
        { type: 'invoice', printerGroupId: 1 },
        { type: 'kitchen', printerGroupId: 2 },
        { type: 'invoice', printerGroupId: 2 },
        { type: 'entireReceipt', printerGroupId: 3 },
      ],
      loading: false,
      mode: 'all',
      printerGroupFilter: 'all',
      printerGroups: []
    }
  }

  it('dismiss', () => {
    const state = initState()
    const dismissFn = dismiss(state)
    dismissFn()
    expect(state.reportCount).toBe(0)
    expect(state.reports).toEqual([])
    expect(state.start).toBe(0)
  })

  describe('filteredReports', () => {
    it('reports should change if filter mode change', () => {
      const state = initState()
      const cptFilteredReports = filteredReports(state)
      expect(cptFilteredReports.value.length).toBe(5)

      state.mode = 'bon';
      expect(cptFilteredReports.value.length).toBe(2) // 2 kitchen

      state.mode = 'receipt'
      expect(cptFilteredReports.value.length).toBe(3) // 2 invoice + 1 entireReceipt
    })

    it('reports should change if printerGroupFilter changed', () => {
      const state = initState()
      const cptFilteredReports = filteredReports(state)
      expect(cptFilteredReports.value.length).toBe(5)

      state.printerGroupFilter = 1
      expect(cptFilteredReports.value.length).toBe(2)

      state.printerGroupFilter = 2
      expect(cptFilteredReports.value.length).toBe(2)

      state.printerGroupFilter = 3
      expect(cptFilteredReports.value.length).toBe(1)

      state.printerGroupFilter = 'all'
      expect(cptFilteredReports.value.length).toBe(5)
    })


  })
})
