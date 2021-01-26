<script>
import { internalValueFactory } from '../utils';
import orderUtil from '../../components/logic/orderUtil';
import { ref, computed, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n';
import { $filters } from '../AppSharedStates';

export default {
  props: {
    modelValue: Boolean,
    disableBtn: Boolean,
  },
  setup(props, { emit }) {
    const { t, locale } = useI18n()
    const order = ref(null)
    const dialog = internalValueFactory(props, { emit })
    const subTotal = computed(() => {
      return order.items.reduce((sum, item) => sum + orderUtil.getItemPrice(item) * item.quantity, 0)
    })
    const totalWithShipping = computed(() => {
      const { shippingFee, vSum } = order.value;
      return vSum + shippingFee
    })
    const orderQuantity = computed(() => {
      return order.value.items.reduce((acc, val) => acc + val.quantity, 0)
    })
    const paymentMethod = computed(() => {
      //todo: recheck this logic
      const { value, type } = order.value.payment[0];
      let payment = cms.getList('PosSetting')[0].payment.find(i => i.name === type)
      return Object.assign(payment || {}, { value, type })
    })

    function showDialog(_order) {
      if (_order) {
        order.value = _order
        dialog.value = true
      }
    }

    function getItemPrice(item) {
      return orderUtil.getItemPrice(item)
    }

    function getExtraInfo(item) {
      return orderUtil.getExtraInfo(item)
    }

    function getShippingFee() {
      const { discounts, shippingFee } = order.value
      if (!discounts) return shippingFee

      const freeShipping = discounts.find(item => item.type === 'freeShipping');
      return freeShipping ? freeShipping.value : shippingFee;
    }

    function declineOrder(order) {
      emit('declineOrder', order)
      dialog.value = false
    }

    function completeOrder(order) {
      emit('completeOrder', order)
      dialog.value = false
    }

    return () => <>
      {
        (order) &&
        <g-dialog v-model={dialog.value} width="580px">
          <g-card class="px-3 pb-2">
            <g-card-title style="font-size: 20px">
              {t('onlineOrder.orderDetails')} </g-card-title>
            <g-card-text class="fs-small">
              <div class="row-flex mb-2">
                <div style="flex: 0 0 30px">
                  {
                    (order.value.type === 'delivery') &&
                    <g-icon>
                      icon-delivery-scooter </g-icon>
                  }
                  {
                    (order.value.type === 'pickup') &&
                    <g-icon>
                      icon-take-away </g-icon>
                  }
                </div>
                <p>
                  <span class="text-indigo-accent-2 fw-600">
                    #{order.value.dailyId ? order.value.dailyId : order.value.id} </span>

                  {order.value.customer ? order.value.customer.name : 'No customer name'} - {order.value.customer ? order.value.customer.phone : 'No customer phone'}
                </p>
                <g-spacer></g-spacer>
                <span class="fw-700 fs-large">
                  {order.value.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} </span>
              </div>
              {
                (order.value.type === 'delivery') &&
                <div class="row-flex mb-2">
                  <div style="flex: 0 0 30px">
                    <g-icon color="#9E9E9E" size="20">
                      icon-place
                    </g-icon>
                  </div>
                  <div class="col-10">
                    {`${order.value.customer.address} ${order.value.customer.zipCode}`} </div>
                </div>
              }
              {
                (order.value.items) &&
                <div class="mb-2">
                  {order.value.items.map(item =>
                      <div class="row-flex">
                        <div class="fw-700" style="flex: 0 0 30px">
                          {item.quantity}x
                        </div>
                        <div class="flex-equal">

                          {item.name}
                          <span class="i text-grey">
                            {getExtraInfo(item)} </span>
                        </div>
                        <div class="col-2 fs-small-2 ta-right">
                          {t('common.currency', locale.value)} {$filters.formatCurrency(getItemPrice(item))} </div>
                      </div>
                  )} </div>
              }
              <div class="dashed-gradient"></div>
              <div class="row-flex justify-between mt-2">
                <div>
                  {t('onlineOrder.total')} <b>
                  {orderQuantity.value} </b>
                  {t('onlineOrder.items')} </div>
                <div class="ta-right">
                  {t('common.currency', locale.value)} {$filters.formatCurrency(subTotal.value)} </div>
              </div>
              {
                (order.type === 'delivery') &&
                <div class="row-flex justify-between">
                  <div>
                    {t('onlineOrder.shippingFee')}:
                  </div>
                  <div class="ta-right">
                    {t('common.currency', locale.value)} {$filters.formatCurrency(getShippingFee())} </div>
                </div>
              }
              {order.value.discounts.map(discount =>
                  <div class="row-flex justify-between">
                    <div>
                      <span>
                        {discount.coupon ? 'Coupon ' : discount.name} </span>
                      {
                        (discount.coupon) &&
                        <span style="color: #757575; font-style: italic">
                          ({discount.coupon}) </span>
                      }
                      :
                    </div>
                    <div class="ta-right">
                      -{t('common.currency', locale.value)}{$filters.formatCurrency(discount.value)} </div>
                  </div>
              )}
              <div class="dashed-gradient mt-2"></div>
              <div class="row-flex justify-between mt-2" style="font-size: 15px; font-weight: 700; font-family: Verdana, sans-serif">
                <div>
                  {t('onlineOrder.total')} </div>
                <div class="ta-right">
                  {t('common.currency', locale.value)} {$filters.formatCurrency(order.value.vSum)} </div>
              </div>
              <div class="row-flex justify-between mt-1" style="font-size: 15px; font-weight: 700; font-family: Verdana, sans-serif">
                <div>
                  Payment
                </div>
                <div class="ta-right row-flex align-items-center" style="text-transform: capitalize">
                  {
                    (paymentMethod.value.icon) &&
                    <img src={paymentMethod.value.icon} style="height: 16px" class="mr-1"> </img>
                  }
                  <span>
                    {paymentMethod.value.type} </span>
                </div>
              </div>
            </g-card-text>
            {
              (!props.disabledBtn) &&
              <g-card-actions>
                <g-btn-bs height="60" background-color="#E57373" text-color="white" class="flex-equal" onClick={withModifiers(() => declineOrder(order.value), ['stop'])}>
                  {t('onlineOrder.cancelOrder')} </g-btn-bs>
                <g-btn-bs height="60" background-color="#2979FF" text-color="white" class="flex-equal" onClick={withModifiers(() => completeOrder(order.value), ['stop'])}>
                  {t('onlineOrder.completeOrder')} </g-btn-bs>
              </g-card-actions>
            }
            {
              (order.value.forwardedStore) &&
              <g-card-actions class="forward-store">
                <b class="mr-1">
                  From: </b>
                {order.value.forwardedStore}
              </g-card-actions>
            }
          </g-card>
        </g-dialog>
      }
    </>


  }
}
</script>

<style scoped>
.dashed-gradient {
  height: 1px;
  width: 100%;
  background-image: linear-gradient(to right, #9E9E9E 50%, transparent 50%);
  background-size: 20px 1px;
}

.forward-store {
  display: flex;
  justify-content: center !important;
  align-items: center !important;
  padding: 2px !important;
  margin: 8px 16px 12px;
  text-align: center;
  background-color: #E1F5FE;
  border-radius: 12px !important;
}
</style>
