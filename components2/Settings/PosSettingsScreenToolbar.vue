<script>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n';
import { genScopeId } from '../utils';

export default {
  name: 'PosSettingsScreenToolbar',
  setup(props, { emit, slots }) {
    const { t } = useI18n()
    const router = useRouter()

    function back() {
      router.push({ path: '/pos-dashboard' })
    }

    return genScopeId(() =>
        <g-toolbar bottom area="toolbar" color="grey lighten 3" style="z-index: 204">
          <g-btn uppercase={false} background-color="white" text-color="#1d1d26" class="mr-2" onClick={back}>
            <g-icon class="mr-2" svg>
              icon-back
            </g-icon>
            {t('ui.back')}
          </g-btn>
          <g-spacer/>
          {slots.default && slots.default()}
        </g-toolbar>)
  }
}
</script>


<style scoped lang="scss">
@media screen and (max-width: 1023px) {
  .g-btn {
    ::v-deep .g-btn__content {
      font-size: 12px;
    }
  }
}
</style>
