import cms from 'cms'
import {loadProducts} from "./product-logic-be";

cms.socket.on('commit:handler:finish:Product', async () => {
	await loadProducts()
})
