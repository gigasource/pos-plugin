<template>
  <div class="user">
    <div class="user-list">
      <g-list :items="listOfUsers" @click="label = 'Edit User'" active-class="item__active" divider elevation="0"
              item-text="name" mandatory prepend-type="avatar" return-object selectable v-model="selectedUser">
        <template v-slot:append>
          <div></div>
        </template>
      </g-list>
      <div @click="addUser" class="row-flex align-items-center pa-2 pl-3">
        <g-avatar size="40">
          <g-icon svg>icon-add_user</g-icon>
        </g-avatar>
        <p class="ml-3 text-red fs-small">{{$t('settings.addUser')}}</p>
      </div>
    </div>
    <div class="user-edit">
      <div class="user-edit__title row-flex align-items-center pl-4 fw-700">
        {{$t('settings.editUser')}}
      </div>
      <div class="user-edit__item">
        <g-text-field-bs :label="$t('settings.name')" v-model="selectedUser.name">
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" @click="editUsername">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </div>
      <div class="user-edit__item" v-if="!isAdmin">
        <p class="mb-2">{{$t('settings.userAvatar')}}</p>
        <div class="row-flex align-items-center" style="height: 40px">
          <g-avatar class="mr-2" size="40" v-if="selectedUser && selectedUser.avatar">
            <img :src="selectedUser.avatar" alt/>
          </g-avatar>
          <a @click="dialogSelectAvatar = true" class="link-change">{{$t('ui.change')}}</a>
        </div>
      </div>
      <!--        <div class="edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense :label="$t('settings.viewOwnReport')" v-model="selectedUser.viewOwnReport"/>-->
      <!--        </div>-->
      <!--        <div class="edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense :label="$t('settings.viewOtherReport')" v-model="selectedUser.viewOtherReport"/>-->
      <!--        </div>-->
      <!--        <div class="edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense :label="$t('settings.editArticle')" v-model="selectedUser.editArticle"/>-->
      <!--        </div>-->
      <!--        <div class="edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense :label="$t('settings.accessZReport')" v-model="selectedUser.accessZReport"/>-->
      <!--        </div>-->
      <!--        <div class="edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense :label="$t('settings.itemCancellation')" v-model="selectedUser.itemCancellation"/>-->
      <!--        </div>-->
      <!--        <div class="edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense label="Allow Table Takeover" v-model="selectedUser.allowTableTakeover"/>-->
      <!--        </div>-->
      <!--        <div class="edit__item" v-if="!isAdmin">-->
      <!--          <p class="mt-3 ml-1">{{$t('settings.iBtn')}}</p>-->
      <!--          <p class="mt-2 ml-1">-->
      <!--            <span class="fs-small text-green-accent-4">{{$t('settings.registered')}}</span>-->
      <!--            <g-icon class="ml-1" size="20" svg>icon-redo</g-icon>-->
      <!--          </p>-->
      <!--        </div>-->
      <!--        <div class="edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense label="Allow Item Cancellation after reactivate paid Table" style="max-width: 200px" v-model="selectedUser.itemCancellationReactivePaidTable"/>-->
      <!--        </div>-->
      <div class="user-edit__item">
        <g-text-field-bs :label="$t('settings.passcode')" v-model="selectedUser.passcode">
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" @click="editPasscode">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </div>
      <!--        <div class="user-edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense label="Allow Move Item" v-model="selectedUser.allowMoveItem"/>-->
      <!--        </div>-->
      <!--        <div class="user-edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense label="Reactivate paid Table" v-model="selectedUser.reactivePaidTable"/>-->
      <!--        </div>-->
      <!--        <div class="user-edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense label="Allow Table Switch" v-model="selectedUser.allowTableSwitch"/>-->
      <!--        </div>-->
      <!--        <div class="user-edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense :label="$t('settings.openCashdrawerManually')" v-model="selectedUser.openCashdrawerManually"/>-->
      <!--        </div>-->
      <!--        <div class="user-edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense :label="$t('settings.discount')" v-model="selectedUser.discount"/>-->
      <!--        </div>-->
      <!--        <div class="user-edit__item" v-if="!isAdmin">-->
      <!--          <pos-switch @change="save" dense :label="$t('settings.cancelInvoice')" v-model="selectedUser.cancelInvoice"/>-->
      <!--        </div>-->
      <div class="user-edit__item" v-if="!isAdmin">
        <pos-switch @change="save" dense :label="$t('settings.viewOnlineOrderDashboard')" v-model="selectedUser.viewOnlineOrderDashboard"/>
      </div>
      <div class="user-edit__item" v-if="!isAdmin">
        <pos-switch @change="save" dense :label="$t('settings.viewOrder')" v-model="selectedUser.viewOrder"/>
      </div>
      <div class="user-edit__item" v-if="!isAdmin">
        <pos-switch @change="save" dense :label="$t('settings.viewOnlineOrderMenu')" v-model="selectedUser.viewOnlineOrderMenu"/>
      </div>
      <div class="user-edit__item" v-if="!isAdmin">
        <pos-switch @change="save" dense :label="$t('settings.viewOrderHistory')" v-model="selectedUser.viewOrderHistory"/>
      </div>
      <div class="user-edit__item" v-if="!isAdmin">
        <pos-switch @change="save" dense :label="$t('settings.viewReservation')" v-model="selectedUser.viewReservation"/>
      </div>
    </div>
  </div>
  <dialog-user-detail v-model:focusInput="focusInput" v-model="dialogUserDetail"/>
  <dialog-select-avatar v-model="dialogSelectAvatar"/>
  <dialog-user-detail add v-model:focusInput="focusInput" v-model="dialogNewUser"/>
