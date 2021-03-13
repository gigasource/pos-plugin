<script>
import { onMounted, ref } from 'vue'
import { execGenScopeId, genScopeId } from '../../utils';
import { getInternalValue } from 'pos-vue-framework';
import { getCurrentOrder } from '../pos-logic-be';
import { useI18n } from 'vue-i18n'
import { isMobile, user, username } from '../../AppSharedStates';
import cms from 'cms'
import { changeUser } from '../pos-logic';

export default {
  name: 'PosOrderTransferUserDialog',
  props: {
    modelValue: false,
  },
  setup(props, context) {
    const { t } = useI18n()
    const order = getCurrentOrder()
    const users = ref([])
    const selectingUser = ref(null)
    const internalValue = getInternalValue(props, context)

    onMounted(async () => {
      const result = await cms.getModel('PosUser').find({}, { _id: true, username: true })
      users.value = result.filter(u => u.name !== username.value)
    })

    async function changeWaiter() {
      // TODO: @Huy: commit sync
      changeUser(order, selectingUser.value.name, order.vDate)
    }

    return genScopeId(() =>
        <g-dialog v-model={internalValue.value} fullscreen={isMobile.value}>
          {
            execGenScopeId(() => <div
                class="col-flex"
                style="padding: 20px 20px 40px 20px; background-color: #FFF; width: 100%; height: 100%;">
              <div class="mb-3"><b>{t('order.transferTable')}</b></div>
              <div class="mb-3">From "{username.value}" to:</div>
              <g-grid-select
                  style="max-width: 100%"
                  grid={false}
                  text-value="name"
                  return-object
                  items={users.value}
                  v-model={selectingUser.value}
                  v-slots={{
                    default: genScopeId(({ toggleSelect, item }) => <g-btn-bs
                        style="width: 30%" class="mb-3"
                        background-color="#efefef" border-color="#efefef" text-color="#000"
                        onClick={() => toggleSelect(item)}>
                      {item.name}
                    </g-btn-bs>),
                    selected: genScopeId(({ item }) => <g-btn-bs
                        style="width: 30%" class="mb-3"
                        background-color="#e0f1ff" border-color="#1976D2" text-color="#000">
                      <b>{item.name}</b>
                    </g-btn-bs>)
                  }}/>
              <g-spacer/>
              <div class="row-flex mt-3 justify-end">
                <g-btn-bs elevation="0" onClick={() => internalValue.value = false}>{t('back')}</g-btn-bs>
                <g-btn-bs elevation="0" background-color="#2979FF" text-color="#FFF" onClick={() => {
                  changeWaiter()
                  internalValue.value = false
                }}>{t('confirm')}</g-btn-bs>
              </div>
            </div>)
          }
        </g-dialog>
    )
  },
}
</script>
<style scoped lang="scss">
</style>
