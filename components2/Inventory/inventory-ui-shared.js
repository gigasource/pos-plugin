import { ref, watch, watchEffect } from 'vue'
import {
	inventoryCategories,
	filter,
	inventories
} from './inventory-logic-ui'
import {
	createInventory,
	deleteInventory,
	loadInventories,
	loadInventoryHistories,
	updateInventory
} from "./inventory-logic-be";
import dayjs from 'dayjs'
import { genScopeId } from '../utils';
import _ from 'lodash'
import {appType, currentAppType} from "../AppSharedStates";

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
const createEmptyInventory = {
	[appType.POS_RESTAURANT]: () => ({
		_id: null,
		id: null,
		name: null,
		category: null,
		unit: null,
		stock: null
	}),
	[appType.POS_RETAIL]: () => ({
		_id: null,
		id: null,
		name: null,
		category: null,
		unit: null,
		stock: null,
		price: null,
		unitCostPrice: null,
		isFavorite: false,
		isVoucher: false,
		isActive: false,
		isRefundable: true,
		showOnOrderScreen: true,
		manualPrice: false,
		hasComboIngredient: false,
		attributes: [],
		comboIngredient: []
	})
}
export const selectedInventory = ref(createEmptyInventory[currentAppType.value]())

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

export async function submitInventory () {
	if(!selectedInventory.value.name ||
		!selectedInventory.value.category ||
		!selectedInventory.value.unit ||
		!selectedInventory.value.stock ||
		isNaN(selectedInventory.value.stock) /* Note that isNaN('12') === true */ ) return
	selectedInventory.value.stock = Number(selectedInventory.value.stock)
	const inventory = selectedInventory.value
	if(dialog.value.mode === 'add') {
		await createInventory(inventory)
	} else {
		await updateInventory(inventory)
	}
	dialog.value.inventory = false
}

