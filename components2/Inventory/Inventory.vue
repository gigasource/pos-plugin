<script>
import { onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'
import PosRangeSlider from '../pos-shared-components/POSInput/PosRangeSlider'
import PosTextfieldNew from '../pos-shared-components/POSInput/PosTextfieldNew'
import dialogFormInput from '../pos-shared-components/dialogFormInput'
import dialogChangeStock from './helpers/dialogChangeStock'
import dialogInventoryCategory from './helpers/dialogInventoryCategory'
import dialogInventoryRetailCategory from './helpers/dialogInventoryRetailCategory'

import {
  renderInventoryDialog,
  renderChangeStockDialog,
  renderCategoryDialog,
  renderFilterDialog
} from './inventory-ui-shared'


import {
  loadInventories
} from './inventory-logic-be'

import {
  loadProducts,
  loadCategories
} from '../Product/product-logic-be';

import {
  renderMainInventoryTable
} from './inventory-table'
import { genScopeId } from '../utils';

export default {
  name: 'Inventory',
  components: {PosRangeSlider, PosTextfieldNew, dialogFormInput, dialogChangeStock, dialogInventoryCategory, dialogInventoryRetailCategory},
  setup(props, { emit }) {
    const { t } = useI18n();

    onBeforeMount(async () => {
      await loadCategories()
      await loadProducts()
      await loadInventories()
    })

    const {
      renderMainTable,
      renderToolBar
    } = renderMainInventoryTable(props, { emit })

    return genScopeId(() => <>
      <div style="height: 100%; display: flex; flex-direction: column">
        {renderMainTable()}
        {renderToolBar()}
        {renderInventoryDialog(t)}
        {renderChangeStockDialog()}
        {renderCategoryDialog()}
        {renderFilterDialog(t)}
      </div>
    </>)
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
