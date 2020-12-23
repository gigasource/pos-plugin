import { ref } from 'vue';

const ReservationModel = cms.getModel('Reservation');

export const reservations = ref([])
export const reservationSetting = ref({})

export async function getReservations(date = new Date(), status = 'all') {
  const dateTo = dayjs(date).startOf('day').add(1, 'day').toDate(),
    dateFrom = dayjs(date).startOf('day').toDate()
  reservations.value = await ReservationModel.find({
    status: (status === 'all' ? { $in: ['pending', 'completed'] } : status),
    date: { $gte: dateFrom, $lt: dateTo }
  })
}

export async function updateReservation(_id, change) {
  await ReservationModel.findOneAndUpdate({ _id }, change)
  cms.socket.emit('rescheduleReservation', _id, change)
}

export async function completeReservation(_id) {
  await updateReservation(_id, { status: 'completed' })
  const reservation = reservations.value.find(r => r._id === _id)
  reservation.status = 'completed'
}

export async function removeReservation(_id) {
  await updateReservation(_id, { status: 'declined' })
  const index = reservations.value.findIndex(r => r._id === _id)
  reservations.value.splice(index, 1)
  cms.socket.emit('updateOnlineReservation', _id, 'delete')
}

async function checkReservationDay(date) {
  const dateTo = dayjs(date).startOf('day').add(1, 'day').toDate(),
    dateFrom = dayjs(date).startOf('day').toDate()
  const _reservations = await ReservationModel.find({date: { $gte: dateFrom, $lte: dateTo }, status: {$ne: 'declined'}})
  return _reservations && _reservations.length > 0
}

async function createReservation(reservation) {
  const res = await ReservationModel.create(reservation)
  cms.socket.emit('scheduleNewReservation', res)
  cms.socket.emit('updateOnlineReservation', res._id, 'create')
}

export async function getReservationSetting() {
  const posSetting = await cms.getModel('PosSetting').findOne()
  if (posSetting) {
    reservationSetting.value = posSetting.reservation || {}
  }
}
