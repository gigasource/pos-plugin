async function printerCommit(updateCommit) {
	if (!updateCommit || !updateCommit.methods) {
		const warningMsg = 'updateCommit or updateCommit.methods are not initialized!'
		console.warn(warningMsg)
		throw warningMsg
	}

	if (!updateCommit.methods.order)
		updateCommit.methods.order = {}

	updateCommit.methods['order'].printOrder = async function (commit) {
		try {
			if (commit.order._id) {
				const order = await cms.getModel('Order').findById(commit.order._id)
				commit.order.id = order.id
			}
			await cms.execPostAsync('run:print', null, [commit]);
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	}

	if (!updateCommit.methods.print)
		updateCommit.methods.print = {}

	updateCommit.methods.print.report = async function(commit) {
		try {
			await cms.execPostAsync('run:print', null, [commit]);
		} catch (e) {
			console.log('printerCommit:printReport')
		}
	}
}

module.exports = printerCommit;
