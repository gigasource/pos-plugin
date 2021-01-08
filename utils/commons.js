export const getDiffTime = function (startTime, endTime, unit = 'm') {
  return dayjs(endTime).diff(startTime, unit)
}
