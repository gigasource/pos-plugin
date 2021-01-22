<script>
import { internalValueFactory } from '../utils';
import dayjs from 'dayjs';
import { withModifiers, watch } from 'vue'
export default {
  props: ['modelValue'],
  setup(props, { emit }) {
    const dialog = internalValueFactory(props, { emit })
    const reports = ref([])

    function open() {
      dialog.value = true
    }

    function close(confirmed = false) {
      dialog.value = false
      if (confirmed) {
        emit('confirmed')
      }
    }

    //todo: printZReport
    async function print(z) {
      await $getService('ReportsStore:printZReport')(z)
    }

    //todo: selectedReportDate, timeFormat utils
    watch(() => dialog.value, (newV) => {
      if (newV) {
        reports.value = selectedReportDate.reports.map((value, index) => {
          return {
            begin: dayjs(value.begin).format(timeFormat),
            end: dayjs(value.end).format(timeFormat),
            z: value.z,
            sum: value.sum,
            pending: value.pending
          }
        }) || []
      }
    })
    return () => <>
      <div>
        <slot close={close} open={open} name="activator"></slot>
        <g-dialog eager overlay-color="#6B6F82" overlay-opacity="0.95" v-model={dialog.value} width="45%">
          <div class="print-confirm-dialog">
            <p class="head-title">
              {t('report.reprintZReport')} </p>
            <div class="printed-list">
              {reports.value.map((item, index) =>
                  <div key={index} class="report-item" style="display: flex">
                    <p> {item.begin} - {item.end} : Z-Number {item.z} </p>
                    <g-btn uppercase={false} background-color="#2979FF" flat style="margin-left: auto" text-color="#fff" height="40px" onClick={withModifiers(() => print(item.z), ['stop'])}>
                      <g-icon class="mr-2" svg>
                        icon-print2
                      </g-icon>
                      {t('ui.print')}
                    </g-btn>
                  </div>
              )} </div>
          </div>
        </g-dialog>
      </div>
    </>
  }
}
</script>

<style lang="scss" scoped>
.print-confirm-dialog {
  padding: 25px 70px 30px 70px;
  width: 100%;
  text-align: center;
  background-color: #fff;
  font-size: 14px;
  line-height: 18px;
  height: 300px;
}

.head-title {
  font-size: 20px;
  line-height: 25px;
  font-weight: bold;
}

.printed-list {
  margin-top: 30px;
  overflow-y: auto;
  height: calc(100% - 50px);
}

.report-item {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
}
</style>
