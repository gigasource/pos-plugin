import {ref, computed} from 'vue'
import dayjs from 'dayjs'
import cms from 'cms';
import { posSettings } from '../AppSharedStates';
/**
 * Get reservations for specified date & status
 * @param date specified date or new Date() object if not provided
 * @param status 'all' | 'pending' | 'completed' | 'declined'
 * @return {Promise<*>}
 */
export async function getReservations(date = new Date(), status = 'all') {
  const currentDate = dayjs(date).startOf('day')
  return await cms.getModel('Reservation').find({
    status: (status === 'all' ? { $in: ['pending', 'completed'] } : status),
    date: { $gte: currentDate.toDate(), $lt: currentDate.add(1, 'day').toDate() }
  })
}


export const todayPendingReservation = ref(null)
/**
 * Update today pending reservations
 * @return {Promise<Number>} the number of pending reservations
 */
export async function updatePendingReservationsLength() {
  const today = dayjs().startOf('day')
  const reservations = await cms.getModel('Reservation').find({
    status: 'pending',
    date: { $gte: today.toDate(), $lt: today.add(1, 'day').toDate() }
  })
  todayPendingReservation.value = reservations.length
}

/**
 * Update specified reservation
 * @param _id
 * @param change
 * @return {Promise<void>}
 */
export async function updateReservation(_id, change) {
  await cms.getModel('Reservation').findOneAndUpdate({ _id }, change)
  cms.socket.emit('rescheduleReservation', _id, change)
}

export const reservationSetting = computed(() => {
  return posSettings.value && posSettings.value.reservation || {}
})

// store selected reservation, which will be used to remove, modify, update, etc
export const selectedReservation = ref({})

// object contain information whether reservation dialog will be shown or not, in edit mode or add
export const reservationDialog = ref({
  show: false,
  editMode: false
})
