<script>
import {Touch} from 'pos-vue-framework';

import {useRoute, useRouter} from 'vue-router'
import {autoLoadOrderLayoutSetting, editModeOL} from "./order-layout-setting-logic";
import {getRootStyle, renderOLSetting, init} from "./order-layout-setting-ui";
import {clearOrder, getCurrentOrder, overlay, prepareOrder, syncOrderChange} from "./pos-logic-be";
import {hooks} from './pos-logic'
import {orderRightSideItemsTable} from "./orderRightSideItemsTable";
import {orderRightSideHeader} from "./orderRightSideHeaderFactory";
import {genScopeId} from "../utils";
import {onActivated, onDeactivated} from "vue";
import dialogConfigOrderItem from "./Helper/dialogConfigOrderItem";
import {activeOrders} from "../AppSharedStates";
import { useI18n } from 'vue-i18n';

export default {
  name: "posOrder2",
  directives: {
    Touch
  },
  components: {dialogConfigOrderItem},
  props: {
    printedOrder: Object,
    isTakeAwayOrder: Boolean,
  },
  setup(props, {emit}) {
    const router = useRouter()
    init()
    onActivated(async () => {
      const route = useRoute()
      if (route.params.id) {
        let order = _.cloneDeep(_.find(activeOrders.value, {table: route.params.id}));
        if (!order) {
          order = await cms.getModel('Order').findOne({table: route.params.id, status: 'inProgress'})
        }
        if (!order) {
          prepareOrder({table: route.params.id, ...route.query.manual && {manual: true}})
        } else {
          prepareOrder(order)
        }
      }
    })

    /*onDeactivated(() => {
      clearOrder();
    })*/

    hooks.on('printOrder', function () {
      router.go(-1)
    })

    autoLoadOrderLayoutSetting();

    const root = (children) => <div class='order-detail' style={getRootStyle()}>{children}</div>

    const renderRightOverLay = () => <g-overlay modelValue={overlay.value} absolute opacity="0.7"
                                                color="rgba(255, 255, 255)"
                                                style="top: 54px"/>

    let {renderItemsTable} = orderRightSideItemsTable();
    //item list + edit menu
    const contentRender = () => {
      if (editModeOL.value) {
        return renderOLSetting();
      } else {
        return (<>
          {renderItemsTable()}
          {overlayRender()}
        </>)
      }
    }

    const {renderHeader, overlayRender} = orderRightSideHeader(props, {emit});
    const _render = genScopeId(() => (
        root(<>
          {renderHeader()}
          {contentRender()}
          {renderRightOverLay()}
        </>)
    ))
    const _order = getCurrentOrder();

    return {
      order: _order,
      _render
    }
  },
  render() {
    return this._render();
  }
}
</script>

<style scoped lang="scss">
.blur-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
}

.order-detail {
  padding: 0 8px;
  background: white;
  color: #1d1d26;
  border-left: 1px solid #e0e0e0;
  // box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  position: relative;

  &__header {
    display: flex;
    align-items: center;
    padding: 8px 0;

    &-username {
      font-weight: 700;
      font-size: 13px;
      flex-grow: 1;
      line-height: 16px;
      max-width: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

    }

    &-title {
      opacity: 0.5;
      font-size: 11px;
      font-weight: 600;
      margin-right: 4px;
    }

    &-value {
      font-size: 16px;
      font-weight: 600;
      margin-left: 2px;
    }

    .g-btn-bs {
      margin: 0;
    }

    .btn-back {
      & > .g-icon {
        min-width: 24px;
      }
    }
  }

  &__content {
    border-radius: 8px;
    border: 1px solid #e8e8e8;
    overflow: scroll;
    margin-bottom: 3px;
    flex: 1;

    .item {
      padding: 8px;

      &:nth-child(even) {
        background-color: #f8f8f8;
      }

      &-detail {
        display: flex;
        justify-content: space-between;

        &__name {
          font-weight: 700;
          font-size: 14px;
        }

        &__price {
          font-size: 12px;
          color: #616161;
          margin-right: 4px;

          &--new {
            font-size: 14px;
            color: #ff5252;
            margin-right: 4px;
          }
        }

        &__discount {
          text-decoration: line-through;
        }

        &__option {
          font-size: 12px;
          font-style: italic;
          font-weight: 700;
        }
      }

      &-action {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-basis: 25%;

        .g-icon {
          cursor: pointer;
          color: #1d1d26;
          -webkit-tap-highlight-color: transparent;
        }
      }
    }
  }

  &__menu {
    background-color: white;
    display: flex;
    flex-direction: column;

    .g-btn-bs {
      justify-content: flex-start;
    }
  }

  &__setting {
    flex: 1;
    overflow: auto;
    font-size: 14px;

    ::v-deep .g-checkbox-wrapper {
      margin: 4px 0;

      .g-checkbox-label {
        font-size: 14px
      }
    }
  }

  .animation-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    perspective: 1000px;
    backface-visibility: hidden;
    width: 100%;
    height: 100%;
    padding: 4px;
  }

  .front {
    &-enter-active,
    &-leave-active {
      transition-property: opacity, transform;
      transition-duration: 0.6s;
    }

    &-leave-active {
      position: absolute;
    }

    &-enter, &-leave-to {
      transform: rotateY(180deg);
      opacity: 0;
    }
  }

  .back {
    &-enter-active,
    &-leave-active {
      transition-property: opacity, transform;
      transition-duration: 0.6s;
    }

    &-leave-active {
      position: absolute;
    }

    &-enter, &-leave-to {
      transform: rotateY(-180deg);
      opacity: 0;
    }
  }

  .fade {
    &-enter-active,
    &-leave-active {
      transition-property: opacity;
      transition-duration: 0.36s;
    }

    &-leave-active {
      position: absolute;
    }

    &-enter, &-leave-to {
      opacity: 0;
    }
  }
}

@media screen and (max-width: 700px) {
  .order-detail__header {
    padding: 4px 0;

    .g-avatar {
      width: 28px !important;
      height: 28px !important;
      min-width: 28px !important;
    }

    &-username {
      font-size: 11px;
    }

    .btn-back {
      width: 28px;
      height: 28px;

      & > .g-icon {
        width: 16px !important;
        height: 16px !important;
        min-width: 16px !important;
      }
    }

    &-title {
      font-size: 9px;
    }

    &-value {
      font-size: 14px;
    }
  }
}
</style>
