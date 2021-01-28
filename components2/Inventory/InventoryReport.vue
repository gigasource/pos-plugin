<script>
import { ref, onActivated, computed, onDeactivated } from 'vue'
import { useRouter } from 'vue-router'
import dateRangePicker from '../../components/OnlineOrder/dateRangePicker';
import dialogTextFilter from '../../components/pos-shared-components/dialogFilter/dialogTextFilter';
import _ from 'lodash';
import dayjs from 'dayjs'
import { $filters } from '../AppSharedStates';
import { useI18n } from 'vue-i18n'
import {
  inventoryCategories
} from './inventory-logic-ui'
import {genScopeId} from '../utils';
import { formatDate, filteredInventoryHistories, historyFilter } from './inventory-ui-shared';

export default {
  name: "InventoryReport",
  components: {dateRangePicker, dialogTextFilter},
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
      history: []
    })

    onActivated(async () => {
      historyFilter.value = Object.assign(historyFilter.value, {
        fromDate: dayjs().format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD')
      })
      selectedCategory.value = 'all'
    })

    onDeactivated(async () => {
      historyFilter.value = Object.assign(historyFilter.value, {
        fromDate: dayjs().format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD')
      })
      selectedCategory.value = 'all'
    })

    const sortedInventories = computed(() => {
      let sorted = _.cloneDeep(filteredInventoryHistories.value)
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
      if(selectedCategory.value === category) {
        selectedCategory.value = null
      } else {
        selectedCategory.value = category
      }
      // TODO: impl
      // await loadData()
    }
    const changeFilter = function (range) {
      historyFilter.value = range
    }
    const selectItem = async function (item) {
      selectedItem.value = item
      reportDialog.value.detail = true
    }

    const renderLefColumn = () => {
      return (
          <div class="inventory-report__left">
            <div class="category">
              <div class={['category-item', selectedCategory.value === 'all' && 'category-item--selected']} onClick={() => selectCategory('all')}>
                ALL
              </div>
              {inventoryCategories.value.map(category =>
                  <div key={category._id} onClick={() => selectCategory(category)} class={['category-item', selectedCategory.value === category && 'category-item--selected']}>
                    {category.name}
                  </div>
              )}
            </div>
            <g-btn-bs block style="margin: 0" class="elevation-1" background-color="white" icon="icon-back" onClick={back}>{t('ui.back')}</g-btn-bs>
          </div>
      )
    }

    const renderMainHeader = () => (
        <div class="inventory-report__main-header">
          <g-text-field-bs v-model={searchText.value} clearable v-slots={{
            'append-inner': () => <g-icon onClick={() => reportDialog.value.text = true}>icon-keyboard</g-icon>
          }}>
          </g-text-field-bs>
          <g-menu v-model={menu.value} nudge-bottom="4" v-slots={{
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
          <div class="display-btn">
            <div style="border-radius: 2px 0 0 2px; border-right: 1px solid #E3F2FD"
                 class={['display-btn-item', display.value === 'list' && 'display-btn--selected']}
                 onClick={() => display.value = 'list'}>
              <g-icon size="20">icon-inventory-report-list</g-icon>
            </div>
            <div style="border-radius: 0 2px 2px 0"
                 class={['display-btn-item', display.value === 'grid' && 'display-btn--selected']}
                 onClick={() => display.value = 'grid'}>
              <g-icon size="20">icon-inventory-report-grid</g-icon>
            </div>
          </div>
          <g-spacer/>
          <date-range-picker from={historyFilter.value.fromDate} to={historyFilter.value.toDate} onSave={changeFilter}/>
        </div>
    )

    const renderMainContent = () => (
        <div class={['inventory-report__main-content', display.value === 'grid' && 'inventory-report__main-content--grid']}>
          {
            (display.value === 'list') && sortedInventories.value.map((inventory, i) =>
                <div class="inventory-report-list-item" key={`list_${i}`} onClick={() => selectItem(inventory)}>
                  <div class="inventory-report-list-item__name">{inventory.name}</div>
                  <div class="inventory-report-list-item__unit">{inventory.unit}</div>
                  <div class="inventory-report-list-item__add">
                    {(inventory.add || inventory.add === 0) && <g-icon size="12" style="margin-bottom: 2px">icon-inventory-report-add</g-icon>}
                    {$filters.formatCurrency(inventory.add)}
                  </div>
                  <div class="inventory-report-list-item__remove">
                    {(inventory.remove || inventory.remove === 0) && <g-icon size="14" class="mr-1">icon-inventory-report-remove</g-icon>}
                    {$filters.formatCurrency(inventory.remove)}
                  </div>
                </div>
            )
          }
          {
            (display.value === 'grid') && sortedInventories.value.map((inventory, i) =>
                <div class="inventory-report-grid-item" key={`grid_${i}`} onClick={() => selectItem(inventory)}>
                  <div class="inventory-report-grid-item__name">{inventory.name}</div>
                  <g-spacer/>
                  <div class="inventory-report-grid-item__detail">
                    <div class="inventory-report-grid-item__add">
                      {(inventory.add || inventory.add === 0) && <g-icon size="12" style="margin-bottom: 2px">icon-inventory-report-add</g-icon>}
                      {$filters.formatCurrency(inventory.add)}
                    </div>
                    <g-spacer/>
                    <div class="inventory-report-grid-item__remove">
                      {(inventory.remove || inventory.remove === 0) && <g-icon size="14" class="mr-1">icon-inventory-report-remove</g-icon>}
                      {$filters.formatCurrency(inventory.remove)}
                    </div>
                  </div>
                </div>
            )
          }
        </div>
    )

    const renderMain = () => (
        <div class="inventory-report__main">
          { renderMainHeader() }
          { renderMainContent() }
        </div>
    )

    const renderSearchItemDialog = () => (<dialog-text-filter v-model={reportDialog.value.text} label="Search Item" onSubmit={val => {searchText.value = val}}/>)

    const renderDetail = () => (selectedItem.value) && <g-dialog v-model={reportDialog.value.detail} width="479" overlay-color="rgb(107, 111, 130)" overlay-opacity="0.7" >
          {genScopeId(() =><div class="dialog col-flex">
            <div class="dialog-header">
              <div class="dialog-header__title">
                <div class="fw-700 flex-grow-1">{selectedItem.value.name}</div>
                <div>Unit: ({selectedItem.value.unit}) </div>
              </div>
              <div class="dialog-header__bar">
                <div class="col-4 pl-2" >{t('inventory.date')}</div>
                <div class="col-2">{t('inventory.amount')}</div>
                <div class="col-6">{t('inventory.reason')}</div>
              </div>
            </div>
            <div style="border-radius: 4px; overflow: auto;">
              {selectedItem.value.history.map((item, i)  =>
                  <div class="dialog-history-item" key={ `history_${i}` }>
                    <div class="col-4 pl-2" >{ formatDate(item.date) }</div>
                    <div class="col-2">
                      <g-icon size="12" style="margin-bottom: 2px">{`icon-inventory-report-${item.type}`}</g-icon>
                      { $filters.formatCurrency(item.amount) }
                    </div>
                    <div class="col-6">{item.reason}</div>
                  </div>
              )}
            </div>
          </div>)()}
        </g-dialog>

    const renderInventoryStock = () => <>
      <div class="inventory-report">
        { renderLefColumn() }
        { renderMain() }
        { renderSearchItemDialog() }
        { renderDetail() }
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
    margin-left: 4px;
    width: 130px;
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

    &-history-item {
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
