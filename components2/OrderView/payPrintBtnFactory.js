import {smallSidebar} from "./order-layout-setting-logic";
import {$filters} from "../AppSharedStates";
import {useI18n} from "vue-i18n";
import {useRouter} from 'vue-router';
import {onActivated, ref, withModifiers, Transition} from "vue";
import {
  getCurrentOrder,
  onlyCheckoutPrintedItems,
  payBtnClickable,
  payPrintMode,
  quickBtnAction,
  showIcon,
  togglePayPrintBtn
} from "./pos-logic-be";

export function payPrintBtnFactory() {
  let {t: $t, locale} = useI18n();
  const showQuickBtn = ref(true);
  const order = getCurrentOrder();

  onActivated(async () => {
    //todo: optimize here because of slow
    //todo: need mock posSetting for test
    const posSettings = await cms.getModel('PosSetting').findOne();
    if (posSettings && posSettings.generalSetting) {
      showQuickBtn.value = posSettings.generalSetting.quickBtn;
      quickBtnAction.value = posSettings.generalSetting.quickBtnAction || 'pay';
      onlyCheckoutPrintedItems.value = posSettings.generalSetting.onlyCheckoutPrintedItems
    }
  })

  const router = useRouter();
  const _togglePayPrintBtn = () => {
    togglePayPrintBtn(() => router.push({path: '/pos-dashboard'}));
  }

  const renderPayBtn = () => {
    const btnAttrs = {
      width: 75,
      style: 'font-size: 14px; padding: 0; border: none',
      'text-color': "#FFF",
      'background-color': "#1271FF",
      disabled: !payBtnClickable.value,
      onClick: withModifiers(_togglePayPrintBtn, ['stop'])
    }
    const bigBtnAttrs = {
      width: '104',
      style: 'font-size: 14px; padding: 4px 0',
      'background-color': "#1271FF",
      disabled: !payBtnClickable.value,
      onClick: withModifiers(_togglePayPrintBtn, ['stop'])
    }

    if (showQuickBtn.value) {
      if (smallSidebar.value) {
        if (payPrintMode.value === 'print') {
          return <g-btn-bs {...btnAttrs}>
            <Transition name="front">
              {!showIcon.value && <div class="animation-wrapper">
                <span>{$t('common.currency', locale)} {$filters.formatCurrency(order.vSum)}</span>
              </div>}
            </Transition>
            <Transition name="back">
              {showIcon.value && <div class="animation-wrapper" style="background-color: #0EA76F">
                <g-icon>icon-print</g-icon>
              </div>}
            </Transition>
          </g-btn-bs>
        }
        return (
          <g-btn-bs {...btnAttrs}>
            <Transition name="front">
              {!showIcon.value && <div class="animation-wrapper">
                <span>{$t('common.currency', locale)} {$filters.formatCurrency(order.vSum)}</span>
              </div>}
            </Transition>
            <Transition name="back">
              {showIcon.value && <div class="animation-wrapper bg-pink">
                <g-icon>icon-wallet</g-icon>
              </div>}
            </Transition>
          </g-btn-bs>
        )
      }
      if (payPrintMode.value === 'print') {
        return <g-btn-bs {...bigBtnAttrs} icon="icon-print">
          <span>{$t('common.currency', locale)} {$filters.formatCurrency(order.vSum)}</span>
        </g-btn-bs>
      }
      return (
        <g-btn-bs {...bigBtnAttrs} icon="icon-wallet">
          <span>{$t('common.currency', locale)} {$filters.formatCurrency(order.vSum)}</span>
        </g-btn-bs>
      )
    }
    return <span class="order-detail__header-value text-red">{$t('common.currency', locale)}{$filters.formatCurrency(order.vSum)}</span>
  }

  return {
    renderPayBtn
  }
}
