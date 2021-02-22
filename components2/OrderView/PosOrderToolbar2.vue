<script>
import {clearOrder, disablePay, disablePrint, getCurrentOrder, onlyCheckoutPrintedItems} from "./pos-logic-be";
import {useI18n} from "vue-i18n";
import {addPayment, clearPayment, getRestTotal, hooks, makeTakeaway} from "./pos-logic";
import {computed, onActivated, ref, withModifiers} from "vue";
import {useRoute, useRouter} from "vue-router";
import {orderViewDialog} from "./pos-ui-shared";
import {backFn, genScopeId} from "../utils";

export default {
  name: "PosOrderToolbar2",
  setup(props, {emit}) {
    const order = getCurrentOrder();
    const showMenu = ref(false);
    const {t} = useI18n();

    const disableMoveItemsBtn = computed(() => {
      return !order.items.length
    })

    const router = useRouter();

    function back() {
      //fixme
      clearOrder();
      router.push({path: '/pos-dashboard'})
    }

    function pay() {
      clearPayment(order);
      addPayment(order, {type: 'cash', value: getRestTotal(order)})
      router.push({path: '/pos-payment'})
    }

    function quickCash(isTakeout = false) {
      makeTakeaway(order);
      emit('quickCash')
    }

    function splitOrder() {
      orderViewDialog['split'] = true;
    }

    function print() {
      hooks.emit('printOrder');
    }

    function moveItems() {
      orderViewDialog['move'] = true;
    }

    function showVoucherDialog() {
      orderViewDialog['voucher'] = true;
    }

    function toggleTakeAwayOrder() {
      makeTakeaway(order, !(!!order.takeAway));
    }

    onActivated(async () => {
      //fixme: optimize performance
      const posSettings = await cms.getModel('PosSetting').findOne()

      if (posSettings && posSettings.generalSetting) {
        onlyCheckoutPrintedItems.value = posSettings.generalSetting.onlyCheckoutPrintedItems
      }
    })

    return genScopeId(() => (
        <g-toolbar elevation="0" color="#eee">
          <g-btn-bs icon="icon-back" onClick={back}>{t('ui.back')}</g-btn-bs>
          <g-menu top nudge-top="5" v-model={showMenu.value} v-slots={{
            activator: ({toggleContent}) => (
                <g-btn-bs icon="icon-menu" onClick={toggleContent}>{t('ui.more')}</g-btn-bs>
            ),
            default: () => (
                <div class="col-flex bg-white">
                  <g-btn-bs icon="icon-move-items" onClick={withModifiers(moveItems, ['stop'])}
                            disabled={disableMoveItemsBtn}>{t('order.moveItem')}</g-btn-bs>
                  <g-btn-bs icon="icon-voucher" onClick={showVoucherDialog}>{t('order.voucher')}</g-btn-bs>
                </div>
            )
          }}/>
          <g-btn-bs icon="icon-delivery" background-color={order.takeAway ? '#2979FF' : '#fff'}
                    onClick={toggleTakeAwayOrder}>Take Away
          </g-btn-bs>
          <g-spacer/>
          {order.table && <g-btn-bs background-color="#1271ff" text-color="#fff"
                                    disabled={disablePrint.value} icon="icon-print"
                                    onClick={print}>
            {t('ui.print')}
          </g-btn-bs>}

          {order.table ?
              <g-btn-bs disabled={disablePay.value} icon="icon-split_check_2" onClick={splitOrder}>
                {t('order.splitOrder')}
              </g-btn-bs> :
              <>
                <g-btn-bs class="col-2" background-color="#4CAF50" disabled={!disablePay.value}
                          onClick={() => quickCash(false)}>
                  {t('restaurant.cashAndDineIn')}
                </g-btn-bs>
                <g-btn-bs class="col-2" background-color="#4CAF50" disabled={!disablePay.value}
                          onClick={() => quickCash(true)}>
                  {t('restaurant.cashAndTakeAway')}
                </g-btn-bs>
              </>
          }

          <g-btn-bs class="col-2" icon="icon-pay" disabled={disablePay.value} onClick={pay}>
            {t('fnBtn.paymentFunctions.pay')}
          </g-btn-bs>
        </g-toolbar>
    ))
  }
}
</script>

<style scoped lang="scss">
.g-btn-bs {
  background-color: white;
  font-size: 14px;
}
</style>
