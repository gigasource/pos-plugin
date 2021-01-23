<script>
export default {
  setup() {
    return () => <>
      <div style="height: 100%; display: flex; flex-direction: column">
        <g-simple-table striped fixed-header style="flex: 1">
          <thead>
          <tr>
            <th></th>
            <th>ID</th>
            <th>
              {t('article.name')}
              <g-icon size="12">
                mdi-filter
              </g-icon>
            </th>
            <th>
              {t('inventory.lastUpdate')} </th>
            <th>
              {t('article.category')}
              <g-icon size="12">
                mdi-magnify
              </g-icon>
            </th>
            <th>
              {t('inventory.unit')} </th>
            <th>
              {t('inventory.stock')} </th>
          </tr>
          </thead>
          <tr>
            <td class="bg-grey-lighten-1">
              {
                (inventories && inventories.length !== 0) ?
                    <g-checkbox v-model={selectedInventoryIDs} value={listIDs} multiple v-slots={{
                      'label': () => <>
                        <g-icon size="16" class="mb-1">
                          fas fa-caret-down
                        </g-icon>
                      </>
                    }}></g-checkbox>
                    :
                    <g-checkbox> </g-checkbox>
              }
            </td>
            <td colspan="6" class="filter-wrapper">
              <div class="filter">
                {t('settings.filter')}
                <div class="group-chip">
                  {inventoryFilters.map((filter, i) =>
                      <g-chip key={filter.title} label small background-color="white" close class="ma-1" onClose={() => removeFilter(filter)}>
                        <div>
                          <span class="chip-title"> {filter.title}: </span>
                          <span class="chip-content">{filter.text} </span>
                        </div>
                      </g-chip>
                  )} </div>
                {
                  (inventoryFilters && inventoryFilters.length > 0) &&
                  <g-btn-bs onClick={clearFilter}>
                    <u>
                      {t('settings.clearAll')} </u>
                  </g-btn-bs>
                }
                <g-spacer>
                </g-spacer>
                <div class="btn-add-filter" onClick={() => dialog.filter = true}>
                  + {t('inventory.addFilter')} </div>
              </div>
            </td>
          </tr>
          {inventories.map((inventory, i) =>
              <tr key={i}>
                <td>
                  <g-checkbox v-model={selectedInventoryIDs} value={inventory._id} onChange={getFirstSelectedInventory}>
                  </g-checkbox>
                </td>
                <td onClick={() => editInventory(inventory)}>
                  {inventory.id} </td>
                <td onClick={() => editInventory(inventory)}>
                  {inventory.name} </td>
                <td onClick={() => editInventory(inventory)}>
                  {formatDate(inventory.lastUpdateTimestamp)} </td>
                <td onClick={() => editInventory(inventory)}>
                  {inventory.category.name} </td>
                <td onClick={() => editInventory(inventory)}>
                  {inventory.unit} </td>
                <td onClick={() => openDialogStock(inventory)}>
                  <div class="row-flex justify-between">

                    {$filters.formatCurrency(inventory.stock)}
                    <g-icon size="18" color="#757575">
                      edit
                    </g-icon>
                  </div>
                </td>
              </tr>
          )} </g-simple-table>
        <div>
          <g-toolbar color="#eeeeee" elevation="0">
            <g-btn uppercase={false} style="margin-right: 5px" onClick={back}>
              <g-icon small style="margin-right: 5px">
                icon-back
              </g-icon>

              {t('ui.back')}
            </g-btn>
            <g-btn uppercase={false} onClick={goToReportPage}>
              <g-icon small style="margin-right: 5px">
                icon-inventory-report
              </g-icon>

              {t('inventory.report')}
            </g-btn>
            <g-spacer>
            </g-spacer>
            <g-btn uppercase={false} style="margin-right: 5px" onClick={goToStockPage}>
              <g-icon small style="margin-right: 5px">
                icon-inventory-new-stock
              </g-icon>

              {t('inventory.newStock')}
            </g-btn>
            <g-btn uppercase={false} style="margin-right: 5px" onClick={() => dialog.category = true}>
              <g-icon small style="margin-right: 5px">
                icon-inventory-category
              </g-icon>

              {t('article.category')}
            </g-btn>
            <g-btn disabled={selectedInventoryIDs.length === 0} uppercase={false} style="margin-right: 5px" onClick={removeInventory}>
              <g-icon small style="margin-right: 5px">
                icon-inventory-delete
              </g-icon>

              {t('ui.delete')}
            </g-btn>
            <g-btn disabled={selectedInventoryIDs.length === 0} uppercase={false} style="margin-right: 5px" onClick={() => openDialogInventory('edit')}>
              <g-icon small style="margin-right: 5px">
                icon-inventory-edit
              </g-icon>

              {t('ui.edit')}
            </g-btn>
            <g-btn uppercase={false} background-color="#4CAF50" text-color="#FFF" onClick={() => openDialogInventory('add')}>
              <span style="font-size: 14px !important">
                + {t('inventory.newProduct')} </span>
            </g-btn>
          </g-toolbar>
        </div>
        <dialog-form-input v-model={dialog.inventory} onSubmit={submitInventory} v-slots={{
          'input': () => <>
            <div class="row-flex flex-wrap justify-around" key={dialog.inventory}>
              <pos-textfield-new style="width: 48%" label="Name" v-model={name} required>
              </pos-textfield-new>
              <pos-textfield-new disabled={dialog.mode === 'edit'} rules={[val => !isNaN(val) || 'Must be a number!']} style="width: 48%" label={$t('inventory.stock')} v-model={stock} required>
              </pos-textfield-new>
              <g-select menu-class="menu-select-inventory" outlined style="width: 48%" label={$t('article.category')} items={inventoryCategories} item-text="name" item-value="_id" v-model={category} required>
              </g-select>
              <g-select menu-class="menu-select-inventory" outlined style="width: 48%" label={$t('inventory.unit')} items={units} v-model={unit} required>
              </g-select>
            </div>
          </>
          ,
        }}></dialog-form-input>
        <dialog-change-stock v-model={dialog.stock} name={selectedInventory && selectedInventory.name} stock={selectedInventory && selectedInventory.stock} onSubmit={updateStock}>
        </dialog-change-stock>
        <dialog-inventory-category v-model={dialog.category} onSubmit={loadData}>
        </dialog-inventory-category>
        <dialog-form-input v-model={dialog.filter} onSubmit={changeFilter} v-slots={{
          'input': () => <>
            <div class="row-flex flex-wrap justify-around mt-2">
              <pos-textfield-new style="width: 30%" label="Product ID" v-model={filter.id} clearable>
              </pos-textfield-new>
              <pos-textfield-new style="width: 30%" label="Name" v-model={filter.name} clearable>
              </pos-textfield-new>
              <g-select menu-class="menu-select-inventory" text-field-component="PosTextfieldNew" outlined style="width: 30%" label={$t('article.category')} clearable items={inventoryCategories} item-text="name" return-object v-model={filter.category}>
              </g-select>
              <div class="col-12 row-flex">
                <p style="margin-top: 35px; margin-left: 16px">
                  Stock Range: </p>
                <pos-range-slider min={0} max={1000} prefix v-model={filter.stock}>
                </pos-range-slider>
              </div>
            </div>
          </>
        }}></dialog-form-input>
      </div>
    </>
  }
}
</script>
<style scoped lang="scss">
.g-table {
  height: calc(100% - 64px);

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
    -webkit-tap-highlight-color: transparent;
  }

  tr td {
    padding: 0 8px;
    font-size: 13px;
    line-height: 16px;
    height: 33px
  }

  tr td:first-child,
  tr th:first-child {
    padding-right: 0;
  }

  tr {
    td:nth-child(1),
    th:nth-child(1) {
      width: 5%;
    }

    td:nth-child(2):not(.filter-wrapper),
    th:nth-child(2) {
      width: 10%;
    }

    td:nth-child(3),
    th:nth-child(3) {
      width: 30%;
    }

    td:nth-child(4),
    th:nth-child(4) {
      width: 15%;
    }

    td:nth-child(5),
    th:nth-child(5) {
      width: 15%;
    }

    td:nth-child(6),
    th:nth-child(6) {
      width: 10%;
    }

    td:nth-child(7),
    th:nth-child(7) {
      width: 10%;
    }
  }

  .sticky {
    td {
      position: sticky;
      z-index: 2;
      top: 48px;
    }
  }

  .filter-wrapper {
    background-color: #bdbdbd;
    height: 48px;

    .filter {
      color: #1d1d26;
      font-size: 13px;
      line-height: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;

      .group-chip {
        display: flex;
        flex-wrap: nowrap;
        overflow: auto;
        margin: 0 4px;

        &::-webkit-scrollbar {
          display: none;
        }

        ::v-deep .g-chip {
          overflow: visible;
        }

        .chip-title {
          color: #97A3B4;
          font-weight: 400;
          font-size: 11px;
        }

        .chip-content {
          color: #1D1D26;
          font-weight: 700;
          font-size: 12px;
        }
      }

      .btn-add-filter {
        border-radius: 4px;
        background-color: #2979ff;
        color: white;
        padding: 10px;
        cursor: pointer;
        font-size: 14px;
      }
    }
  }
}

.g-select ::v-deep .g-tf-wrapper {
  margin: 16px 0 4px;
  width: 100%;

  .g-tf-input--fake-caret span {
    color: rgba(0, 0, 0, 0.87)
  }

  fieldset {
    border-color: #C9C9C9;
    border-radius: 2px;
  }

  &.g-tf__focused fieldset {
    border-color: #1867c0;
  }

  .g-tf-label {
    font-weight: bold;
    color: #1D1D26;
  }

  .input {
    padding-left: 6px;
  }
}

@media screen and (max-height: 599px) {
  .g-table {
    thead tr th {
      height: 36px;
    }

    tr td {
      height: 28px;
    }

    .filter-wrapper {
      height: 36px;

      .filter {
        .btn-add-filter {
          padding: 4px 8px;
          font-size: 12px;
        }
      }
    }
  }
}

@media screen and (max-width: 1023px) {
  .g-toolbar {
    .g-btn ::v-deep .g-btn__content {
      font-size: 0;

      .g-icon {
        margin-right: 0 !important;
        font-size: 24px !important;
        width: 24px !important;
        height: 24px !important;
      }
    }
  }
}
</style>

<style lang="scss">
@media screen and (max-height: 599px) {
  .menu-select-inventory {
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
