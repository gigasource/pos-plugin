import {editModeOL, saveOrderLayoutSetting, showSplitBtn} from "./order-layout-setting-logic";
import {avatar, isMobile, user, username} from "../AppSharedStates";
import {useI18n} from "vue-i18n";
import {actionList, clearOrder, disablePay, getCurrentOrder, hasOrderChange, payPrintMode} from "./pos-logic-be";
import {hooks, makeTakeaway, toggleTakeaway} from './pos-logic'
import {computed, ref, withModifiers} from "vue";
import {useRouter} from "vue-router";
import {orderViewDialog} from "./pos-ui-shared";
import {payPrintBtnFactory} from "./payPrintBtnFactory";
import {genScopeId} from "../utils";
import cms from 'cms';

export function orderRightSideHeader(props, {emit}) {
  let {t: $t, locale} = useI18n();
  const order = getCurrentOrder();
  const menu = ref(false);

  function splitOrder() {
    orderViewDialog['split'] = true;
  }

  function showVoucherDialog() {
    orderViewDialog['voucher'] = true;
  }

  hooks.on('printOrder', () => {
    menu.value = false;
    router.push({path: '/pos-dashboard'})
  });
  const printOrder = () => hooks.emit('printOrder');

  const router = useRouter()

  function back() {
    hooks.emit('resetOrderData');
    saveOrderLayoutSetting()
    router.go(-1)
  }

  //todo: fix
  function moveItems() {
    orderViewDialog['move'] = true;
  }

  function toggleTakeAwayOrder() {
    toggleTakeaway(order);
  }

  function pay() {
    router.push({path: '/pos-payment'})
  }

  const {renderPayBtn} = payPrintBtnFactory();

  const renderHeader = () => (
    <div class="order-detail__header">
      {isMobile.value && showSplitBtn.value && payPrintMode.value === 'pay' && <g-spacer style="flex: 4 0 0"/>}
      <g-btn-bs v-show={isMobile.value && showSplitBtn.value && payPrintMode.value === 'pay'} background-color="#FFCB3A"
                border-color="#f0f0f0" width="75"
                style="transition-delay: 0.6s; padding: 4px" onClick={splitOrder}>
        <g-icon>icon-split_check_2</g-icon>
      </g-btn-bs>

      <transition name="fade">
        {!(isMobile.value && showSplitBtn.value && payPrintMode.value === 'pay') &&
        <div class="row-flex align-items-center flex-grow-1">
          {isMobile.value ?
            <g-menu v-model={menu.value} close-on-content-click v-slots={{
              activator: ({on}) => (<div onClick={on.click} class="waves-effect br-100">
                <g-avatar size="36">
                  <img alt src={avatar.value}/>
                </g-avatar>
              </div>),

              default: () => <g-expand-x-transition>
                <div {...genScopeId()} class="order-detail__menu">
                  <g-btn-bs icon="icon-blue-cog" onClick={() => editModeOL.value = true}>Edit Screen</g-btn-bs>
                  <g-btn-bs icon="icon-voucher" onClick={showVoucherDialog}>{$t('order.voucher')}</g-btn-bs>
                  <g-btn-bs icon="icon-move-items" onClick={moveItems}>{$t('order.moveItem')}</g-btn-bs>

                  <g-btn-bs icon="icon-delivery" background-color={order.takeAway ? '#2979FF' : '#FFF'}
                            onClick={toggleTakeAwayOrder}>Take Away
                  </g-btn-bs>
                  <g-btn-bs icon="icon-split_check_2" onClick={splitOrder}>{$t('order.splitOrder')}</g-btn-bs>
                  {actionList.value.length > 0 && <g-btn-bs disabled={!hasOrderChange.value} icon="icon-print"
                                                            onClick={withModifiers(printOrder, ['stop'])}>
                    {$t('ui.print')}
                  </g-btn-bs>}
                  <g-btn-bs icon="icon-wallet"
                            disabled={disablePay.value} onClick={pay}>{$t('article.pay')}</g-btn-bs>
                </div>
              </g-expand-x-transition>
            }}>
            </g-menu>
            :
            <g-avatar size="36">
              <img alt src={avatar.value}/>
            </g-avatar>
          }
          <div style={{'display': isMobile.value ? 'block' : 'flex', 'flex': 2}} class="ml-1 align-items-baseline">
            <p class="order-detail__header-username">{username.value}</p>
            {order.table && <p style="line-height: 19px">
              <span class="order-detail__header-title">Table</span>
              <span class="order-detail__header-value">{order.table}</span>
            </p>}
          </div>
          {isMobile.value && <g-spacer/>}
          {isMobile.value && <g-btn-bs class="elevation-1 btn-back" onClick={back}>
            <g-icon>icon-back</g-icon>
          </g-btn-bs>}
        </div>}
      </transition>
      <g-spacer/>
      {renderPayBtn()}

    </div>
  )

  const overlayRender = () => <div class="blur-overlay" v-show={menu.value}/>

  return {
    renderHeader,
    overlayRender
  }
}
