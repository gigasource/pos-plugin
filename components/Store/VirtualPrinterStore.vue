<template>
</template>
<script>
  // Should map to backend/print-report/virtual-printer.js
  // TODO: Both backend and front-end use query so we need to move all collection name to constants file
  const VIRTUAL_REPORT_COLLECTION = 'VirtualReport'
  const GROUP_PRINTER_COLLECTION = 'GroupPrinter'
  
  const SOCKET_EVENT_NEW_VREPORT_CREATED = 'newVirtualReportCreated'
  const OUT_DATED_VREPORT_TIME_IN_DAYS = 2
  
  // NOTE: clear timer will be remove when cms core added auto clean feature
  const MILLISECONS_PER_DAY = 86400000
  
  export default {
    name: 'VirtualPrinterStore',
    domain: 'VirtualPrinterStore',
    props: {},
    data: function () {
      return {
        start: 0,       // paging
        take: 10,
        reportCount: 0, // total report
        reports: [],    // loaded reports -- lazy load
        loading: false, // loading or not
        mode: 'all',    // view mode. available values: all | bon | receipt
        printerGroupFilter: 'all',  // printer which report has been printed
        printerGroups: []
      }
    },
    async created() {
      await this.loadReportCount()
      await this.loadMoreReports()
      await this.loadPrinterGroups()
      
      cms.socket.on(SOCKET_EVENT_NEW_VREPORT_CREATED, async ({ newReport }) => {
        if (newReport) {
          this.reportCount = this.reportCount + 1;
          this.setReports([newReport, ...this.reports])
        } else {
          console.warn(`${SOCKET_EVENT_NEW_VREPORT_CREATED} received empty report info!`)
        }
      });
      
      this.clearVirtualReportTimerId = setInterval(async () => {
        await cms.getModel(VIRTUAL_REPORT_COLLECTION).remove({
          created: {
            $lt: dayjs().subtract(OUT_DATED_VREPORT_TIME_IN_DAYS, 'day')
          }
        })
      }, MILLISECONS_PER_DAY)
    },
    async beforeDestroy() {
      cms.socket.off(SOCKET_EVENT_NEW_VREPORT_CREATED)
      clearInterval(this.clearVirtualReportTimerId)
    },
    computed: {
      filteredReports () {
        let reports = []
        switch (this.mode) {
          case 'all':
            reports = this.reports;
            break;
          case 'bon':
            reports = this.reports.filter(r => r.type === 'kitchen')
            break;
          case 'receipt':
            reports = this.reports.filter(r => r.type === 'invoice')
        }
        
        if (this.printerGroupFilter === 'all')
          return reports
        else
          return reports.filter(r => r.printerGroupId === this.printerGroupFilter)
      },
    },
    methods: {
      async loadMoreReports() {
        console.log('Stores/VirtualPrinterView:loadMoreReports')
        try {
          const vrs = await cms.getModel(VIRTUAL_REPORT_COLLECTION).find({}, {}, { skip: this.start, limit: this.take }).sort('created')
          const newReports = [...this.reports, ...vrs]
          console.log('Stores/VirtualPrinterView:loadMoreReports completed!')
          this.setReports(newReports)
        } catch (e) {
          console.log('Stores/VirtualPrinterView:loadMoreReports failed!', e)
        }
      },
      async loadReportCount() {
        try {
          this.reportCount = '...'
          console.log('Stores/VirtualPrinterView:getVirtualReportCount')
          this.reportCount = await cms.getModel(VIRTUAL_REPORT_COLLECTION).count()
        } catch (e) {
          console.log('Stores/VirtualPrinterView:getVirtualReportCount exception', e)
        }
      },
      async loadPrinterGroups() {
        try {
          console.log('Stores/VirtualPrinterView:loadPrinterGroups')
          const groupPrinters = await cms.getModel(GROUP_PRINTER_COLLECTION).find({})
          groupPrinters.unshift({ _id: 'all', name: 'All' })
          this.$set(this, 'printerGroups', groupPrinters)
          console.log('Stores/VirtualPrinterView:loadPrinterGroups completed')
        } catch (e) {
          console.log('Stores/VirtualPrinterView:loadPrinterGroups failed', e)
        }
      },
      async dismiss() {
        try {
          console.log('Stores/VirtualPrinterView:dismiss')
          await cms.getModel(VIRTUAL_REPORT_COLLECTION).remove({})
          this.reportCount = 0
          this.setReports([])
        } catch (e) {
          console.log('Stores/VirtualPrinterView:dismiss exception', e)
        }
      },
      setReports(reports) {
        this.$set(this, 'reports', reports)
        this.start = this.reports.length
      },
      selectMode(mode) {
        this.mode = mode
      },
      selectPrinterGroup(val) {
        this.printerGroupFilter = val
      }
    },
    provide() {
      return {
        loading: this.loading,
        reportCount: this.reportCount,
        reports: this.reports,
        printerGroups: this.printerGroups,
        filteredReports: this.filteredReports,
        loadMoreReports: this.loadMoreReports,
        dismiss: this.dismiss,
        selectMode: this.selectMode,
        selectPrinterGroup: this.selectPrinterGroup,
      }
    }
  }
</script>
