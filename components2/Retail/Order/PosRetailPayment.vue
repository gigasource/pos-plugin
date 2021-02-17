<script>
import { ref } from 'vue'
import {
  renderDisplayOrderItemsTable
} from '../pos-retail-shared-logic'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  getCurrentOrder
} from '../../OrderView/pos-logic-be'
import { genScopeId } from '../../utils';
import PosKeyboardFull from '../../../components/pos-shared-components/PosKeyboardFull';
import { avatar, username, storeLocale } from '../../AppSharedStates';
import dayjs from 'dayjs'

export default {
  name: 'PosRetailPayment',
  components: { PosKeyboardFull },
  props: {},
  setup() {
    const { t } = useI18n()
    const order = getCurrentOrder()
    const inputValue = ref(null)

    const keyboardTemplate = 'grid-template-areas: " key7 key7 key8 key8 key9 key9" ' +
        '"key4 key4 key5 key5 key6 key6" ' +
        '"key1 key1 key2 key2 key3 key3" ' +
        '"key0 key0 keyDot keyDot del del";' +
        'grid-auto-columns: 1fr; grid-gap: 5px'
    const keyboardItems = [
      ...Object.values({
        key7: { content: ['7'], style: 'grid-area: key7' },
        key8: { content: ['8'], style: 'grid-area: key8' },
        key9: { content: ['9'], style: 'grid-area: key9' },
        key4: { content: ['4'], style: 'grid-area: key4' },
        key5: { content: ['5'], style: 'grid-area: key5' },
        key6: { content: ['6'], style: 'grid-area: key6' },
        key1: { content: ['1'], style: 'grid-area: key1' },
        key2: { content: ['2'], style: 'grid-area: key2' },
        key3: { content: ['3'], style: 'grid-area: key3' },
        key0: { content: ['0'], style: 'grid-area: key0' },
        keyDot: { content: [','], style: 'grid-area: keyDot' },
      }),
      {
        content: [''],
        img: 'delivery/key_delete',
        style: 'grid-area: del; background-color: #e0e0e0',
        action: 'delete'
      }
    ]

    const router = useRouter()
    const back = function () {
      router.go(-1)
    }

    return genScopeId(() => (
      <div class="row-flex">
        <div style="flex: 1">
          {renderDisplayOrderItemsTable(order, t)}
        </div>
        <div class="column-flex" style="flex: 1">
          <div className="detail-header">
            <g-btn-bs className="elevation-2" onClick={back}>
              <g-icon>icon-back</g-icon>
            </g-btn-bs>
            <span className="username">{username.value}</span>
            <span>{dayjs().format('MMM DD, YY - HH:MM')}</span>
          </div>
          <div className="row-flex number-key-show ba-thin bg-grey-lighten-3">
            <div style="flex: 1">
              <div className="row-flex">
                <div>{t('something.balanceDue')}</div>
                <g-spacer/>
                <div>{t('something.amountTendered')}</div>
              </div>
              <input id="number_retail_key_output"
                     className="number-key-text col-12 self-center bg-transparent fs-large-2 fw-700 pl-2"
                     style="border: none; outline: none"
                     v-model={inputValue.value}/>
            </div>
          </div>
          <pos-keyboard-full template={keyboardTemplate} items={keyboardItems} v-model={inputValue.value}/>
        </div>
      </div>
    ))
  }
}

</script>

<style scoped lang="scss">
.detail {
  padding: 8px 8px 8px 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  &-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
}
</style>
