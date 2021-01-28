/*jest*/ console.log(`mock-date:`, new Date())

import { computed, ref, watch } from 'vue';
import {
  reservationSetting,
  selectedReservation,
  reservationDialog,
  updatePendingReservationsLength,
  getReservations,
  updateReservation,
} from './reservation-shared';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import weekday from 'dayjs/plugin/weekday'
dayjs.extend(isBetween)
dayjs.extend(weekday)

import _ from 'lodash';
import cms from 'cms'

import { formatDate } from '../utils';

// days in week
export const week = ref([])
export async function genWeek(date) {
  let _week = []
  const dateObj = dayjs(date)
  for (let i = 0; i < 7; i++) {
    const weekday = dateObj.weekday(i)
    const hasReservation = await hasReservationAt(weekday.toDate())
    _week.push({
      date: weekday,
      hasReservation
    })
  }
  week.value = _week
}
export async function prevWeek() {
  const date = week.value[0].date.add(-7, 'day').toDate()
  await genWeek(date)
}
export async function nextWeek() {
  const date = week.value[0].date.add(7, 'day').toDate()
  await genWeek(date)
}
export async function backToToday() {
  date.value = new Date()
  await genWeek(date.value)
}
export async function hasReservationAt(date) {
  const dateTo = dayjs(date).startOf('day').add(1, 'day').toDate(),
      dateFrom = dayjs(date).startOf('day').toDate()
  const _reservations = await cms.getModel('Reservation').find({date: { $gte: dateFrom, $lte: dateTo }, status: {$ne: 'declined'}})
  return _reservations && _reservations.length > 0
}

// date
export const date = ref(new Date())
export const formattedDate = computed(() => formatDate(date.value))
export const chooseDate = date => date.value = date.toDate()
watch(() => date.value, async (selectedDate) => {
  await genReservations(selectedDate, status.value)
})

// status
export const status = ref('all')
watch(() => status.value, async (newStatus) => {
  await genReservations(data.value, newStatus)
})

//
export const reservations = ref([])
export const reservationInHours = computed(() => {
  let hours = [], start = 0, end = 24
  const setting = reservationSetting.value || {}
  //
  if (setting.openHours) {
    const weekday = dayjs(date.value).day() === 0 ? 6 : dayjs(date.value).day() - 1
    setting.openHours.forEach(({ dayInWeeks, closeTime, openTime }) => {
      if (dayInWeeks[weekday]) {
        if (start === 0 || +openTime.split(':')[0] < start)
          start = +openTime.split(':')[0]
        if (end === 24 || +closeTime.split(':')[0] > end)
          end = +closeTime.split(':')[0] + (+closeTime.split(':')[2] > 0 ? 1 : 0)
      }
    })
  }
  //
  for (let i = start; i < end; i++) {
    const time = `${_.padStart(i, 2, '0')}h`
    const hour = dayjs(date.value).hour(i).startOf('hour'),
        nextHour = dayjs(date.value).hour(i + 1).startOf('hour')
    // The logic seem weird but acceptable, see test cases "reservation logic > reservationInHours"
    const _reservations = reservations.value.filter(r => dayjs(r.date).isBetween(hour, nextHour, null, '[)'))
    if (setting.hideEmpty) {
      if (_reservations.length > 0)
        hours.push({ time, reservations: _.sortBy(_reservations, r => r.date) })
    } else {
      hours.push({ time, reservations: _.sortBy(_reservations, r => r.date) })
    }
  }
  return hours
})
export async function genReservations(_date, _status) {
  _date = _date || date.value
  _status = _status || status.value
  reservations.value = await getReservations(_date, _status)
  await updatePendingReservationsLength()
}
// complete
export async function completeReservation(reservation) {
  if (reservation.status === 'completed')
    return
  reservation.status = 'completed'
  await updateReservation(reservation._id, { status: 'completed' })
  await updatePendingReservationsLength()
}
// modify
export const showNoticeDialog = ref(false)
export function showEditDialog(reservation) {
  if (reservation.status === 'completed') {
    showNoticeDialog.value = true
    return
  }
  selectedReservation.value = reservation
  reservationDialog.value = { show: true, editMode: true }
}
// decline
export const showDeleteDialog = ref(false)
export async function showRemoveDialog(reservation) {
  selectedReservation.value = reservation
  showDeleteDialog.value = true
}
export async function confirmRemove() {
  showDeleteDialog.value = false
  const _id = selectedReservation.value._id
  await updateReservation(_id, { status: 'declined' })
  cms.socket.emit('updateOnlineReservation', _id, 'delete')
  const index = reservations.value.findIndex(r => r._id === _id)
  reservations.value.splice(index, 1)
  if (reservations.value.length === 1) // TODO: Why we do it?
    await genWeek(date.value)
  await updatePendingReservationsLength()
}
