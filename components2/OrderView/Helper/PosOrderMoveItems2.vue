<script>
import {genScopeId, internalValueFactory} from "../../utils";
import {
  assignTableToOrder2,
  cancelMoveItemsOrder,
  currentTable,
  getCurrentOrder,
  moveItemToSecondOrder,
  order2,
  prepareMoveItemsOrder,
  returnItem
} from "../pos-logic-be";
import {activeOrders, avatar, isMobile, username} from "../../AppSharedStates";
import {useI18n} from "vue-i18n";
import {itemsRenderFactory} from "../pos-ui-shared";
import {useRouter} from "vue-router";
import {ref, watch} from 'vue';
import ChooseTableDialog2 from "./ChooseTableDialog2";
import {hooks} from "../pos-logic";

//finish
export default {
  props: {
    modelValue: Boolean,
  },
  components: [ChooseTableDialog2],
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const internalValue = internalValueFactory(props, {emit});
    const order = getCurrentOrder();
    const {t, locale} = useI18n();
    const showChooseTableDialog = ref(false);

    //fixme: use from Duong's code

    function back() {
      cancelMoveItemsOrder();
      internalValue.value = false
    }

    function moveItems() {
      showChooseTableDialog.value = true
    }

    watch(() => internalValue.value, () => {
      if (internalValue.value) {
        prepareMoveItemsOrder();
      }
    })

    const router = useRouter();

    async function submitTable(table) {
      if (table) {
        await assignTableToOrder2(table);
        await hooks.emit('move-items');
        internalValue.value = false
      }
    }

    const itemsRender = itemsRenderFactory();


    const contentRender = genScopeId(() => (<>
      <div class="row-flex justify-end w-100">
        <div class="splitter" style={isMobile.value ? {height: 'calc(100% - 20px)'} : {height: 'calc(100% - 84px)'}}>
          <div class="splitter__header row-flex align-items-center">
            {order2.items.length &&
            <div>
              <span class="mr-2" style="font-weight: 700; font-size: 15px">{t('order.items')}:</span>
              <span style="font-weight: 600; font-size: 18px; color: #ff4452"> {order2.items.length} </span>
            </div>}
            <g-spacer/>
            <g-btn-bs uppercase={false}
                      disabled={!order2.items.length}
                      icon="icon-move-items"
                      background-color="#1271ff"
                      onClick={moveItems}>
              <span>{t('order.moveItem')}</span>
            </g-btn-bs>
          </div>
          <div class="splitter__content">
            {itemsRender(order2.items, returnItem)}
          </div>
        </div>

        <g-icon class="mr-4 ml-4" size="40" color="#fff" style="height: calc(100% - 64px)">keyboard_backspace
        </g-icon>

        <div class="order-detail" style={isMobile.value ? {height: '100%'} : {height: 'calc(100% - 64px)'}}>
          <div class="order-detail__header row-flex align-items-center">
            <div class="row-flex align-items-center">
              <g-avatar size="36"><img alt src={avatar.value}/></g-avatar>
              <div class="ml-1 fw-700" style="font-size: 13px">
                <div> {username.value} </div>
                <div>
                  <span style="font-weight: 600; font-size: 11px; color: #9e9e9e">Table</span>
                  <span class="ml-2" style="font-weight: 600; font-size: 13px">{order.table}</span>
                </div>
              </div>
            </div>
            {isMobile.value && <g-spacer/>}
            {isMobile.value &&
            <g-btn-bs class="elevation-1 btn-back" onClick={back}>
              <g-icon>icon-back</g-icon>
            </g-btn-bs>}
            <g-spacer/>
          </div>
          <div class="order-detail__content">
            {itemsRender(order.items, moveItemToSecondOrder)}
          </div>
        </div>
      </div>
      {!isMobile.value &&
      <g-toolbar elevation="0" color="#eee" class="toolbar">
        <g-btn-bs icon="icon-back" onClick_stop={back}> {t('ui.back')} </g-btn-bs>
        <g-spacer/>
      </g-toolbar>}
    </>));

    return () =>
        <div>
          <choose-table-dialog2 table={currentTable.value} active-orders={activeOrders.value}
                                v-model={showChooseTableDialog.value}
                                onSubmit={submitTable}/>
          <g-dialog v-model={internalValue.value} transition={false} content-class="move-items-dialog">
            {contentRender()}
          </g-dialog>
        </div>
  }
}
</script>

<style scoped lang="scss">
.splitter {
  background: #fff;
  flex-basis: 30%;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  margin: 10px 0;

  &__header {
    padding: 0 8px;
    position: relative;

    .g-btn-bs {
      margin: 0;
    }
  }

  &__content {
    border-radius: 8px;
    border: 1px solid #e8e8e8;
    overflow: scroll;
    flex-grow: 1;
    margin: 8px;
    position: relative;
  }

  &__actions {
    display: flex;
    flex-direction: row;
    align-items: center;

    &-btn {
      font-size: 16px;
      font-weight: 700;
    }
  }
}

.order-detail {
  background: #fff;
  flex-basis: 30%;
  padding: 0 8px;
  position: relative;

  &__header {
    padding: 8px 0;
    display: flex;
    align-items: center;

    .btn-back {
      width: 37px;
      height: 37px;
      border-radius: 50%;
      margin: 0;

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
  }
}

.item {
  padding: 8px;

  &:nth-child(even) {
    background-color: #f8f8f8;
  }

  &-detail {
    display: flex;
    justify-content: space-between;
    cursor: pointer;

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
}

.toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 64px;
}

.g-btn-bs {
  background-color: white;
  font-size: 14px;
}
</style>

<style lang="scss">
.move-items-dialog {
  height: 100% !important;
  max-height: 100% !important;
  width: 100% !important;
  max-width: 100% !important;
}

.splitter__actions-menu {
  display: flex;
  flex-direction: column;
  transform: translateX(25%);

  .g-btn-bs {
    margin: 0;
    font-weight: 700;
    font-size: 16px;
  }
}

.choose-table-dialog {
}
</style>
