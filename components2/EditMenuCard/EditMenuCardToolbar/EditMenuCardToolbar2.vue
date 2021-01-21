<script>
  import { updateView } from '../../OrderView/pos-ui-shared';
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'

  import constants from './constants'
  import { genScopeId } from '../../utils';

  export default {
    name: 'EditMenuCardToolbar2',
    components: { },
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
          <g-btn-bs elevation="2" icon="icon-back" onClick={back}>{t('ui.back')}</g-btn-bs>
          <portal-target name={constants.portalLeftButtons}></portal-target>
          <g-spacer></g-spacer>
          <portal-target name={constants.portalRightButtons}></portal-target>
          <g-btn-bs elevation="2" icon="fas fa-calculator" onClick={() => updateView('KeyboardEditor')}>{t('restaurant.menuEdit.editKeyboard')}</g-btn-bs>
        </>
      }

      return genScopeId(() => <>
        <div style="height: 100%; width: 100%">
          <g-toolbar height="100%" elevation="0" color="#eee">
            { genScopeId(renderToolbarButtons)() }
          </g-toolbar>
        </div>
      </>)
    }
  }
</script>
<style scoped lang="scss">
@import "emc-button";

.g-toolbar {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
}

/*TODO: Move to emc*/
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
</style>

