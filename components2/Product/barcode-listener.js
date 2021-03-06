import _ from 'lodash'
export const barcodeHook = new (require('schemahandler/hooks/hooks'))();

let inputString = ''

const debounceFn = _.debounce(() => {
	if (inputString.length >= 10) {
		barcodeHook.emit('newBarcode', inputString)
	}
	inputString = ''
}, 90)

function handleKeyup(e) {
	// check keyboard event is number or alphabet character
	if ((e.which >= 48 && e.which <= 57) || (e.which >= 65 && e.which <= 90) || (e.which >= 97 && e.which <= 122)) {
		inputString += String.fromCharCode(e.which)
	} else {
		return e.preventDefault()
	}
	debounceFn()
}

export function setHandleKeyupBarcode() {
	document.addEventListener('keyup', handleKeyup)
}

export function removeHandleKeyupBarcode() {
	document.removeEventListener('keyup', handleKeyup)
}
