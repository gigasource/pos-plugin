<script>
import { onMounted, withModifiers } from 'vue'
import { genScopeId } from '../../utils';
import { useRouter } from 'vue-router'

export default {
  name: 'PosOrderScreenToolbar',
  injectService: ['OrderStore:(savedOrders,getSavedOrders)'],
  setup() {
    const router = useRouter()

    async function openDialogSavedList() {
      await this.getSavedOrders()
      this.$getService('dialogSavedList:setActive')(true)
    }

    onMounted(async () => {
      // TODO
      await this.getSavedOrders()
    })

    async function back() {
      // TODO
      this.$getService('OrderStore:resetOrderData')()
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
              (savedOrders && savedOrders.length > 0) ?
                  <g-badge overlay color="#FF4452" v-slots={{
                    default: genScopeId(() => (
                        <g-btn uppercase={false} background-color="white" onClick={openDialogSavedList}>
                          <g-icon class="mr-2" svg>icon-folder</g-icon>
                          {t('order.savedList')}
                        </g-btn>
                    )),
                    badge: genScopeId(() => <span>{savedOrders.length}</span>),
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
