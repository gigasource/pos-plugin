require("mockdate").set(new Date("2021/01/28").getTime());
import { mockReservationSetting, m } from "./reservation-mock-data";
const { stringify } = require("schemahandler/utils");

jest.mock("cms", () => {
  const { cmsFactory } = require("../../../test-utils");
  const cms = cmsFactory("pos-restaurant--jest-reservation");
  global.cms = cms;
  return cms;
});

// force update pos setting
import { posSettings } from "../../AppSharedStates";
import {
  todayPendingReservation,
  selectedReservation
} from "../reservation-shared";
const {
  reservations,
  reservationInHours,
  genReservations,
  completeReservation,
  confirmRemove,
  //
  week,
  genWeek,
  prevWeek,
  nextWeek,
  backToToday,
  checkReservationDay,
  //
  date,
  formattedDate,
  chooseDate
} = require("../reservation-list-logic");

describe("reservation logic", () => {
  beforeAll(async () => {
    console.log("mock-date", new Date());
    await cms.initDemoData();
    // then register another schema
    cms.orm.registerSchema("Reservation", {
      date: Date,
      noOfGuests: Number,
      status: String,
      note: String,
      customer: {
        name: String,
        phone: String,
        email: String
      }
    });
  });

  describe("reservationInHours", () => {
    // tests below ensure that appropriate reservation will be
    // show at reservation table for selected date
    // note that mock date is 2021/01/28 (see above code)

    // compact mode
    it("should allow reservation", () => {
      posSettings.value = {
        reservation: {
          ...mockReservationSetting,
          openHours: [
            {
              dayInWeeks: [0, 1, 2, 3, 4, 5, 6],
              openTime: "7:30",
              closeTime: "21:00"
            }
          ]
        }
      };
      // Close time is 09:00 PM, reservation time 08:54 PM (6 minutes to close) is still acceptable
      reservations.value = [
        m({ date: "2021/01/27 8:54:00 PM" }),
        m({ date: "2021/01/28 8:54:00 PM" }),
        m({ date: "2021/01/29 8:54:00 PM" })
      ];
      expect(stringify(reservationInHours.value)).toMatchInlineSnapshot(`
        Array [
          Object {
            "reservations": Array [
              Object {
                "_id": "ObjectID",
                "customer": Object {
                  "email": "jo@gmail.com",
                  "name": "Jo",
                  "phone": "0345.678.910",
                },
                "date": "2021-01-28T13:54:00.000Z",
                "noOfGuests": 5,
                "note": "...",
                "status": "pending",
              },
            ],
            "time": "20h",
          },
        ]
      `);
    });
    it("should reject reservation", () => {
      posSettings.value = {
        reservation: {
          ...mockReservationSetting,
          openHours: [
            {
              dayInWeeks: [0, 1, 2, 3, 4, 5, 6],
              openTime: "7:30",
              closeTime: "21:59"
            }
          ]
        }
      };
      // Close time is 09:59 PM, reservation time 09:00 (59 minutes to close) PM is ignored
      reservations.value = [
        m({ date: "2021/01/27 09:00:00 PM" }),
        m({ date: "2021/01/28 09:00:00 PM" }),
        m({ date: "2021/01/29 09:00:00 PM" })
      ];
      expect(stringify(reservationInHours.value)).toMatchInlineSnapshot(
        `Array []`
      );
    });
    // full mode (also show blank hours)
    it("should also show hours without reservation", () => {
      posSettings.value = {
        reservation: { ...mockReservationSetting, hideEmpty: false }
      };
      // Close time is 09:00 PM, reservation time 08:54 PM (6 minutes to close) is still acceptable
      reservations.value = [
        m({ date: "2021/01/27 8:54:00 PM" }),
        m({ date: "2021/01/28 8:54:00 PM" }),
        m({ date: "2021/01/29 8:54:00 PM" })
      ];
      expect(stringify(reservationInHours.value)).toMatchInlineSnapshot(`
        Array [
          Object {
            "reservations": Array [],
            "time": "07h",
          },
          Object {
            "reservations": Array [],
            "time": "08h",
          },
          Object {
            "reservations": Array [],
            "time": "09h",
          },
          Object {
            "reservations": Array [],
            "time": "10h",
          },
          Object {
            "reservations": Array [],
            "time": "11h",
          },
          Object {
            "reservations": Array [],
            "time": "12h",
          },
          Object {
            "reservations": Array [],
            "time": "13h",
          },
          Object {
            "reservations": Array [],
            "time": "14h",
          },
          Object {
            "reservations": Array [],
            "time": "15h",
          },
          Object {
            "reservations": Array [],
            "time": "16h",
          },
          Object {
            "reservations": Array [],
            "time": "17h",
          },
          Object {
            "reservations": Array [],
            "time": "18h",
          },
          Object {
            "reservations": Array [],
            "time": "19h",
          },
          Object {
            "reservations": Array [
              Object {
                "_id": "ObjectID",
                "customer": Object {
                  "email": "jo@gmail.com",
                  "name": "Jo",
                  "phone": "0345.678.910",
                },
                "date": "2021-01-28T13:54:00.000Z",
                "noOfGuests": 5,
                "note": "...",
                "status": "pending",
              },
            ],
            "time": "20h",
          },
        ]
      `);
    });
    // only show reservation in open hours
    it("should not show reservation in close hours", () => {
      posSettings.value = {
        reservation: {
          ...mockReservationSetting,
          openHours: [
            {
              dayInWeeks: [0, 1, 2, 3, 4, 5, 6],
              openTime: "11:30",
              closeTime: "21:59"
            }
          ]
        }
      };
      reservations.value = [
        m({ date: "2021/01/27 09:00:00 AM" }),
        m({ date: "2021/01/28 09:00:00 AM" }),
        m({ date: "2021/01/29 09:00:00 AM" })
      ];
      expect(stringify(reservationInHours.value)).toMatchInlineSnapshot(
        `Array []`
      );
    });
  });

  describe("navigation", () => {
    beforeAll(async () => {
      await cms.getModel("Reservation").remove({});
      const mockRecords = [
        m({ date: "2021/01/02 8:54:00 PM" }),
        m({ date: "2021/01/15 8:54:00 PM" }),
        m({ date: "2021/01/18 8:54:00 PM" }),
        m({ date: "2021/01/20 8:54:00 PM", status: "completed" }),
        m({ date: "2021/01/24 8:54:00 PM", status: "declined" }),
        m({ date: "2021/01/27 8:54:00 PM" }),
        // in 2021/01/28 we only have declined reservation -> don't have reservation
        m({ date: "2021/01/28 8:54:00 PM", status: "declined" }),
        // in 2021/01/29 we have 2 reservations, one declined, one pending -> this day have reservation
        m({ date: "2021/01/29 8:54:00 PM" }),
        m({ date: "2021/01/29 9:54:00 PM", status: "declined" }),
        m({ date: "2021/01/30 9:54:00 PM" }),
        m({ date: "2021/01/31 8:54:00 PM" }),
        m({ date: "2021/02/01 8:54:00 PM", status: "completed" }),
        m({ date: "2021/02/04 8:54:00 PM" }),
        m({ date: "2021/01/05 8:54:00 PM" }),
        m({ date: "2021/01/08 8:54:00 PM" })
      ];
      console.log("creating mock records...");
      for (let record of mockRecords) {
        await cms.getModel("Reservation").create(record);
      }
      console.log("creating mock records completed");
    });

    afterAll(async () => {
      await cms.getModel("Reservation").remove({});
    });

    beforeEach(() => {
      week.value = [];
    });

    const formatWeekday = weekday =>
      `${weekday.date.format("YYYY/MM/DD HH:mm:ss")} _ ${
        weekday.hasReservation
      }`;

    it("should generate days in week, distinguish which days has reservation, which not", async () => {
      await genWeek("2021/01/25");
      expect(week.value.map(formatWeekday)).toMatchInlineSnapshot(`
        Array [
          "2021/01/25 00:00:00 _ false",
          "2021/01/26 00:00:00 _ false",
          "2021/01/27 00:00:00 _ true",
          "2021/01/28 00:00:00 _ false",
          "2021/01/29 00:00:00 _ true",
          "2021/01/30 00:00:00 _ true",
          "2021/01/31 00:00:00 _ true",
        ]
      `);
    });

    it("should generate days in last week", async () => {
      await genWeek(new Date());
      await prevWeek();
      expect(week.value.map(formatWeekday)).toMatchInlineSnapshot(`
        Array [
          "2021/01/18 00:00:00 _ true",
          "2021/01/19 00:00:00 _ false",
          "2021/01/20 00:00:00 _ true",
          "2021/01/21 00:00:00 _ false",
          "2021/01/22 00:00:00 _ false",
          "2021/01/23 00:00:00 _ false",
          "2021/01/24 00:00:00 _ false",
        ]
      `);
    });

    it("should generate days in next week", async () => {
      await genWeek(new Date());
      await nextWeek();
      expect(week.value.map(formatWeekday)).toMatchInlineSnapshot(`
        Array [
          "2021/02/01 00:00:00 _ true",
          "2021/02/02 00:00:00 _ false",
          "2021/02/03 00:00:00 _ false",
          "2021/02/04 00:00:00 _ true",
          "2021/02/05 00:00:00 _ false",
          "2021/02/06 00:00:00 _ false",
          "2021/02/07 00:00:00 _ false",
        ]
      `);
    });
  });

  it("should complete reservation", async () => {
    let emit = cms.socket.emit;
    cms.socket.emit = jest.fn(() => {});

    await cms.getModel("Reservation").remove({});
    await cms
      .getModel("Reservation")
      .create(m({ date: "2021/01/28 11:35:00 AM" }));

    await genReservations();
    expect(todayPendingReservation.value).toBe(1);

    await completeReservation(reservations.value[0]);
    expect(todayPendingReservation.value).toBe(0);

    expect(reservations.value[0].status).toBe("completed");

    const record = await cms
      .getModel("Reservation")
      .findOne({ _id: reservations.value[0]._id });
    expect(record.status).toBe("completed");

    expect(cms.socket.emit.mock.calls[0]).toEqual([
      "rescheduleReservation",
      reservations.value[0]._id,
      { status: "completed" }
    ]);

    cms.socket.emit = emit;
  });

  it("should remove reservation", async () => {
    let emit = cms.socket.emit;
    cms.socket.emit = jest.fn(() => {});

    await cms.getModel("Reservation").remove({});
    const reservationRecord = m({ date: "2021/01/28 11:35:00 AM" });
    await cms.getModel("Reservation").create(reservationRecord);

    // has 1 pending reservation
    await genReservations();
    expect(reservations.value.length).toBe(1);
    expect(todayPendingReservation.value).toBe(1);

    // execute delete
    selectedReservation.value = reservationRecord;
    await confirmRemove();

    // deleted reservation will be removed in memory
    expect(reservations.value.length).toBe(0);
    expect(todayPendingReservation.value).toBe(0);

    // status updated to 'declined'
    const record = await cms
      .getModel("Reservation")
      .findOne({ _id: reservationRecord._id });
    expect(record.status).toBe("declined");

    // socket call to announce (don't know why we do it)
    expect(cms.socket.emit.mock.calls[0]).toEqual([
      "rescheduleReservation",
      reservationRecord._id,
      { status: "declined" }
    ]);
    expect(cms.socket.emit.mock.calls[1]).toEqual([
      "updateOnlineReservation",
      reservationRecord._id,
      "delete"
    ]);

    cms.socket.emit = emit;
  });
});
