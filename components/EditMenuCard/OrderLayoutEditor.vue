<script>
import { loadOrderLayout, orderLayout } from '../OrderView/pos-ui-shared';
import constants from './EditMenuCardToolbar/constants';
import { ref } from 'vue'
import orderLayoutApi from './orderLayoutApi';
import PosTextfieldNew from '../pos-shared-components/POSInput/PosTextfieldNew';
import dialogFormInput from '../pos-shared-components/dialogFormInput';
import { useI18n } from 'vue-i18n'
import { genScopeId } from '../utils';

export default {
  name: 'OrderLayoutEditor',
  components: {PosTextfieldNew, dialogFormInput},
  props: {},
  setup() {
    const { t } = useI18n()
    const column = ref(4)
    const row = ref(2)
    const showAddOrderLayoutDialog = ref(false)

    async function createLayout() {
      await orderLayoutApi.createOrderLayout(column.value, row.value)
      await loadOrderLayout()
      showAddOrderLayoutDialog.value = false
    }

    return genScopeId(() => <>
      <portal to={constants.portalLeftButtons}>
        {
          (!orderLayout.value) && <g-btn-bs
            text-color="#1271FF" elevation="2" icon="add_circle"
            onClick={showAddOrderLayoutDialog.value = true}>{t('ui.add')}</g-btn-bs>
        }
      </portal>
      <dialog-form-input v-model={showAddOrderLayoutDialog.value} onSubmit={createLayout} v-slots={{
        input: () => <>
          <div class="row-flex flex-wrap justify-around mt-2">
            <pos-textfield-new style="width: 48%" label="Column" v-model={column.value} clearable></pos-textfield-new>
            <pos-textfield-new style="width: 48%" label="Row" v-model={row.value} clearable></pos-textfield-new>
          </div>
        </>
      }}></dialog-form-input>
    </>)
  }
}
</script>
