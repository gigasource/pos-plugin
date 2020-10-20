<template>
  <div>
    <g-text-field></g-text-field>
    <g-text-field></g-text-field>
    <g-text-field></g-text-field>
    <g-text-field></g-text-field>
    <pos-keyboard-full></pos-keyboard-full>
  </div>
</template>
<script>
  import PosKeyboardFull from '../pos-shared-components/PosKeyboardFull';
  
  export default {
    name: 'dialogCreateEditInventory',
    components: { PosKeyboardFull },
    props: {
      mode: 'edit'
    },
    data: function () {
      return {
        name: '',
        stock: '',
        category: '',
        unit: ''
      }
    },
    computed: {
    
    },
    methods: {
    
    }
  }
</script>
<style scoped>
</style>
