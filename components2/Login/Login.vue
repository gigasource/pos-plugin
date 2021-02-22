<script>
import { genScopeId } from '../utils';
import { incorrectPasscode, login } from './LoginLogic';
import { appHooks, locale, version } from '../AppSharedStates';
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import PosLoginTextfield from './PosLoginTextfield'
import PosLoginKeyboard from './PosLoginKeyboard'
import ConnectionStatusBtn from './ConnectionStatusBtn'
import PosLoginBtnLanguage from './PosLoginBtnLanguage'
import VersionBtn from './VersionBtn'
import StoreIdBtn from './StoreIdBtn'
import SupportBtn from './SupportBtn'
import DialogLoginSupport from './dialogLoginSupport'
import { useI18n } from 'vue-i18n';

export default {
  components: { DialogLoginSupport, SupportBtn, StoreIdBtn, VersionBtn, PosLoginBtnLanguage, ConnectionStatusBtn, PosLoginKeyboard, PosLoginTextfield, },
  setup() {
    const { locale: i18nLocale } = useI18n()

    const router = useRouter()
    const loginPassword = ref('')
    const showDialog = ref(false)

    function openDialog() {
      showDialog.value = true
    }

    function resetIncorrectPasscodeFlag() {
      incorrectPasscode.value = false
    }

    async function changeLocale(_locale) {
      await appHooks.emit('changeLocale', _locale)
      i18nLocale.value = _locale
    }

    async function onLogin() {
      incorrectPasscode.value = !(await login(loginPassword.value))
      if (!incorrectPasscode.value) {
        router.push('/pos-dashboard')
      }
    }

    //init
    appHooks.emit('fetchLocale').then(() => {
      i18nLocale.value = locale.value
    })
    appHooks.emit('settingChange')
    appHooks.emit('updateStoreId')
    appHooks.emit('updateVersion')

    return genScopeId(() =>
        <div class="login">
          <div class="login-bg"></div>
          <div class="login-main">
            <div class="login-logo">
              <img alt src="/plugins/pos-plugin/assets/image/logo.svg"/>
            </div>
            <div class="login-input">
              <div class="login-input__title">
                Enter your passcode to login
              </div>
              <div class="login-input__textfield">
                <PosLoginTextfield v-model={loginPassword.value} incorrectPasscode={incorrectPasscode.value}/>
              </div>
            </div>
            <div class="login-keyboard">
              <PosLoginKeyboard v-model={loginPassword.value}
                                onLogin={onLogin}
                                onClear={resetIncorrectPasscodeFlag}
                                onDelete={resetIncorrectPasscodeFlag}
                                onAppend={resetIncorrectPasscodeFlag}
              />
            </div>
            <div class="login-btn">
              <ConnectionStatusBtn/>
              <PosLoginBtnLanguage locale={locale.value} onChangeLocale={changeLocale}/>
              <VersionBtn version={version.value}/>
              <StoreIdBtn/>
              <SupportBtn onOpen={openDialog}/>
            </div>
            <DialogLoginSupport v-model={showDialog.value}/>
          </div>
        </div>)
  }
}
</script>


<style scoped lang="scss">
.login {
  height: 100%;
  display: flex;

  &-bg {
    flex: 0 0 40%;
    background-image: url("/plugins/pos-plugin/assets/login-bg.png");
    background-size: cover;
  }

  &-main {
    flex: 0 0 60%;
    display: flex;
    flex-direction: column;
  }

  &-logo {
    flex: 0 0 15%;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 45%;
    }
  }

  &-input {
    flex: 0 0 30%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-top: 10px;

    &__title {
      height: 40px;
      text-align: center;
    }

    &__textfield {
      margin: 0 30%;
    }
  }

  &-keyboard {
    flex: 0 0 40%;
    padding: 16px 15%;

    & > div {
      height: 100%;
    }
  }

  &-btn {
    flex: 0 0 15%;
    display: flex;
    padding-top: 16px;

    & > div {
      flex: 0 0 20%;
      margin: 0;
    }
  }
}
</style>
