<template>
  <div class="pos-eod-report">
    <template #report>
      <pos-end-of-day-details class="pos-eod-report__report"/>
    </template>
    <template #toolbar>
      <pos-end-of-day-toolbar class="pos-eod-report__toolbar"/>
    </template>
    <template #calendar>
      <pos-end-of-day-main class="pos-eod-report__calendar"/>
    </template>
  </div>
</template>
<script>
  import PosEndOfDayDetails from '../EndOfDay/PosEndOfDayDetails';
  import PosEndOfDayToolbar from '../EndOfDay/PosEndOfDayToolbar';
  import PosEndOfDayMain from '../EndOfDay/PosEndOfDayMain';
  export default {
    name: 'posEndOfDayReport',
    components: { PosEndOfDayMain, PosEndOfDayToolbar, PosEndOfDayDetails },
    props: {},
    data: function () {
      return {}
    },
    computed: {},
    methods: {}
  }
</script>
<style scoped lang="scss">
  .pos-eod-report {
    grid-area: -1 / -1 / -1 / -1;  display: grid; grid-template-columns:  75% 25%; grid-template-rows:  1fr 64px; grid-gap: 0px 0px;
    height: 100%;
    
    &__report {
      grid-area: 1 / 2 / 2 / 3;
      z-index: 1;
    }
    
    &__toolbar {
      grid-area: 2 / 1 / 3 / 3;
    }
    
    &__calendar {
      grid-area: 1 / 1 / 2 / 2;
      background-color: #eee;
    }
  }
</style>
