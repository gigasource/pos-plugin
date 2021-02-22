import { ref, watch, computed } from 'vue'
import { detailInventories, filter } from './inventory-logic-ui'
import { categories, categoriesWithParentName } from '../Product/product-logic'
import { createInventory, deleteInventory, loadInventoryActions, updateInventory } from './inventory-logic-be';
import dayjs from 'dayjs'
import { genScopeId } from '../utils';
import _ from 'lodash'
import { appType, currentAppType } from '../AppType';

/**
 * This variable control the state
 * of each dialog in Inventory view
 *
 * If any value is true, show dialog of
 * that key
 */
export const dialog = ref({
  mode: 'add',
  filter: false,
  inventory: false,
  stock: false,
  category: false
})

/**
 * Reference of selected inventory
 * in inventory dialog and in stock
 * dialog
 */
const createEmptyInventory = () => ({
  _id: null,
  id: null,
  product: {
    option: {},
    attributes: [],
    category: []
  },
  unit: null,
  stock: null
})

export const selectedInventory = ref(createEmptyInventory())

/**
 * Unit of inventory
 */
export const units = ref([
  'piece',
  'g',
  'kg',
  'ml',
  'l'
])

export const tax = ref([
  0, 7, 19
])

/**
 * Pagination to display a limit per page
 */
export const inventoryPagination = ref({ limit: 15, currentPage: 1 })

export const checkBoxSelectedInventoryIDs = ref([])

/**
 * @desc In create product dialog, press +New Attribute button to create new attribute for product
 * and press delete icon to delete atrtibute
 */
export function createAttribute() {
  !!selectedInventory.value.attributes && selectedInventory.value.attributes.push({
    name: '',
    description: ''
  })
}

export function removeAttribute(i) {
  !!selectedInventory.value.attributes && selectedInventory.value.attributes.splice(i, 1)
}

export function createComboItem() {
  !!selectedInventory.value.comboIngredient && selectedInventory.value.comboIngredient.push({
    item: null,
    quantity: null
  })
}

export function removeComboItem(i) {
  !!selectedInventory.value.comboIngredient && selectedInventory.value.comboIngredient.splice(i, 1)
}

export async function submitInventory() {
	if (!selectedInventory.value.product.name ||
		  !selectedInventory.value.product.category ||
      !selectedInventory.value.unit ||
      !selectedInventory.value.stock ||
      isNaN(selectedInventory.value.stock) /* Note that isNaN('12') === true */) {
    return
  }
  selectedInventory.value.stock = Number(selectedInventory.value.stock)
	const inventory = _.cloneDeep(selectedInventory.value)
  if (dialog.value.mode === 'add') {
    await createInventory(inventory)
  } else {
    await updateInventory(inventory)
  }
  dialog.value.inventory = false
}

export async function updateStock({ value, reason }) {
  await updateInventory({
    ...selectedInventory.value,
    stock: value
  }, reason)
}

export async function removeInventory() {
  await deleteInventory(selectedInventory.value)
}

