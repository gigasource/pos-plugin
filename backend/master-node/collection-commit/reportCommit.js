async function reportCommit(updateCommit) {
	updateCommit.registerMethod('report','print', async function(commit) {
		try {
			await cms.execPostAsync('run:print', null, [commit]);
		} catch (e) {
			console.log('printerCommit:printReport')
		}
	})
}

module.exports = reportCommit;
