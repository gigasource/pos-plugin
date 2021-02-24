<script>
import { computed, onActivated, onDeactivated, ref } from 'vue'
import { useRouter } from 'vue-router'
import dateRangePicker from '../../components/OnlineOrder/dateRangePicker';
import dialogTextFilter from '../pos-shared-components/dialogFilter/dialogTextFilter';
import _ from 'lodash';
import dayjs from 'dayjs'
import { $filters } from '../AppSharedStates';
import { useI18n } from 'vue-i18n'
import { genScopeId } from '../utils';
import { actionFilter, filteredInventoryActions, formatDate } from './inventory-ui-shared';
import { categories } from '../Product/product-logic'

export default {
  name: 'InventoryReport',
  components: { dateRangePicker, dialogTextFilter },
  setup() {
    const { t } = useI18n()
    const selectedCategory = ref(null)
    const searchText = ref('')
    const reportDialog = ref({
      text: false,
      detail: false
    })
    const menu = ref(false)
    const type = ref('all')
    const display = ref('list')
    const selectedItem = ref({
      name: '',
      unit: '',
      action: []
    })

    onActivated(async () => {
      actionFilter.value = Object.assign(actionFilter.value, {
        fromDate: dayjs().format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD')
      })
      selectedCategory.value = 'all'
    })

    onDeactivated(async () => {
      actionFilter.value = Object.assign(actionFilter.value, {
        fromDate: dayjs().format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD')
      })
      selectedCategory.value = 'all'
    })

    const sortedInventories = computed(() => {
      let sorted = _.cloneDeep(filteredInventoryActions.value)
      if (searchText.value) {
        sorted = _.filter(sorted, item => item.name && item.name.toLowerCase().includes(searchText.value.toLowerCase()))
      }
      if (type.value === 'add') {
        sorted = _.map(sorted, item => _.omit(item, 'remove'))
      } else if (type.value === 'remove') {
        sorted = _.map(sorted, item => _.omit(item, 'add'))
      }
      return sorted
    })

    const router = useRouter()
    const back = function () {
      router.go(-1)
    }

    const selectCategory = async function (category) {
      if (selectedCategory.value === category) {
        selectedCategory.value = null
      } else {
        selectedCategory.value = category
      }
      // TODO: impl
      // await loadData()
    }
    const changeFilter = function (range) {
      actionFilter.value = range
    }
    const selectItem = async function (item) {
      selectedItem.value = item
      reportDialog.value.detail = true
    }

    const renderLefColumn = () => {
      return (<div class="inventory-report__left">
            {/*search*/}
            <g-text-field-bs style="border-radius: 4px; background-color: #FFF; margin: 0; margin-bottom: 0.25rem; width: 100%;" v-model={searchText.value} clearable v-slots={{
              'append-inner': () => <g-icon onClick={() => reportDialog.value.text = true}>icon-keyboard</g-icon>
            }}/>

            {/*type: All|Add/Remove*/}
            <div class="mb-1">
              <g-menu v-model={menu.value} close-on-content-click nudge-bottom="4" v-slots={{
                default: genScopeId(() => <div class="type-menu">
                  <div class="type-menu-item" onClick={() => type.value = 'all'}>
                    <g-icon class="mr-2"> icon-inventory-report-all</g-icon>
                    {t('inventory.all')}
                  </div>
                  <div class="type-menu-item" onClick={() => type.value = 'add'}>
                    <g-icon size="16" class="ml-1 mr-2">icon-inventory-report-add</g-icon>
                    {t('inventory.add')}
                  </div>
                  <div class="type-menu-item" onClick={() => type.value = 'remove'}>
                    <g-icon size="16" class="ml-1 mr-2">icon-inventory-report-remove</g-icon>
                    {t('inventory.useRemove')}
                  </div>
                </div>),
                activator: ({ on }) => genScopeId(() => (
                    <div onClick={on.click} class="type">
                      <g-icon size={type.value === 'all' ? 24 : 16} class="mr-1">{`icon-inventory-report-${type.value}`}</g-icon>
                      {type.value === 'remove' ? t('inventory.useRemove') : t(`inventory.${type.value}`)}
                    </div>
                ))()
              }}>
              </g-menu>
            </div>

            {/*time*/}
            <date-range-picker class="mb-1" style="width: 100%; " from={actionFilter.value.fromDate} to={actionFilter.value.toDate} onSave={changeFilter}/>

            {/*category:*/}
            <g-select
                class="mb-1 inventory-report__left__category"
                text-field-component="GTextFieldBs"
                items={categories.value}
                v-model={selectedCategory.value}
                item-text="name"
                return-object
            ></g-select>

            {/*reason*/}
            <g-btn-bs block style="margin: 0" class="elevation-1" background-color="white" icon="icon-back" onClick={back}>{t('ui.back')}</g-btn-bs>
          </div>
      )
    }


    const renderMainContent = () => {
      const thStyle = {'border-bottom': '1px solid #E0E0E0'}
      const qtyStyle = { width: '80px' }
      return (
          <g-table striped fixed-header style="flex: 1">
            <thead>
            <tr style="font-size: 12px;">
              <th class="ta-left pl-2" style={thStyle}>Name</th>
              <th class="ta-right pr-2" style={[qtyStyle, thStyle]}>Unit</th>
              { (type.value === 'all' || type.value === 'add') && <th class="ta-right pr-2" style={[qtyStyle, thStyle]}>Added</th> }
              { (type.value === 'all' || type.value === 'remove') && <th class="ta-right pr-2" style={[qtyStyle, thStyle]}>Removed</th> }
            </tr>
            </thead>
            <tbody>
            { sortedInventories.value.map((inventory, i) =>
                <tr style="font-size: 12px" key={`list_${i}`} onClick={() => selectItem(inventory)}>
                  <td class="ta-left pl-2">{inventory.product.name}</td>
                  <td class="ta-right pr-2" style={qtyStyle}>{inventory.unit}</td>
                  { (type.value === 'all' || type.value === 'add') && <td class="ta-right pr-2" style={qtyStyle}>{$filters.formatCurrency(inventory.add)}</td> }
                  { (type.value === 'all' || type.value === 'remove') && <td class="ta-right pr-2" style={qtyStyle}>{$filters.formatCurrency(inventory.remove)}</td> }
                </tr>
            )}
            </tbody>
          </g-table>
      )
    }

    // const renderMain = () => (
    //     <div class="inventory-report__main">
    //       {renderMainHeader()}
    //       {renderMainContent()}
    //     </div>
    // )

    const renderSearchItemDialog = () => (
        <dialog-text-filter v-model={reportDialog.value.text} label="Search Item" onSubmit={val => {
          searchText.value = val
        }}/>)

    const renderDetail = () => (selectedItem.value) &&
        <g-dialog v-model={reportDialog.value.detail} width="479" overlay-color="rgb(107, 111, 130)" overlay-opacity="0.7">
          {genScopeId(() => <div class="dialog col-flex">
            <div class="dialog-header">
              <div class="dialog-header__title">
                <div class="fw-700 flex-grow-1">{selectedItem.value.name}</div>
                <div>Unit: ({selectedItem.value.unit})</div>
              </div>
              <div class="dialog-header__bar">
                <div class="col-4 pl-2">{t('inventory.date')}</div>
                <div class="col-2">{t('inventory.amount')}</div>
                <div class="col-6">{t('inventory.reason')}</div>
              </div>
            </div>
            <div style="border-radius: 4px; overflow: auto;">
              {selectedItem.value.action.map((item, i) =>
                  <div class="dialog-action-item" key={`action_${i}`}>
                    <div class="col-4 pl-2">{formatDate(item.date)}</div>
                    <div class="col-2">
                      <g-icon size="12" style="margin-bottom: 2px">{`icon-inventory-report-${item.type}`}</g-icon>
                      {$filters.formatCurrency(item.amount)}
                    </div>
                    <div class="col-6">{item.reason}</div>
                  </div>
              )}
            </div>
          </div>)()}
        </g-dialog>

    const renderInventoryStock = () => <>
      <div class="inventory-report">
        {renderLefColumn()}
        {renderMainContent()}
        {renderSearchItemDialog()}
        {renderDetail()}
      </div>
    </>

    return genScopeId(renderInventoryStock)
  }
}
</script>

