<script>
  import { updateView } from '../../OrderView/pos-ui-shared';
  import { PortalTarget } from 'portal-vue/dist/portal-vue.esm'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'

  import constants from './constants'

  export default {
    name: 'EditMenuCardToolbar2',
    components: { PortalTarget },
    props: {},
    setup() {
      const { t } = useI18n()
      const router = useRouter()
      function back() {
        router.push({ path: '/pos-dashboard' })
      }

      // TODO: Figure how to bring keyboardConfig, product edit mode (basic, ingredient) stuff to another file
      function renderToolbarButtons() {
        return <>
          <portal-target name={constants.portalLeftButtons}></portal-target>
          <g-spacer></g-spacer>
          <g-btn-bs elevation="2" icon="fas fa-calculator" onClick={updateView('KeyboardEditor')}>{t('restaurant.menuEdit.editKeyboard')}</g-btn-bs>
          <portal-target name={constants.portalRightButtons}></portal-target>
        </>
      }

      return () => <>
        <div style="height: 100%; width: 100%">
          <g-toolbar height="100%" elevation="0" color="#eee">
            <g-btn-bs elevation="2" icon="icon-back" onClick={back}>{t('ui.back')}</g-btn-bs>
            { renderToolbarButtons() }
          </g-toolbar>
        </div>
      </>
    }
  }
</script>
<style scoped lang="scss">
.g-toolbar {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
}

.g-btn-bs {
  background-color: white;
  font-size: 14px;
}

.delete_product_title {
  height: 25px;

  font-family: Muli;
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 25px;
  /* identical to box height */

  display: flex;
  align-items: center;
  text-align: center;

  color: #1D1D26;
}

.dialog {
  width: 100%;
  background-color: white;
  border-radius: 4px;
  padding: 20px;

  &-content {
    display: flex;
    margin-bottom: 16px;

    &__title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    &__detail {
      font-size: 13px;
    }
  }

  &-message {
    text-align: center;
    font-size: 12px;
    color: #9e9e9e;
  }
}

@media screen and (max-width: 1279px) {
  .g-btn-bs {
    font-size: 0;

    ::v-deep .g-icon {
      margin-right: 0 !important;
    }
  }
}
</style>

