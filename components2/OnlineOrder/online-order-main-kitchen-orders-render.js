//<editor-fold desc="kitchenOrders">
import { ref, withModifiers } from 'vue'
import {useI18n} from 'vue-i18n'
import {
	sortedKitchenOrders,
	getPendingOrderKitchenTime,
	getExtraInfo
} from "./online-order-main-logic";

export const completeOrderDialogShow = ref(false)
export const dialogOrder = ref(null)

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
		return (
			<g-card-title>
				<div className="fs-small-2 ml-1" style="max-width: calc(100% - 96px); line-height: 1.2">
          <span className="fs-small fw-700 text-indigo-accent-2">
            #{order.dailyId ? order.dailyId : order.id}
          </span>

					{order.customer ? order.customer.name : 'No customer name'} -
					{order.customer ? order.customer.phone : 'No customer phone'}
				</div>
				<g-spacer></g-spacer>
				<div className="kitchen-orders__timer" onClick={withModifiers(() => openCompleteDialog(order), ['stop'])}>
					{
						(order.type === 'delivery') &&
						<g-icon>
							icon-delivery-scooter
						</g-icon>
					}
					{
						(order.type === 'pickup') &&
						<g-icon>
							icon-take-away </g-icon>
					}
					<span className="fw-700 fs-small ml-2">
						{order.deliveryTime}
					</span>
				</div>
			</g-card-title>
		)
	}

	function renderKitchenOrdersText(order) {
		return (
			<g-card-text>
				{
					(order.note) &&
					<div className="text-grey-darken-1 i mb-1" style="font-size: 13px; line-height: 16px">
						Note: {order.note}
					</div>
				}
				{
					(order.type === 'delivery') &&
					<div className="row-flex">
						<div className="col-1">
							<g-icon color="#9E9E9E" size="20">
								icon-place
							</g-icon>
						</div>
						<div className="col-11 text-grey-darken-1">
							{`${order.customer.address} ${order.customer.zipCode}`}
						</div>
					</div>
				}
				{
					(order.items) &&
					<div className="row-flex">
						<div className="col-1" style="line-height: 20px">
							<g-icon color="#9E9E9E" size="20">
								icon-food
							</g-icon>
						</div>
						<div style="padding-top: 2px">
							{order.items.map(item =>
								<span>
                  <span className="fw-700">
                    {item.quantity}x </span>
                  <span className="mr-3" style="word-break: break-all">
                    {item.id && `${item.id}.`} {item.name}
                    <span className="i text-grey fs-small-2">
                      {getExtraInfo(item)}
                    </span>
                  </span>
                </span>
							)}
						</div>
					</div>
				}
				{
					(order.forwardedStore) &&
					<div className="row-flex">
						<div className="col-1 row-flex align-items-center">
							<g-icon color="#9E9E9E" size="17">
								icon-double-arrow-right
							</g-icon>
						</div>
						<div>
							{order.forwardedStore}
						</div>
					</div>
				}
			</g-card-text>
		)
	}

	function renderKitchenOrdersContent() {
		return (
			<div className="content">
				{
					(!sortedKitchenOrders.value || !sortedKitchenOrders.value.length) ?
						<div className="kitchen-orders--empty">
							<p>
								{t('onlineOrder.noKitchen')}
							</p>
						</div>
						:
						<>
							{sortedKitchenOrders.value.map((order, index) =>
								<g-card elevation="0" key={index}
								        style={[getPendingOrderKitchenTime(order) < 10 && {border: '1px solid #FF4452'}]}>
									{renderKitchenOrdersTitle(order)}
									{renderKitchenOrdersText(order)}
								</g-card>
							)}
						</>
				}
			</div>
		)
	}

	function renderKitchenOdrers() {
		return (
			<div className="kitchen-orders pl-2">
				{renderKitchenOrdersHeader()}
				{renderKitchenOrdersContent()}
			</div>
		)
	}

	return {
		renderKitchenOdrers,
		renderKitchenOrdersHeader
	}
}
//</editor-fold>
