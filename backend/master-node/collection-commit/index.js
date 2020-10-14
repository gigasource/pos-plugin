module.exports = async function (updateCommit) {
	await require('./orderCommit')(updateCommit);
	await require('./reportCommit')(updateCommit);
}
