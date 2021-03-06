<script>
import { useI18n } from 'vue-i18n';
import {
  init,
  DashboardFunctionFactory,
  demoLicense,
  dayLeft,
  iframeHeight,
  iframeWidth, iframeSrc, iframeDragging, showIframe, showExportDataDialog, viewLicense
} from './pos-dashboard-function-logics';
import { appHooks } from '../../AppSharedStates';
import { genScopeId } from '../../utils';
import { computed } from 'vue'
import dialogExportData from '../../Report/dialogExportData';


export default {
  setup() {
    init()
    const { computedBtnGroup2, computedBtnGroup1, shouldRenderButtonFnDivider } = DashboardFunctionFactory()
    function renderTopButtons() {
      return (
          <div class="function--up" v-show={computedBtnGroup1.value && computedBtnGroup1.value.length}>
            {computedBtnGroup1.value.map((btn, i) =>
                <div key={`up_${i}`} class="function-btn" onClick={btn.click}>
                  <g-icon size="60">{btn.icon}</g-icon>
                  <span class="mt-3 ta-center">{btn.title}</span>
                </div>
            )}
          </div>
      )
    }
    function renderBottomButtons() {
      return (
          <div class="function--down">
            {computedBtnGroup2.value.map((btn, i) =>
                <div key={`down_${i}`} class="function-btn" onClick={btn.click}>
                  <g-icon size="60">{btn.icon}</g-icon>
                  <span class="mt-3 ta-center">{btn.title}</span>
                  {
                    (btn.notification) && <div class="function-noti">
                      <g-icon color="white" size="16" class="mr-1">info</g-icon>
                      {btn.notification}
                    </div>
                  }
                </div>
            )}
          </div>
      )
    }
    function renderDemoLicenseWarning() {
      return demoLicense.value && (
          <div class={['demo-license-warning', dayLeft.value < 30 ? 'bg-red-lighten-5' : 'bg-blue-lighten-5']}>
            <div style="margin: 0 32px 0 8px">
              <p class="fw-700">You are using demo license</p>
              <p class={['fs-small-2', dayLeft.value < 30 ? 'text-red' : 'text-grey-darken-1']}>
                {dayLeft.value} day{dayLeft.value > 1 && 's'} left
              </p>
            </div>
            <g-btn-bs class="fs-small-2" width="100" background-color="white" border-color="#1271FF" onClick={viewLicense}>
              View license
            </g-btn-bs>
          </div>
      )
    }
    // TODO: Moving render online ordering setting to another place
    function renderOnlineOrderingSettingDialog() {
      return (
          <g-dnd-dialog v-model={showIframe.value}
                        width={iframeWidth.value}
                        height={iframeHeight.value}
                        lazy
                        showMinimize={false}
                        showMaximize={false}
                        onClose={() => showIframe.value = false}
                        onDragStart={() => iframeDragging.value = true}
                        onDragEnd={() => iframeDragging.value = false}
                        onResizeStart={() => iframeDragging.value = true}
                        onResizeEnd={() => iframeDragging.value = false} v-slots={{
            default: () => <>
              { showIframe.value && iframeDragging.value && <div style="height: 100%; width: 100%; position: absolute; background: transparent"></div> }
              { showIframe.value && <iframe src={iframeSrc.value} width="100%" height="100%"></iframe> }
            </>,
            title: () => 'Online Order Setting'
          }}>
          </g-dnd-dialog>
      )
    }
    function renderExportDataDialog() {
      return <dialogExportData v-model={showExportDataDialog.value}/>
    }

    return genScopeId(() =>
        <div class="function">
          { renderTopButtons() }
          { shouldRenderButtonFnDivider.value && <g-divider color="#9e9e9e"></g-divider> }
          { renderBottomButtons() }
          { renderDemoLicenseWarning() }
          { renderOnlineOrderingSettingDialog() }
          { renderExportDataDialog() }
        </div>
    )
  }
}
</script>

<style scoped lang="scss">
.function {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  background-image: url("/plugins/pos-plugin/assets/out.png");
  padding: 24px;
  overflow: scroll;

  &--up,
  &--down {
    display: grid;
    grid-template-columns: repeat(5, calc(20% - 8px));
    grid-column-gap: 10px;
    grid-row-gap: 40px;
  }

  &--up {
    grid-template-rows: 100%;
    margin-bottom: 40px;
    /*flex: 0 0 calc(33.33% - 40px);*/
  }

  &--down {
    grid-template-rows: repeat(2, 1fr);
    margin-top: 40px;
    flex: 1;
    /*flex: 0 0 calc(66.67% - 40px)*/
  }

  &-btn {
    width: 100%;
    min-height: 136px;
    background: white;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0 8px;
    box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);

    & > span {
      word-break: break-word;
    }
  }

  &-noti {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    border-radius: 2px;
    background: #FFCB3A;
    padding: 4px;
    color: white;
    font-size: 12px;
  }

  .demo-license-warning {
    position: fixed;
    top: 16px;
    right: 16px;
    display: flex;
    padding: 8px;
    align-items: center;
    border-radius: 2px;
  }
}

@media screen and (max-width: 1023px) {
  .function {

    &-btn {
      padding-top: 8px;

      & > .g-icon {
        width: 40px !important;
        height: 40px !important;
        min-width: 40px !important;
        min-height: 40px !important;
      }

      & > span {
        font-size: 12px;
      }
    }
  }
}

/*Iphone 6/7/8*/
@media screen and (max-width: 667px) {
  .function {
    &--up,
    &--down {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}


@media screen and (min-width: 668px) and (max-width: 860px) {
  .function {
    &--up,
    &--down {
      grid-template-columns: repeat(4, 1fr);
    }
  }
}
</style>
