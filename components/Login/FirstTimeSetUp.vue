<template>
  <div class="background row-flex align-items-center justify-center">
    <g-card persistent width="580">
      <div class="dialog" style="padding: 24px">
        <div class="dialog-title">Welcome to Gigasource POS</div>
        <div class="dialog-title--sub">Pairing Code</div>
        <g-text-field-bs large class="bs-tf__pos" v-model="code" style="margin-bottom: 12px;">
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" @click="dialog.input = true">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
        <div v-if="error" class="dialog-message--error">
          <g-icon v-if="offline">icon-no-connection</g-icon>
          <span class="ml-2 fs-small">{{errorMessage}}</span>
        </div>
        <div class="row-flex" style="margin-top: 24px;">
          <div class="dialog-message--note">
            <b>Note: </b>Please contact your local provider to start using the program. Internet connection is required.
          </div>
          <div>
            <g-btn-bs :background-color="pairing ? 'grey': '#2979FF'" text-color="white" width="7.5em" height="44px"
                      @click="connect" :disabled="pairing">
              <template v-if="pairing">
                <g-progress-circular class="mr-2" indeterminate/>
              </template>
              <template v-else>Connect</template>
            </g-btn-bs>
          </div>
        </div>
      </div>
    </g-card>
    <dialog-text-filter v-model="dialog.input" label="Code" :defaul-value="code" @submit="changeCode"/>
    <g-btn style="position: absolute; bottom: 10px; right: 10px" @click="$emit('skipPairing')">Skip pairing</g-btn>
  </div>
</template>

<script>
  export default {
    name: "FirstTimeSetUp",
    data() {
      return {
        dialog: {
          pairing: true,
          input: false,
        },
        code: '',
        error: false,
        errorMessage: 'No internet connection',
        pairing: false,
        offline: false
      }
    },
    created() {
      if (!navigator.onLine) {
        this.offline = true
        this.error = true
        this.errorMessage = ''
      }

      window.addEventListener('online', () => {
        this.error = false
      });

      window.addEventListener('offline', () => {
        this.error = true
      });
    },
    methods: {
      changeCode(code) {
        this.code = code
      },
      start() {
        this.$router.push({path: '/pos-login'})
      },
      connect() {
        this.pairing = true

        this.$emit('registerOnlineOrder', this.code, (error, deviceId) => {
          if (error) {
            this.error = true
            this.errorMessage = 'Pair failed. Please try again.'
          } else {
            this.error = false
            this.code = ''
            this.$emit('completeSetup')
          }
          this.pairing = false
        })
      }
    }
  }
</script>

<style scoped lang="scss">
  .background {
    height: 100%;
    background-size: cover;
    background-repeat: no-repeat;
    background-image: url("/plugins/pos-plugin/assets/background-blur.png");
  }

  .dialog {
  width: 100%;
  background: white;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;

  &-title {
    font-size: 20px;
    font-weight: 700;
    margin: 20px 0;

    &--sub {
      font-size: 15px;
      margin-top: 8px;
      margin-bottom: 12px;
    }
  }

  &-message {
    font-size: 15px;
    color: #424242;
    text-align: center;
    margin-bottom: 16px;
    margin-top: 4px;

    &--error {
      color: #f44336;
      font-style: italic;
    }

    &--note {
      text-align: left;
      font-size: 12px;
      font-style: italic;
      margin-bottom: 8px;
    }
  }

  .bs-tf-wrapper {
    margin: 8px 0;
    width: 80%;

    ::v-deep {
      .bs-tf-label {
        font-size: 15px;
      }

      .bs-tf-input {
        font-size: 34px;
        font-weight: 700;
        color: #000000;
        text-align: center;
        width: 100%;
      }
    }
  }
}
</style>
