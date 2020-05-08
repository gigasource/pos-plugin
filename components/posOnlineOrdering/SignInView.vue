<template>
  <div class="pos-login">
    <template v-if="signInView">
      <div class="title">Welcome Back</div>
      <div class="sub-title">New to Online Ordering?
        <a class="ref" @click="showSignUpView">Sign Up</a>
      </div>
      <div class="pos-login__input">
        <g-text-field-bs label="Email" rounded border-color="white" large class="mb-4" placeholder="Your email"
                 v-model="email" ref="email"/>
        <g-text-field-bs type="password" label="Password" rounded border-color="white" large placeholder="Your password"
                 v-model="password" @enterpressed="signIn"/>
        <div v-if="signInMessage" class="message message-sign-in">{{signInMessage}}</div>
        <div class="remember-forgot">
          <g-checkbox label="Remember me" v-model="rememberSignIn" color="white"/>
          <a>Forgot Password?</a>
        </div>
        <g-btn-bs class="login-btn" rounded large background-color="#1271ff" @click="signIn">Log In</g-btn-bs>
      </div>
    </template>
    <template v-else-if="signUpView">
      <div class="title">Create Your Account</div>
      <div class="sub-title" style="margin-bottom: 41px">Already have Online Ordering account?
        <a class="ref" @click="showSignInView">Sign In</a></div>
      <div class="pos-login__input">
        <g-text-field-bs label="Email" large rounded border-color="white" class="mb-4" v-model="email"/>
        <g-text-field-bs type="password" label="Password" large rounded border-color="white" class="mb-4" v-model="password"/>
        <g-text-field-bs type="password" label="Type your password again" large rounded border-color="white" v-model="retypePassword"/>
        <div v-if="signUpMessage" class="message message-sign-up">{{signUpMessage}}</div>
        <g-btn-bs large rounded background-color="#1271ff" class="login-btn" @click="signUp">Sign Up</g-btn-bs>
      </div>
    </template>
  </div>
</template>
<script>
  import _ from 'lodash'

  export default {
    name: 'SignInView',
    injectService: ['PosStore:(login,createUser)'],
    props: {},
    data: function () {
      return {
        view: 'sign-in',
        email: '',
        password: '',
        retypePassword: '',
        rememberSignIn: false,
        errorMessage: '',
        signInMessage: '',
        signUpMessage: '',
        waitingSendResetPasswordResponse: false
      }
    },
    computed: {
      signInView() {
        return this.view === 'sign-in'
      },
      signUpView() {
        return this.view === 'sign-up'
      }
    },
    methods: {
      showSignInView() {
        this.view = 'sign-in'
        this.errorMessage = ''
      },
      showSignUpView() {
        this.view = 'sign-up'
        this.errorMessage = ''
      },
      signIn() {
        this.signInMessage = ''
        if(_.trim(this.email) === '')
          return
        this.login(this.email, this.password, (errMessage) => this.signInMessage = errMessage)
      },
      async signUp() {
        if (this.password === this.retypePassword) {
          this.signUpMessage = '';
          await this.createUser(this.email, this.password);
        } else {
          this.signUpMessage = 'Password and Retype password are mismatch!';
        }
      }
    },
    async created() {
      const { access_token, redirect_to } = this.$route.params
      if (access_token)
        await axios.post('/authenticateWithAccessToken', { access_token })
      if (redirect_to)
        location.href = redirect_to
    },
    mounted() {
      this.$nextTick(() => {
        this.$refs.email.$refs.input.focus()
      })
    }
  }
</script>
<style scoped lang="scss">
  .pos-login {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    background: url('/plugins/pos-plugin/assets/images/login-bg.png');
    background-size: cover;
    color: white;

    &__input {
      width: 409px;
      margin-bottom: 14px;
    }

    ::v-deep .g-checkbox-label,
    ::v-deep .g-checkbox-checkmark:before {
      color: white;
    }

    ::v-deep .bs-tf-inner-input-group {
      .bs-tf-input {
        background: transparent;
        color: white;
        padding-left: 2px;

        &::placeholder {
          color: white;
        }

        &:-webkit-autofill,
        &:-webkit-autofill:hover,
        &:-webkit-autofill:focus,
        &:-webkit-autofill:active {
          animation: autofill 0s forwards;
        }

        @keyframes autofill {
          100% {
            background: transparent;
            color: inherit;
          }
        }

        @-webkit-keyframes autofill {
          100% {
            background: transparent;
            color: inherit;
          }
        }
      }

      .g-icon {
        color: white
      }
    }
  }

  .title {
    font-weight: 300;
    font-size: 56px;
  }

  .sub-title {
    font-weight: 300;
    font-size: 18px;
    margin-bottom: 65px;
  }

  .ref {
    color: #536DFE;
    cursor: pointer;
    text-decoration: underline;
    font-weight: 700;
  }

  .remember-forgot {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .login-btn {
    width: calc(100% - 10px);
    margin: 36px 5px;
  }

  .message {
    color: red;
    font-size: 14px;
    line-height: 18px;
    text-transform: capitalize;
    font-style: italic;
    position: relative;
    left: 4px;

    &-sign-in {
      top: -8px;
    }

    &-sign-up {
      top: -12px;
    }

    &-reset-pwd {
      height: 1em;
      margin-top: 5px;
      margin-bottom: 15px;
    }
  }

  @media screen and (max-width: 600px) {
    .pos-login {

      .title {
        font-size: 32px;
      }

      &__input {
        width: 80%;
      }
    }
  }


</style>