export function renderInventoryDialog(t) {
  /**
   * @desc i18n value of attributes
   */
  const defaultAttrs = [
    { text: t('inventory.size'), val: 'size' },
    { text: t('inventory.color'), val: 'color' }
  ]

  const updateSelectedInventoryCategory = function (newValue) {
    if (!newValue) return
    if (newValue.length < selectedInventory.value.product.category.length) {
      selectedInventory.value.product.category = newValue
      return
    }
    const newAddedCategory = _.last(newValue)
    selectedInventory.value.product.category.push(newAddedCategory)
    if (newAddedCategory.parentCategory &&
        !selectedInventory.value.product.category.find(_category => {
          return newAddedCategory.parentCategory._id.toString() === _category._id.toString()
        }))
      selectedInventory.value.product.category.push(newAddedCategory.parentCategory)
  }

  const renderDialog = {
    [appType.POS_RESTAURANT]: () => (
        <div class="row-flex flex-wrap justify-around" key={dialog.value.inventory}>
          <pos-textfield-new style="width: 48%" label="Name" v-model={selectedInventory.value.product.name}/>
          <pos-textfield-new disabled={dialog.value.mode === 'edit'} rules={[val => !isNaN(val) || 'Must be a number!']}
                             style="width: 48%" label={t('inventory.stock')} v-model={selectedInventory.value.stock}/>
          <g-select menu-class="menu-select-inventory" outlined style="width: 48%" label={t('article.category')}
                    items={categories.value} item-text="name" return-object v-model={selectedInventory.value.product.category}/>
          <g-select menu-class="menu-select-inventory" outlined style="width: 48%" label={t('inventory.unit')}
                    items={units.value} v-model={selectedInventory.value.unit}/>
        </div>
    ),
    [appType.POS_RETAIL]: () => {
      const halfGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr' }
      const triGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }
      return (
          <div class="column-flex flex-wrap justify-around">
            <div>{t('inventory.createNewProduct')}</div>
            <div style={triGrid}>
              <g-text-field-bs style={{ gridArea: '1/1/2/3' }} label="Name" required v-model={selectedInventory.value.product.name}/>
              <div style={halfGrid}>
                <g-text-field-bs label="Product ID" v-model={selectedInventory.value.product.id}/>
                <g-text-field-bs
                    label={t('inventory.price')}
                    required
                    suffix='$'
                    rules={[val => !isNaN(val) || 'Must be a number!']}
                    v-model={selectedInventory.value.product.price}/>
              </div>

              <g-select
                  label={t('article.category')}
                  required
                  multiple
                  chips
                  deletableChips
                  style={{gridColumn:'span 3'}}
                  text-field-component="g-text-field-bs"
                  menu-class="menu-select-inventory" outlined
                  items={categoriesWithParentName.value} item-text="name" return-object
                  modelValue={selectedInventory.value.product.category}
                  onUpdate:modelValue={updateSelectedInventoryCategory}/>

              <div style={halfGrid}>
                <g-select
                    label={t('inventory.tax')}
                    menu-class="menu-select-inventory" text-field-component="g-text-field-bs" outlined
                    items={tax.value} v-model={selectedInventory.value.product.tax}/>
                <g-select
                    label={t('inventory.unit')}
                    menu-class="menu-select-inventory" text-field-component="g-text-field-bs" outlined
                    items={units.value} v-model={selectedInventory.value.unit}/>
              </div>

              <div style={halfGrid}>
                <g-text-field-bs
                    label={t('inventory.unitPrice')}
                    suffix='$'
                    rules={[val => !isNaN(val) || 'Must be a number!']}
                    v-model={selectedInventory.value.product.costPrice}/>
                <g-text-field-bs
                    disabled={dialog.value.mode === 'edit'} rules={[val => !isNaN(val) || 'Must be a number!']}
                    label={t('inventory.stock')} v-model={selectedInventory.value.stock}/>
              </div>

              <g-text-field-bs
                  label={t('inventory.barcode')}
                  append-inner-icon='mdi-barcode'
                  disabled={dialog.value.mode === 'edit'}
                  rules={[val => !isNaN(val) || 'Must be a number!']}
                  v-model={selectedInventory.value.product.barcode}/>
            </div>

            <div style={triGrid}>
              {/* switch */}
              <g-switch v-model={selectedInventory.value.product.option.favorite} label={t('inventory.isFavorite')}/>
					    <g-switch v-model={selectedInventory.value.product.isVoucher} label={t('inventory.isVoucher')}/>
              <g-switch v-model={selectedInventory.value.product.option.active} label={t('inventory.isActive')}/>
              <g-switch v-model={selectedInventory.value.product.option.nonRefundable} label={t('inventory.isRefundable')}/>
              <g-switch v-model={selectedInventory.value.product.option.showOnOrderScreen} label={t('inventory.showOnOrderScreen')}/>
              <g-switch v-model={selectedInventory.value.product.option.manualPrice} label={t('inventory.manualPrice')}/>
					    <g-switch v-model={selectedInventory.value.product.isCombo} label={t('inventory.comboIngredient')}/>
            </div>

            {/* attribute */}
            <div class="column-flex">
              <div>{t('inventory.attribute')}</div>
              {selectedInventory.value.product.attributes.map((attribute, i) => (
                  <div class="row-flex">
                    <g-select
                        menu-class="menu-select-inventory" outlined style="width: 10%" label={t('inventory.attributes')}
                        items={defaultAttrs} v-model={attribute.name} itemText="text" itemValue="val"/>
                    <g-text-field-bs
                        style="width: 15%" label={t('inventory.attributeDescription')}
                        v-model={attribute.description}/>
                    <div onClick={() => removeAttribute(i)}
                         class={['category-item__btn', 'category-item__btn--delete']}>
                      <g-icon>icon-delete2</g-icon>
                    </div>
                  </div>
              ))}
              <g-btn-bs icon="add" background-color="#1271FF" onClick={createAttribute}>{t('inventory.newAttribute')}</g-btn-bs>
            </div>
            {/* combo/ingredients */}
            {
              selectedInventory.value.product.isCombo &&
              <div class="column-flex">
                <div>{t('inventory.comboIngredient')}</div>
                <g-btn-bs icon="add" background-color="#1271FF" onClick={createAttribute}>{t('inventory.newAttribute')}</g-btn-bs>
              </div>
            }
          </div>
      )
    }
  }
  return <dialog-form-input v-model={dialog.value.inventory} onSubmit={submitInventory} v-slots={{
    input: genScopeId(renderDialog[currentAppType.value]),
  }}>
  </dialog-form-input>
}

