<script>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PosPaymentScreenKeyboard2 from './Helpers/PosPaymentScreenKeyboard2';
import PosPaymentScreenPaymentMethods2 from './Helpers/PosPaymentScreenPaymentMethods2';
import PosRestaurantPaymentOrderDetail2 from './Helpers/PosRestaurantPaymentOrderDetail2';
import PosRestaurantPaymentToolbar2 from './Helpers/PosRestaurantPaymentToolbar2';
import PaymentLogicsFactory from './payment-logics';
import { genScopeId } from '../../utils';
import { makeDiscount } from '../../OrderView/pos-logic';

export default {
  name: 'Payment',
  components: [PosPaymentScreenKeyboard2, PosPaymentScreenPaymentMethods2, PosRestaurantPaymentOrderDetail2, PosRestaurantPaymentToolbar2],
  setup() {
    const {t} = useI18n()
    const showDiscountMessage = ref(false)
    const discountDialog = ref(null)
    const { moreDiscount, currentOrder } = PaymentLogicsFactory()
    const discountCurrentOrder = function(discount) {
      console.log(discount)
      makeDiscount(currentOrder, discount)
    }
    const onOpenDiscountDialog = function() {
      if (moreDiscount.value) {
        console.log(currentOrder.items)
        const originalTotal = currentOrder.items.reduce((acc, item) => (acc + (item.discountResistance ? 0 : item.quantity * item.originalPrice)), 0);
        discountDialog.value.open(originalTotal, currentOrder.discount)
      } else {
        showDiscountMessage.value = true
        //todo: hide discount message
      }
    }


    //todo: add onDiscount and print event
    return genScopeId(() => <>
      <div class="payment">
        <div class="payment-main">
          <pos-payment-screen-payment-methods2>
          </pos-payment-screen-payment-methods2>
          <pos-payment-screen-keyboard2>
          </pos-payment-screen-keyboard2>
        </div>
        <pos-restaurant-payment-order-detail2>
        </pos-restaurant-payment-order-detail2>
        <pos-restaurant-payment-toolbar2 onPromotion={onOpenDiscountDialog}>
        </pos-restaurant-payment-toolbar2>
      </div>
      <g-snackbar v-model={showDiscountMessage.value} color="#FFC107" timeout="2000" top>
        <div style="color: #FF4552; display: flex; align-items: center">
          <g-icon color="#FF4552" style="margin-right: 8px">
            warning
          </g-icon>
          <span>
            {t('payment.alertDiscount')} </span>
        </div>
      </g-snackbar>
      <dialog-change-value ref={discountDialog} onSubmit={discountCurrentOrder}>
      </dialog-change-value>
    </>)
  }
}
</script>

<style scoped lang="scss">
.payment {
  height: 100%;
  display: grid;
  grid-template-columns: 70% 30%;
  grid-template-rows: calc(100% - 64px) 64px;

  .g-toolbar {
    grid-column: span 2;
  }

  &-main {
    display: grid;
    grid-template-columns: 100%;
    grid-template-rows: 40% 60%;
  }
}
</style>
