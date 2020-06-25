<template>

</template>
<script>
  import _ from 'lodash'
  import { getProvided } from '../logic/commonUtils';

  export default {
    name: 'PermissionStore',
    domain: 'PermissionStore',
    props: {},
    computed: {
      versionControlPerm() {
        if (cms.loginUser.user)
          return cms.loginUser.user.role.name === 'admin'
      },
      manageAccountPerm() {
        if (cms.loginUser.user)
          return cms.loginUser.user.role.name === 'admin'
      },
      manageGroupPerm() {
        return _.find(this.userPermissions, perm => perm.permission === 'manageGroup' && perm.value === true)
      },
      manageStorePerm() {
        return _.find(this.userPermissions, perm => perm.permission === 'manageStore' && perm.value === true)
      },
      remoteControlPerm() {
        return _.find(this.userPermissions, perm => perm.permission === 'remoteControl' && perm.value === true)
      },
      configOnlineOrderingPerm() {
        return _.find(this.userPermissions, perm => perm.permission === 'configOnlineOrdering' && perm.value === true)
      },
      settingsPerm() {
        return _.find(this.userPermissions, perm => perm.permission === 'settings' && perm.value === true)
      },
      updateAppPerm() {
        return _.find(this.userPermissions, perm => perm.permission === 'updateApp' && perm.value === true)
      },
      featureControlPerm() {
        return _.find(this.userPermissions, perm => perm.permission === 'featureControl' && perm.value === true)
      },
      viewMonthlyRevenuePerm() {
        return _.find(this.userPermissions, perm => perm.permission === 'viewMonthlyRevenue' && perm.value === true)
      },
      deleteStorePerm() {
        return _.find(this.userPermissions, perm => perm.permission === 'deleteStore' && perm.value === true)
      }
    },
    data() {
      return {
        userPermissions: [],
        allPermissions: [ "manageGroup", "settings", "manageStore", "updateApp", "remoteControl", "configOnlineOrdering", "featureControl" , "viewMonthlyRevenue", "deleteStore"]
      }
    },
    async created() {
      cms.updateUserSession()
      if (!cms.loginUser.user.active)
        this.$getService('PosStore').logout()
      else
        this.userPermissions.splice(0, 0, ...cms.loginUser.user.permissions)
    },
    provide() {
      return {
        ...getProvided(this.$data, this),
        ...getProvided(this.$options.computed, this)
      }
    }
  }
</script>
<style scoped>
</style>
