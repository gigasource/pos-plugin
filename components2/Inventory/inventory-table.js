import {useI18n} from 'vue-i18n'
import {$filters, appType, currentAppType} from '../AppSharedStates'
import {useRouter} from 'vue-router'
import {
	checkBoxSelectedInventoryIDs,
	dialog,
	openDialogInventory,
	openDialogStock,
	formatDate
} from "./inventory-ui-shared";
import {
	listIDs,
	removeFilter,
	clearFilter,
	filteredInventory,
	filter,
	isFiltered,
	convertFilterValueToString
} from './inventory-logic-ui'
import {
	deleteInventory
} from "./inventory-logic-be";
import { genScopeId } from '../utils'
import {
	categories
} from '../Product/product-logic'

export function renderMainInventoryTable(props, { emit }) {
	const router = useRouter()

	const back = function () {
		router.go(-1)
	}
	const goToReportPage = function () {
		router.push({ path: '/pos-inventory-report' })
	}
	const goToStockPage = function () {
		router.push({ path: '/pos-inventory-stock' })
	}
	const removeInventory = async function () {
		await deleteInventory(selectedInventoryIDs)
	}
	const getCategoryText = function (categoryList) {
		const filteredList = categories.value.filter(category => {
			return !!categoryList.find(categoryId => categoryId.toString() === category._id.toString())
		})
		return filteredList.reduce((result, category) => {
			if (result.length) result += ', '
			result += category.name
		}, '')
	}

	const { t } = useI18n()

	const renderInventory = {
		[appType.POS_RESTAURANT]: (inventory, i) => {
			return (
				<tr key={i}>
					<td>
						<g-checkbox v-model={checkBoxSelectedInventoryIDs.value} value={inventory._id}></g-checkbox>
					</td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>{inventory.id}</td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>{inventory.product.name}</td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>{formatDate(inventory.lastUpdateTimestamp)}</td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>{inventory.product.category.name}</td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>{inventory.unit}</td>
					<td onClick={() => openDialogStock(inventory)}>
						<div className="row-flex justify-between">
							{$filters.formatCurrency(inventory.stock)}
							<g-icon size="18" color="#757575">edit</g-icon>
						</div>
					</td>
				</tr>
			)
		},
		[appType.POS_RETAIL]: (inventory, i) => {
			return (
				<tr key={i}>
					<td>
						<g-checkbox v-model={checkBoxSelectedInventoryIDs.value} value={inventory._id}></g-checkbox>
					</td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>{inventory.product.id}</td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>{inventory.product.name}</td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>{$filters.formatCurrency(inventory.product.price)}</td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>{getCategoryText(inventory.product.category)}</td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>{inventory.costPrice}</td>
					<td onClick={() => openDialogStock(inventory)}>
						<div className="row-flex justify-between">
							{$filters.formatCurrency(inventory.stock)}
							<g-icon size="18" color="#757575">edit</g-icon>
						</div>
					</td>
				</tr>
			)
		}
	}

	const renderTableTitle = {
		[appType.POS_RESTAURANT]: () => {
			return (
				<thead>
				<tr>
					<th></th>
					<th>ID</th>
					<th>
						{t('article.name')}<g-icon size="12">mdi-filter</g-icon>
					</th>
					<th>{t('inventory.lastUpdate')}</th>
					<th>
						{t('article.category')}
						<g-icon size="12">
							mdi-magnify
						</g-icon>
					</th>
					<th>{t('inventory.unit')}</th>
					<th>{t('inventory.stock')}</th>
				</tr>
				</thead>
			)
		},
		[appType.POS_RETAIL]: () => {
			return (
				<thead>
				<tr>
					<th></th>
					<th>Product ID</th>
					<th>
						{t('article.name')}<g-icon size="12">mdi-filter</g-icon>
					</th>
					<th>
						{t('inventory.price')}
						<g-icon size="12">mdi-filter</g-icon>
					</th>
					<th>
						{t('article.category')}
						<g-icon size="12">
							mdi-magnify
						</g-icon>
					</th>
					<th>{t('inventory.unitPrice')}</th>
					<th>{t('inventory.stock')}</th>
				</tr>
				</thead>
			)
		}
	}

	const renderMainTable = () => (
			<g-simple-table striped fixed-header style="flex: 1">
				{genScopeId(() => (
				    <>
							{renderTableTitle[currentAppType.value]()}
    					<tr>
    						<td class="bg-grey-lighten-1">
    							{
    								(filteredInventory.value && filteredInventory.value.length !== 0) ?
    										<g-checkbox v-model={checkBoxSelectedInventoryIDs.value} value={listIDs.value} multiple v-slots={{
    											'label': () => <g-icon size="16" class="mb-1">fas fa-caret-down</g-icon>
    										}}></g-checkbox>
    										: <g-checkbox></g-checkbox>
    							}
    						</td>
    						<td colSpan="6" class="filter-wrapper">
    							<div class="filter">
    								{t('settings.filter')}
    								<div class="group-chip">
    									{Object.keys(filter.value).map(typeFilter => (filter.value[typeFilter] != null) && (
											    <g-chip key={typeFilter} label small background-color="white" close class="ma-1"
											            onClose={() => removeFilter(typeFilter)}>
												    <div>
													    <span class="chip-title">{t(`inventory.filter.${typeFilter}`)}: </span>
													    <span class="chip-content">{convertFilterValueToString(typeFilter)} </span>
												    </div>
											    </g-chip>
									    ))}
    								</div>
    								{ (isFiltered.value) && <g-btn-bs onClick={clearFilter}><u>{t('settings.clearAll')}</u></g-btn-bs>}
    								<g-spacer/>
    								<div class="btn-add-filter" onClick={() => dialog.value.filter = true}>+ {t('inventory.addFilter')}</div>
    							</div>
    						</td>
    					</tr>
    					{filteredInventory.value.map((inventory, i) =>
								renderInventory[currentAppType.value](inventory, i)
    					)}
    				</>
				))()}
			</g-simple-table>
	)

	/**
	 * Render Footer toolBar
	 */
	const renderToolBar = genScopeId(() => (
			<div>
				<g-toolbar color="#eeeeee" elevation="0">
					<g-btn uppercase={false} style="margin-right: 5px" onClick={back}>
						<g-icon small style="margin-right: 5px">icon-back</g-icon>
						{t('ui.back')}
					</g-btn>
					<g-btn uppercase={false} onClick={goToReportPage}>
						<g-icon small style="margin-right: 5px">icon-inventory-report</g-icon>
						{t('inventory.report')}
					</g-btn>
					<g-spacer/>
					<g-btn uppercase={false} style="margin-right: 5px" onClick={goToStockPage}>
						<g-icon small style="margin-right: 5px">icon-inventory-new-stock</g-icon>
						{t('inventory.newStock')}
					</g-btn>
					<g-btn uppercase={false} style="margin-right: 5px" onClick={() => dialog.value.category = true}>
						<g-icon small style="margin-right: 5px">icon-inventory-category</g-icon>
						{t('article.category')}
					</g-btn>
					<g-btn disabled={checkBoxSelectedInventoryIDs.value.length === 0} uppercase={false} style="margin-right: 5px" onClick={removeInventory}>
						<g-icon small style="margin-right: 5px">icon-inventory-delete</g-icon>
						{t('ui.delete')}
					</g-btn>
					<g-btn disabled={checkBoxSelectedInventoryIDs.value.length !== 1} uppercase={false} style="margin-right: 5px" onClick={() => openDialogInventory('edit')}>
						<g-icon small style="margin-right: 5px">icon-inventory-edit</g-icon>
						{t('ui.edit')}
					</g-btn>
					<g-btn uppercase={false} background-color="#4CAF50" text-color="#FFF" onClick={() => openDialogInventory('add')}>
						<span style="font-size: 14px !important">+ {t('inventory.newProduct')} </span>
					</g-btn>
				</g-toolbar>
			</div>
	))

	return {
		renderMainTable,
		renderToolBar
	}
}
