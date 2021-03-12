* [x] isMobile: pos-order -> share
* [x] currentOrder

* [x] isolate editMode -> another file (use PortalVue)
* [x] storeLocale

* [x] createOrder
* [x] addProduct
* [x] changeItemQuantity
* [x] lần đầu create trên frontend : how to know ??

* [x] takeAway logic
* [_] date logic
* [x] course:
    * [x] logic: 0: takeAway, 1: default
* [x] modifiers
* [x] tiền trả lại cashback
* [x] separate

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
  * [x] snapshot for ui
  * [x] singleton setting ui
  * [x] categories: test/mock-db
  * [x] products: test/mock-db
  * [x] actionMode: test/mock-db
  

* [x] voucher
* [_] binding order-ui to work with backend
* [_] split order
  * [_] test backend
* [_] move items
* [_] move items -> test backend
* [x] tip -> vSum 
* [x] cashback -> payment > vSum -> cashback

* [_] report
* [_] test thu cho khi ghep vao no se nhu the nao ?
* [x] compact order
* [_] case modifiers

* [_] use reactive to gen mongo commit (snapshot base)
  * [_] use rdiff
  * [_] should use schema to make commit to one item in array ??
  
* [_] new concept for buildform

```jsx

```


items -> nested items

Sidebar : header + treeview + footer
header: -> portal sidebarHeader
const sidebarHeader = function (children) {
  return <div>{children}</div>
}

treeview -> customize duoc 1 so vi tri

const footer  
