import { ref, computed, withModifiers } from 'vue'
import {useI18n} from 'vue-i18n'
import {
	completeOrderDialogShow,
	dialogOrder
} from '../online-order-main-kitchen-orders-render'
import {
	declineOrder,
	completeOrder
} from '../online-order-main-logic-be'
import {
	getExtraInfo, getShippingFee
} from '../online-order-main-logic'
import { $filters } from '../../AppSharedStates'
import {
	getItemPrice
} from '../online-order-main-logic'
import orderUtil from "../../../components/logic/orderUtil";
import { genScopeId } from '../../utils';

export const totalWithShipping = computed(() => {
	const { shippingFee, vSum } = dialogOrder.value;
	return vSum + shippingFee
})
export const orderQuantity = computed(() => {
	return dialogOrder.value.items.reduce((acc, val) => acc + val.quantity, 0)
})

export const subTotal = computed(() => {
	dialogOrder.value.items.reduce((sum, item) => sum + orderUtil.getItemPrice(item) * item.quantity, 0)
})

export const paymentMethod = computed(() => {
	const { value, type } = dialogOrder.value.payment[0];
	let payment = cms.getList('PosSetting')[0].payment.find(i => i.name === type)
	return Object.assign(payment || {}, { value, type })
})

export async function onClickDecline(order) {
	await declineOrder(order)
	completeOrderDialogShow.value = false
}

export async function onClickComplete(order) {
	await completeOrder(order)
	completeOrderDialogShow.value = false
}

export function dialogCompleteOrderFactory(props) {
	const { t, locale } = useI18n()
	const renderContentInfo = function () {
		return (
			<div class="row-flex mb-2">
				<div style="flex: 0 0 30px">
					{ dialogOrder.value.type === 'delivery' &&  <g-icon>icon-delivery-scooter</g-icon> }
					{ dialogOrder.value.type === 'pickup' && <g-icon>icon-take-away</g-icon> }
				</div>
				<p>
          <span class="text-indigo-accent-2 fw-600">
	          #{dialogOrder.value.dailyId ? dialogOrder.value.dailyId : dialogOrder.value.id}
          </span>
					{dialogOrder.value.customer ? dialogOrder.value.customer.name : 'No customer name'} - {dialogOrder.value.customer ? dialogOrder.value.customer.phone : 'No customer phone'}
				</p>
				<g-spacer></g-spacer>
				<span class="fw-700 fs-large">
					{dialogOrder.value.date.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
				</span>
			</div>
		)
	}

	const renderContentAddress = function () {
		return (dialogOrder.value.type === 'delivery') &&
			<div class="row-flex mb-2">
				<div style="flex: 0 0 30px">
					<g-icon color="#9E9E9E" size="20">icon-place</g-icon>
				</div>
				<div class="col-10">
					{`${dialogOrder.value.customer.address} ${dialogOrder.value.customer.zipCode}`}
				</div>
			</div>
	}

	const renderContentItems = function () {
		return (dialogOrder.value.items) &&
			<div class="mb-2">
				{dialogOrder.value.items.map(item =>
					<div class="row-flex">
						<div class="fw-700" style="flex: 0 0 30px">{item.quantity}x</div>
						<div class="flex-equal">
							{item.name}
							<span class="i text-grey">{getExtraInfo(item)}</span>
						</div>
						<div class="col-2 fs-small-2 ta-right">
							{t('common.currency', locale.value)} {$filters.formatCurrency(getItemPrice(item))}
						</div>
					</div>
				)}
			</div>
	}

	const renderContentShippingFee = function () {
		return (dialogOrder.type === 'delivery') &&
			<div class="row-flex justify-between">
				<div>{t('onlineOrder.shippingFee')}:</div>
				<div class="ta-right">{t('common.currency', locale.value)} {$filters.formatCurrency(getShippingFee())}</div>
			</div>
	}

	const renderContentDiscount = function () {
		return dialogOrder.value.discounts.map(discount =>
			<div class="row-flex justify-between">
				<div>
          <span>{discount.coupon ? 'Coupon ' : discount.name}</span>
					{ (discount.coupon) && <span style="color: #757575; font-style: italic">({discount.coupon})</span> }
					:
				</div>
				<div class="ta-right">
					-{t('common.currency', locale.value)}{$filters.formatCurrency(discount.value)}
				</div>
			</div>
		)
	}

	const renderBtn = function () {
		return (!props.disabledBtn) &&
			<g-card-actions>
				{genScopeId(() => (<>
				    <g-btn-bs height="60" background-color="#E57373" text-color="white" class="flex-equal" onClick={withModifiers(() => onClickDecline(dialogOrder.value), ['stop'])}>
    					{t('onlineOrder.cancelOrder')}
    				</g-btn-bs>
    				<g-btn-bs height="60" background-color="#2979FF" text-color="white" class="flex-equal" onClick={withModifiers(() => onClickComplete(dialogOrder.value), ['stop'])}>
    					{t('onlineOrder.completeOrder')}
    				</g-btn-bs>
				</>))()}
			</g-card-actions>
	}

	const renderForwadedStore = function () {
		return (dialogOrder.value.forwardedStore) &&
			<g-card-actions class="forward-store">
				<b class="mr-1">From: </b>{dialogOrder.value.forwardedStore}
			</g-card-actions>
	}

	const renderDialogComplete = function () {
		return <>
			{
				dialogOrder.value &&
				<g-dialog v-model={completeOrderDialogShow.value} width="580px">
					<g-card class="px-3 pb-2">
						<g-card-title style="font-size: 20px">{t('onlineOrder.orderDetails')}</g-card-title>
						<g-card-text class="fs-small">
							{genScopeId(() => (<>
							    {renderContentInfo()}
    							{renderContentAddress()}
    							{renderContentItems()}
    							<div class="dashed-gradient"></div>
    							<div class="row-flex justify-between mt-2">
    								<div>{t('onlineOrder.total')} <b>{orderQuantity.value}</b> {t('onlineOrder.items')}</div>
    								<div class="ta-right">{t('common.currency', locale.value)} {$filters.formatCurrency(subTotal.value)}</div>
    							</div>
    							{renderContentShippingFee()}
    							{renderContentDiscount()}
    							<div class="dashed-gradient mt-2"></div>
    							<div class="row-flex justify-between mt-2"
    							     style="font-size: 15px; font-weight: 700; font-family: Verdana, sans-serif">
    								<div>{t('onlineOrder.total')}</div>
    								<div class="ta-right">
    									{t('common.currency', locale.value)} {$filters.formatCurrency(dialogOrder.value.vSum)}
    								</div>
    							</div>
    							<div class="row-flex justify-between mt-1"
    							     style="font-size: 15px; font-weight: 700; font-family: Verdana, sans-serif">
    								<div>Payment</div>
    								<div class="ta-right row-flex align-items-center" style="text-transform: capitalize">
    									{
    										(paymentMethod.value.icon) && <img src={paymentMethod.value.icon} style="height: 16px" class="mr-1"> </img>
    									}
    									<span>{paymentMethod.value.type}</span>
    								</div>
    							</div>
							</>))()}
						</g-card-text>
						{renderBtn()}
						{renderForwadedStore()}
					</g-card>
				</g-dialog>
			}
		</>
	}

	return {
		renderDialogComplete
	}
}
