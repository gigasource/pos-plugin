<script>
import { avatar, username, storeLocale } from '../../AppSharedStates';
import { useRouter } from 'vue-router'
import { genScopeId } from '../../utils';

export default {
  name: 'PosRetailOrder',
  props: {},
  setup() {
    const items = ref([
      { name: 'T-shirt', price: 12, quantity: 10 },
      { name: 'Dress', price: 12, quantity: 4, attributes: { size: 39, color: 'Yellow' } },
      { name: 'Hat', price: 12, quantity: 2 },
      { name: 'Shoes', price: 12, quantity: 2 },
      { name: 'Bag', price: 12, quantity: 3 },
    ])
    const total = ref(1234.50)
    const router = useRouter()

    function back() {
      router.push({ path: '/pos-dashboard' })
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
            <g-btn-bs style="margin: 0" icon="icon-wallet" background-color="#1271FF">{t('common.currency', storeLocale.value)}{total}</g-btn-bs>
          </div>
          <div class="detail-table">
            {items.value.map((item, i) =>
                <div key={i} class="detail-table__row">
                  <div class="detail-table__row-main">
                    <p class="fs-small fw-700">{item.name}</p>
                    <p>
                      <span class="detail-table__row-price">{t('common.currency', storeLocale.value)} {item.price}</span>
                      {item.attributes.map((attr, key) =>
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
