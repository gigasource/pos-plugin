export default function (component) {
	return {
		name: 'App',
		components: {
			Component: component
		},
		render() {
			return <Component/>
		}
	}
}
