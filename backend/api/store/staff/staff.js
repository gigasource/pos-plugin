const {reverseGeocodePelias} = require("../../devices/gsms-devices");

const dayjs = require('dayjs')
const _ = require('lodash')
const axios = require('axios')

async function getStaff({storeId, deviceId}) {
  if (storeId && deviceId) {
    return cms.getModel('Staff').findOne({device: deviceId, store: storeId})
  } else {
    throw "Staff's id or Device's id is required"
  }
}

async function getStaffs({storeId}) {
  if (!storeId)
    throw "Missing store's id"
  return await cms.getModel('Staff').find({store: storeId, active: true})
}

async function createStaff({ name, role, avatarUrl, active = true, storeId, deviceId }) {
  if (!storeId)
    throw "Missing store's id"

  if (!deviceId)
    throw "Missing device's id"

  return await cms.getModel('Staff').create({
    name,
    role,
    active,
    avatarUrl,
    store: storeId,
    device: deviceId
  })
}

async function updateStaff({ staffId, name, role, active, avatar }) {
  if (!staffId)
    throw "Missing staff's id"

  const changes = {}
  if (name) changes.name = name
  if (role) changes.role = role
  if (active != null && active !== changes.active) changes.active = active
  if (avatar !== changes.avatar) changes.avatar = avatar // allow to remove avatar

  return await cms.getModel('Staff').update({_id: staffId}, changes, { new: true })
}

function removeStaff({ staffId }) {
  // not impl
}