export function renderChangeStockDialog() {
  return <dialog-change-stock v-model={dialog.value.stock}
                              name={selectedInventory.value && selectedInventory.value.name}
                              stock={selectedInventory.value && selectedInventory.value.stock}
                              onSubmit={updateStock}>
  </dialog-change-stock>
}

export function renderCategoryDialog() {
  const renderDialog = {
    [appType.POS_RESTAURANT]: () => (
        <dialog-inventory-category v-model={dialog.value.category}>
        </dialog-inventory-category>
    ),
    [appType.POS_RETAIL]: () => (
        <dialog-inventory-retail-category v-model={dialog.value.category}>
        </dialog-inventory-retail-category>
    )
  }
  return renderDialog[currentAppType.value]()
}

const temporaryDialogFilter = ref({})

function changeFilter() {
  filter.value = {
    ...filter.value,
    ..._.cloneDeep(temporaryDialogFilter.value)
  }
  temporaryDialogFilter.value = {}
  dialog.value.filter = false
}

watch(() => dialog.value.filter, () => {
  temporaryDialogFilter.value = _.cloneDeep(filter.value)
})

export function renderFilterDialog(t) {
  return <dialog-form-input data-jest-filter-dialog v-model={dialog.value.filter} onSubmit={changeFilter} v-slots={{
    input: genScopeId(() => <>
      <div class="row-flex flex-wrap justify-around mt-2">
        <pos-textfield-new style="width: 30%" label="Product ID" v-model={temporaryDialogFilter.value.id} clearable>
        </pos-textfield-new>
        <pos-textfield-new style="width: 30%" label="Name" v-model={temporaryDialogFilter.value.name} clearable>
        </pos-textfield-new>
        <g-select menu-class="menu-select-inventory" text-field-component="GTextFieldBs" outlined style="width: 30%"
                  label={t('article.category')} clearable items={categories.value} item-text="name"
                  return-object v-model={temporaryDialogFilter.value.category}>
        </g-select>
        <div class="col-12 row-flex">
          <p style="margin-top: 35px; margin-left: 16px">
            Stock Range: </p>
          <pos-range-slider min={0} max={1000} prefix={''} v-model={temporaryDialogFilter.value.stock}>
          </pos-range-slider>
        </div>
      </div>
    </>)
  }}></dialog-form-input>
}

// PosTextfieldNew
export function openDialogStock(inventory) {
  selectedInventory.value = inventory
  dialog.value.stock = true
}

export function openDialogInventory(inventory, mode) {
  // no inventory a.s.a passing mode as 1st parameter
  if (typeof inventory === 'string') {
    mode = inventory
    dialog.value.mode = mode
    // mode:
    //   + add: create empty inventory
    //   + edit: just keep selectedInventory as it is
    if (mode === 'add') {
      selectedInventory.value = createEmptyInventory()
    }
  } else {
    dialog.value.mode = mode
    selectedInventory.value = _.cloneDeep(inventory)
  }

  dialog.value.inventory = true
}

export function formatDate(date) {
  if (!date || !dayjs(date).isValid()) return ''
  return dayjs(date).format('DD/MM/YYYY HH:mm')
}

/**
 * @date: {Object} range from, to of selected inventory actions
 * @example:
 * {
 *   data: {
 *     from:
 *     to:
 *   }
 * }
 */
export const actionFilter = ref({
  fromDate: dayjs().format('YYYY-MM-DD'),
  toDate: dayjs().format('YYYY-MM-DD')
})
export const filteredInventoryActions = ref([])
watch(() => actionFilter.value, async () => {
  const inventoryActions = await loadInventoryActions(actionFilter.value)

  const getAmount = (actions, mode) => {
    return actions.reduce((acc, item) => {
      if (mode === item.type) {
        return acc + parseInt(item.amount)
      }
      return acc
    }, 0)
  }

  filteredInventoryActions.value = _.map(
      _.groupBy(inventoryActions, action => action.inventory),
      (group, inventory) => {
        return {
          inventory,
          action: group,
          add: getAmount(group, 'add'),
          remove: getAmount(group, 'remove')
        }
      }
  ).filter(item => {
    return !!detailInventories.value.find(inventory => inventory._id.toString() === item.inventory.toString())
  }).map(item => ({
    ...item,
    ...detailInventories.value.find(inventory => inventory._id.toString() === item.inventory.toString())
  }))
}, { deep: true })
