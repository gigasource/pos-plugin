<script>
import { ref, withModifiers, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getCurrentOrder } from '../../../OrderView/pos-logic-be';
import PaymentLogicsFactory from '../payment-logics';
import { useRoute } from 'vue-router';
import { posSettings } from '../../../AppSharedStates';
import { GBtnBs, GProgressCircular, GSpacer, GToolbar } from '../../../../../../backoffice/pos-vue-framework';
import { genScopeId } from '../../../utils';

export default {
  name: 'PosRestaurantPaymentToolbar2',
  components: [GToolbar, GBtnBs, GSpacer, GProgressCircular],
  setup(props, { emit}) {
    const { paidValue } = PaymentLogicsFactory()
    const { t } = useI18n()
    const processing = ref(false)
    const currentOrder = getCurrentOrder()
    const isPayBtnDisabled = computed(() => {
      if (!currentOrder.payment || processing) return true
      return paidValue.value < currentOrder.vSum
    })
    const router = useRoute()
    const back = function () {
      router.go(-1)
    }
    const pay = async function (isPayBtn) {
      let shouldPrint = true
      processing.value = true
      if (isPayBtn) {
        shouldPrint = posSettings.value && posSettings.value.printReceiptWithPay
      }
      emit('pay', null, false, shouldPrint, isPayBtn, () => {
        processing.value = false
        router.push({ path: '/pos-dashboard' })
      })
    }
    const promotion = function () {
      emit('promotion')
    }
    return genScopeId(() =>
        <g-toolbar color="#eee" height="100%" elevation="0">
          <g-btn-bs icon="icon-back" onClick={withModifiers(back, ['stop'])}>
            {t('ui.back')} </g-btn-bs>
          <g-btn-bs icon="icon-promotion" onClick={withModifiers(promotion, ['stop'])}>
            {t('fnBtn.paymentFunctions.promotion')} </g-btn-bs>
          <g-spacer>
          </g-spacer>
          <g-btn-bs icon="icon-print2" onClick={withModifiers(() => pay(false), ['stop'])} disabled={isPayBtnDisabled.value}>
            {t('fnBtn.paymentFunctions.bill')}
          </g-btn-bs>
          <g-btn-bs class="col-2" background-color="#2979FF" onClick={withModifiers(() => pay(true), ['stop'])} disabled={isPayBtnDisabled.value}>
            {
              (processing.value) ?
                  <g-progress-circular indeterminate>
                  </g-progress-circular>
                  : t('fnBtn.paymentFunctions.pay')
            }
          </g-btn-bs>
        </g-toolbar>)
  }
}
</script>

<style scoped lang="scss">
.g-btn-bs {
  background-color: white;
  font-size: 14px;
}
</style>
