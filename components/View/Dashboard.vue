<template>
  <div class="dashboard">
    Dashboard
    <virtual-printer-view></virtual-printer-view>
  </div>
</template>

<script>
  import VirtualPrinterView from '../VirtualPrinter/VirtualPrinterView';
  export default {
    name: "Dashboard",
    components: { VirtualPrinterView }
  }
</script>

<style scoped>

</style>
