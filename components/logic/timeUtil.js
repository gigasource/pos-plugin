

export const _12HourTimeRegex = /^(?<hours>1[0-2]|0?[0-9]):(?<minutes>[0-5][0-9])(:(?<seconds>[0-5][0-9]))? ?(?<meridiems>[AaPp][Mm])$/i
export const _24HourTimeRegex = /^(?<hours>2[0-3]|[0-1]?[0-9]):(?<minutes>[0-5][0-9])(:(?<seconds>[0-5][0-9]))?$/i

export function get24HourValue(time) {
  time = _.toLower(time)
  return _.includes(time, 'm') ? dayjs(time, 'hh:mma').format('HH:mm') : time
}

export function get12HourValue(time) {
  return dayjs(time, 'HH:mm').format('hh:mm A')
}

export function incrementTime(hour, minute, interval = 15) {
  minute += interval
  while (minute >= 60) {
    hour++
    minute -= 60
  }
  return {hour, minute}
}

export function decrementTime(hour, minute, interval = 15) {
  minute -= interval
  while (minute < 0) {
    hour--
    minute += 60
  }
  return { hour, minute }
}
