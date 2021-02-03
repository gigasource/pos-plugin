<script>

import { isMobile } from '../../../AppSharedStates';
import { computed, ref, watch } from 'vue'
import { genScopeId, internalValueFactory } from '../../../utils';
import { useI18n } from 'vue-i18n';
import { userList, selectedUser, updateUser } from './view-user-logics';

export default {
  props: {
    modelValue: null,
    focusInput: String,
    add: Boolean
  },
  setup(props, { emit }) {
    const { t } = useI18n()
    const name = ref('')
    const passcode = ref('')
    const usernameRef = ref(null)
    const passcodeRef = ref(null)
    const refs = {
      usernameRef,
      passcodeRef
    }
    const showDialogUserDetail = internalValueFactory(props, { emit })
    const check = internalValueFactory(props, { emit }, 'focusInput')


    async function submit() {
      if (props.add) {
        const user = {
          name: name.value,
          passcode: passcode.value,
          viewReservation: true
        }
        await updateUser(null, user);
        const newUser = userList.value[userList.value.length - 1];
        selectedUser.value = {
          ...newUser,
          prepend: newUser.avatar,
        }
      } else {
        selectedUser.value.name = name.value;
        selectedUser.value.passcode = passcode.value;
        await updateUser(selectedUser.value._id, selectedUser.value);
      }
      showDialogUserDetail.value = false;
    }


    watch(() => showDialogUserDetail.value, () => {
      setTimeout(() => {
        if (refs[`${check.value}Ref`].value)  refs[`${check.value}Ref`].value.focus();
      }, 200);
      name.value = props.add ? '' : selectedUser.value.name;
      passcode.value = props.add ? '' : selectedUser.value.passcode;
    })
    return genScopeId(() =>
        <g-dialog v-model={showDialogUserDetail.value} overlay-color="#6b6f82" overlay-opacity="0.95" width="90%" eager fullscreen={isMobile.value}>
          <div class="dialog-user w-100">
            <g-icon onClick={() => showDialogUserDetail.value = false} svg size="20" class="icon">
              icon-close
            </g-icon>
            <div class="form">
              <div class="input">
                <pos-textfield-new ref={usernameRef} onClick={() => check.value = 'username'} label={t('settings.userName')} v-model={name.value}/>
                <pos-textfield-new ref={passcodeRef} onClick={() => check.value = 'passcode'} label={t('settings.passcode')} v-model={passcode.value}/>
              </div>
              {
                (!isMobile.value) &&
                <div class="action">
                  <g-btn uppercase={false} outlined class="mr-3" width="120" onClick={() => showDialogUserDetail.value = false}>
                    {t('ui.cancel')} </g-btn>
                  <g-btn uppercase={false} flat background-color="blue accent 3" text-color="white" width="120" onClick={submit}>
                    {t('ui.ok')} </g-btn>
                </div>
              }
            </div>
            <div class="bg-grey-lighten-1 pa-2">
              <pos-keyboard-full onEnterPressed={submit}/>
            </div>
          </div>
        </g-dialog>)
  }
}
</script>

<style scoped lang="scss">
.dialog-user {
  background-color: white;
  position: relative;
  display: flex;
  flex-direction: column;

  .form {
    padding: 16px;
    flex: 1;

    .input {
      margin-top: 16px;
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

  .icon {
    position: absolute;
    top: 8px;
    right: 8px;
  }
}
</style>
