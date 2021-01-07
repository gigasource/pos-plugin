const ModuleFederationPlugin = require("webpack").container.ModuleFederationPlugin;
const fs = require('fs')
const path = require('path')

const listComponent = []

function getAllVueComponent(curPath) {
	const files = fs.readdirSync(curPath)
	for (let file of files) {
		const filePath = path.join(curPath, file)
		const stat = fs.lstatSync(filePath)
		if (stat.isDirectory()) {
			getAllVueComponent(filePath)
		} else if (filePath.endsWith('.vue')) {
			listComponent.push({
				file,
				filePath
			})
		}
	}
}

module.exports = {
	configureWebpack: {
		entry: [ path.join(__dirname, 'index.js')],
		optimization: {
			minimize: false
		},
		plugins: [
			new ModuleFederationPlugin({
				name: 'posPlugin',
				filename: 'remoteEntry.js',
				exposes: listComponent,
				shared: {
					vue: {
						singleton: true
					},
					'pos-vue-framework': {
						singleton: true
					}
				}
			})
		]
	}
}
