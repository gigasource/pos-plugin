<script>
import { internalValueFactory } from '../utils';
import _ from 'lodash';
import { ref, watch} from 'vue'

export default {
  props: ['modelValue'],
  setup() {
    const dialog = internalValueFactory(props, { emit })
    const pendingReport = ref(null)
    const open = function () {
      dialog.value = true
    }
    const close = function (confirmed = false) {
      dialog.value = false
      //todo: make getHighestZNumber singleton
      if (confirmed) emit('confirmed', _.map(pendingReport.value.reports, (value, key) => ({
            z: key ? key : $getService('ReportsStore:getHighestZNumber')(),
            begin: dayjs(value.from).toDate(),
            end: dayjs(value.to).toDate(),
            sum: value.vSum,
            pending: !key
          }))
      )
    }
    // todo: this function should be in utils.js
    const formatDate = function (date) {
      if (!date || !dayjs(date).isValid()) return ''
      return dayjs(date).format(dateFormat)
    }
    // todo: getOldestPendingReport
    watch(() => dialog.value, async (newVal) => {
      if (newVal) pendingReport.value = await $getService('ReportsStore:getOldestPendingReport')()
    })

    return () => <>
      <div>
        <slot close={close} open={open} name="activator"></slot>
        <g-dialog eager v-model={dialog.value} width="45%" overlay-color="#6B6F82" overlay-opacity="0.95">
          <div class="print-confirm-dialog">
            <p class="title">
              {t('ui.notification')} </p>
            <div class="confirmation-content">
              <p>
                {t('report.pendingPrintLine1', { date: formatDate(pendingReport.value && pendingReport.value.date) })} </p>
              <p>
                {t('report.pendingPrintLine2', { date: formatDate(pendingReport.value && pendingReport.value.date) })} </p>
            </div>
            <div class="confirmation-buttons">
              <g-btn onClick={() => close()} uppercase={false} background-color="#fff" class="mr-2" flat style="border: 1px solid #979797" text-color="#1D1D26" width="120px">
                {t('ui.cancel')}
              </g-btn>
              <g-btn onClick={() => close(true)} uppercase={false} background-color="#E57373" class="mr-2" flat text-color="#FFFFFF" width="120px">
                {t('ui.ok')}
              </g-btn>
            </div>
          </div>
        </g-dialog>
      </div>
    </>
  }
}
</script>

<style lang="scss" scoped>
.title {
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 25px;
  color: #1D1D26;
}

.confirmation-content {
  margin-top: 26px;
  margin-bottom: 50px;
  font-style: normal;
  font-weight: normal;
  font-size: 14px;
  line-height: 18px;
  color: #1D1D26;

}

.confirmation-buttons {
  display: flex;
  justify-content: flex-end;
}

.print-confirm-dialog {
  padding: 40px 8px 10px 8px;
  width: 100%;
  text-align: center;
  background-color: #fff;
}
</style>
