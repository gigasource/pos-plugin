const { VueLoaderPlugin } = require('vue-loader')
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path')
const webpack = require('webpack')

module.exports = async function (options) {
	const config = {
		entry: options.componentPath,
		output: {
			libraryTarget: 'commonjs2',
			publicPath: '', // prevent prefix 'auto'
			path: path.resolve(__dirname, '../../dist_test')
		},
		resolve: {
			extensions: ['.vue', '.jsx', '.js', '.json'],
			alias: {
				vue: "@vue/runtime-dom",
			},
		},
		externals: {
			vue: 'vue'
		},
		optimization: {
			minimize: false,
		},
		module: {
			rules: [
				{
					test: /\.vue$/,
					use: "vue-loader",
				},
				{
					test: /\.png$/,
					use: {
						loader: "url-loader",
						options: { limit: 8192 },
					},
				},
				{
					test: /\.js?$/,
					loader: "babel-loader"
				},
				{
					test: /\.css$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader,
						},
						"css-loader",
					],
				},
			],
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename: "[name].css",
			}),
			new VueLoaderPlugin(),
			new WebpackManifestPlugin({ fileName: 'ssr-manifest.json' })
		]
	}

	return new Promise((resolve, reject) => {
		webpack(config, (err, stats) => {
			if (err) {
				return reject(err)
			}
			if (stats.hasErrors()) {
				return reject(stats.compilation.errors)
			}
			console.log('Build complete.')
			resolve()
		})
	})
}
