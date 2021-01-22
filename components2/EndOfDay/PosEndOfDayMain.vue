<script>
export default {
  setup() {
    return () => <>
      <div style="height: 100%; background-color: #EEEEEE;">
        <pos-end-of-day-date-picker
            eventDates={listOfDatesWithReports}
            firstDayOfWeek={1}
            monthSelectDisabled={true}
            weekdayFormat={getDay} color="#fff"
            full-width no-title
            modelValue={date} onUpdate:modelValue={selectDate}
            onClick:prev={getDatesWithReport}
            onClick:next={getDatesWithReport}>
        </pos-end-of-day-date-picker>
      </div>
    </>
  }
}
</script>

<style scoped>
.g-picker {
  box-shadow: none;
  height: 100%;
}
</style>
