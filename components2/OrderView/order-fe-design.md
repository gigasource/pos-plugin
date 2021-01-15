* [x] isMobile: pos-order -> share
* [_] currentOrder

* [x] isolate editMode -> another file (use PortalVue)
* [_] storeLocale

* [_] createOrder
* [_] addProduct
* [_] changeItemQuantity
* [_] lần đầu create trên frontend : how to know ??
* [_]

* [x] takeAway logic
* [_] date logic
* [x] course:
    * [x] logic: 0: takeAway, 1: default
* [x] modifiers
* [_] tiền trả lại cashback
* [_] separate

* [_] table truyền vào như thế nào ?
* voucher:
* [x] item.quantityModifier : 
* [x] order has change : +- quantity to sent
* [x] xử lý order đã có từ backend
* [x] mock_order 
* [x] logic: nếu như backend set quantity = 0 -> ko show ra, còn frontend -> vẫn show ra
* [_] split order
* [_] dialog singleton : how to open them
* [_] payment
* [_] saveOrderTable (sendToKitchen) refactor
* [_] takeAway -> table có tính chất takeAway : how to test vue route -> setup thử xem thế nào
* [_] posOrder2 test snapshot trước -> easy hơn
* [x] pos layout -> convert now
* [x] pos layout
  * [_] snapshot for ui
  * [x] singleton setting ui
  * [_] categories: test/mock-db
  * [_] products: test/mock-db
  * [_] actionMode: test/mock-db
* [_] split order
  * [_] test backend
* [_] test thu cho khi ghep vao no se nhu the nao ?

```jsx
//addVoucher
this.addProductToOrder({
  name: 'Voucher',
  price: +value,
  isVoucher: true
})
//redeemVoucher
this.addProductToOrder({
  name: 'Redeemed Voucher',
  price: -value,
  isVoucher: true
})
```


items -> nested items

Sidebar : header + treeview + footer
header: -> portal sidebarHeader
const sidebarHeader = function (children) {
  return <div>{children}</div>
}

treeview -> customize duoc 1 so vi tri

const footer  
