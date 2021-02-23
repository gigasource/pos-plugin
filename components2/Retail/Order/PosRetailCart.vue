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
      router.go(-1)
    }

    function toPayment() {
      router.push({ path: '/pos-payment' })
    }

    function generateRandomColor() {
      return '#' + Math.floor(Math.random() * 16777215).toString(16);
    }

    const showCtxMenu = ref(false)
    const showScreenSettingPanel = ref(false)

    function renderScreenSettingPanel() {
      function renderNumericPropSetting(title, prop) {
        const valueStyle = { width: '50px', fontSize: '12px', fontWeight: 'bold' }
        const propStyle = { fontSize: '12px' }
        return (
            <div class="row-flex align-items-center">
              <span style={propStyle}>{title}</span>
              <g-spacer/>
              <g-icon onClick={() => changeValue(prop, retailLayoutSetting[prop] - 1)}>remove_circle</g-icon>
              <span style={valueStyle}>{retailLayoutSetting[prop]}</span>
              <g-icon onClick={() => changeValue(prop, retailLayoutSetting[prop] + 1)}>add_circle</g-icon>
            </div>
        )
      }

      function renderBooleanPropSetting(title, prop) {
        const propStyle = { fontSize: '12px' }
        return (
            <div class="row-flex align-items-center">
              <span style={propStyle}>{title}</span>
              <g-spacer/>
              <g-switch v-model={retailLayoutSetting[prop]}></g-switch>
            </div>
        )
      }

      const sectionStyle = { marginTop: '10px', position: 'relative', border: '1px solid #444', paddingBottom: '10px' }
      const sectionTitleStyle = { paddingLeft: '5px', backgroundColor: '#ddd', marginBottom: '8px' }
      const propSectionStyle = { marginLeft: '5px' }

      return <>
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Product</div>
          <div style={propSectionStyle}>
            {renderNumericPropSetting('Rows', 'productRow')}
            {renderNumericPropSetting('Columns', 'productColumn')}
            {renderNumericPropSetting('Font size', 'productFontSize')}
            {renderBooleanPropSetting('Show full name', 'showFullProductName')}
          </div>
        </div>

        <div class="row-flex justify-end">
          <g-btn-bs width="100" small style="margin-top: 10px; margin-right:0" background-color="#1271FF"
                    onClick={() => {
                      saveRetailLayoutSetting()
                      showScreenSettingPanel.value = false
                    }}>Save
          </g-btn-bs>
        </div>
      </>
    }

    function increaseQty(order, item) {
      if (item.sent) return;
      changeItemQuantity(order, item, 1)
    }

    function renderCartItems() {
      return (
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
                    <g-icon color="#1d1d26" onClick={() => removeItem(order, item)}>remove_circle_outline</g-icon>
                    <div class="ta-center" style="width: 24px">{item.quantity}</div>
                    <g-icon color="#1d1d26" onClick={() => increaseQty(order, item)}>add_circle_outline</g-icon>
                  </div>
                </div>
            )}
          </div>
      )
    }

    function renderHeader() {
      return (
          <div class="detail-header">
            <g-menu v-model={showCtxMenu.value} close-on-content-click v-slots={{
              default: () => (
                  <g-expand-x-transition>{execGenScopeId(() =>
                      <div style="background-color: #FFF;">
                        <g-btn-bs icon="icon-blue-cog" onClick={() => {
                          loadRetailLayoutSetting()
                          showScreenSettingPanel.value = true
                        }}>Edit Screen
                        </g-btn-bs>
                      </div>
                  )}</g-expand-x-transition>
              ),
              activator: ({ on }) => (
                  <div onClick={on.click}>
                    <g-avatar size="40">
                      <g-img src={avatar.value}></g-img>
                    </g-avatar>
                  </div>
              )
            }}>
            </g-menu>
            <span class="username">{username.value}</span>
            <g-spacer/>
            <g-btn-bs class="elevation-2" onClick={back} style={{ width: '36px', height: '36px', borderRadius: '50%' }}>
              <g-icon>icon-back</g-icon>
            </g-btn-bs>
            <g-btn-bs
                style="margin: 0" icon="icon-wallet" background-color="#1271FF"
                disabled={!(order.items && order.items.length)}
                onClick={toPayment}>
              {t('common.currency', storeLocale.value)}{total.value}
            </g-btn-bs>
          </div>
      )
    }

    return genScopeId(() => (
        <div class="detail">
          {renderHeader()}
          {showScreenSettingPanel.value ? renderScreenSettingPanel() : renderCartItems()}
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
