<script>
import { onBeforeMount } from 'vue'
import { renderPendingOrdersFactory } from "./online-order-main-pending-orders-render";
import { renderKitchenOrdersFactory } from "./online-order-main-kitchen-orders-render";
import {
  declineOrder,
  completeOrder,
  loadOrders
} from "./online-order-main-logic-be";
import {
  genScopeId
} from "../utils";

export default {
  setup(props, { emit }) {
    onBeforeMount(async () => {
      await loadOrders()
    })

    const {
      renderPendingOrders
    } = renderPendingOrdersFactory()
    const {
      renderKitchenOdrers
    } = renderKitchenOrdersFactory()

    return genScopeId(() => (
      <div class="main">
        {renderPendingOrders()}
        {renderKitchenOdrers()}
        <dialog-complete-order onCompleteorder={completeOrder} onDeclineorder={declineOrder}></dialog-complete-order>
        <dialog-text-filter label="Reason"></dialog-text-filter>
      </div>
    ))
  }
}
</script>

<style scoped lang="scss">
.main {
  background-image: url('/plugins/pos-plugin/assets/out.png');
  width: 100%;
  height: 100%;
  display: flex;
  padding: 16px;

  .g-card {
    border-radius: 4px;
    border: solid #9e9e9e 0.05em;
    margin-bottom: 6px;
    font-size: 14px;

    .g-btn-bs {
      border-radius: 2px;
    }

    .g-card-title {
      padding-bottom: 8px;
    }

    .g-card-text {
      padding: 0 16px 16px;
    }

    .g-card-actions {
      padding: 0 8px 16px;

      .g-btn-bs {
        text-transform: capitalize;
      }
    }
  }
}

.header {
  display: flex;
  flex-wrap: wrap;
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
}

.content {
  height: calc(100% - 34px);
  overflow: hidden scroll;

  &::-webkit-scrollbar {
    display: none;
  }
}

.pending-orders {
  width: 40%;
  height: 100%;
  overflow: hidden;

  &--empty {
    height: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: white;
    border: 0.5px solid #9E9E9E;
    border-radius: 4px;

    p {
      font-size: 12px;
      color: #9E9E9E;
      margin-top: 8px;
    }
  }

  &--forward-store {
    display: flex;
    justify-content: center !important;
    align-items: center !important;
    padding: 2px !important;
    margin: -8px 16px 12px;
    text-align: center;
    background-color: #E1F5FE;
    border-radius: 12px !important;
  }

  &--title {
    align-items: flex-start !important;
    flex-wrap: nowrap !important;
  }

  &--call {
    width: 100%;
    background-color: white;
    border: 1px solid #9e9e9e;
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 8px;

    &-title {
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: bold;
    }

    &-buttons {
      display: flex;
      align-items: center;
      margin-top: 4px;

      .g-btn-bs {
        margin: 0;
        padding: 18px;
      }
    }
  }
}

.kitchen-orders {
  width: 60%;

  &--empty {
    height: 30%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 0.5px solid #9E9E9E;
    border-radius: 4px;

    p {
      font-size: 12px;
      color: #9E9E9E;
      margin-top: 8px;
    }
  }

  &__timer {
    background: #EFEFEF;
    border: 1px solid #C4C4C4;
    border-radius: 2px;
    padding: 0 8px;
  }
}

.btn-clicked {
  background: #FFFFFF;
  border: 1px solid #536DFE !important;
  border-radius: 2px;
  color: #536DFE !important;
}

.options {
  background: #FFFFFF;
  border: 1px solid #D3D3D3;
  border-radius: 2px;

  .option {
    background-color: #FFF;
    font-size: 14px;
    line-height: 20px;
    padding: 12px 16px;
    text-align: left;
    user-select: none;
    cursor: pointer;
    color: #201F2B;

    &:hover {
      background-color: #EFEFEF;
    }
  }
}

.progress-remaining {
  color: #E57373;
  position: absolute;
  top: 3px;
  right: 3px;
  font-size: 15px;
  width: 32px;
  text-align: center;
}

@media screen and (max-width: 1023px) {
  .main {
    .g-card {
      .g-card-title {
        padding: 8px;
      }

      .g-card-text, .g-card-actions {
        padding: 0 8px 8px;

        & > .g-btn-bs {
          margin: 0 4px;
        }
      }
    }

    .pending-orders--empty > p {
      text-align: center;
    }

    .pending-orders--title {
      flex-wrap: wrap !important;
    }

    .pending-orders--btn-price {
      flex-direction: column;
      align-items: center;

      & > img {
        margin-right: 0 !important;
      }
    }

    .pending-orders--call-title {
      line-height: 1.2;

      div span {
        display: none;
      }
    }

    .pending-orders--call-buttons .g-btn-bs {
      padding: 4px;
    }
  }

}
</style>
