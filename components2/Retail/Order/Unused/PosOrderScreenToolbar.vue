<script>
import { onMounted, withModifiers } from 'vue'
import { genScopeId } from '../../../utils';
import { useRouter } from 'vue-router'
import { showDialogSavedList, savedOrders, getSavedOrders, resetOrderData } from '../temp-logic';

export default {
  name: 'PosOrderScreenToolbar',
  setup() {
    const router = useRouter()

    async function openDialogSavedList() {
      await getSavedOrders()
      showDialogSavedList.value = true
    }

    onMounted(async () => {
      await getSavedOrders()
    })

    async function back() {
      resetOrderData()
      router.push({ path: '/pos-dashboard' })
    }

    return genScopeId(() => (
        <g-toolbar color="#eee" elevation="0" height="100%">
          { genScopeId(()=> <>
            <g-btn uppercase={false} background-color="white" class="mr-3" style="margin-left: -4px" onClick={withModifiers(back, ['stop'])}>
              <g-icon class="mr-2" svg>icon-back</g-icon>
              {t('ui.back')}
            </g-btn>
            {
              (savedOrders.value && savedOrders.value.length > 0) ?
                  <g-badge overlay color="#FF4452" v-slots={{
                    default: genScopeId(() => (
                        <g-btn uppercase={false} background-color="white" onClick={openDialogSavedList}>
                          <g-icon class="mr-2" svg>icon-folder</g-icon>
                          {t('order.savedList')}
                        </g-btn>
                    )),
                    badge: genScopeId(() => <span>{savedOrders.value.length}</span>),
                  }}></g-badge>
                  :
                  <g-btn uppercase={false} background-color="white" onClick={openDialogSavedList}>
                    <g-icon class="mr-2" svg>icon-folder</g-icon>
                    {t('order.savedList')}
                  </g-btn>
            }
          </>)() }
        </g-toolbar>
    ))
  }
}
</script>

<style scoped lang="scss">
.toolbar {
  .g-badge-wrapper .g-btn {
    margin-right: 0;
  }

  ::v-deep .g-toolbar-content {
    overflow: visible;

    & > .g-btn:first-child {
      margin-left: 0;
    }
  }

  .g-toolbar-background > div {
    box-shadow: inset -8px 0 8px -8px rgba(0, 0, 0, 0.25);
  }
}
</style>
