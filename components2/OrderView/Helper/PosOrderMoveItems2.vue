<script>
export default {
  setup() {
    return () =>
        <div>
          <g-dialog v-model="internalValue" transition={false} content-class="move-items-dialog">
            <div class="row-flex justify-end w-100">
              <div class="splitter" style={isMobile ? { height: 'calc(100% - 20px)' } : { height: 'calc(100% - 84px)' }}>
                <div class="splitter__header row-flex align-items-center">
                  {itemsToMove.length ?
                      <div>
                        <span class="mr-2" style="font-weight: 700; font-size: 15px">Items:</span>
                        <span style="font-weight: 600; font-size: 18px; color: #ff4452"> {itemsToMove.length} </span>
                      </div> : null}
                  <g-spacer/>
                  <g-btn-bs uppercase={false}
                            disabled={!itemsToMove.length}
                            icon="icon-move-items"
                            background-color="#1271ff"
                            onClick_stop="moveItems">
                    <span>Move Items</span>
                  </g-btn-bs>
                </div>
                <div class="splitter__content">
                  {itemsToMove.map(item =>
                      <div key={item._id.toString()} class="item">
                        <div class="item-detail" onClick_stop={returnItem(item)}>
                          <div>
                            <p style={[item.printed && { opacity: 0.55 }]} class="item-detail__name">
                              {item.id && `${item.id}. `}{item.name}</p>
                            <p>
                              <span class={['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']}>
                                {$t('common.currency', storeLocale)}{$filters.formatCurrency(item.originalPrice)}
                              </span>
                              {isItemDiscounted(item) ?
                                  <span class="item-detail__price--new">
                                    {$t('common.currency', storeLocale)}{$filters.formatCurrency(item.price)}
                                  </span> : null}
                              <span class={['item-detail__option', 'text-red-accent-2']}>{getItemSubtext(item)}
                              </span>
                            </p>
                          </div>
                          <div class="mr-2 fw-700 row-flex align-items-center" style="font-size: 18px">{item.quantity} </div>
                        </div>
                        {item.modifiers ?
                            <div>
                              {item.modifiers.map((modifier, index) =>
                                  <g-chip label small text-color="#616161" key={`${item._id}_${index}`}>
                                    {modifier.name} |
                                    {$t('common.currency', storeLocale)}{$filters.formatCurrency(modifier.price)}
                                  </g-chip>
                              )}
                            </div> : null}
                      </div>)}
                </div>
              </div>

              <g-icon class="mr-4 ml-4" size="40" color="#fff" style="height: calc(100% - 64px)">keyboard_backspace</g-icon>

              <div class="order-detail" style={isMobile ? { height: '100%' } : { height: 'calc(100% - 64px)' }}>
                <div class="order-detail__header row-flex align-items-center">
                  <div class="row-flex align-items-center">
                    <g-avatar size="36"><img alt src={avatar}/></g-avatar>
                    <div class="ml-1 fw-700" style="font-size: 13px">
                      <div> {username} </div>
                      <div>
                        <span style="font-weight: 600; font-size: 11px; color: #9e9e9e">Table</span>
                        <span class="ml-2" style="font-weight: 600; font-size: 13px">{currentOrder.table}</span>
                      </div>
                    </div>
                  </div>
                  {isMobile ? <g-spacer/> : null}
                  {isMobile ?
                      <g-btn-bs class="elevation-1 btn-back" onClick={back}>
                        <g-icon>icon-back</g-icon>
                      </g-btn-bs> : null}
                  <g-spacer/>
                </div>
                <div class="order-detail__content">
                  {itemsWithQty.map((item, i) =>
                      <div key={i} class="item"
                           onClick_stop="addToMoveItems(item)">
                        <div class="item-detail">
                          <div>
                            <p class="item-detail__name" style={[item.printed && { opacity: 0.55 }]}>
                              {item.id && `${item.id}. `}{item.name}</p>
                            <p>
                              <span class={['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']}>
                                {$filters.formatCurrency(item.originalPrice)}
                              </span>
                              {isItemDiscounted(item) ?
                                  <span class="item-detail__price--new">
                                    {$t('common.currency', storeLocale)}{$filters.formatCurrency(item.price)}
                                  </span> : null}
                              <span class={['item-detail__option', 'text-red-accent-2']}>
                                {getItemSubtext(item)}
                              </span>
                            </p>
                          </div>
                          <div class="mr-2 fw-700 row-flex align-items-center" style="font-size: 18px">{item.quantity}</div>
                        </div>
                        {item.modifiers ? <div>{item.modifiers.map((modifier, index) =>
                            <g-chip label small text-color="#616161" close onClose={removeModifier(item, index)} key={`${item._id}_${index}`}>
                              {modifier.name} |storeLocale
                              {$t('common.currency',)}{$filters.formatCurrency(modifier.price)}
                            </g-chip>
                        )} </div> : null}
                      </div>)}
                </div>
              </div>
            </div>
            {!isMobile ?
                <g-toolbar elevation="0" color="#eee" class="toolbar">
                  <g-btn-bs icon="icon-back" onClick_stop={back}> {$t('ui.back')} </g-btn-bs>
                  <g-spacer/>
                </g-toolbar> : null}
          </g-dialog>
          <choose-table-dialog table={currentTable} active-orders={activeOrders} v-model={showChooseTableDialog} onSubmit={submitTable}/>
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
