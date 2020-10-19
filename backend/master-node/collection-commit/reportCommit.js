const Queue = require('better-queue');

async function reportCommit(updateCommit) {
	const TYPENAME = 'report';

	if (!updateCommit[TYPENAME]) {
		updateCommit[TYPENAME] = {}
		updateCommit[TYPENAME].queue = new Queue(async (data, cb) => {
			const { commits } = data;
			for (let commit of commits) {
				await updateCommit.getMethod(TYPENAME, commit.action)(commit);
			}
			cb(null);
		});
		updateCommit[TYPENAME].queue.pause();
		updateCommit.registerMethod(TYPENAME, 'resumeQueue', function() {
			updateCommit[TYPENAME].queue.resume();
		})
	}

	updateCommit.registerMethod(TYPENAME, 'doTask', async function(commits) {
		updateCommit[TYPENAME].queue.push({
			commits
		})
	})

	updateCommit.registerMethod(TYPENAME, 'print', async function(commit) {
		try {
			await cms.execPostAsync('run:print', null, [commit]);
		} catch (e) {
			console.log('printerCommit:printReport')
		}
	})

	updateCommit.registerMethod(TYPENAME,'checkCommitExist', async function({ commitId }) {
		return false;
	})

	updateCommit.registerMethod(TYPENAME,'setHighestCommitId', async function(commit) {
	})

	updateCommit.registerMethod(TYPENAME, 'resumeQueue', function() {
		updateCommit[TYPENAME].queue.resume();
	})

	updateCommit.registerMethod(TYPENAME, 'requireSync', function () {
		return false;
	})

	updateCommit.registerMethod(TYPENAME, 'checkHighestCommitId', function () {
		return 0;
	})
}

module.exports = reportCommit;
