<template>
  <g-dialog v-model="dialogUserDetail" overlay-color="#6b6f82" overlay-opacity="0.95" width="90%" eager>
    <div class="dialog-user w-100">
      <div class="form">
        <div class="input">
          <pos-text-field ref="username" @click="check = 'username'" large :label="$t('settings.userName')" v-model="name"/>
          <pos-text-field ref="passcode" @click="check = 'passcode'" large :label="$t('settings.passcode')" v-model="passcode"/>
        </div>
        <div class="action">
          <g-btn :uppercase="false" outlined class="mr-3" width="120" @click="dialogUserDetail = false">{{$t('ui.cancel')}}</g-btn>
          <g-btn :uppercase="false" flat background-color="blue accent 3" text-color="white" width="120" @click="submit">{{$t('ui.ok')}}</g-btn>
        </div>
      </div>
      <div class="bg-grey-lighten-1 pa-2">
        <pos-keyboard-full v-if="check === 'username'" v-model="name"/>
        <pos-numpad class="dialog-user__numpad" v-else-if="check === 'passcode'" v-model="passcode"/>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: 'dialogUserDetail',
    props: {
      value: null,
			focusInput: String,
      add: Boolean
    },
		data(){
    	return {
    	  name: '',
        passcode: ''
			}
		},
		injectService: [
			'SettingsStore:selectedUser',
			'SettingsStore:updateUser',
			'SettingsStore:listUsers',
		],
    computed: {
      dialogUserDetail: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val);
        }
      },
      check: {
        get() {
          return this.focusInput;
        },
        set(val) {
          this.$emit('update:focusInput', val);
        }
      },
    },
		methods: {
			async submit() {
        if(this.add) {
          const user = {
            name: this.name,
            passcode: this.passcode,
            viewReservation: true
          };
          await this.updateUser(null, user);
          const newUser = this.listUsers[this.listUsers.length - 1];
          this.selectedUser = {
            ...newUser,
            prepend: newUser.avatar,
          }
        } else {
          this.selectedUser.name = this.name;
          this.selectedUser.passcode = this.passcode;
          await this.updateUser(this.selectedUser._id, this.selectedUser);
        }
				this.dialogUserDetail = false;
			}
		},
		watch: {
      value: function(val) {
        setTimeout(() => {
          const textfield = this.$refs[this.focusInput];
          if (textfield) textfield.$refs.input.focus();
        }, 200);
        this.name = this.add ? '' : this.selectedUser.name;
        this.passcode = this.add ? '' : this.selectedUser.passcode;
      }
		}
  }
</script>

<style scoped lang="scss">
  .dialog-user {
    background-color: white;

    .form {
      padding: 16px;

      .input {
        display: flex;
      }

      .action {
        display: flex;
        justify-content: flex-end;
        padding-top: 24px;
      }
    }

    &__numpad {
      height: 174px;
      width: 40%;
      margin: auto;
    }
  }
</style>