async function processCheckInCheckOut({staffId, type, datetime, storeId, coords}) {
  if (!storeId)
    throw "Missing store's id"
  if (!staffId)
    throw "Missing staff's id"
  if (type !== 'in' && type !== 'mark' && type !== 'out')
    throw "Invalid check type"
  // validate time??

  let note;
  if (type === 'mark') {
    note = 'success'
  } else {
    const distanceThreshold = 500; // default 500m
    async function getCoordsFromGooglePlaceId(id) {
      try {
        const {data} = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${id}&key=${global.APP_CONFIG.mapsApiKey}`)
        const location = data.result.geometry.location
        return {lat: location.lat, long: location.lng}
      } catch (e) {
        console.log(e)
        return null
      }
    }

    try {
      const store = await cms.getModel('Store').findOne({_id: storeId}).lean()
      const srcCoords = store.coordinates || await getCoordsFromGooglePlaceId(store.googleMapPlaceId)
      const geolib = require('geolib')
      const distance = geolib.getPreciseDistance({latitude: srcCoords.lat, longitude: srcCoords.long}, coords)
      if (isNaN(distance)) {
        throw "Error coordinates"
      }
      console.log(distance)
      if (distance < distanceThreshold) {
        note = 'success'
      } else {
        note = 'gps-error'
      }
    } catch (e) {
      console.log('Error when calculating check event distance', e);
      note = 'gps-error'
    }
  }

  const formattedLocation = await reverseGeocodePelias(coords.latitude, coords.longitude);

  return await cms.getModel('CheckEvent').create({
    staff: staffId,
    store: storeId,
    type,
    datetime: new Date(datetime),
    note,
    coords: {lat: coords.latitude, long: coords.longitude},
    location: formattedLocation
  })
}

async function getLastCheckInCheckOut(staffId) {
  if (!staffId) throw "Missing staff's id"

  const checkIns = await cms.getModel('CheckEvent').find({staff: staffId, type: 'in'}).sort({datetime: -1})
  const checkOuts = await cms.getModel('CheckEvent').find({staff: staffId, type: 'out'}).sort({datetime: -1})

  return {in: checkIns.length > 0 ? checkIns[0].datetime : null, out: checkOuts.length > 0 ? checkOuts[0].datetime : null}
}

async function calculateWorkTimeReport(staffId, startDate, endDate) {
  function getHourDiff(start, end) {
    const diff = end - start
    return diff / (3600 * 1000)
  }

  const allEvents = await cms.getModel('CheckEvent').find({staff: staffId, datetime: {$gte: startDate, $lte: endDate}}).sort({datetime: 1})
  const report = allEvents.reduce((acc, e, idx) => {
    // cal gps error times
    if (e.note === 'gps-error') {
      acc.gpsError += 1
    }

    // cal missing attendance
    if (acc.lastEvent
        && (acc.lastEvent.type === e.type
            || dayjs(acc.lastEvent.datetime).date() !== dayjs(e.datetime).date())
            || (e.type === 'in' && idx === allEvents.length - 1)) {
      if (dayjs(acc.lastEvent.datetime).date() !== dayjs(e.datetime).date()) {
        acc.missingClock += 2
      } else {
        acc.missingClock += 1
      }
    }

    // cal total attendance hours
    if (acc.lastEvent
        && acc.lastEvent.type === 'in' && e.type === 'out'
        && dayjs(acc.lastEvent.datetime).date() === dayjs(e.datetime).date()) {
      acc.total += getHourDiff(acc.lastEvent.datetime.getTime(), e.datetime.getTime())
    }

    // every clock-in = 1 attendance
    if (e.type === 'in' || dayjs(acc.lastEvent.datetime).date() !== dayjs(e.datetime).date()) {
      acc.attendance += 1
    }

    if (e.type === 'in' || e.type === 'out') {
      acc.lastEvent = e
    }
    return acc
  }, {total: 0, gpsError: 0, missingClock: 0, attendance: 0, lastEvent: null})
  return {totalHours: report.total, missingClock: report.missingClock, gpsError: report.gpsError, totalAttendance: report.attendance};
}

function getWorkTimeReport({staffId, startDate, endDate}) {
  if (!staffId) throw "Missing staff's id"
  startDate = new Date(startDate)
  if (isNaN(startDate)) throw "Invalid start date"
  endDate = new Date(endDate)
  if (isNaN(endDate)) throw "Invalid end date"

  return calculateWorkTimeReport(staffId, startDate, endDate)
}

async function getTimeSheetDetail({staffId, startDate, endDate}) {
  if (!staffId) throw "Missing staff's id"
  startDate = new Date(startDate)
  if (isNaN(startDate)) throw "Invalid start date"
  endDate = new Date(endDate)
  if (isNaN(endDate)) throw "Invalid end date"

  function _getDateBoundary(dateIn, dateOut) {
    const today = dayjs().format('YYYY-MM-DD')
    dateIn = dateIn || dayjs(`${today} 00:00:00`)
    dateOut = dateOut || dayjs(`${today} 23:59:59`)

    const theDayBeforeDateIn =  dayjs(`${dayjs(dateIn).subtract(1, 'day').format('YYYY-MM-DD')}T00:00:00`)
    const theDayDateIn = dayjs(dateIn)
    const theDayDateOut = dayjs(dateOut)
    const theDayAfterDateOut = dayjs(`${dayjs(dateOut).add(1, 'day').format('YYYY-MM-DD')}T23:59:59`)

    return {
      theDayBeforeDateIn,
      theDayDateIn,
      theDayDateOut,
      theDayAfterDateOut
    }
  }

  async function _createInOutPairs(checkEventsOfStaff, theDayDateIn, theDayDateOut) {
    checkEventsOfStaff = _.orderBy(checkEventsOfStaff, ['datetime'], ['asc'])
    // check event before (new in)
    const ceBefore = _.filter(checkEventsOfStaff, ce => dayjs(ce.datetime).isBefore(theDayDateIn, 'date'))
    // check event between (new in-out)
    const ceIn = _.filter(checkEventsOfStaff, ce => dayjs(ce.datetime).isBetween(theDayDateIn, theDayDateOut, 'date','[]'))
    // check event after (new out)
    const ceAfter = _.filter(checkEventsOfStaff, ce => dayjs(ce.datetime).isAfter(theDayDateOut, 'date'))

    // add last item in previous day if staff work over time
    if (ceIn.length > 0 && ceBefore.length > 0  && _.first(ceIn).type === 'out' && _.last(ceBefore).type === 'in') {
      ceIn.splice(0, 0, _.last(ceBefore))
    }
    // add first item in previous day if staff work over time
    if (ceIn.length > 0 && ceAfter.length > 0 && _.last(ceIn).type === 'in' && _.first(ceAfter).type === 'out') {
      ceIn.push(_.first(ceAfter))
    }

    let inOutPair = {marks: []}
    const checkEventDates = {}
    let lastDate;

    _.each(ceIn, (checkEvent, index) => {
      const date = dayjs(checkEvent.datetime).format('YYYY-MM-DD')

      // if checkEventDates map doesn't contain current date then create new
      if (!_.has(checkEventDates, date))
        checkEventDates[date] = []

      if (checkEvent.type === 'in') {
        // current is checkIn, and previous is checkIn -> missing checkOut
        // add previous inOutPair (missing out) to checkEventDate map for current date.
        // then init new inOutPair object
        if (inOutPair.in) {
          inOutPair.hours = null
          checkEventDates[lastDate].push(inOutPair)
          inOutPair = {marks: []}
        }

        // add in info to current inOutPair
        const checkIn = checkEvent.datetime
        inOutPair.in = {
          _id: checkEvent._id,
          staff: checkEvent.staff,
          store: checkEvent.store,
          value: checkIn,
          formattedValue: dayjs(checkIn).format('HH:mm'),
          note: checkEvent.note,
          coords: checkEvent.coords,
          location: checkEvent.location,
        }
        // at this point, lastDate will be the date of this check in event
        // this is to fix the bug when clock out miss punch happens, the check in will be unexpectedly merged to next day
        lastDate = date

        // is last and found check in, add inOutPair missing out checkEventDate map for current date.
        if (index === ceIn.length - 1) {
          inOutPair.hours = null
          checkEventDates[date].push(inOutPair)
          inOutPair = {marks: []}
        }
      } else if (checkEvent.type === 'mark') {
        // add mark events (continuous check-in in new place) between an in-out pair
        const mark = checkEvent.datetime
        inOutPair.marks.push({
          _id: checkEvent._id,
          staff: checkEvent.staff,
          store: checkEvent.store,
          value: mark,
          formattedValue: dayjs(mark).format('HH:mm'),
          note: checkEvent.note,
          coords: checkEvent.coords,
          location: checkEvent.location,
        })
        // at this point, lastDate will be the date of this check in event
        // this is to fix the bug when clock out miss punch happens, the check in will be unexpectedly merged to next day
        lastDate = date

        // is last and found check in, add inOutPair missing out checkEventDate map for current date.
        if (index === ceIn.length - 1) {
          inOutPair.hours = null
          checkEventDates[date].push(inOutPair)
          inOutPair = {marks: []}
        }
      } else if (checkEvent.type === 'out') {
        // found out
        // if last date != current date (different day)
        // add inOutPair in to dateOut. Missing dateIn in this case.
        if (lastDate !== date) {
          checkEventDates[lastDate].push(inOutPair)
          inOutPair = {marks: []}
        }
        const checkOut = checkEvent.datetime
        inOutPair.out = {
          _id: checkEvent._id,
          staff: checkEvent.staff,
          store: checkEvent.store,
          value: checkOut,
          formattedValue: dayjs(checkOut).format('HH:mm'),
          note: checkEvent.note,
          coords: checkEvent.coords,
          location: checkEvent.location,
        }

        let hours = null
        // if found out and in, then add the pair into dateIn
        if (inOutPair.in) {
          const minutes = dayjs(inOutPair.out.value).diff(dayjs(inOutPair.in.value), 'minute')
          hours = Math.round((minutes / 60) * 10) / 10
          inOutPair.hours = hours
          checkEventDates[dayjs(inOutPair.in.value).format('YYYY-MM-DD')].push(inOutPair)
        } else {
          // otherwise, add inOutPair in to dateOut. Missing dateIn in this case.
          checkEventDates[date].push(inOutPair)
        }
        // then init empty pair if check event is not last
        if (index !== checkEvent.length - 1) {
          inOutPair = {marks: []}
        }
      }
    })

    const dates = _.keys(checkEventDates)
    const inOutPairs = _.map(dates, date => ({
      date: date,
      inOuts: checkEventDates[date],
    }))
    return _.filter(inOutPairs, inOutPair => inOutPair.inOuts.length > 0)
  }

  async function _getTimeSheets(staffId, fromDate, toDate) {
    const {
      theDayBeforeDateIn,
      theDayDateIn,
      theDayDateOut,
      theDayAfterDateOut
    } = _getDateBoundary(fromDate, toDate)

    let qry = {
      staff: staffId,
      datetime: { $gte: theDayDateIn.toDate(), $lte: theDayAfterDateOut.toDate() },
    }

    const checkEvents = await cms.getModel('CheckEvent').find(qry).lean()

    const timeSheetItem = {
      totalAttendance: 0,
      totalHours: 0,
      containInvalidCheckEvents: false,
      checkEvents: []
    }
    // create in-our pair
    const inOutPairs = await _createInOutPairs(checkEvents, theDayDateIn, theDayDateOut)
    let containInvalidCheckEvents = false
    for (let inOutPair of inOutPairs) {
      if (containInvalidCheckEvents) {
        break
      }

      for (let inOut of inOutPair.inOuts) {
        if (inOut.in == null || inOut.out == null) {
          containInvalidCheckEvents = true
          break
        }
      }
    }
    // Step3: Convert step 2 to build final data structure which will be used by view
    timeSheetItem.checkEvents = inOutPairs
    timeSheetItem.containInvalidCheckEvents = containInvalidCheckEvents
    timeSheetItem.totalAttendance = inOutPairs.reduce((acc, pair) => acc + pair.inOuts.length, 0)
    timeSheetItem.totalHours = _.sum(_.map(timeSheetItem.checkEvents, checkEvent => _.sumBy(checkEvent.inOuts, (inOutPair) => inOutPair.hours)))

    return timeSheetItem
  }

  return _getTimeSheets(staffId, startDate, endDate);
}

async function getStaffsWithTask(storeId) {
  if (!storeId) {
    throw 'Missing storeId!'
  }

  const startOfWeek = dayjs().startOf('week').toDate()
  const staffs = await cms.getModel('Staff').find({store: storeId}).lean()
  for (let i = 0, len = staffs.length; i < len; i++) {
    const report = await calculateWorkTimeReport(staffs[i]._id, startOfWeek, new Date())
    staffs[i].totalThisWeek = report.totalHours
  }

  const tasks = await cms.getModel('Task').aggregate([
    {
      $match: {status: 'inprogress'}
    },
    {
      $unwind: {path: '$participants'}
    }
  ])
  return staffs.map(s => ({
    ...s,
    tasks: tasks.filter(t => t.participants.toString() === s._id.toString()).length
  }))
}

module.exports = {
  getStaff,
  getStaffs,
  createStaff,
  updateStaff,
  removeStaff,
  processCheckInCheckOut,
  getLastCheckInCheckOut,
  getWorkTimeReport,
  getTimeSheetDetail,
  getStaffsWithTask
}
