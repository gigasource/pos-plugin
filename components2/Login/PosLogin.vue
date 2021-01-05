<template>
  <div class="login">
    <div class="login-bg"/>
    <div class="login-main">
      <div class="login-logo">
        <img alt src="/plugins/pos-plugin/assets/image/logo.svg"/>
      </div>
      <div class="login-input">
        <div class="login-input__title">Enter your passcode to login</div>
        <div class="login-input__text-field">
          <portal-target name="login-text-field"/>
        </div>
      </div>
      <div class="login-keyboard">
        <portal-target name="login-keyboard"/>
      </div>
      <div class="login-btn">
        <portal-target name="login-bottom-bar"/>
      </div>
      <login-portals/>
      <!-- todo add btn bar -->
    </div>
  </div>
</template>

<script>
  import { PortalTarget } from 'portal-vue/dist/portal-vue.esm'
  import LoginPortals from './LoginPortals';

  export default {
    name: 'PosLogin',
    components: { LoginPortals, PortalTarget }
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

    &__text-field {
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
