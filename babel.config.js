module.exports = {
	presets: [
		'@vue/cli-plugin-babel/preset'
	],
	plugins: ['@vue/babel-plugin-jsx', ["@babel/plugin-proposal-class-properties"]],
	ignore: ['**/webpack/**/']
}
