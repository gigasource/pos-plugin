//<editor-fold desc="kitchenOrders">
import { ref, withModifiers } from 'vue'
import { genScopeId } from '../utils';

import {useI18n} from 'vue-i18n'
import {
	sortedKitchenOrders,
	getPendingOrderKitchenTime,
	getExtraInfo
} from "./online-order-main-logic";
import {
	dialogOrder
} from './helpers/dialog-complete-order-render'
import {
	findCustomerWithId
} from "../Customer/customer-logic";

export const completeOrderDialogShow = ref(false)

export function openCompleteDialog(order) {
	dialogOrder.value = order
	completeOrderDialogShow.value = true
}

export function renderKitchenOrdersFactory() {
	const { t, locale } = useI18n()

	function renderKitchenOrdersHeader() {
		return (
			<div class="header">
				{ t('onlineOrder.sentToKitchen') }
				{ sortedKitchenOrders.value && sortedKitchenOrders.value.length > 0 &&
					<g-badge class="ml-1" inline modelValue={true} color="#F9A825" v-slots={{
						'badge': () => <div class="px-2">{sortedKitchenOrders.value.length}</div>
					}}></g-badge>
				}
			</div>
		)
	}

	function renderKitchenOrdersTitle(order) {
		const customer = findCustomerWithId(order.customer)
		return (
			<g-card-title>
				{genScopeId(() => <>
				    <div class="fs-small-2 ml-1" style="max-width: calc(100% - 96px); line-height: 1.2">
              <span class="fs-small fw-700 text-indigo-accent-2">
                #{order.dailyId ? order.dailyId : order.id}
              </span>
    					{customer ? customer.name : 'No customer name'} -
    					{customer ? customer.phone : 'No customer phone'}
    				</div>
    				<g-spacer/>
    				<div class="kitchen-orders__timer" onClick={withModifiers(() => openCompleteDialog(order), ['stop'])}>
    					{ order.type === 'delivery' && <g-icon>icon-delivery-scooter</g-icon> }
    					{ order.type === 'pickup' && <g-icon>icon-take-away</g-icon> }
    					<span class="fw-700 fs-small ml-2">{order.deliveryTime}</span>
    				</div>
				</>)()}
			</g-card-title>
		)
	}

	function renderKitchenOrdersText(order) {
		return (
			<g-card-text>
				{genScopeId(() => <>
				    {
    					(order.note) && <div class="text-grey-darken-1 i mb-1" style="font-size: 13px; line-height: 16px">
    						Note: {order.note}
    					</div>
    				}
    				{
    					(order.type === 'delivery') && <div class="row-flex">
    						<div class="col-1">
    							<g-icon color="#9E9E9E" size="20">icon-place</g-icon>
    						</div>
    						<div class="col-11 text-grey-darken-1">
    							{`${order.address} - ${order.zipcode}`}
    						</div>
    					</div>
    				}
    				{
    					(order.items) && <div class="row-flex">
    						<div class="col-1" style="line-height: 20px">
    							<g-icon color="#9E9E9E" size="20">icon-food</g-icon>
    						</div>
    						<div style="padding-top: 2px">
    							{order.items.map(item =>
    								<span>
                      <span class="fw-700">{item.quantity}x</span>
                      <span class="mr-3" style="word-break: break-all">
                        {item.id && `${item.id}.`} {item.name}
                        <span class="i text-grey fs-small-2">{getExtraInfo(item)}</span>
                      </span>
                    </span>
    							)}
    						</div>
    					</div>
    				}
    				{
    					(order.forwardedStore) && <div class="row-flex">
    						<div class="col-1 row-flex align-items-center">
    							<g-icon color="#9E9E9E" size="17">icon-double-arrow-right</g-icon>
    						</div>
    						<div>{order.forwardedStore}</div>
    					</div>
    				}
				</>)()}
			</g-card-text>
		)
	}

	function renderKitchenOrdersContent() {
		return (
			<div class="content">
				{
					(!sortedKitchenOrders.value || !sortedKitchenOrders.value.length) ?
						<div class="kitchen-orders--empty">
							<p>{t('onlineOrder.noKitchen')}</p>
						</div>
						: <>
							{sortedKitchenOrders.value.map((order, index) => (
								<g-card elevation="0" key={index}
								        style={[getPendingOrderKitchenTime(order) < 10 && {border: '1px solid #FF4452'}]}>
									{
										genScopeId(() => <>
									    {renderKitchenOrdersTitle(order)}
    									{renderKitchenOrdersText(order)}
										</>)()
									}
								</g-card>
							))}
						</>
				}
			</div>
		)
	}

	function renderKitchenOrders() {
		return (
			<div class="kitchen-orders pl-2">
				{renderKitchenOrdersHeader()}
				{renderKitchenOrdersContent()}
			</div>
		)
	}

	return {
		renderKitchenOrders,
		renderKitchenOrdersHeader
	}
}
//</editor-fold>
