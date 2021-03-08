import { watch } from 'vue'
import { pendingOrders } from "./online-order-main-logic"

watch(() => pendingOrders.value, async (newVal, oldVal) => {
	if (newVal.length > oldVal.length) {
		await playBell()
	}
})

export const bell = new Audio('/plugins/pos-plugin/assets/sounds/bell.mp3')
let isBellPlaying
let repeat
let playSound


bell.addEventListener('play', () => {
	isBellPlaying = true
})

bell.addEventListener('ended', () => {
	isBellPlaying = false
})

export async function playBell() {
	if (!playSound || isBellPlaying)
		return
	await bell.play()
}

export function initBell(posSettings) {
	watch(() => posSettings.value, () => {
		repeat = (posSettings.value.onlineOrderSoundSetting.soundLoop === 'repeat')
		playSound = posSettings.value.onlineOrderSoundSetting.sound
		console.log(repeat)
		console.log(playSound)
	})
	isBellPlaying = false
	repeat = posSettings.value.onlineOrderSoundSetting ? (posSettings.value.onlineOrderSoundSetting.soundLoop === 'repeat') : false // todo: add case repeat = true
	playSound = posSettings.value.onlineOrderSoundSetting ? posSettings.value.onlineOrderSoundSetting.sound : false
}
