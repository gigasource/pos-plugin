import { dismiss } from '../virtualPrinterStore'

describe('VirtualPrinterStore', () => {
  it('dismiss', () => {
    const state = {
      reportCount: 1,
      reports: [{ name: 'abc', value: 'zyx' }], // whatever
      start: 2
    }

    const dismissFn = dismiss(state)
    dismissFn()

    expect(state.reportCount).toBe(0)
    expect(state.reports).toEqual([])
    expect(state.start).toBe(0)
  })
})
