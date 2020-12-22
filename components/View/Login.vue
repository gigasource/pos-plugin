<template>
  <div class="login">
    <div class="login-bg"></div>
    <div class="login-main">
      <div class="login-logo">
        <img alt src="/plugins/pos-plugin/assets/image/logo.svg"/>
      </div>
      <div class="login-input">
        <div class="login-input__title">Enter your passcode to login</div>
        <div class="login-input__textfield">
          <pos-login-textfield v-model="loginPassword" :incorrect-passcode="incorrectPasscode"/>
        </div>
      </div>
      <div class="login-keyboard">
        <pos-login-keyboard v-model="loginPassword"
                            @login="userLogin"
                            @clear="resetIncorrectPasscodeFlag"
                            @delete="resetIncorrectPasscodeFlag"
                            @append="resetIncorrectPasscodeFlag"/>
      </div>
      <div class="login-btn">
        <connection-status-btn/>
        <pos-login-btn-language :locale="locale" @change-locale="updateLocale"/>
        <version-btn :version="version"/>
        <store-id-btn/>
        <support-btn @open="openDialog"/>
      </div>
      <dialog-login-support v-model="dialog"/>
    </div>
  </div>
</template>

<script>
  import PosLoginTextfield from "../Login/PosLoginTextfield";
  import PosLoginKeyboard from "../pos-shared-components/POSInput/PosLoginKeyboard";
  import ConnectionStatusBtn from "../Login/ConnectionStatusBtn";
  import PosLoginBtnLanguage from "../Login/PosLoginBtnLanguage";
  import VersionBtn from "../Login/VersionBtn";
  import StoreIdBtn from "../Login/StoreIdBtn";
  import SupportBtn from "../Login/SupportBtn";
  import DialogLoginSupport from "../Login/dialogLoginSupport";
  import { login, loginPassword, incorrectPasscode, locale, version, resetIncorrectPasscodeFlag, changeLocale } from '../../composition/usePosLogic';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';

  export default {
    name: "Login",
    components: {DialogLoginSupport, SupportBtn, StoreIdBtn, VersionBtn, PosLoginBtnLanguage, ConnectionStatusBtn, PosLoginKeyboard, PosLoginTextfield},
    setup() {
      const dialog = ref(false)
      const router = useRouter()

      function openDialog() {
        dialog.value = true
      }

      async function userLogin() {
        const loginSuccess = await login()
        loginSuccess && router.push({ path: `/pos-dashboard` })
      }

      async function updateLocale(locale) {
        await changeLocale(locale)
        router.go()
      }

      return {
        dialog, loginPassword, incorrectPasscode, locale, version,
        userLogin, resetIncorrectPasscodeFlag, updateLocale, openDialog
      }
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
