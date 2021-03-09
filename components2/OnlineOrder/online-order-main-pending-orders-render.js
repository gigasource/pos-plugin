import { ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { genScopeId } from '../utils'

import {
	calls,
	missedCalls,
	cancelMissedCallTimeout,
	deleteCall,
	deleteMissedCall
} from '../Settings/CallSystem/call-system-calls'
import { modemDeviceConnected, currentCallSystemMode, CALL_SYSTEM_MODES } from '../Settings/CallSystem/call-system-logics'
import { showReservationDialog } from '../Reservation/reservation-shared'
import {
	timeoutProgress,
	pendingOrders,
	paymentIcon,
	defaultPrepareTime,
	getExtraInfo,
	getItemPrice
} from './online-order-main-logic'

import { acceptOrder, declineOrder, onDeclinedOrder } from './online-order-main-logic-be'
//<editor-fold desc="delivery">
import {selectedCustomer as deliverySelectedCustomer, phone, selectedCall} from "../OrderView/delivery/delivery-shared";
import { orderType } from "../OrderView/delivery/delivery-customer-ui";
//</editor-fold>

import {$filters} from "../AppSharedStates";
import {findCustomerWithId} from "../Customer/customer-logic";

export const selectedCustomer = ref({})

export const selectingPendingOrder = ref(null)
export const showCancelOrderReasonDialog = ref(null)
function openOrderCancelReasonDialog(order) {
	selectingPendingOrder.value = order
	showCancelOrderReasonDialog.value = true
}

export function navigateToDeliveryScreen(call, type, missedCallIndex) {
	const { customer, callId } = call
	cancelMissedCallTimeout(callId)
	if (missedCallIndex) {
		calls.unshift({ ...missedCalls.value[missedCallIndex], type: 'missed' })
		deleteMissedCall(missedCallIndex)
	}
	selectedCustomer.value = deliverySelectedCustomer.value = customer
	phone.value = customer.phone
	orderType.value = type
	selectedCall.value = call
	router.push({ path: '/pos-order-delivery' })
}
export function openReservationDialog({ customer, callId }) {
	selectedCustomer.value = customer
	showReservationDialog.value = true
	cancelMissedCallTimeout()
}

export async function onClickAccept(order) {
	if (order.deliveryTime === 'asap') {
		if (order.declineStep2) order.declineStep2 = false
		if (!order.confirmStep2) return order.confirmStep2 = true
		if (!order.prepareTime) order.prepareTime = defaultPrepareTime
	}
	await acceptOrder(order)
}

//<editor-fold desc="pendingOrders">
export function renderPendingOrdersFactory () {
	const { t, locale } = useI18n()

	function renderCallSystemWarning() {
		if (currentCallSystemMode.value !== CALL_SYSTEM_MODES.OFF.value && !modemDeviceConnected.value)
			return <span style="color: #D32F2F">Modem not connected</span>
	}
	function renderPendingOrdersHeader() {
		return (
			<div class="header">
				<span>{t('onlineOrder.pendingOrders')}</span>
				{
					pendingOrders.value && pendingOrders.value.length > 0 &&
						<g-badge class="ml-1" inline modelValue={true} color="#4CAF50" v-slots={{
							badge: () => <div class="px-2">{pendingOrders.value.length}</div>
						}}>
						</g-badge>
				}
				<g-spacer/>
				{ renderCallSystemWarning() }
			</div>
		)
	}

	function renderEmptyPendingOrders() {
		return (
			<div class="pending-orders--empty">
				<img alt src="/plugins/pos-plugin/assets/pending_order.svg"> </img>
				<p> {t('onlineOrder.noPending')} </p>
			</div>
		)
	}

	function renderPendingOrdersCalls() {
		return (
			<>
				{calls.value.map((call, i) =>
					<div class="pending-orders--call" key={`call_${i}`}>
						<div class="pending-orders--call-title">
							<div>{`${call.customer.name ? `${call.customer.name} - ` : ''}${call.customer.phone}`}</div>
							<g-spacer></g-spacer>
							<g-icon>icon-call</g-icon>
						</div>
						<p class="fs-small-2 text-grey-darken-1">Incoming call</p>
						<div class="pending-orders--call-buttons">
							<g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => deleteCall(i, call)}>
								<g-icon size="16">icon-cross-red</g-icon>
							</g-btn-bs>

							<g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => openReservationDialog(call)}>
								<g-icon size="16">icon-table-reservation</g-icon>
							</g-btn-bs>

							<g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => navigateToDeliveryScreen(call, 'pickup')}>
								<g-icon size="16">icon-take-away</g-icon>
							</g-btn-bs>

							<g-btn-bs class="flex-equal" border-color="#C4C4C4" onClick={() => navigateToDeliveryScreen(call, 'delivery')}>
								<g-icon size="16">icon-delivery-scooter</g-icon>
							</g-btn-bs>
						</div>
					</div>
				)}
			</>
		)
	}

	function renderPendingOrdersMissedCall() {
		return (
			<>
				{missedCalls.value.map((call, i) =>
					<div class="pending-orders--call b-red" key={`missed_call_${i}`}>
						<div class="pending-orders--call-title">
							<div> {call.customer.name} <span> - </span> {call.customer.phone} </div>
							<g-spacer></g-spacer>
							<g-icon size="20">icon-missed-call</g-icon>
						</div>
						<p class="fs-small-2 text-grey-darken-1">Missed call</p>
						<div class="pending-orders--call-buttons">
							<g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => deleteMissedCall(i)}>
								<g-icon size="16">icon-cross-red</g-icon>
							</g-btn-bs>
							<g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => openReservationDialog(call)}>
								<g-icon size="16">icon-table-reservation</g-icon>
							</g-btn-bs>
							<g-btn-bs class="flex-equal mr-2" border-color="#C4C4C4" onClick={() => navigateToDeliveryScreen(call, 'pickup', i)}>
								<g-icon size="16">icon-take-away</g-icon>
							</g-btn-bs>
							<g-btn-bs class="flex-equal" border-color="#C4C4C4" onClick={() => navigateToDeliveryScreen(call, 'delivery', i)}>
								<g-icon size="16">icon-delivery-scooter</g-icon>
							</g-btn-bs>
						</div>
					</div>
				)}
			</>
		)
	}

	function renderPendingOrdersTitle(order) {
		const customer = findCustomerWithId(order.customer)
		return (
			<g-card-title>
				{ genScopeId(() => <>
					<div class="row-flex align-items-center flex-grow-1">
						{ (order.type === 'delivery') && <g-icon>icon-delivery-scooter</g-icon> }
						{ (order.type === 'pickup') && <g-icon>icon-take-away</g-icon> }
						<div class="fs-small-2 ml-1 mr-2" style="max-width: calc(100% - 24px); line-height: 1.2">
							<span class="fs-small fw-700 text-indigo-accent-2 mr-2">#{order.dailyId}</span>
							{customer ? customer.name : 'No customer name'} -
							{customer ? customer.phone : 'No customer phone'}
						</div>
					</div>
					<div class="row-flex justify-end align-items-center r" style="flex: 0 0 auto">
						{
							(order.deliveryTime) && <span class="fw-700 fs-small mr-2" style="text-transform: uppercase">
								{order.deliveryTime}
							</span>
						}
						{
							(order.timeoutDate && timeoutProgress.value[order._id]) && <>
								<g-progress-circular rotate="-90" width="1.5" size="36" color="#E57373"
								                     value={timeoutProgress.value[order._id].progress}>
								</g-progress-circular>
								<div class="progress-remaining">
									{timeoutProgress.value[order._id].remaining}
								</div>
							</>
						}
					</div>
				</>)() }
			</g-card-title>
		)
	}

	function renderPendingOrdersText(order) {
		return (
			<g-card-text>
				{
					(order.note) && <div class="text-grey-darken-1 i mb-1" style="font-size: 13px; line-height: 16px">
						{t('onlineOrder.note')}: {order.note}
					</div>
				}
				{
					(order.type === 'delivery') &&
					<div class="row-flex">
						<div style="flex: 0 0 25px">
							<g-icon color="#9E9E9E" size="20">
								icon-place
							</g-icon>
						</div>
						<div style="max-width: calc(100% - 25px);" class="flex-equal pl-1">
							{`${order.address} ${order.zipcode}`}
						</div>
					</div>
				}
				{
					(order.items) && <div>
						{order.items.map(item =>
							<div class="row-flex align-items-start">
								<div style="flex: 0 0 25px; font-weight: 700; font-size: 12px">
									{item.quantity}x
								</div>
								<div class="flex-equal fs-small-2 pl-1" style="word-break: break-all">

									{item.id && `${item.id}.`} {item.name}
									<span class="i text-grey">
									{getExtraInfo(item)}
								</span>
								</div>
								<div class="fs-small-2 ta-right">€{$filters.formatCurrency(getItemPrice(item), 2)}</div>
							</div>
						)} </div>
				}
				{
					(order.type === 'delivery') && <div class="row-flex">
						<div class="flex-equal fw-700">{t('onlineOrder.shippingFee')}</div>
						<div class="fs-small-2 ta-right">€{$filters.formatCurrency(order.shippingFee, 2)}</div>
					</div>
				}
				{
					(order.discounts && order.discounts.length === 0) && <div>
						{order.discounts.map(discount =>
							<div class="row-flex align-items-start">
								<div>
								<span>
									{discount.coupon ? `Coupon ` : discount.name}
								</span>
									{
										(discount.coupon) && <span style="color: #757575; font-style: italic">({discount.coupon})
									</span>
									}
								</div>
								<g-spacer></g-spacer>
								<div class="fs-small-2">
									-{t('common.currency', locale.value)}{$filters.formatCurrency(discount.value, 2)}
								</div>
							</div>
						)}
					</div>
				}
			</g-card-text>
		)
	}

	function renderPendingOrdersActions(order) {
		function onBack() {
			order.declineStep2 = false
			order.confirmStep2 = false
		}

		return (
			<>
				{
					(order.declineStep2) && <g-card-actions>
						<g-text-field-bs label={t('onlineOrder.reasonDecline')} v-model={order.declineReason} v-slots={{
							'append-inner': () =>
								<g-icon style="cursor: pointer" onClick={() => openOrderCancelReasonDialog(order)}>
									icon-keyboard
								</g-icon>
						}}/>
					</g-card-actions>
				}
				{
					(order.confirmStep2 && ((order.type === 'delivery' && order.deliveryTime === 'asap') || (order.type === 'pickup'))) && <g-card-actions>
						<div class="w-100">
							<p class="ml-2 mb-1">
								{t('onlineOrder.settings.timeToComplete2')} (min)
							</p>
							<value-picker
									values={[15, 30, 45, 60]}
									default-value={defaultPrepareTime.value || 30}
									allow-custom
							    v-model={order.prepareTime}/>
						</div>
					</g-card-actions>
				}
				<g-card-actions style="padding: 0 0 8px 0">
					{(
							order.confirmStep2 || order.declineStep2
								? <g-btn-bs height="54" width="60" border-color="#C4C4C4" text-color="black" onClick={withModifiers(() => onBack(order), ['stop'])}>
										{t('onlineOrder.back')}
									</g-btn-bs>
								: <g-btn-bs height="54" width="60" border-color="#C4C4C4" text-color="black" onClick={withModifiers(() => onDeclinedOrder(order), ['stop'])}>
										<g-icon size="14">icon-cross-red</g-icon>
									</g-btn-bs>
					)}
					{(
							order.declineStep2
							? <g-btn-bs height="54" background-color="#E0E0E0" text-color="black" style="flex: 1; margin-left: 0"
							            onClick={() => declineOrder(order)}>Confirm</g-btn-bs>
							: <g-btn-bs height="54" background-color="#E0E0E0" class="pending-orders--btn-price" text-color="black" style="flex: 1; margin-left: 0"
							            onClick={withModifiers(() => onClickAccept(order), ['stop'])}>
									{(
											paymentIcon.value[order.payment[0].type]
		                    ? <img src={paymentIcon.value[order.payment[0].type]} alt={order.payment[0].type} style="height: 16px" class="mr-2"> </img>
												: <span class="mr-2"> {order.payment[0].type} </span>
	                )}
									<span>
										{t('common.currency', locale.value)}
										{$filters.formatCurrency(order.payment[0].value)}
									</span>
								</g-btn-bs>
						)}
				</g-card-actions>
				{
					(order.forwardedStore) &&
					<g-card-actions class="pending-orders--forward-store">
						<b class="mr-1">
							From:
						</b>
						{order.forwardedStore}
					</g-card-actions>
				}
			</>
		)
	}

	function renderAllPendingOrders() {
		return pendingOrders.value.map((order, index) => (
			<g-card elevation="0" key={index}>
				{ genScopeId(() => <>
					{renderPendingOrdersTitle(order)}
					{renderPendingOrdersText(order)}
					{renderPendingOrdersActions(order)}
				</>)() }
			</g-card>
		))
	}

	function renderPendingOrdersContent() {
		return (
			<div class="content">
				{renderPendingOrdersCalls()}
				{(!pendingOrders.value || !pendingOrders.value.length) && renderEmptyPendingOrders()}
				{renderAllPendingOrders()}
			</div>
		)
	}



	function renderPendingOrders() {
		return (
			<div class="pending-orders pr-2">
				{renderPendingOrdersHeader()}
				{renderPendingOrdersContent()}
			</div>
		)
	}

	function renderReservationDialog() {
		return <new-reservation-dialog
				v-model={showReservationDialog.value}
				received-phone={selectedCustomer.value ? selectedCustomer.value.phone : ''}
				onSubmit={data => {
					console.log(data)
				}}/>
	}

	return {
		renderPendingOrdersHeader,
		renderPendingOrdersContent,
		renderEmptyPendingOrders,
		renderPendingOrdersCalls,
		renderPendingOrdersMissedCall,
		renderPendingOrders,
		renderAllPendingOrders,
		renderReservationDialog
	}
};


//</editor-fold>
