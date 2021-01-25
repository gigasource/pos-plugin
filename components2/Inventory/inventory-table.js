import {useI18n} from 'vue-i18n'
import {clearFilter, inventories} from './inventory-logic-ui'
import {$filters} from '../AppSharedStates'
import {useRouter} from 'vue-router'
import {
	checkBoxSelectedInventoryIDs,
	dialog,
	openDialogInventory,
	openDialogStock
} from "./inventory-ui-shared";
import {
	listIDs,
	removeFilter
} from './inventory-logic-ui'

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

	const { t } = useI18n()
	const renderMainTable = () => (
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
				<td className="bg-grey-lighten-1">
					{
						(inventories.value && inventories.value.length !== 0) ?
							<g-checkbox v-model={checkBoxSelectedInventoryIDs} value={listIDs} multiple v-slots={{
								'label': () => <>
									<g-icon size="16" className="mb-1">
										fas fa-caret-down
									</g-icon>
								</>
							}}></g-checkbox>
							:
							<g-checkbox></g-checkbox>
					}
				</td>
				<td colSpan="6" className="filter-wrapper">
					<div className="filter">
						{t('settings.filter')}
						<div className="group-chip">
							{Object.keys(filter.value).forEach((typeFilter) =>
								(filter.value[typeFilter] !== null) ?
									<g-chip key={typeFilter} label small background-color="white" close className="ma-1"
									        onClose={() => removeFilter(typeFilter)}>
										<div>
											<span className="chip-title"> {typeFilter}: </span>
											<span className="chip-content">{filter.value[typeFilter]} </span>
										</div>
									</g-chip>
									: <></>
							)} </div>
						{
							(inventoryFilters.value && inventoryFilters.value.length > 0) &&
							<g-btn-bs onClick={clearFilter}>
								<u>
									{t('settings.clearAll')}
								</u>
							</g-btn-bs>
						}
						<g-spacer>
						</g-spacer>
						<div className="btn-add-filter" onClick={() => dialog.value.filter = true}>
							+ {t('inventory.addFilter')} </div>
					</div>
				</td>
			</tr>
			{inventories.value.map((inventory, i) =>
				<tr key={i}>
					<td>
						<g-checkbox v-model={checkBoxSelectedInventoryIDs.value} value={inventory._id}>
						</g-checkbox>
					</td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>
						{inventory.id} </td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>
						{inventory.name} </td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>
						{formatDate(inventory.lastUpdateTimestamp)} </td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>
						{inventory.category.name} </td>
					<td onClick={() => openDialogInventory(inventory, 'edit')}>
						{inventory.unit} </td>
					<td onClick={() => openDialogStock(inventory)}>
						<div className="row-flex justify-between">
							{$filters.formatCurrency(inventory.stock)}
							<g-icon size="18" color="#757575">
								edit
							</g-icon>
						</div>
					</td>
				</tr>
			)}
		</g-simple-table>
	)

	/**
	 * Render Footer toolBar
	 */
	const renderToolBar = () => (
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
				<g-btn uppercase={false} style="margin-right: 5px" onClick={() => dialog.value.category = true}>
					<g-icon small style="margin-right: 5px">
						icon-inventory-category
					</g-icon>

					{t('article.category')}
				</g-btn>
				<g-btn disabled={selectedInventoryIDs.value.length === 0} uppercase={false} style="margin-right: 5px" onClick={removeInventory}>
					<g-icon small style="margin-right: 5px">
						icon-inventory-delete
					</g-icon>

					{t('ui.delete')}
				</g-btn>
				<g-btn disabled={selectedInventoryIDs.value.length === 0} uppercase={false} style="margin-right: 5px" onClick={() => openDialogInventory('edit')}>
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
	)

	return {
		renderMainTable,
		renderToolBar
	}
}
