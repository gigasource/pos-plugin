import {ref, computed} from 'vue'
import dayjs from 'dayjs'
import cms from 'cms';
import { posSettings } from '../AppSharedStates';

export const reservationSetting = computed(() => {
  return (posSettings.value && posSettings.value.reservation) || {}
})

let _reservationBell = null
export const reservationBell = computed(() => {
  if (!reservationSetting.value.soundNotification)
    return null;

  if (_reservationBell == null)
    _reservationBell = new Audio('/plugins/pos-plugin/assets/sounds/reservation-bell.mp3')

  return _reservationBell
})

export async function getReservations(date = new Date(), status = 'all') {
  const currentDate = dayjs(date).startOf('day')
  return await cms.getModel('Reservation').find({
    status: (status === 'all' ? { $in: ['pending', 'completed'] } : status),
    date: { $gte: currentDate.toDate(), $lt: currentDate.add(1, 'day').toDate() }
  })
}

export const todayPendingReservation = ref(0)
export async function updateTodayPendingReservations() {
  const today = dayjs().startOf('day')
  const reservations = await cms.getModel('Reservation').find({
    status: 'pending',
    date: { $gte: today.toDate(), $lt: today.add(1, 'day').toDate() }
  })
  todayPendingReservation.value = reservations.length
}

export async function updateReservation(_id, change) {
  await cms.getModel('Reservation').findOneAndUpdate({ _id }, change)
  cms.socket.emit('rescheduleReservation', _id, change)
}

export const selectedReservation = ref({})

export const showReservationDialog = ref(false)
export const reservationDialogEditMode = ref(false)

updateTodayPendingReservations()