</template>

<script>
  import layout from './layoutUserView';
  export default {
    name: 'viewUser',
    injectService: [
      'PosStore:user',
      'SettingsStore:selectedUser',
      'SettingsStore:listUsers',
      'SettingsStore:getListUsers',
      'SettingsStore:updateUser',
    ],
    data() {
      return {
        layout: layout,
				dialogUserDetail: false,
				focusInput: 'username',
				dialogSelectAvatar: false,
				dialogNewUser: false,
        user: null,
        selectedUser: null,
        listUsers: []
      }
    },
    computed: {
      isAdmin() {
        if (!this.user) {
          return false;
        }
        return this.selectedUser.role === 'admin'
      },
      listOfUsers() {
        if (!this.user) {
          return [];
        }
        let list
        if (this.user.role !== 'admin') {
          list = _.map(_.filter(this.listUsers, (user) => user.role !== 'admin'), (u) => ({
            ...u,
            prepend: u.avatar
          }))
        } else {
          list = this.listUsers.map(u => ({
            ...u,
            prepend: u.avatar
          }));
        }
        return list
      },
    },
    watch: {
      user() {
        this.selectedUser = this.listOfUsers[0]
      }
    },
    methods: {
      editUsername() {
        this.focusInput = 'username';
        this.dialogUserDetail = true;
      },
      editPasscode() {
        this.focusInput = 'passcode';
        this.dialogUserDetail = true;
      },
      addUser() {
        this.dialogNewUser = true;
      },
      async save() {
        await this.updateUser(this.selectedUser._id, this.selectedUser);
      },
      getListUsers() {},
      updateUser() {}
    },
    async created() {
      await this.getListUsers();
      this.selectedUser = this.listOfUsers[0]
    },
    async activated() {
      if(this.listOfUsers.length === 0)
        await this.getListUsers()
      this.selectedUser = this.listOfUsers[0]
    }
  }
</script>

<style lang="scss" scoped>
  .user {
    display: flex;
    height: 100%;

    &-list {
      flex: 0 0 200px;
      overflow-y: auto;
      border-right: 1px solid rgba(0, 0, 0, 0.12);

      .g-list {
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
        padding: 0;

        ::v-deep .g-list-item-text {
          font-size: 13px;
          line-height: 16px;
          color: #4D4D4E;
        }

        ::v-deep .g-image-content {
          background-size: contain !important;
        }

        ::v-deep .g-list-item__active:hover {
          background: rgba(242, 242, 242, 0.5);
        }

        ::v-deep .item__active {
          border-right: 5px solid #1271ff;
          background: rgba(242, 242, 242, 0.5);
          transition: none;

          &::before {
            background: rgba(242, 242, 242, 0.5);
          }

          .g-list-item-text {
            color: #1271ff;
          }
        }
      }
    }

    &-edit {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 56px 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;

      &__title {
        grid-area: 1 / 1 / 2 / 3;
      }

      &__item {
        padding: 0 16px;
        font-size: 13px;
        line-height: 16px;

        &:nth-child(even) {
          border-right: 1px solid rgba(0, 0, 0, 0.12);
        }

        .link-change {
          font-weight: 700;
          font-size: 14px;
          line-height: 18px;
          color: #1471FF;
          cursor: pointer;
        }

        .bs-tf-wrapper {
          margin: 8px 5px 0;
        }
      }
    }
  }

</style>
