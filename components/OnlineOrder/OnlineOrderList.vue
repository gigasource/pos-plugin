<script>
import { onlineOrderListFactory } from './online-order-list-render'
import {genScopeId} from '../utils';

export default {
  props: {
    status: String,
    onlineOrders: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const { renderOnlineOrderList } = onlineOrderListFactory(props)

    return genScopeId(() => <>
      {renderOnlineOrderList()}
    </>)
  }
}
</script>

<style scoped lang="scss">
.online-order-list {
  background-image: url('/plugins/pos-plugin/assets/out.png');
  width: 100%;
  height: 100%;
  padding: 16px 16px 24px 16px;

  &__title {
    font-size: 15px;
    font-weight: 700;
    text-transform: capitalize;
  }

  .g-select ::v-deep {
    .bs-tf-label {
      display: none;
    }

    .bs-tf-inner-input-group {
      padding: 0 0 0 8px;
    }

    .input {
      font-size: 14px;
      min-width: 85px;
      text-align: center;
    }
  }

  &__info {
    display: flex;
    align-items: center;
    margin-right: 16px;
    background-color: #fff;
    border: 1px solid #E0E0E0;
    border-radius: 4px;

    & > div:first-child {
      border-right: 1px solid #E0E0E0;
    }

    div {
      padding: 5px 8px;
    }
  }

  &__table {
    height: calc(100% - 40px);
    width: 100%;

    .g-table {
      th, td {
        height: auto;
        padding: 8px 4px;
        vertical-align: top;
        font-size: 14px;
        word-break: break-word;

        &:nth-child(1) {
          width: 6%;
        }

        &:nth-child(2),
        &:nth-child(3) {
          width: 21%;
        }

        &:nth-last-child(-n+6) {
          width: 10%;
        }

        // actions menu
        &:nth-last-child(1) {
          width: 40px;
        }
      }

      thead th {
        background: #EFEFEF;
        font-size: 12px;
        color: #757575;
        height: 38px;
      }

      tr:nth-child(even) {
        td {
          background: #F8F8FB;
        }
      }

      .completed {
        color: #4CAF50;
        text-transform: capitalize;
      }

      .declined {
        color: #FF5252;
        text-transform: capitalize;
      }
    }
  }

  ::v-deep .bs-tf-wrapper {
    margin: 8px 0;
    background-color: #FFF;
    width: 150px;

    .bs-tf-label {
      margin-bottom: 0;
    }
  }
}

@media screen and (max-width: 1023px) {
  .online-order-list {

    &__table {
      .g-table td {
        font-size: 12px;
      }
    }
  }
}

</style>
