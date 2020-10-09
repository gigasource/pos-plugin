<template>
  <div class="background row-flex align-items-center justify-center">
    <g-card persistent width="580">
      <div class="dialog" style="padding: 24px">
        <div class="dialog-title" @click.stop="secretClick">Welcome to Gigasource POS</div>
        <g-tabs v-model="tab" :items="items">
          <g-tab-item :item="items[0]" style="height: 200px">
            <div class="dialog-title--sub">Address</div>
            <g-text-field-bs large class="bs-tf__pos text-small" v-model="place" style="margin-bottom: 12px;">
              <template v-slot:append-inner>
                <g-icon style="cursor: pointer" @click="dialog.combobox = true">icon-keyboard</g-icon>
              </template>
            </g-text-field-bs>
            <div v-if="error" class="dialog-message--error">
              <g-icon v-if="offline">icon-no-connection</g-icon>
              <span class="ml-2 fs-small">{{errorMessage}}</span>
            </div>
            <div class="dialog-message--subtext">
          <b>Note: </b>
          <span style="font-style: italic; color: #757575">
            {{ disableSendBtn
            ? 'Your sign-in request is pending approval.'
            : 'Please contact your local provider to start using the program.'}}
          </span>
            </div>
            <div class="row-flex w-100">
              <div class="dialog-message--note" v-if="deniedRequest" style="color: #ff4452">
                <b>Your last sign-in request was declined!</b>
              </div>
              <g-spacer/>
              <div>
                <g-btn-bs :background-color="sending ? 'grey': '#2979FF'" text-color="white" width="10em" height="44px"
                          @click="sendRequest" :disabled="disableSendBtn">
                  <template v-if="sending">
                    <g-progress-circular class="mr-2" indeterminate color="#fff"/>
                  </template>
                  <template v-else-if="disableSendBtn">Request sent</template>
                  <template v-else>Send Request</template>
                </g-btn-bs>
              </div>
            </div>
          </g-tab-item>
          <g-tab-item :item="items[1]" style="height: 200px">
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
          </g-tab-item>
        </g-tabs>
      </div>
    </g-card>
    <dialog-number-filter v-model="dialog.input" label="Pairing Code" @submit="changeCode"/>
    <g-dialog v-model="dialog.combobox" fullscreen>
      <g-card style="position: relative; display: flex; flex-direction: column">
        <g-icon size="28" style="position: absolute;top: 16px;right: 16px" @click="dialog.combobox = false">close</g-icon>
        <div style="flex: 1; padding: 16px; margin-top: 20px">
          <g-combobox class="w-100" label="Address" v-model="placeId" text-field-component="PosTextField"
                      :key="dialog.combobox" keep-menu-on-blur clearable
                      :items="placesSearchResult" @update:searchText="debouncedSearch">
          </g-combobox>
        </div>
        <div class="w-100 bg-grey pa-2">
          <pos-keyboard-full @enter-pressed="choosePlace"/>
        </div>
      </g-card>
    </g-dialog>
    <dialog-custom-url v-model="showCustomUrlDialog" @confirm="updateServerUrl" @getServerUrl="$emit('getServerUrl', $event)"></dialog-custom-url>
    <g-btn style="position: absolute; bottom: 10px; right: 10px" @click="$emit('skipPairing')">Skip pairing</g-btn>
  </div>
</template>

<script>
  import DialogCustomUrl from './dialogCustomUrl';
  import { v4 as uuidv4 } from 'uuid';
  import _ from 'lodash';
  import PosKeyboardFull from "../pos-shared-components/PosKeyboardFull";

  export default {
    name: 'FirstTimeSetUp',
    components: {PosKeyboardFull, DialogCustomUrl },
    data() {
      return {
        dialog: {
          pairing: true,
          input: false,
          combobox: false
        },
        code: '',
        error: false,
        errorMessage: 'No internet connection',
        sending: false,
        pairing: false,
        offline: false,
        clickCount: 0,
        showCustomUrlDialog: false,
        placesSearchResult: [],
        placeId: '',
        place: '',
        debouncedSearch: () => null,
        signInRequest: null,
        items: [{title: 'Address'}, {title: 'Pairing Code'}],
        tab: null
      }
    },
    async created() {
      this.tab = this.items[0]
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

      this.debouncedSearch = _.debounce(this.searchPlace, 500)

      const { signInRequest } = await cms.getModel('PosSetting').findOne()
      if (signInRequest) this.signInRequest = signInRequest

      cms.socket.on('denySignIn', () => {
        if (this.signInRequest) this.$set(this.signInRequest, 'status', 'notApproved')
      })
    },
    activated() {
      this.placesSearchResult = []
      this.placeId = ''
    },
    computed: {
      disableSendBtn() {
        return this.signInRequest && this.signInRequest.status === 'pending'
      },
      deniedRequest() {
        return this.signInRequest && this.signInRequest.status === 'notApproved'
      }
    },
    methods: {
      changeCode(code) {
        this.code = code
      },
      start() {
        this.$router.push({ path: '/pos-login' })
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
      },
      secretClick() {
        if (this.clickCount === 9) {
          this.showCustomUrlDialog = true
        } else {
          this.clickCount++
        }
      },
      updateServerUrl(url) {
        this.$emit('updateServerUrl', url)
      },
      searchPlace(text) {
        console.log('searching')
        if (!text || text.length < 4) return
        this.token = uuidv4()
        cms.socket.emit('searchPlace', text, this.token, places => {
          this.placesSearchResult = places.map(p => {
            return ({
              text: p.description,
              value: p.place_id,
            });
          })
        })
      },
      getPlaceDetail() {
        if (this.placesSearchResult.find(item => item.value === this.placeId)) {
          return new Promise(resolve => {
            cms.socket.emit('getPlaceDetail', this.placeId, this.token, data => {
              resolve(data)
            })
          })
        }
      },
      async sendRequest() {
        this.sending = true
        const { name: storeName } = await this.getPlaceDetail()
        cms.socket.emit('sendSignInRequest', storeName, this.placeId, request => {
          this.signInRequest = request
          this.sending = false
        })
      },
      choosePlace() {
        if(this.placeId) {
          this.place = this.placesSearchResult.find(p => p.value === this.placeId).text
        }
        this.dialog.combobox = false
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
        align-self: center;
        margin-left: 5px;
      }

      &--subtext {
        margin-left: 5px;
        font-size: 12px;
        margin-bottom: 8px;
        text-align: left;
        align-self: flex-start;
      }
    }

    .bs-tf-wrapper {
      margin: 8px 0;

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

      &.text-small ::v-deep .input {
        flex: 1;

        .bs-tf-input {
          font-size: 24px;
          padding: 13px 6px;
        }
      }
    }
  }

  .g-combobox ::v-deep {
    .bs-tf-label {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .bs-tf-input {
      font-size: 18px;
      padding: 16px 6px;
    }
  }
</style>
