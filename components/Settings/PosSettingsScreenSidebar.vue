<template>
  <g-sidebar medium style="height: calc(100vh - 64px)">
    <template v-slot:header>
      <div class="row-flex align-items-center pa-3 bbw-thin b-grey-lighten-1">
        <g-avatar :size="40">
            <g-img :src="user ? user.avatar: ''"/>
        </g-avatar>
        <p class="username">{{userName}}</p>
      </div>
    </template>
    <g-side-bar-tree-view :data="sidebarData" :auto-collapse="false" v-model="internalValue"/>
  </g-sidebar>
</template>

<script>
  export default {
    name: 'PosSettingsScreenSidebar',
    injectService: ['PosStore:user', 'SettingsStore:sidebarData'],
    props: {
      modelValue: null
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(value) {
          this.$emit('update:modelValue', value)
        }
      },
      userName() {
        return this.user ? this.user.name : ''
      }
    }
  }
</script>

<style scoped lang="scss">
  .g-sidebar-wrapper {
    width: 100% !important;
    max-width: none !important;

    .username {
      word-break: break-all;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 14px;
      font-weight: 600;
      padding-left: 8px;
    }

    ::v-deep .g-sidebar {
      width: 100% !important;
      max-width: none !important;

      .g-treeview-children i:not(.g-treeview-icon__small) {
        font-size: 16px !important;
      }

      &.g-sidebar__medium .g-treeview-title {
        font-size: 14px;
        white-space: unset;
        line-height: 1.2;
      }

      .g-treeview-icon:not(.g-treeview-icon__small) {
        min-width: 20px;
      }
    }
  }

  .g-treeview-wrapper ::v-deep .g-treeview__active {
    background: linear-gradient(9.78deg, #3949AB 0%, #4FC3F7 100%) !important;
    box-shadow: 0 1px 8px 1px rgba(28, 144, 196, 0.5);
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    margin-right: 8px;
  }
</style>
