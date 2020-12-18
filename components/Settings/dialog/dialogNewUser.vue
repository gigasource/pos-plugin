<template>
  <g-dialog v-model="dialogNewUser" overlay-color="#6b6f82" overlay-opacity="0.95" width="90%" eager>
    <div class="dialog-new-user w-100">
      <div class="header">
        <span>{{$t('settings.addUser')}}</span>
        <g-icon svg size="20" @click="dialogNewUser = false">icon-close</g-icon>
      </div>
      <div class="form">
        <div class="input">
          <pos-text-field ref="username" @click="check = 'username'" large :label="$t('settings.userName')" v-model="name"/>
          <pos-text-field ref="passcode" @click="check = 'passcode'" large :label="$t('settings.passcode')" v-model="passcode"/>
        </div>
        <div class="avatar">
          <p class="title">{{$t('settings.selectAvatar')}}</p>
          <g-item-group :items="listAvatars" v-model="selectedAvatar">
            <template v-slot:item="{item, toggle, active}">
              <g-badge :value="active" overlay>
                <template v-slot:badge>
                  <g-icon style="font-size: 20px; font-weight: bold">done</g-icon>
                </template>
                <g-avatar size="72" :class="['ma-3', active && 'avatar__selected']">
                  <img :alt="item.name" :src="item.image" @click="toggle(item)"/>
                </g-avatar>
              </g-badge>
            </template>
          </g-item-group>
        </div>
        <div class="action">
          <g-btn :uppercase="false" outlined class="mr-3" width="120" @click="dialogNewUser = false">{{$t('ui.cancel')}}</g-btn>
          <g-btn :uppercase="false" flat background-color="blue accent 3" text-color="white" width="120" :disabled="!valid" @click="submit">
            {{$t('ui.ok')}}
          </g-btn>
        </div>
      </div>
      <div class="bg-grey-lighten-1 pa-2">
        <pos-keyboard-full v-model="keyboard"/>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: 'dialogNewUser',
    props: {
      modelValue: null
    },
    data() {
      return {
        listAvatars: [],
        selectedAvatar: null,
        name: '',
        passcode: '',
        check: 'username',
      }
    },
    injectService: [
      'SettingsStore:selectedUser',
      'SettingsStore:updateUser',
      'SettingsStore:getListAvatar',
      'SettingsStore:listUsers',
    ],
    computed: {
      dialogNewUser: {
        get() {
          return this.modelValue;
        },
        set(val) {
          this.$emit('update:modelValue', val);
        }
      },
      keyboard: {
        get() {
          if (this.check === 'username') {
            return this.name;
          } else if (this.check === 'passcode') {
            return this.passcode;
          }
        },
        set(val) {
          if (this.check === 'username') {
            return this.name = val;
          } else if (this.check === 'passcode') {
            return this.passcode = val;
          }
        }
      },
      valid() {
        return this.name && this.passcode && this.selectedAvatar;
      }
    },
    methods: {
      async submit() {
        const user = {
          avatar: this.selectedAvatar.image,
          name: this.name,
          passcode: this.passcode,
        };
        await this.updateUser(null, user);
        const newUser = this.listUsers[this.listUsers.length - 1];
        this.selectedUser = {
          ...newUser,
          prepend: newUser.avatar,
        }
        this.dialogNewUser = false;
        this.name = '';
        this.passcode = '';
        this.selectedAvatar = null;
      }
    },
    async mounted() {
      this.listAvatars = await this.getListAvatar();
    },
  }
</script>

<style scoped lang="scss">
  .dialog-new-user {
    width: 100%;
    background: #fff;

    .header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 16px;
      line-height: 20px;
      color: #1D1D26;
      padding: 16px 16px 0;
    }

    .form {
      padding: 0 16px;

      .input {
        display: flex;
        padding: 16px;
      }

      .avatar {

        .title {
          padding-left: 16px;
          font-size: 13px;
          line-height: 16px;
        }

        .g-item-group {
          flex-wrap: wrap !important;
          max-height: 250px;
          overflow: auto;
        }

        ::v-deep .g-avatar {
          box-sizing: content-box;
          border: 2px solid transparent;

          &.avatar__selected {
            border: 2px solid #1271ff;
          }
        }

        ::v-deep .g-badge {
          transform: translate(-65%, 65%) !important;
          padding: 0 !important;
        }

      }

      .action {
        display: flex;
        justify-content: flex-end;
        padding: 16px 0;
      }
    }

  }
</style>
