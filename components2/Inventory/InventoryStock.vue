<script>
import { ref, onActivated, onDeactivated } from 'vue'
import { useRouter } from 'vue-router'
import PosKeyboardFull from '../pos-shared-components/PosKeyboardFull';
import DialogChangeStock from './helpers/dialogChangeStock';
import cms from 'cms'
import _ from 'lodash';
import { useI18n } from 'vue-i18n'
import { updateInventory } from './inventory-logic-be';
import {
  detailInventories
} from './inventory-logic-ui'
import { genScopeId } from '../utils';
import { $filters } from '../AppSharedStates';
import {reason} from "./inventory-ui-shared";

export default {
  name: "InventoryStock",
  components: {PosKeyboardFull, DialogChangeStock},
  setup() {
    const { t } = useI18n()
    const items = ref([])
    const inventories = ref ([])
    const selectedItem = ref(null)
    const dialog = ref({
      inventory: false,
      low: false,
      add: false
    })
    const name = ref('')
    const itemId = ref('')
    const category = ref('')
    const unit = ref('')
    const stock = ref(0)
    const added = ref(0)
    const showKeyboard = ref(false)

    onActivated(async () => {
      inventories.value = detailInventories.value.map(item => ({
        ...item,
        text: item.product.name,
        category: item.product.category
      }))
      items.value = []
      selectedItem.value = null
      window.addEventListener('keydown', keyboardHandle, false)
    })

    onDeactivated(() => {
      window.removeEventListener('keydown', keyboardHandle, false)
    })

    const router = useRouter()
    const back = function () {
      router.go(-1)
    }
    const openDialog = function () {
      itemId.value = ''
      category.value = ''
      unit.value = ''
      stock.value = 0
      added.value = ''
      dialog.value.inventory = true
    }
    const changeStock = function () {
      if (isNaN(added.value))
        added.value = 0
      const item = inventories.value.find(item => item._id.toString() === itemId.value.toString())
      Object.assign(item, { added: added.value})
      items.value.push(item)
      dialog.value.inventory = false
    }
    const openDialogAdd = function (item) {
      if (item) {
        itemId.value = _.cloneDeep(item._id)
        name.value = _.cloneDeep(item.product.name)
        category.value = _.cloneDeep(getCategoryText(item.product.category))
        unit.value = _.cloneDeep(item.unit)
        stock.value = _.cloneDeep(+item.stock)
        added.value = _.cloneDeep(+item.added)
      }
      selectedItem.value = item
      dialog.value.add = true
    }
    const updateStock = function ({change}) {
      const item = items.value.find(item => item._id.toString() === itemId.value.toString())
      const index = items.value.findIndex(i => i._id === item._id)
      Object.assign(item, { added: +change })
      selectedItem.value = item
    }
    const chooseItem = function (_id) {
      const item = inventories.value.find(item => item._id.toString() === _id.toString())
      category.value = getCategoryText(item.product.category)
      unit.value = _.cloneDeep(item.unit)
      stock.value = item.stock && +(_.cloneDeep(item.stock)).toFixed(2)
      added.value = ''
    }
    const selectItem = function (item) {
      if (item && !items.value.find(i => i._id === item._id))
        items.value.push({
          ...item,
          added: 0
        })
      showKeyboard.value = false
    }
    const removeItem = function (index) {
      items.value.splice(index, 1)
    }
    const getLowStockItems = function (value) {
      const _items = inventories.value.filter(item => item.stock <= value && !items.value.find(i => i._id.toString() === item._id.toString())).map(item => ({
        ...item,
        added: 0
      }))
      items.value.push(..._items)
      dialog.value.low = false
    }
    const complete = async function () {
      const updateItems = items.value.filter(item => item.added).map(item => {
        const foundedItem = _.clone(detailInventories.value.find(inventory => inventory._id.toString() === item._id.toString()))
        foundedItem.stock += item.added
        return foundedItem
      })
      for (const item of updateItems) {
        await updateInventory(item, reason.UPDATE_BY_USER)
      }
      back()
    }
    function keyboardHandle(event) {
      event.stopPropagation()
      if(event.key === 'Tab' || event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault()
        if(items.value.length > 0) {
          if(!selectedItem.value) {
            selectedItem.value = items[0]
          } else {
            const index = items.value.findIndex(i => i._id === selectedItem.value._id)
            if(index === items.value.length - 1) {
              selectedItem.value = items.value[0]
            } else {
              selectedItem.value = items.value[index + 1]
            }
          }
        }
      }
      if(event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault()
        if(items.value.length > 0) {
          if(!selectedItem.value) {
            selectedItem.value = _.last(items)
          } else {
            const index = items.findIndex(i => i._id === selectedItem.value._id)
            if(index === 0) {
              selectedItem.value = _.last(items.value)
            } else {
              selectedItem.value = items.value[index - 1]
            }
          }
        }
      }
      if(event.key === 'Enter') {
        if(selectedItem.value) {
          openDialogAdd(selectedItem.value)
        }
      }
    }

    const getCategoryText = function (categoryList) {
      return categoryList.reduce((result, category) => {
        if (result.length) result += ', '
        result += category.name
        return result
      }, '')
    }

    return genScopeId(() => <>
      <div class="inventory-stock">
        <div class="inventory-stock__header">
          <g-autocomplete text-field-component="GTextFieldBs" onUpdate:modelValue={selectItem} clearable keep-menu-on-blur items={inventories.value} return-object menu-class="menu-inventory-stock" v-slots={{
            'append-inner': () => <g-icon onClick={() => showKeyboard.value = true}>icon-keyboard</g-icon>
          }}></g-autocomplete>
          <div class="inventory-stock__header-btn" onClick={() => openDialog()}>
            <g-icon color="white">add</g-icon>
          </div>
          <g-spacer/>
          <span class="fs-small">{t('inventory.products')}: </span>
          <span class="fs-large text-red ml-1">{items.value.length}</span>
        </div>
        <g-simple-table striped fixed-header style="flex: 1">
          {genScopeId(() => <>
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
            {items.value.map((inventory, i) =>
                <tr key={i} class={selectedItem.value && selectedItem.value._id === inventory._id && 'row--selected'}>
                  <td onClick={() => openDialogAdd(inventory)}> {inventory.id} </td>
                  <td onClick={() => openDialogAdd(inventory)}> {inventory.product.name} </td>
                  <td onClick={() => openDialogAdd(inventory)}> {getCategoryText(inventory.category)} </td>
                  <td onClick={() => openDialogAdd(inventory)}> {inventory.unit} </td>
                  <td onClick={() => openDialogAdd(inventory)}> {$filters.formatCurrency(inventory.stock)} </td>
                  <td class="fw-700 text-blue" onClick={() => openDialogAdd(inventory)}> {inventory.added} </td>
                  <td onClick={() => removeItem(i)}>
                    <g-icon color="red">cancel</g-icon>
                  </td>
                </tr>
            )}
          </>)()}
        </g-simple-table>
        <div>
          <g-toolbar color="#eeeeee">
            <g-btn uppercase={false} style="margin-right: 5px" onClick={back}>
              <g-icon small style="margin-right: 5px">icon-back</g-icon>
              {t('ui.back')}
            </g-btn>
            <g-btn uppercase={false} onClick={() => dialog.value.low = true}>{t('inventory.importLowStock')}</g-btn>
            <g-spacer/>
            <g-btn uppercase={false} background-color="#4CAF50" text-color="#FFF" onClick={complete}>
              <g-icon small style="margin-right: 5px">icon-inventory-new-stock</g-icon>
              {t('inventory.complete')}
            </g-btn>
          </g-toolbar>
        </div>
        <dialog-form-input v-model={dialog.value.inventory} onSubmit={changeStock} v-slots={{
          'input': () => (
              <div class="row-flex flex-wrap justify-around">
                <g-autocomplete text-field-component="GTextFieldBs"
                                v-model={itemId.value} style="width: 98%"
                                class="inventory-stock-select"
                                key={dialog.value.inventory}
                                items={inventories.value}
                                item-text="text" item-value="_id"
                                keep-menu-on-blur
                                menu-class="menu-select-inventory"
                                onUpdate:modelValue={chooseItem}/>
                <pos-textfield-new readonly style="width: 48%" v-model={category.value} label={t('article.category')}/>
                <pos-textfield-new readonly style="width: 48%" v-model={unit.value} label={t('inventory.unit')}/>
                <pos-textfield-new readonly style="width: 48%" v-model={stock.value} label={t('inventory.currentStock')}/>
                <pos-textfield-new rules={[val => !isNaN(val) || 'Must be a number!']} style="width: 48%" v-model={added.value} label={t('inventory.addedStock')}/>
              </div>
          )
        }}/>
        <dialog-number-filter v-model={dialog.value.low} label="Low-stock threshold" onSubmit={getLowStockItems}/>
        <dialog-change-stock v-model={dialog.value.add} removable={false} name={name.value} stock={stock.value} onSubmit={updateStock}/>
        {
          (showKeyboard.value) &&
          <div class="keyboard-wrapper">
            <pos-keyboard-full type="alpha-number"/>
          </div>
        }
      </div>
    </>)
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
