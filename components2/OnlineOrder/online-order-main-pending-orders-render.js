import { ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'

import {
	timeoutProgress,
	modemDeviceConnected,
	pendingOrders,
	calls,
	missedCalls,
	paymentIcon
} from './online-order-main-logic'
import {
	cancelMissedCallTimeout,
	deleteCall, deleteMissedCall
} from './online-order-main-logic-be'
import {$filters} from "../AppSharedStates";

//<editor-fold desc="ref">
export const selectedCustomer = ref({})
const dialog = ref({

})
//</editor-fold>

//<editor-fold desc="function">
/**
 *
 * @description
 * Remove missed call when openOrderDialog
 */
export function openOrderDialog({ customer, callId }, type, index) {
	//todo: fill this
	cancelMissedCallTimeout(callId)
	if (index) {
		calls.unshift({
			...missedCalls.value[index],
			type: 'missed'
		})
		deleteMissedCall(index)
	}
	selectedCustomer.value = customer
	/**
	 * Why used these code ?
	orderType.value = type
	router.push(
		{ path: '/pos-order-delivery' }
	)
	 */
}
export function openReservationDialog({ customer, callId }) {
	selectedCustomer.value = customer
	dialog.value.reservation = true
	cancelMissedCallTimeout()
}
export function getItemPrice(item) {
	//todo: fill this
	return 10
}
//</editor-fold>

//<editor-fold desc="pendingOrders">
export function renderPendingOrdersFactory () {
	const { t, locale } = useI18n()
	console.log((pendingOrders.value && pendingOrders.value.length))
	function renderPendingOrdersHeader() {
		return (
			<div className="header">
			<span>
				{t('onlineOrder.pendingOrders')}
			</span>
				{
					(pendingOrders.value && !!pendingOrders.value.length) &&
					<g-badge className="ml-1" inline modelValue={true} color="#4CAF50" v-slots={{
						'badge': () =>
							<div className="px-2">
								{pendingOrders.value.length}
							</div>
					}}>
					</g-badge>
				}
				<g-spacer></g-spacer>
				{
					(!modemDeviceConnected.value) &&
					<span style="color: #D32F2F">
          Modem not connected
        </span>
				}
			</div>
		)
	}

	function renderEmptyPendingOrders() {
		return (
			<div className="pending-orders--empty">
				<img alt src="/plugins/pos-plugin/assets/pending_order.svg"> </img>
				<p> {t('onlineOrder.noPending')} </p>
			</div>
		)
	}

	function renderPendingOrdersCalls() {
		return (
			<>
				{calls.value.map((call, i) =>
					<div className="pending-orders--call" key={`call_${i}`}>
						<div className="pending-orders--call-title">
							<div>
								{call.customer.name}
								<span> - </span>
								{call.customer.phone} </div>
							<g-spacer></g-spacer>
							<g-icon>
								icon-call
							</g-icon>
						</div>
						<p className="fs-small-2 text-grey-darken-1">
							Incoming call </p>
						<div className="pending-orders--call-buttons">
							<g-btn-bs className="flex-equal mr-2" border-color="#C4C4C4" onClick={() => deleteCall(i, call)}>
								<g-icon size="16">
									icon-cross-red
								</g-icon>
							</g-btn-bs>
							<g-btn-bs className="flex-equal mr-2" border-color="#C4C4C4" onClick={() => openReservationDialog(call)}>
								<g-icon size="16">
									icon-table-reservation
								</g-icon>
							</g-btn-bs>
							<g-btn-bs className="flex-equal mr-2" border-color="#C4C4C4"
							          onClick={() => openOrderDialog(call, 'pickup')}>
								<g-icon size="16">
									icon-take-away
								</g-icon>
							</g-btn-bs>
							<g-btn-bs className="flex-equal" border-color="#C4C4C4" onClick={() => openOrderDialog(call, 'delivery')}>
								<g-icon size="16">
									icon-delivery-scooter
								</g-icon>
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
					<div className="pending-orders--call b-red" key={`missed_call_${i}`}>
						<div className="pending-orders--call-title">
							<div>
								{call.customer.name} <span> - </span>
								{call.customer.phone} </div>
							<g-spacer></g-spacer>
							<g-icon size="20">
								icon-missed-call
							</g-icon>
						</div>
						<p className="fs-small-2 text-grey-darken-1">
							Missed call </p>
						<div className="pending-orders--call-buttons">
							<g-btn-bs className="flex-equal mr-2" border-color="#C4C4C4" onClick={() => deleteMissedCall(i)}>
								<g-icon size="16">
									icon-cross-red
								</g-icon>
							</g-btn-bs>
							<g-btn-bs className="flex-equal mr-2" border-color="#C4C4C4" onClick={() => openReservationDialog(call)}>
								<g-icon size="16">
									icon-table-reservation
								</g-icon>
							</g-btn-bs>
							<g-btn-bs className="flex-equal mr-2" border-color="#C4C4C4"
							          onClick={() => openOrderDialog(call, 'pickup', i)}>
								<g-icon size="16">
									icon-take-away
								</g-icon>
							</g-btn-bs>
							<g-btn-bs className="flex-equal" border-color="#C4C4C4"
							          onClick={() => openOrderDialog(call, 'delivery', i)}>
								<g-icon size="16">
									icon-delivery-scooter
								</g-icon>
							</g-btn-bs>
						</div>
					</div>
				)}
			</>
		)
	}

	function renderPendingOrdersTitle(order) {
		return (
			<g-card-title className="pending-orders--title">
				<div className="row-flex align-items-center flex-grow-1">
					{
						(order.type === 'delivery') &&
						<g-icon>
							icon-delivery-scooter
						</g-icon>
					}
					{
						(order.type === 'pickup') &&
						<g-icon>
							icon-take-away
						</g-icon>
					}
					<div className="fs-small-2 ml-1" style="max-width: calc(100% - 24px); line-height: 1.2">
          <span className="fs-small fw-700 text-indigo-accent-2">
            #{order.dailyId}
          </span>

						{order.customer ? order.customer.name : 'No customer name'} -
						{order.customer ? order.customer.phone : 'No customer phone'}
					</div>
				</div>
				<div className="row-flex justify-end align-items-center r" style="flex: 0 0 auto">
					{
						(order.deliveryTime) &&
						<span className="fw-700 fs-small ml-2 mr-2" style="text-transform: uppercase">
            {order.deliveryTime}
					</span>
					}
					{
						(order.timeoutDate && timeoutProgress.value[order._id]) &&
						<>
							<g-progress-circular rotate="-90" width="1.5" size="36" color="#E57373"
							                     value={timeoutProgress.value[order._id].progress}>
							</g-progress-circular>
							<div className="progress-remaining">
								{timeoutProgress.value[order._id].remaining}
							</div>
						</>
					}
				</div>
			</g-card-title>
		)
	}

	function renderPendingOrdersText(order) {
		<g-card-text>
			{
				(order.note) &&
				<div className="text-grey-darken-1 i mb-1" style="font-size: 13px; line-height: 16px">
					{t('onlineOrder.note')}: {order.note}
				</div>
			}
			{
				(order.type === 'delivery') &&
				<div className="row-flex">
					<div style="flex: 0 0 25px">
						<g-icon color="#9E9E9E" size="20">
							icon-place
						</g-icon>
					</div>
					<div style="max-width: calc(100% - 25px);" className="flex-equal pl-1">
						{`${order.customer.address} ${order.customer.zipCode}`}
					</div>
				</div>
			}
			{
				(order.items) &&
				<div>
					{order.items.map(item =>
						<div className="row-flex align-items-start">
							<div style="flex: 0 0 25px; font-weight: 700; font-size: 12px">
								{item.quantity}x
							</div>
							<div className="flex-equal fs-small-2 pl-1" style="word-break: break-all">

								{item.id && `${item.id}.`} {item.name}
								<span className="i text-grey">
								{getExtraInfo(item)}
							</span>
							</div>
							<div className="fs-small-2 ta-right">
								€{$filters.formatCurrency(getItemPrice(item), 2)} </div>
						</div>
					)} </div>
			}
			{
				(order.type === 'delivery') &&
				<div className="row-flex">
					<div className="flex-equal fw-700">
						{t('onlineOrder.shippingFee')} </div>
					<div className="fs-small-2 ta-right">
						€{$filters.formatCurrency(order.shippingFee, 2)} </div>
				</div>
			}
			{
				(order.discounts && order.discounts.length) &&
				<div>
					{order.discounts.map(discount =>
						<div className="row-flex align-items-start">
							<div>
							<span>
								{discount.coupon ? `Coupon ` : discount.name}
							</span>
								{
									(discount.coupon) &&
									<span style="color: #757575; font-style: italic">
									({discount.coupon})
								</span>
								}
							</div>
							<g-spacer></g-spacer>
							<div className="fs-small-2">
								-{t('common.currency', locale.value)}{$filters.formatCurrency(discount.value, 2)}
							</div>
						</div>
					)}
				</div>
			}
		</g-card-text>
	}

	function renderPendingOrdersActions(order) {
		return (
			<>
				{
					(order.declineStep2) &&
					<g-card-actions>
						<g-text-field-bs label={t('onlineOrder.reasonDecline')} v-model={order.declineReason} v-slots={{
							'append-inner': () =>
								<g-icon style="cursor: pointer" onClick={() => openDialogReason(order)}>
									icon-keyboard
								</g-icon>
						}}></g-text-field-bs>
					</g-card-actions>
				}
				{
					(order.confirmStep2 &&
						((order.type === 'delivery' && order.deliveryTime === 'asap')
							|| (order.type === 'pickup'))) &&
					<g-card-actions>
						<div class="w-100">
							<p class="ml-2 mb-1">
								{t('onlineOrder.settings.timeToComplete2')} (min)
							</p>
							<value-picker values={[15, 30, 45, 60]} defaultValue={defaultPrepareTime || 30} allow-custom v-model={order.prepareTime}></value-picker>
						</div>
					</g-card-actions>
				}
				<g-card-actions>
					{
						(!order.confirmStep2 && !order.declineStep2) &&
						<g-btn-bs height="54" width="60" border-color="#C4C4C4" text-color="black" onClick={withModifiers(() => onClickDecline(order), ['stop'])}>
							<g-icon size="14">
								icon-cross-red
							</g-icon>
						</g-btn-bs>
					}
					{
						(order.confirmStep2 || order.declineStep2) &&
						<g-btn-bs height="54" width="60" border-color="#C4C4C4" text-color="black" onClick={withModifiers(() => onBack(order), ['stop'])}>
							{t('onlineOrder.back')}
						</g-btn-bs>
					}
					{
						(order.declineStep2) ?
							<g-btn-bs height="54" background-color="#E0E0E0" text-color="black" style="flex: 1" onClick={() => declineOrder(order)}>
								Confirm
							</g-btn-bs>
							:
							<g-btn-bs height="54" background-color="#E0E0E0" class="pending-orders--btn-price" text-color="black" style="flex: 1" onClick={withModifiers(() => onClickAccept(order), ['stop'])}>
								{
									(paymentIcon.value[order.payment]) ?
										<img src={paymentIcon.value[order.payment]} alt={order.payment[0].type} style="height: 16px" class="mr-2"> </img>
										:
										<span class="mr-2"> {order.payment[0].type} </span>
								}
								<span>
									{t('common.currency', locale.value)}
									{$filters.formatCurrency(order.payment[0].value, 2)}
								</span>
							</g-btn-bs>
					}
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
				{renderPendingOrdersTitle(order)}
				{renderPendingOrdersText(order)}
				{renderPendingOrdersActions(order)}
			</g-card>
		))
	}

	function renderPendingOrdersContent() {
		return (
			<div class="content">
				{(!pendingOrders.value || !pendingOrders.value.length) && renderEmptyPendingOrders()}
				{renderPendingOrdersCalls()}
				{renderAllPendingOrders()}
			</div>
		)
	}

	function renderPendingOrders() {
		return (
			<div className="pending-orders pr-2">
				{renderPendingOrdersHeader()}
				{renderPendingOrdersContent()}
			</div>
		)
	}

	return {
		renderPendingOrdersHeader,
		renderPendingOrdersContent,
		renderEmptyPendingOrders,
		renderPendingOrdersCalls,
		renderPendingOrdersMissedCall,
		renderPendingOrders,
		renderAllPendingOrders
	}
};


//</editor-fold>
