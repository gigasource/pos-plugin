<template>
  <div class="pos-eod-report">
    <pos-end-of-day-details class="pos-eod-report__report"/>
    <pos-end-of-day-toolbar class="pos-eod-report__toolbar"/>
    <pos-end-of-day-main class="pos-eod-report__calendar"/>
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
    display: grid;
    grid-template-columns: 75% 25%;
    grid-template-rows:  1fr 64px;
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
