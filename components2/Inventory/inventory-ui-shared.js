import { ref } from 'vue'
import {
	inventoryCategories,
	filter
} from './inventory-logic-ui'
import {createInventory, deleteInventory, loadInventories, updateInventory} from "./inventory-logic-be";
import dayjs from 'dayjs'
import { genScopeId } from '../utils';

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
export const selectedInventory = ref({
	_id: null,
	name: null,
	category: null,
	unit: null,
	stock: null
})

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

/**
 * Pagination to display a limit per page
 */
export const inventoryPagination = ref({ limit: 15, currentPage: 1 })

export const checkBoxSelectedInventoryIDs = ref([])

export async function submitInventory () {
	if(!selectedInventory.value.name ||
		!selectedInventory.value.category ||
		!selectedInventory.value.unit ||
		!selectedInventory.value.stock ||
		isNaN(selectedInventory.value.stock)) return
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
	return <dialog-form-input v-model={dialog.value.inventory} onSubmit={submitInventory} v-slots={{
			'input': genScopeId(() => <>
				<div class="row-flex flex-wrap justify-around" key={dialog.value.inventory}>
					<pos-textfield-new style="width: 48%" label="Name" v-model={selectedInventory.value.name} required>
					</pos-textfield-new>
					<pos-textfield-new disabled={dialog.value.mode === 'edit'} rules={[val => !isNaN(val) || 'Must be a number!']}
					                   style="width: 48%" label={t('inventory.stock')} v-model={selectedInventory.value.stock} required>
					</pos-textfield-new>
					<g-select menu-class="menu-select-inventory" outlined style="width: 48%" label={t('article.category')}
					          items={inventoryCategories.value} item-text="name" item-value="_id" v-model={selectedInventory.value.category}
					          required>
					</g-select>
					<g-select menu-class="menu-select-inventory" outlined style="width: 48%" label={t('inventory.unit')}
					          items={units.value} v-model={selectedInventory.value.unit} required>
					</g-select>
				</div>
			</>),
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
	return <dialog-inventory-category v-model={dialog.value.category}>
	</dialog-inventory-category>
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

export function renderFilterDialog(t) {
	return <dialog-form-input v-model={dialog.value.filter} onSubmit={changeFilter} v-slots={{
		'input': () => <>
			<div class="row-flex flex-wrap justify-around mt-2">
				<pos-textfield-new style="width: 30%" label="Product ID" v-model={temporaryDialogFilter.value.id} clearable>
				</pos-textfield-new>
				<pos-textfield-new style="width: 30%" label="Name" v-model={temporaryDialogFilter.value.name} clearable>
				</pos-textfield-new>
				<g-select menu-class="menu-select-inventory" text-field-component="PosTextfieldNew" outlined style="width: 30%"
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
		</>
	}}></dialog-form-input>
}

export function openDialogStock(inventory) {
	selectedInventory.value = inventory
	dialog.value.stock = true
}

export function openDialogInventory(inventory, mode) {
	if (typeof inventory === 'string') {
		inventory = null
		mode = inventory
	}
	selectedInventory.value = inventory
	dialog.value.mode = mode
	dialog.value.inventory = true
}

export function formatDate(date) {
	if (!date || !dayjs(date).isValid()) return ''
	return dayjs(date).format('DD/MM/YYYY HH:mm')
}