export async function updateStock({value, reason}) {
	await updateInventory({
		...selectedInventory.value,
		category: selectedInventory.value.category._id,
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
		{text: t('inventory.size'), val: 'size'},
		{text: t('inventory.color'), val: 'color'}
	]
	const renderDialog = {
		[appType.POS_RESTAURANT]: () => (
			<div class="row-flex flex-wrap justify-around" key={dialog.value.inventory}>
				<pos-textfield-new style="width: 48%" label="Name" v-model={selectedInventory.value.name}/>
				<pos-textfield-new disabled={dialog.value.mode === 'edit'} rules={[val => !isNaN(val) || 'Must be a number!']}
													 style="width: 48%" label={t('inventory.stock')} v-model={selectedInventory.value.stock}/>
				<g-select menu-class="menu-select-inventory" outlined style="width: 48%" label={t('article.category')}
									items={inventoryCategories.value} item-text="name" return-object v-model={selectedInventory.value.category}/>
				<g-select menu-class="menu-select-inventory" outlined style="width: 48%" label={t('inventory.unit')}
									items={units.value} v-model={selectedInventory.value.unit}/>
			</div>
		),
		[appType.POS_RETAIL]: () => (
			<div class="column-flex flex-wrap justify-around">
				<div>{t('inventory.createNewProduct')}</div>
				<div class="row-flex flex-wrap justify-around" key={dialog.value.inventory}>
					<pos-textfield-new style="width: 30%" label="Name" v-model={selectedInventory.value.name}/>
					<g-select menu-class="menu-select-inventory" outlined style="width: 20%" label={t('article.category')}
										items={inventoryCategories.value} item-text="name" return-object v-model={selectedInventory.value.category}
					/>
					<pos-textfield-new style="width: 20%" label="Product ID" v-model={selectedInventory.value.id}/>
					<pos-textfield-new style="width: 20%" rules={[val => !isNaN(val) || 'Must be a number!']}
														 label={t("inventory.price")} v-model={selectedInventory.value.price}/>
					<g-select menu-class="menu-select-inventory" outlined style="width: 15%" label={t('inventory.tax')}
										items={units.value} v-model={selectedInventory.value.unit}/>
					<g-select menu-class="menu-select-inventory" outlined style="width: 15%" label={t('inventory.unit')}
										items={tax.value} v-model={selectedInventory.value.tax}/>
					<pos-textfield-new style="width: 15%" rules={[val => !isNaN(val) || 'Must be a number!']}
														 label={t("inventory.unitPrice")} v-model={selectedInventory.value.unitCostPrice}/>
					<pos-textfield-new disabled={dialog.value.mode === 'edit'} rules={[val => !isNaN(val) || 'Must be a number!']}
														 style="width: 15%" label={t('inventory.stock')} v-model={selectedInventory.value.stock}/>
					<pos-textfield-new disabled={dialog.value.mode === 'edit'} rules={[val => !isNaN(val) || 'Must be a number!']}
														 style="width: 15%" label={t('inventory.barcode')} v-model={selectedInventory.value.barcode}/>
				</div>
				{/**
				  *	Render switch
				  */}
				<div class="row-flex flex-wrap justify-around">
					<g-switch v-model={selectedInventory.value.isFavorite} label={t('inventory.isFavorite')}/>
					<g-switch v-model={selectedInventory.value.isVoucher} label={t('inventory.isVoucher')}/>
					<g-switch v-model={selectedInventory.value.isActive} label={t('inventory.isActive')}/>
					<g-switch v-model={selectedInventory.value.isRefundable} label={t('inventory.isRefundable')}/>
					<g-switch v-model={selectedInventory.value.showOnOrderScreen} label={t('inventory.showOnOrderScreen')}/>
					<g-switch v-model={selectedInventory.value.manualPrice} label={t('inventory.manualPrice')}/>
					<g-switch v-model={selectedInventory.value.hasComboIngredient} label={t('inventory.comboIngredient')}/>
				</div>
				{/**
				 *	Render attribute
				 */}
				<div class="column-flex">
					<div>{t('inventory.attribute')}</div>
					{selectedInventory.value.attributes.map((attribute, i) => (
						<div class="row-flex">
							<g-select menu-class="menu-select-inventory" outlined style="width: 10%" label={t('inventory.attributes')}
												items={defaultAttrs} v-model={attribute.name} itemText="text" itemValue="val"/>
							<pos-textfield-new style="width: 15%" label={t("inventory.attributeDescription")}
																 v-model={attribute.description}/>
							{/*todo: this is not showing on FE*/}
							<div onClick={() => removeAttribute(i)}
									 className={['category-item__btn', 'category-item__btn--delete']}>
								<g-icon>icon-delete2</g-icon>
							</div>
						</div>
					))}
					<g-btn-bs icon="add" background-color="#1271FF" onClick={createAttribute}>{t('inventory.newAttribute')}</g-btn-bs>
				</div>
				{/**
				 *	Render combo
				 */}
				{
					selectedInventory.value.hasComboIngredient &&
					<div className="column-flex">
						<div>{t('inventory.comboIngredient')}</div>
						<g-btn-bs icon="add" background-color="#1271FF" onClick={createAttribute}>{t('inventory.newAttribute')}</g-btn-bs>
					</div>
				}
			</div>
		)
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

const temporaryDialogFilter = ref({
})
function changeFilter() {
	filter.value = {
		...filter.value,
		..._.cloneDeep(temporaryDialogFilter.value)
	}
	temporaryDialogFilter.value = {
	}
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
				          label={t('article.category')} clearable items={inventoryCategories.value} item-text="name"
				          return-object v-model={temporaryDialogFilter.value.category}>
				</g-select>
				<div class="col-12 row-flex">
					<p style="margin-top: 35px; margin-left: 16px">
						Stock Range: </p>
					<pos-range-slider min={0} max={1000} prefix={""} v-model={temporaryDialogFilter.value.stock}>
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
		if (mode === 'add')
			selectedInventory.value = createEmptyInventory[currentAppType.value]()
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
 * @date: {Object} range from, to of selected inventory histories
 * @example:
 * {
 *   data: {
 *     from:
 *     to:
 *   }
 * }
 */
export const historyFilter = ref({
	fromDate: dayjs().format('YYYY-MM-DD'),
	toDate: dayjs().format('YYYY-MM-DD')
})
export const filteredInventoryHistories = ref([])
watch(() => historyFilter.value, async () => {
	const inventoryHistories = await loadInventoryHistories(historyFilter.value)

	const getAmount = (histories, mode) => {
		return histories.reduce((acc, item) => {
			if (mode === item.type) {
				return acc + parseInt(item.amount)
			}
			return acc
		}, 0)
	}

	filteredInventoryHistories.value = _.map(
		_.groupBy(inventoryHistories, history => history.inventory),
		(group, inventory) => {
			return {
				inventory,
				history: group,
				add: getAmount(group, 'add'),
				remove: getAmount(group, 'remove')
			}
		}
	).filter(item => {
		return !!inventories.value.find(inventory => inventory._id.toString() === item.inventory.toString())
	}).map(item => ({
		...item,
		...inventories.value.find(inventory => inventory._id.toString() === item.inventory.toString())
	}))
}, { deep: true })
