<script>
export default {
  setup() {
    return () => <>
      <div class="inventory-stock">
        <div class="inventory-stock__header">
          <g-autocomplete text-field-component="GTextFieldBs" onUpdate:modelValue={selectItem} clearable keep-menu-on-blur items={inventories} return-object menu-class="menu-inventory-stock" v-slots={{
            'append-inner': () => <>
              <g-icon onClick={() => showKeyboard = true}>
                icon-keyboard
              </g-icon>
            </>
          }}></g-autocomplete>
          <div class="inventory-stock__header-btn" onClick={() => openDialog()}>
            <g-icon color="white">
              add
            </g-icon>
          </div>
          <g-spacer>
          </g-spacer>
          <span class="fs-small">
            {t('inventory.products')}: </span>
          <span class="fs-large text-red ml-1">
            {items.length} </span>
        </div>
        <g-simple-table striped fixed-header style="flex: 1">
          <thead>
          <tr>
            <th>Product ID</th>
            <th>Name</th>
            <th> {t('article.category')} </th>
            <th> {t('inventory.unit')} </th>
            <th> {t('inventory.currentStock')} </th>
            <th> {t('inventory.addedStock')} </th>
            <th> </th>
          </tr>
          </thead>
          {items.map((inventory, i) =>
              <tr key={i} class={selectedItem && selectedItem._id === inventory._id && 'row--selected'}>
                <td onClick={() => openDialogAdd(inventory)}> {inventory.id} </td>
                <td onClick={() => openDialogAdd(inventory)}> {inventory.name} </td>
                <td onClick={() => openDialogAdd(inventory)}> {inventory.category.name} </td>
                <td onClick={() => openDialogAdd(inventory)}> {inventory.unit} </td>
                <td onClick={() => openDialogAdd(inventory)}> {$filters.formatCurrency(inventory.stock)} </td>
                <td class="fw-700 text-blue" onClick={() => openDialogAdd(inventory)}> {inventory.added} </td>
                <td onClick={() => removeItem(i)}>
                  <g-icon color="red">
                    cancel
                  </g-icon>
                </td>
              </tr>
          )}
        </g-simple-table>
        <div>
          <g-toolbar color="#eeeeee">
            <g-btn uppercase={false} style="margin-right: 5px" onClick={back}>
              <g-icon small style="margin-right: 5px">
                icon-back
              </g-icon>
              {t('ui.back')}
            </g-btn>
            <g-btn uppercase={false} onClick={() => dialog.low = true}>
              {t('inventory.importLowStock')}
            </g-btn>
            <g-spacer>
            </g-spacer>
            <g-btn uppercase={false} background-color="#4CAF50" text-color="#FFF" onClick={complete}>
              <g-icon small style="margin-right: 5px">
                icon-inventory-new-stock
              </g-icon>
              {t('inventory.complete')}
            </g-btn>
          </g-toolbar>
        </div>
        <dialog-form-input v-model={dialog.inventory} onSubmit={changeStock} v-slots={{
          'input': () => <>
            <div class="row-flex flex-wrap justify-around">
              <g-autocomplete text-field-component="GTextFieldBs" v-model={itemId} style="width: 98%" class="inventory-stock-select" key={dialog.inventory} items={inventories} item-text="name" item-value="_id" keep-menu-on-blur menu-class="menu-select-inventory" onUpdate:modelValue={chooseItem}>
              </g-autocomplete>
              <pos-textfield-new readonly style="width: 48%" v-model={category} label={$t('article.category')}>
              </pos-textfield-new>
              <pos-textfield-new readonly style="width: 48%" v-model={unit} label={$t('inventory.unit')}>
              </pos-textfield-new>
              <pos-textfield-new readonly style="width: 48%" v-model={stock} label={$t('inventory.currentStock')}>
              </pos-textfield-new>
              <pos-textfield-new rules={[val => !isNaN(val) || 'Must be a number!']} style="width: 48%" v-model={added} label={$t('inventory.addedStock')}>
              </pos-textfield-new>
            </div>
          </>
        }}></dialog-form-input>
        <dialog-number-filter v-model={dialog.low} label="Low-stock threshold" onSubmit={getLowStockItems}>
        </dialog-number-filter>
        <dialog-change-stock v-model={dialog.add} removeable={false} name={name} stock={stock} onSubmit={updateStock}>
        </dialog-change-stock>
        {
          (showKeyboard) &&
          <div class="keyboard-wrapper">
            <pos-keyboard-full type="alpha-number">
            </pos-keyboard-full>
          </div>
        }
      </div>
    </>
  }
}
</script>

<style scoped lang="scss">
.inventory-stock {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__header {
    padding: 8px 16px;
    background-color: #bdbdbd;
    display: flex;
    align-items: center;

    .g-autocomplete {
      flex: 1;

      ::v-deep .bs-tf-wrapper {
        margin: 0;
        width: 100%;
        background-color: white;
        border-radius: 4px;
      }
    }

    &-btn {
      margin-left: 4px;
      height: 100%;
      border-radius: 2px;
      background-color: #1271FF;
      flex: 0 0 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .g-table {
    height: calc(100% - 118px);

    ::v-deep table {
      table-layout: fixed;
    }

    thead tr th {
      font-size: 13px;
      color: #1d1d26;
      padding: 0 8px;
      background-color: #fff;
      cursor: pointer;
      text-align: left;
    }

    tr td {
      padding: 0 8px;
      font-size: 13px;
      line-height: 16px;
      height: 33px
    }


    tr {
      td:nth-child(1),
      th:nth-child(1) {
        width: 10%;
      }

      td:nth-child(2),
      th:nth-child(2) {
        width: 30%;
      }

      td:nth-child(3),
      th:nth-child(3) {
        width: 15%;
      }

      td:nth-child(4),
      th:nth-child(4) {
        width: 10%;
      }

      td:nth-child(5),
      th:nth-child(5) {
        width: 15%;
      }

      td:nth-child(6),
      th:nth-child(6) {
        width: 15%;
      }

      td:nth-child(7),
      th:nth-child(7) {
        width: 5%;
      }

      &.row--selected {
        td {
          border-top: 2px solid #1271FF;
          border-bottom: 2px solid #1271FF;
        }

        td:first-child {
          border-left: 2px solid #1271FF;
        }

        td:last-child {
          border-right: 2px solid #1271FF;
        }
      }
    }
  }

  .keyboard-wrapper {
    position: absolute;
    z-index: 2;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px;
    background-color: #BDBDBD;
  }
}
</style>

<style lang="scss">
.inventory-stock-select {
  .bs-tf-wrapper {
    margin: 16px 0 0;
    width: 100%;
  }
}

.menu-inventory-stock {
  .g-list .g-list-item__active {
    color: rgba(0, 0, 0, 0.87);

    &:before {
      display: none;
    }
  }
}

@media screen and (max-height: 599px) {
  .menu-inventory-stock {
    .g-list {
      .g-list-item {
        min-height: 0;
        padding: 4px;

        .g-list-item-content {
          margin: 0;

          .g-list-item-text {
            text-align: left;
          }
        }
      }
    }
  }
}
</style>
