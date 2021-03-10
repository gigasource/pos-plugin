<script>
import { genScopeId } from '../utils';
import { incorrectPasscode, login } from './LoginLogic';
import { appHooks, locale, version } from '../AppSharedStates';
import { appType, currentAppType } from '../AppType';
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
import { DASHBOARD_VIEWS, dashboardHooks } from '../Dashboard/DashboardSharedStates';

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
        loginPassword.value = ''
        dashboardHooks.emit('updateScreen', DASHBOARD_VIEWS.FUNCTIONS_VIEW)
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

    function renderAppSwitch(){
      const imgSrc = `/plugins/pos-plugin/assets/app-mode--${ appType.POS_RESTAURANT === currentAppType.value ? 'restaurant' : 'retail'}.svg`
      function toggleApp() {
        currentAppType.value = (
            currentAppType.value === appType.POS_RESTAURANT
              ? appType.POS_RETAIL
              : appType.POS_RESTAURANT
        )
      }
      return <img onClick={toggleApp} src={imgSrc} style={{position: 'absolute', top: '20px', right: '20px', width: '50px'}}/>
    }


    return genScopeId(() =>
        <div class="login">
          <div class={currentAppType.value === appType.POS_RESTAURANT ? "login-bg" : "login-bg-retail"}></div>
          <div class="login-main" style="height: 100%; display: grid; grid-template-rows: 3fr 5fr 10px 1fr; grid-template-columns: 1fr">
            { renderAppSwitch() }
            <div class="login-logo">
              <img alt src="/plugins/pos-plugin/assets/image/logo.svg"/>
            </div>
            <div style="display: flex; flex-direction: column; justify-content: center;">
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
                                  onAppend={resetIncorrectPasscodeFlag}/>
              </div>
            </div>
            <div></div>
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

  &-bg-retail {
    flex: 0 0 40%;
    background-image: url("/plugins/pos-plugin/assets/login-bg-retail.jpg");
    background-size: cover;
  }

  &-main {
    flex: 0 0 60%;
    //display: flex;
    //flex-direction: column;
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
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-top: 10px;

    &__title {
      height: 40px;
      text-align: center;
    }

    &__textfield {
      width: 200px;
      margin: 0 auto 16px;
    }
  }

  &-keyboard {
    padding: 0 15%;

    & > div {
      height: 100%;
    }
  }

  &-btn {
    display: flex;

    & > div {
      flex: 0 0 20%;
      margin: 0;
    }
  }
}
</style>
