module.exports = async function (updateCommit) {
	await require('./orderCommit')(updateCommit);
	await require('./reportCommit')(updateCommit);
	await require('./posCommit')(updateCommit);
	// await require('./inventory/inventoryCategoryCommit')(updateCommit);
	// await require('./inventory/inventoryCommit')(updateCommit);
}
