<script>
import {formatDate, internalValueFactory} from '../utils';
import {useI18n} from "vue-i18n";
import {printZReport, selectedReportDate} from "./eod-shared";

export default {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, {emit, slots}) {
    const {t} = useI18n();
    const dialog = internalValueFactory(props, {emit})

    const open = () => dialog.value = true;
    const close = () => dialog.value = false;

    return () => (
        <div>
          {slots.activator && slots.activator({close, open})}
          <g-dialog eager overlay-color="#6B6F82" overlay-opacity="0.95" v-model={dialog.value} width="45%">
            <div class="print-confirm-dialog">
              <p class="head-title">
                {t('report.reprintZReport')} </p>
              <div class="printed-list">
                {selectedReportDate.value && selectedReportDate.value.reports.map((item, index) =>
                    <div key={index} class="report-item" style="display: flex">
                      <p> {formatDate(item.begin)} - {formatDate(item.end)} : Z-Number {item.z} </p>
                      <g-btn print-z uppercase={false} background-color="#2979FF" flat style="margin-left: auto"
                             text-color="#fff" height="40px" onClick={() => printZReport(item)}>
                        <g-icon class="mr-2" svg>
                          icon-print2
                        </g-icon>
                        {t('ui.print')}
                      </g-btn>
                    </div>
                )}
              </div>
            </div>
          </g-dialog>
        </div>
    )
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
