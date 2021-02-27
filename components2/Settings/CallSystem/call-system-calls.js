// calls, missed calls
import { ref } from 'vue';
import dayjs from 'dayjs';
import cms from 'cms';
import csConstants from '../../../backend/call-system-handler/call-system-contants';

export const calls = ref([])
export const missedCalls = ref([])
export const mockMissedCalls = [
  /*Customer: see Customer collection*/
  /*          see OrderStore::getCustomerInfo(phone) */
  {
    customer: {
      name: 'Miss Customer 1',
      phone: '0123456678',
      addresses: [
        {
          address: 'missCust.1.addrs.address',
          house: 'missCust.1.addrs.house',
          street: 'missCust.1.addrs.street',
          zipcode: 'missCust.1.addrs.zipcode',
          city: 'missCust.1.addrs.city'
        }
      ]
    }, date: dayjs() },
  { customer: { name: 'Miss Customer 2', phone: '0123456678', addresses: [] }, date: dayjs() },
  { customer: { name: 'Miss Customer 3', phone: '0123456678', addresses: [] }, date: dayjs() }
]
missedCalls.value = mockMissedCalls
export function deleteCall(index, { callId }) {
  calls.value.splice(index, 1)
  cancelMissedCallTimeout(callId)
}
export function deleteMissedCall(index) {
  missedCalls.value.splice(index, 1)
}
export function cancelMissedCallTimeout(callId) {
  cms.socket.emit(csConstants.CancelMissedCallTimeout, callId);
}

cms.socket.on(csConstants.NewPhoneCall, async (phoneNumber, date, callId) => {
  const customer = await getCustomerInfo(phoneNumber);
  calls.value.unshift({customer, date, phoneNumber, callId});
})

cms.socket.on(csConstants.NewMissedPhoneCall, async (callId) => {
  const callIndex = calls.value.findIndex(e => e.callId === callId);
  if (callIndex > -1) {
    const removedCall = calls.value.splice(callIndex, 1)[0];
    const {phoneNumber, date} = removedCall;
    const customer = await getCustomerInfo(phoneNumber);
    missedCalls.value.unshift({customer, date});
  }
})

async function getCustomerInfo(phone) {
  const customer = await cms.getModel('Customer').findOne({phone})
  if (!customer) {
    return {
      phone,
      name: 'New customer',
      addresses: []
    }
  }
  return customer
}
