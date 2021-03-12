import { watch, computed } from 'vue'
import { pendingOrders } from "./online-order-main-logic"


export function initBell(posSettings) {
	let isBellPlaying = false
	const repeat = computed(() => posSettings.value.onlineOrderSoundSetting ? (posSettings.value.onlineOrderSoundSetting.soundLoop === 'repeat') : false) // todo: add case repeat = true
	const playSound = computed(() => posSettings.value.onlineOrderSoundSetting ? posSettings.value.onlineOrderSoundSetting.sound : false)

	const bell = new Audio('/plugins/pos-plugin/assets/sounds/bell.mp3')
	watch(() => pendingOrders.value, async (newVal, oldVal) => {
		if (newVal.length > oldVal.length) {
			await playBell()
		}
	})

	async function playBell() {
		if (!playSound.value || isBellPlaying)
			return
		await bell.play()
	}

	bell.addEventListener('play', () => {
		isBellPlaying = true
	})

	bell.addEventListener('ended', () => {
		isBellPlaying = false
	})
}
