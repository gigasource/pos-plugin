<template>
  <g-toolbar area="toolbar" color="grey lighten 3" height="100%" style="z-index: 204">
    <g-btn :uppercase="false" background-color="white" text-color="#1d1d26" class="mr-2" @click="back">
      <g-icon class="mr-2" svg>
        icon-back
      </g-icon>
      {{$t('ui.back')}}
    </g-btn>
    <g-spacer/>
    <slot :name="internalValue"></slot>
  </g-toolbar>
</template>

<script>
  import _ from 'lodash'
  export default {
    name: 'PosSettingsScreenToolbar',
    props: {
      value: String
    },
    computed: {
      internalValue() {
        const sidebarData = this.$getService('SettingsStore:sidebarData');
        if (!this.value) return sidebarData[0].key
        const activeItemPath = this.value.split('.').slice(1).join('.')
        const activeItem = _.get(sidebarData, activeItemPath)
        if (activeItem.isView) return activeItem.key
      }
    },
    methods: {
      back() {
        this.$router.push({ path: '/pos-dashboard' })
      }
    }
  }
</script>

<style scoped lang="scss">
  @media screen and (max-width: 1023px) {
    .g-btn {
      ::v-deep .g-btn__content {
        font-size: 12px;
      }
    }
  }
</style>
