<script>
import { genScopeId } from '../../utils';
import { useI18n } from 'vue-i18n'
import { $filters } from '../../AppSharedStates'
import { lastPayment } from './temp-logic';

export default {
  name: 'PosOrderScreenInfoLeft',
  setup() {
    const { t } = useI18n()
    return genScopeId(() => (lastPayment.value > 0) && (
        <p class="info__left">
          {t('order.lastPay')}:
          <span>€{ $filters.formatCurrency(lastPayment.value) }</span>
        </p>
    ))
  }
}
</script>

<style scoped lang="scss">
.info__left {
  display: flex;
  padding: 16px;
  align-items: center;
  font-size: 13px;
  font-weight: 700;

  span {
    color: #1271ff;
    margin-left: 8px;
  }
}
</style>
