<script>
import { ref, withModifiers } from 'vue'
import { renderDisplayOrderItemsTable } from '../../pos-retail-shared-logic'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { getCurrentOrder } from '../../../OrderView/pos-logic-be'
import { execGenScopeId, genScopeId } from '../../../utils';
import { $filters, username } from '../../../AppSharedStates';
import dayjs from 'dayjs'
import { paymentAmountTendered, paymentChange, paymentTotal } from '../temp-logic';
import PosRetailPaymentKeyboard from './PosRetailPaymentKeyboard';

export default {
  name: 'PosRetailPayment',
  components: { PosRetailPaymentKeyboard },
  props: {},
  setup() {
    const { t } = useI18n()
    const order = getCurrentOrder()
    const inputValue = ref(null)

    const router = useRouter()
    const back = function () {
      router.go(-1)
    }
    const showMenu = ref(false)

    function renderRightHeader() {
      return (
          <div class="detail-header">
            <g-btn-bs class="elevation-2" onClick={back} style={{ width: '36px', height: '36px', borderRadius: '50%' }}>
              <g-icon>icon-back</g-icon>
            </g-btn-bs>
            <div>
              <p class="username">{username.value}</p>
              <p>{dayjs().format('MMM DD, YY - HH:MM')}</p>
            </div>
            <g-spacer/>
            <g-menu top nudge-top="5" v-model={showMenu.value} v-slots={{
              activator: ({ toggleContent }) => execGenScopeId(() => (
                  <g-btn-bs icon="icon-menu" onClick={toggleContent}>More</g-btn-bs>
              )),
              default: () => execGenScopeId(() => (
                  <div class="col-flex bg-white">
                    <div>TODO: define more items</div>
                    <g-btn-bs icon="icon-dinner_copy">More items</g-btn-bs>
                    <g-btn-bs icon="icon-promotion">Discount</g-btn-bs>
                  </div>
              ))
            }}>
            </g-menu>
          </div>
      )
    }

    function renderPaymentBalance() {
      const twoHead = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }

      const inputStyle = {
        border: '1px solid #c9c9c9',
        background: '#f0f0f0',
        borderRadius: '4px',
        padding: '8px',
      }

      return (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridColumnGap: '5px' }}>
            <div style={twoHead}>
              <p>{t('payment.balanceDue')}</p>
              <p>{t('payment.amountTendered')}</p>
            </div>
            <div>{t('payment.change')}</div>
            <div style={[twoHead, inputStyle]}>
              <p style="font-size: 16px; color: #1271ff;">€ {$filters.formatCurrency(paymentTotal.value)}</p>
              <p style="font-size: 16px;">€ {$filters.formatCurrency(paymentAmountTendered.value || 0)}</p>
            </div>
            <div style={[inputStyle]}>
              {t('common.currency')} {$filters.formatCurrency(paymentChange.value)}
            </div>
          </div>
      )
    }

    const listPayments = [
      { type: 'cash', icon: 'icon-cash' },
      { type: 'card', icon: 'icon-credit_card' },
    ]
    const selectedPayment = ref(null)
    const cashEditValue = ref('')
    const cardEditValue = ref('')

    function addPaymentMethod(item) {
      selectedPayment.value = item.type
    }

    function renderPaymentMethods() {
      const paymentMethodBtn = {
        height: '60px !important',
        backgroundColor: 'white !important',
        borderColor: '#1271FF'
      }

      const paymentMethodBtnSelected = {
        backgroundColor: '#297aff !important'
      }

      return (
          <div class="row-flex mt-1">
            {listPayments.map(item => (
                <g-btn
                    outlined
                    elevation="0" uppercase={false} x-large
                    class="mr-1"
                    style={[paymentMethodBtn, selectedPayment.value === item.type && paymentMethodBtnSelected]}
                    textColor={selectedPayment.value === item.type ? '#fff' : '#1D1D26'}
                    onClick={withModifiers(() => addPaymentMethod(item), ['stop'])}>
                  {item.icon && <g-icon size="20">{item.icon}</g-icon>}
                  <span class="ml-2" style="text-transform: capitalize">
                    {t(`payment.${item.type}`)}
                  </span>
                </g-btn>
            ))}
          </div>
      )
    }

    return genScopeId(() => (
        <div class="row-flex" style="height: 100%">
          <div style="flex: 1">
            {renderDisplayOrderItemsTable(order, t)}
          </div>

          <div class="col-flex" style="flex: 1; padding: 5px">
            {renderRightHeader()}
            {renderPaymentBalance()}
            {renderPaymentMethods()}
            <g-spacer/>
            <pos-retail-payment-keyboard/>
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
