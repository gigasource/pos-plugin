import MockDate from 'mockdate'
MockDate.set('2020-01-29')

import dayjs from 'dayjs'
import { ObjectID } from 'bson'
// create mock
export const m = (option) => {
  return {
    _id: new ObjectID(),
    date: dayjs(option.date).toDate(),
    noOfGuests: 5 || option.guests,
    status: option.status || 'pending',
    note: option.note || '...',
    customer: {
      name: option.name || 'Jo',
      phone: option.phone || '0345.678.910',
      email: option.email || 'jo@gmail.com'
    }
  }
}

export const mockReservationSetting = {
  "maxGuest": 20, /*Maximum guest for 1 reservation*/
  "maxDay": 14, /*Maximum day after current day allowed for reservation*/
  "openHours": [ /*Don't know how to set these stuff yet*/
    {
      "dayInWeeks": [0, 1, 2, 3, 4],
      "openTime": "7:30",
      "closeTime": "21:00"
    },
    {
      "dayInWeeks": [5, 6],
      "openTime": "11:30",
      "closeTime": "21:30"
    }
  ],
  "seatLimit": [
    {
      /*Only serve maximum 500 customer per day for every day in a week except Sat, Sun*/
      "days": ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      "seat": 500,
      "startTime": "7:30",
      "endTime": "21:30"
    },
    {
      /*only serve maximum 200 customers in Sat, Sun*/
      "days": ['Sat', 'Sun'],
      "seat": 200,
      "startTime": "7:30",
      "endTime": "21:30"
    }
  ],
  "hideEmpty": true
}
