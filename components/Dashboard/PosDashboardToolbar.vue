<template>
  <g-toolbar gradient="#3949AB,#4FC3F7" elevation="0">
    <slot></slot>
    <g-spacer></g-spacer>
    <div class="time">
      <p>{{formattedDateTime.time}}</p>
      <p>{{formattedDateTime.date}}</p>
    </div>
  </g-toolbar>
</template>

<script>
  export default {
    name: 'PosDashboardToolbar',
    injectService: ['PosStore:(systemDate, timeFormat, dateFormat)'],
    computed: {
      formattedDateTime() {
        const dateObj = dayjs(this.systemDate)
        return {
          date: dayjs(dateObj).format(this.dateFormat),
          time: dateObj.format(this.timeFormat)
        }
      }
    }
  }
</script>

<style scoped>
  .time {
    color: white;
    font-size: 13px;
    line-height: 16px;
    text-align: right
  }
</style>
