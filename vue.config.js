const ModuleFederationPlugin = require("webpack").container.ModuleFederationPlugin;
const fs = require('fs')
const path = require('path')

const listComponent = {}

function getAllVueComponent(manifestPath) {
	const manifest = require(manifestPath)
	manifest.files.forEach(file => {
		if (file.loader.type === 'route') {
			listComponent[file.loadPath] = path.resolve(manifestPath, '..', file.filePath)
		}
	})
}

getAllVueComponent(path.resolve(__dirname, path.resolve(__dirname, './manifest.js')))

console.log(listComponent)

module.exports = {
	publicPath: '/plugins',
	chainWebpack(config) {
		config.module.rule('scss')
			.oneOf('vue')
			.use('resolve-url-loader')
			.loader('resolve-url-loader')
			.before('sass-loader')
			.end()
			.use('sass-loader')
			.loader('sass-loader')
			.tap(options => ({
				...options,
				sourceMap: true,
			}))
	},
	transpileDependencies: ['schemahandler'],
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
					},
					'vue-router': {
						singleton: true
					},
					'portal-vue/dist/portal-vue.esm': {
						singleton: true
					}
				}
			})
		]
	}
}
