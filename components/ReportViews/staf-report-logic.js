import {computed, ref} from 'vue';

export const selectedStaff = ref()
export const staffs = ref([])
import cms from 'cms';
import JsonFn from "json-fn";
import dayjs from "dayjs";
import {dateFormat} from "../utils";

export const currentDate = ref(new Date());
//export const currentDate = ref(dayjs('05.01.2021', 'DD.MM.YYYY').toDate());
export const reportDate = computed(() => {
  return dayjs(currentDate.value).format(dateFormat.value)
})

export const staffReport = ref()

export const userSales = computed(() => staffReport.value && staffReport.value.userSales);
export const groupByPayment = computed(() => staffReport.value && staffReport.value.groupByPayment);
export const groupByStatus = computed(() => staffReport.value && staffReport.value.groupByStatus);

export async function getListUsers() {
  staffs.value = await cms.getModel('PosUser').find();
  selectedStaff.value = staffs.value.length && staffs.value[0]
}

export async function getStaffReport() {
  const from = dayjs(currentDate.value).startOf('day').toDate();
  const to = dayjs(currentDate.value).endOf('day').toDate();
  staffReport.value = JsonFn.clone(await new Promise(
    r => cms.socket.emit('make-staff-report', from, to, r)));
  userSales.value;
  groupByPayment.value
  groupByStatus.value
}

export function printStaffReport() {
  const from = dayjs(currentDate.value).startOf('day').toDate();
  const to = dayjs(currentDate.value).endOf('day').toDate();
  const report = {
    staffName: selectedStaff.value.name,
    from, to
  }
  return new Promise(resolve => cms.socket.emit('printReport', 'StaffReport', report, function () {
    resolve();
  }))
}
