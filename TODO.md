Chung:
 - pos-payment: Lỗi khi click vào item (xem itemsRenderFactory)
   (Retail -> chọn item(s) -> bấm toPayment button -> bấm item trong màn pos-payment)
 - Pairing device trong firstTimeSetup không work trên code mới của online-order.

POS Restaurant:
 - hardwares
 - tách setting chung trong PosSettings sang SystemSetting để share cho mọi máy trong hệ thống.
 - [Bug] inventory history không hiện ngay khi vào history, phải chuyển qua lại date-time-picker thì mới hiện.
 - ...

POS Retail:
 - Retail customer (đang làm)
 - Retail function buttons
 - Implement Quick Cash button trong PosRetailCart.vue
 - Mua hàng: 
    - inventory chưa trừ
    - inventory history chưa log.
    
QA Bugs:
https://gigasource.sharepoint.com/sites/dev/_layouts/OneNote.aspx?id=%2Fsites%2Fdev%2FShared%20Documents%2FCss%20Vue%20Component%20Materialize%2FMaterialize%20vue&wd=target%28Task.one%7CFCA2D0D2-D007-4B60-AA2A-163AAB3998DA%2FQA%20cho%20Huy%20%2825%5C%2F2%5C%29%7C1E8F0DC7-6BB1-4737-B893-F1DC383CE531%2F%29
onenote:https://gigasource.sharepoint.com/sites/dev/Shared%20Documents/Css%20Vue%20Component%20Materialize/Materialize%20vue/Task.one#QA%20cho%20Huy%20(25/2)&section-id={FCA2D0D2-D007-4B60-AA2A-163AAB3998DA}&page-id={1E8F0DC7-6BB1-4737-B893-F1DC383CE531}&end
