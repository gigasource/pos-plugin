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
                            @login="login"
                            @clear="resetIncorrectPasscodeFlag"
                            @delete="resetIncorrectPasscodeFlag"
                            @append="resetIncorrectPasscodeFlag"/>
      </div>
      <div class="login-btn">
        <connection-status-btn/>
        <pos-login-btn-language :locale="locale" @changeLocale="changeLocale"/>
        <version-btn :version="version"/>
        <store-id-btn/>
        <support-btn @open="openDialog"/>
      </div>
      <dialog-login-support v-model="dialog.loginSupport"/>
    </div>
  </div>
</template>

<script>
  import PosLoginKeyboard from '../pos-shared-components/POSInput/PosLoginKeyboard';
  import PosLoginTextfield from '../Login/PosLoginTextfield';
  import ConnectionStatusBtn from '../Login/ConnectionStatusBtn';
  import PosLoginBtnLanguage from '../Login/PosLoginBtnLanguage';
  import VersionBtn from '../Login/VersionBtn';
  import StoreIdBtn from '../Login/StoreIdBtn';
  import SupportBtn from '../Login/SupportBtn';
  import DialogLoginSupport from '../Login/dialogLoginSupport'
  
  export default {
    name: "Login",
    injectService: ['PosStore:(loginPassword, incorrectPasscode, login, resetIncorrectPasscodeFlag, locale, changeLocale, version)'],
    components: { PosLoginKeyboard, PosLoginTextfield, ConnectionStatusBtn, PosLoginBtnLanguage, VersionBtn, StoreIdBtn, SupportBtn, DialogLoginSupport},
    data() {
      return {
        dialog: {
          loginSupport: false
        },
        version: null,
        loginPassword: '',
        incorrectPasscode: null,
        locale: 'en'
      }
    },
    methods: {
      openDialog() {
        this.dialog.loginSupport = true
      },
      login() {},
      resetIncorrectPasscodeFlag() {},
      changeLocale() {}
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