<style scoped lang="scss">
.inventory-report {
  display: flex;
  height: 100%;
  overflow: hidden;

  &__left {
    flex: 0 0 200px;
    display: flex;
    flex-direction: column;
    padding: 6px;
    background-color: #E1E3EB;

    &__cateogry :deep {
      .bs-tf-wrapper {
        width: calc(100% - 10px);
        margin: 4px 5px 8px;
      }

      .bs-tf-inner-input-group {
        background-color: #FFF
      }
    }

    .category {
      flex: 1;
      margin-bottom: 8px;
      overflow: auto;

      &-item {
        background-color: white;
        border-radius: 2px;
        padding: 8px;
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 4px;

        &--selected {
          background-color: #1271FF;
          color: white;
        }
      }
    }
  }

  &__main {
    flex: 1;
    height: 100%;
    overflow: auto;

    &-header {
      display: flex;
      align-items: center;
      padding: 6px;
      background-color: #bdbdbd;
      position: sticky;
      top: -1px;

      .bs-tf-wrapper {
        flex: 2;
        margin: 0;
        background-color: white;
        border-radius: 4px;
      }

      .display-btn {
        display: flex;
        border-radius: 2px;
        margin-left: 4px;

        &-item {
          height: 38px;
          width: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: white;
        }

        &--selected {
          background-color: #E3F2FD;
        }
      }

      .date-range-picker {
        background-color: white;

        ::v-deep .value {
          height: 30px;
        }
      }
    }

    &-content {
      padding: 6px;
      overflow: auto;

      &--grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        grid-auto-rows: 1fr;
        grid-gap: 6px;
      }
    }
  }

  &-list-item {
    display: flex;
    align-items: center;
    height: 32px;
    padding: 8px;
    font-size: 13px;
    line-height: 16px;

    &:nth-child(2n+1) {
      background-color: white;
    }

    &:nth-child(2n+2) {
      background-color: #f2f2f2;
    }

    &__name {
      flex: 1;
    }

    &__unit, &__add, &__remove {
      flex: 0 0 12%;
      text-align: left;
    }

    &__add, &__remove {
      font-weight: 700;
    }
  }

  &-grid-item {
    padding: 8px;
    border-radius: 2px;
    font-size: 14px;
    display: flex;
    flex-direction: column;

    &:nth-child(8n+1),
    &:nth-child(8n+2),
    &:nth-child(8n+3),
    &:nth-child(8n+4) {
      background-color: #EFEFEF;
    }

    &:nth-child(8n+5),
    &:nth-child(8n+6),
    &:nth-child(8n+7),
    &:nth-child(8n+8) {
      background-color: #E3F2FD;
    }

    &__name {
      word-break: break-word;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    &__detail {
      display: flex;
      align-items: center;
      font-weight: 700;
    }

    &__add {
      color: #1271FF;
    }

    &__remove {
      color: #FF4452;
    }
  }
}

.type {
  background: white;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  text-transform: capitalize;
  font-size: 14px;

  &-menu {
    background-color: white;
    border-radius: 2px;

    &-item {
      display: flex;
      align-items: center;
      font-size: 14px;
      padding: 4px;
      border-bottom: 1px solid #e0e0e0;
    }
  }
}

.dialog {
  background-color: white;
  width: 100%;
  border-radius: 4px;

  &-header {
    position: sticky;
    top: -1px;
    background-color: white;

    &__title {
      display: flex;
      align-items: center;
      padding: 8px;
    }

    &__bar {
      display: flex;
      align-items: center;
      background-color: #EFEFEF;
      border-top: 0.4px solid #9E9E9E;
      border-bottom: 0.4px solid #9E9E9E;
      padding: 8px 0;
      font-size: 12px;
      font-weight: 700;
      color: #757575;
    }
  }

  &-action-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
    font-size: 14px;

    &:nth-child(2n+2) {
      background-color: #F8F8FB;
    }
  }
}
</style>
