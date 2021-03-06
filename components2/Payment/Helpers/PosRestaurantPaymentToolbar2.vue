<script>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getCurrentOrder } from '../../OrderView/pos-logic-be';
import PaymentLogicsFactory from '../payment-logics';
import { useRouter } from 'vue-router';
import { posSettings } from '../../AppSharedStates';
import { GBtnBs, GProgressCircular, GSpacer, GToolbar } from 'pos-vue-framework';
import { genScopeId } from '../../utils';
import { hooks } from '../../OrderView/pos-logic';

export default {
  name: 'PosRestaurantPaymentToolbar2',
  components: { GToolbar, GBtnBs, GSpacer, GProgressCircular },
  setup(props, { emit }) {
    const { paidValue } = PaymentLogicsFactory()
    const { t } = useI18n()
    const processing = ref(false)
    const order = getCurrentOrder()
    const isPayBtnDisabled = computed(() => {
      if (!order.payment || processing.value) return true
      return paidValue.value < order.vSum
    })
    const router = useRouter()
    const back = function () {
      if (processing.value) return
      router.go(-1)
    }
    const pay = async function (isPayBtn) {
      let shouldPrint = true
      processing.value = true
      if (isPayBtn) {
        shouldPrint = posSettings.value && posSettings.value.printReceiptWithPay
        await hooks.emit('pay', shouldPrint);
      } else {
        await hooks.emit('pay', true);
      }

      processing.value = false
      if (!order.table) {
        router.go(-1);
      } else {
        router.push({ path: '/pos-dashboard' })
      }
    }
    const promotion = function () {
      if (processing.value) return
      emit('promotion')
    }
    return genScopeId(() =>
        <g-toolbar color="#eee" height="100%" elevation="0">
          {genScopeId(() => <>
            <g-btn-bs icon="icon-back" onClick={back}>
              {t('ui.back')} </g-btn-bs>
            <g-btn-bs icon="icon-promotion" onClick={promotion}>
              {t('fnBtn.paymentFunctions.promotion')} </g-btn-bs>
            <g-spacer>
            </g-spacer>
            <g-btn-bs icon="icon-print2" onClick={() => pay(false)} disabled={isPayBtnDisabled.value}>
              {t('fnBtn.paymentFunctions.bill')}
            </g-btn-bs>
            <g-btn-bs class="col-2" background-color="#2979FF" onClick={() => pay(true)}
                      disabled={isPayBtnDisabled.value}>
              {
                (processing.value) ?
                    <g-progress-circular indeterminate/>
                    : t('fnBtn.paymentFunctions.pay')
              }
            </g-btn-bs>
          </>)()}
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
