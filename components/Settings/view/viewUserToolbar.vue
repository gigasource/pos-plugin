<template>
  <g-btn :uppercase="false" background-color="white" :disabled="isCurrentUser" text-color="#1d1d26"
         @click="openDialogDelete">
    <g-icon class="mr-2" svg>
      icon-trash
    </g-icon>
    {{$t('ui.delete')}}
  </g-btn>
  <dialog-confirm-delete type="user" :label="selectedUser ? selectedUser.name : ''" v-model="dialogConfirmDelete" @submit="deleteUser"/>
</template>

<script>
  export default {
    name: 'viewUserToolbar',
    injectService: [
      'SettingsStore:selectedUser',
      'SettingsStore:updateUser',
      'SettingsStore:listUsers',
      'PosStore:user',
    ],
    data() {
      return {
        dialogConfirmDelete: false,
        user: null,
        selectedUser: null,
        listUsers: null
      }
    },
    computed: {
      isCurrentUser() {
        if (!this.user || !this.selectedUser) return false;
        return this.user._id === this.selectedUser._id || !this.selectedUser;
      }
    },
    methods: {
      updateUser() {},
      openDialogDelete() {
        this.dialogConfirmDelete = true;
      },
      async deleteUser() {
        if (this.selectedUser._id) {
          await this.updateUser(this.selectedUser._id)
          this.selectedUser = {
            ...this.listUsers[0],
            prepend: this.listUsers[0].avatar,
          }
        }
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
