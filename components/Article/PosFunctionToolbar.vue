<template>
  <g-toolbar color="#eee" elevation="0" fill-height>
    <g-btn :uppercase="false" background-color="white" class="mr-3" style="margin-left: -4px" @click="back">
      <g-icon class="mr-2" svg>icon-back</g-icon>
      {{$t('ui.back')}}
    </g-btn>
  </g-toolbar>
</template>


<script>
  export default {
    name: 'PosFunctionToolbar',
    methods: {
      back() {
        this.$router.push({ path: '/pos-settings' })
      }
    }
  }
</script>

<style scoped>

</style>
