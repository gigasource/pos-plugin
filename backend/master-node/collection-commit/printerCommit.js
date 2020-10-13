async function printerCommit(updateCommit) {
	updateCommit.methods['order'].printOrder = async function (commit) {
		try {
			if (commit.order._id) {
				const order = await cms.getModel('Order').findById(commit.order._id)
				commit.order.id = order.id
			}
			await cms.execPostAsync('run:print', null, [commit]);
			if (commit.data && commit.data.cb) commit.data.cb();
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	}
}

module.exports = printerCommit;
