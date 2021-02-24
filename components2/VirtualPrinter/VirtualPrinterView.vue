<script>
import { genScopeId } from '../utils';
import LazyLoadContainer from './LazyLoadContainer';
import { computed, reactive, withModifiers } from 'vue'
import {
  dismiss,
  filteredReports,
  loadMoreReports,
  loadPrinterGroups,
  selectPrinterGroup,
  state as virtualPrinterState,
  selectMode
} from './virtual-printer-logics'

export default {
  components: { LazyLoadContainer },
  setup() {

    loadPrinterGroups()

    const state = reactive({
      zoom: {
        current: 75,
        list: [
          { text: '75%', value: 75 },
          { text: '100%', value: 100 },
          { text: '125%', value: 125 },
          { text: '150%', value: 150 }
        ],
      }
    })

    const printerGroupModel = computed(() => {
      return virtualPrinterState.printerGroups.map(v => ({ text: v.name, value: v._id }))
    })

    const imgSrcs = computed(() => {
      return filteredReports.value.map(x => 'data:image/png;base64, ' + x.imageContent)
    })

    const receiptWidth = computed(() => {
      return state.zoom.current * 4;
    })

    const receiptPadding = computed(() => {
      return Math.floor(15 * state.zoom.current / 100)
    })

    const imageWrapperStyle = computed(() => {
      const pd = receiptPadding.value
      return {
        maxWidth: receiptWidth.value + pd * 2 + 'px',
        background: '#FFF',
        padding: `${pd}px ${pd}px ${pd * 2}px ${pd}px`,
        marginTop: '15px',
        marginBottom: '15px',
      }
    })

    const imgStyle = computed(() => ({
      width: receiptWidth.value + 'px',
    }))

    const renderHeader = () =>
        <div class="virtualPrinter__header" onTouchEnd={withModifiers(() => {}, ['stop'])}>
          <g-btn border-radius="4" uppercase={false} onClick={() => selectMode('all')} class="virtualPrinter__header__btn">
            All
          </g-btn>
          <g-btn border-radius="4" uppercase={false} onClick={() => selectMode('bon')} class="virtualPrinter__header__btn">
            Bon
          </g-btn>
          <g-btn border-radius="4" uppercase={false} onClick={() => selectMode('receipt')} class="virtualPrinter__header__btn">
            Receipt
          </g-btn>
          <g-select text-field-component="GTextFieldBs" items={state.zoom.list} v-model={state.zoom.current} class="virtualPrinter__header__select" style="min-width: 76px"/>
          <g-select text-field-component="GTextFieldBs" items={printerGroupModel.value} modelValue={virtualPrinterState.printerGroupFilter} onUpdate:modelValue={selectPrinterGroup} class="virtualPrinter__header__select" style="min-width: 80px"/>
          <g-spacer/>
          <g-btn border-radius="4" uppercase={false} onClick={dismiss} class="virtualPrinter__header__btn">
            Dismiss
          </g-btn>
        </div>

    const renderReports = () =>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'transparent'
        }}>
          {
            (imgSrcs.value && imgSrcs.value.length) ?
                <div key={i} style={imageWrapperStyle}>
                  <img src={imgSrcs.value} draggable="false" style={imgStyle}/>
                </div>
                :
                <div>
                  0 report found!
                </div>
          }
        </div>
    return genScopeId(() =>
        <LazyLoadContainer class="virtualPrinterContainer w-100" containerStyle={{ maxHeight: '100%' }} threshold={50} doLoad={loadMoreReports}>
          {genScopeId(() =>
              <div class="virtualPrinter">
                {renderHeader()}
                {renderReports()}
              </div>)()
          }
        </LazyLoadContainer>
    )
  }
}
</script>

<style scoped lang="scss">
$headerHeight: 46px;

.virtualPrinterContainer {
  background-image: url('/plugins/pos-plugin/assets/out.png');
  background-attachment: fixed;
  min-height: 100%;
}

.virtualPrinter {

  &__header {
    height: $headerHeight;
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 10px;

    &__btn {
      margin-right: 5px;
    }

    &__select {
      box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);
      margin-right: 5px;
    }

    ::v-deep {
      .bs-tf-wrapper {
        margin: 0;
        background-color: #f5f5f5;
        border-radius: 4px;
        display: flex;
        width: 100%;
      }

      .bs-tf-input-group {
        width: 100%;
      }

      .bs-tf-inner-input-group {
        height: 36px;
        padding-left: 8px;
        padding-right: 0;
        flex-wrap: nowrap;
        border-width: 0;

        .input, .bs-tf-append-inner {
          cursor: pointer;
        }
      }
    }
  }
}
</style>
