<script>
import { appHooks, posSettings } from '../../AppSharedStates';
import { computed, ref } from 'vue'
import { genScopeId, isSameId } from '../../utils';
import { useI18n } from 'vue-i18n';
import { getScopeAttrs } from '../../../utils/helpers';
import { selectedPayment, listPayments, onSelectPayment } from './view-payment-logics';

export default {
  components: {  },
  setup() {
    appHooks.emit('settingChange')
    const { t } = useI18n()
    const headerRender = genScopeId(() => <tr>
      <th>
        {t('settings.paymentName')} </th>
      <th>
        {t('settings.paymentIcon')} </th>
    </tr>)
    const paymentItemRender = (payment) => genScopeId(() =>
        <tr onClick={() => onSelectPayment(payment)} class={[selectedPayment.value && isSameId(selectedPayment.value, payment) && 'bordered']}>
          <td style="text-transform: capitalize">
            {payment.name} </td>
          <td>
            <img class="payment-icon" src={payment.icon}/>
          </td>
        </tr>)
    return genScopeId(() =>
        <div>
          <div {...getScopeAttrs()}>
            <g-simple-table striped {...getScopeAttrs()}>
              {headerRender()}
              {listPayments.value.map(payment => paymentItemRender(payment)())}
            </g-simple-table>
          </div>
        </div>)
  }
}
</script>

<style scoped lang="scss">
.g-table {
  tr th {
    color: #1d1d26;
    text-align: left;
  }

  th:first-child, td:first-child {
    width: 200px;
  }

  td {
    height: 32px
  }

  .payment-icon {
    width: 20px;
    height: 20px;
  }

  .bordered {
    box-shadow: 0 0 4px rgba(18, 113, 255, 0.563019);

    td {
      border-top: 2px solid #1271ff;
      border-bottom: 2px solid #1271ff;
    }

    td:first-child {
      border-left: 2px solid #1271ff;
    }

    td:last-child {
      border-right: 2px solid #1271ff;
    }
  }
}
</style>
