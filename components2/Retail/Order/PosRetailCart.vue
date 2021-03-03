<script>
import { computed, ref } from 'vue'
import { avatar, storeLocale, username } from '../../AppSharedStates';
import { useRouter } from 'vue-router'
import { execGenScopeId, genScopeId } from '../../utils'
import { useI18n } from 'vue-i18n'
import { getCurrentOrder } from '../../OrderView/pos-logic-be'
import { changeItemQuantity, removeItem } from '../../OrderView/pos-logic';
import {
  changeValue,
  loadRetailLayoutSetting,
  retailLayoutSetting,
  saveRetailLayoutSetting
} from './retail-layout-setting-logic';

export default {
  name: 'PosRetailCart',
  props: {
    isRefundMode: Boolean
  },
  setup(props) {
    const router = useRouter()
    const { isRefundMode } = props
    const { t } = useI18n()
    const order = getCurrentOrder()
    const total = computed(() => {
      return order.items.reduce((totalPrice, item) => {
        totalPrice += item.price * item.quantity
        return totalPrice
      }, 0)
    })
    const footerHeight = '36px'
    const cartHeightStyle = `max-height: calc(100% - ${footerHeight}); height: calc(100% - ${footerHeight})`

    function decreaseQty(item) {
      changeItemQuantity(order, item, -1)
    }
    function increaseQty(item) {
      if (isRefundMode && item.quantity === item.maxQuantity)
        return
      changeItemQuantity(order, item, 1)
    }
    function generateRandomColor() {
      return '#' + Math.floor(Math.random() * 16777215).toString(16);
    }
    function renderCartItems() {
      return (
          <div class="detail-table" style={cartHeightStyle}>
            {order.items.map((item, i) =>
                <div key={i} class="detail-table__row">
                  <div class="detail-table__row-main">
                    <p class="fs-small fw-700">{item.name}</p>
                    <p>
                      <span class="detail-table__row-price">{t('common.currency', storeLocale.value)} {item.price * item.quantity}</span>
                      {item.attributes && item.attributes.map((attr, key) =>
                          <span class="detail-table__row-attr" style={{ color: generateRandomColor() }} key={`${key}_${attr}_${i}`}>
                            {key}: {attr}
                          </span>
                      )} </p>
                  </div>
                  <div class="row-flex align-items-center">
                    <g-icon color="#1d1d26" onClick={() => decreaseQty(item)}>remove_circle_outline</g-icon>
                    <div class="ta-center" style="width: 24px">{item.quantity}</div>
                    <g-icon color="#1d1d26" onClick={() => increaseQty(item)}>add_circle_outline</g-icon>
                  </div>
                </div>
            )}
          </div>
      )
    }

    // TODO: re-use renderPayButton if possible
    const payable = computed(() => {
      return order.items && order.items.length && _.some(order.items, i => i.quantity > 0)
    })
    const showFooterCtxMenu = ref(false)
    function toPayment() {
      router.push({ path: '/pos-payment' })
    }
    function renderFooter() {
      return (
          <div class="row-flex mt-1" style={`cursor: pointer; height: ${footerHeight}; max-height: ${footerHeight}`}>
            <g-menu v-model={showFooterCtxMenu.value} close-on-content-click top v-slots={{
              default: () => (
                  <g-expand-x-transition>{execGenScopeId(() =>
                      <div style="background-color: #FFF;" class="col-flex">
                        <g-btn-bs icon="icon-blue-cog" onClick={() => {}}> Item A</g-btn-bs>
                        <g-btn-bs icon="icon-blue-cog" onClick={() => {}}> Item B</g-btn-bs>
                        <g-btn-bs icon="icon-blue-cog" onClick={() => {}}> Item C</g-btn-bs>
                        <g-btn-bs icon="icon-blue-cog" onClick={() => {}}> Item D</g-btn-bs>
                      </div>
                  )}</g-expand-x-transition>
              ),
              activator: ({ on }) => (
                  <div style="width: 40px; border: 2px solid #1271FF; border-radius: 4px;" class="row-flex justify-center align-items-center" onClick={on.click}>
                    <g-icon>icon-functions</g-icon>
                  </div>
              )
            }}/>
            <g-btn-bs
                style="flex: 1; margin-left: 5px; margin-right: 0" icon="icon-wallet" background-color="#1271FF"
                disabled={!payable.value}
                onClick={toPayment}>
              {t('common.currency', storeLocale.value)}{total.value}
            </g-btn-bs>
          </div>
      )
    }
    return genScopeId(() => (
        <div class="detail">
          {renderCartItems()}
          {renderFooter()}
        </div>
    ))
  }
}
</script>

<style scoped lang="scss">
.detail {
  background-color: white;
  display: flex;
  flex-direction: column;

  &-table {
    flex: 1;
    border: 1px solid #E8E8E8;
    border-radius: 6px;
    overflow: auto;
    scrollbar-width: none; // firefox
    -ms-overflow-style: none; //edge

    &::-webkit-scrollbar {
      display: none;
    }

    &__row {
      display: flex;
      padding: 8px;

      &-main {
        flex: 1
      }

      &-price {
        font-size: 13px;
        line-height: 16px;
        color: #FF5252;
      }

      &-attr {
        font-size: 12px;
        line-height: 15px;
        font-weight: 700;
        font-style: italic;
        text-transform: capitalize;
      }
    }

    & > div:nth-child(2n+2) {
      background-color: #f8f8f8;
    }
  }
}
</style>
