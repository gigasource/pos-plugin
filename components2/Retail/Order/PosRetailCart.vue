<script>
import { computed } from 'vue'
import { avatar, username, storeLocale } from '../../AppSharedStates';
import { useRouter } from 'vue-router'
import { genScopeId } from '../../utils'
import { useI18n } from 'vue-i18n'
import { getCurrentOrder } from '../../OrderView/pos-logic-be'

export default {
  name: 'PosRetailCart',
  props: {},
  setup() {
    const { t } = useI18n()
    const order = getCurrentOrder()
    const total = computed(() => {
      return order.items.reduce((totalPrice, item) => {
        totalPrice += item.price * item.quantity
        return totalPrice
      }, 0)
    })
    const router = useRouter()

    function back() {
      router.push({ path: '/pos-dashboard' })
    }

    function toPayment() {
      router.push({ path: '/pos-order-retail-payment' })
    }

    function generateRandomColor() {
      return '#' + Math.floor(Math.random() * 16777215).toString(16);
    }

    return genScopeId(() => (
        <div class="detail">
          <div class="detail-header">
            <g-avatar size="40">
              <g-img src={avatar.value}></g-img>
            </g-avatar>
            <span class="username">{username.value}</span>
            <g-spacer/>
            <g-btn-bs class="elevation-2" onClick={back}>
              <g-icon>icon-back</g-icon>
            </g-btn-bs>
            <g-btn-bs style="margin: 0" icon="icon-wallet" background-color="#1271FF" onClick={toPayment}>{t('common.currency', storeLocale.value)}{total.value}</g-btn-bs>
          </div>
          <div class="detail-table">
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
                    <g-icon color="#1d1d26">remove_circle_outline</g-icon>
                    <div class="ta-center" style="width: 24px">{item.quantity}</div>
                    <g-icon color="#1d1d26">add_circle_outline</g-icon>
                  </div>
                </div>
            )}
          </div>
        </div>
    ))
  }
}
</script>

<style scoped lang="scss">
.detail {
  padding: 8px 8px 8px 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  &-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    .username {
      word-break: break-all;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 14px;
      font-weight: 600;
      padding-left: 8px;
    }
  }

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
