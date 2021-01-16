<template>
  <div v-if="internalValue" class="dialog">
    <div class="dialog-wrapper">
      <div class="dialog-title">
        {{title}}
      </div>
      <template v-if="step === 1">
        <div class="dialog-message">
          Unregistered devices do not save store data and will have some online features limited. Are you sure you want to skip to demo?
        </div>
      </template>
      <template v-else-if="step === 2">
        <div class="dialog-content">
          <div class="dialog-message">
            You can import some demo data to help you familiarize with
            the system <span class="i text-grey-darken-1 fw-200">(Optional)</span>
          </div>
          <div class="dialog-grid">
            <template v-for="(demo, i) in listDemo" :key="i">
              <div :class="['dialog-grid__item', selectedDemo === demo && 'dialog-grid__item--selected']"
                   :style="getBackgroundImage(demo)"
                   @click="selectDemo(demo)">
                <div class="dialog-grid__item-title">{{demo.storeName}}</div>
              </div>
            </template>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="dialog-content">
          <p v-if="mode !== 'demo' && address"><b>Address:</b> {{address}}</p>
          <p v-if="mode !== 'demo' && phone"><b>Phone number: </b> {{phone}}</p>
          <p><b>Import data: </b><span style="text-transform: capitalize">{{selectedDemo && selectedDemo.storeName || 'None'}}</span></p>
          <p v-if="mode === 'demo'"><b>License plan: </b><span class="license">DEMO</span></p>
          <p v-if="mode === 'demo'"><b>End of plan: </b>{{date}}</p>
          <div v-if="mode === 'demo'" class="dialog-content__notice">
            <div class="dialog-content__notice-title">
              <g-icon size="18" color="white" class="mr-2">info</g-icon>
              Important notice
            </div>
            <div>With demo license, store data will be automatically deleted after 30 days of inactivity.</div>
          </div>
        </div>
      </template>
      <div class="dialog-action">
        <g-btn-bs style="margin-right: 8px" icon="chevron_left" @click="back">
          Back
        </g-btn-bs>
        <g-btn-bs v-if="step === 1" style="flex: 1" background-color="#1271FF" @click="changeStep(2)">
          Yes, take me to demo
        </g-btn-bs>
        <g-btn-bs v-else-if="step === 2" style="flex: 1" background-color="#1271FF" @click="changeStep(3)">
          Continue {{selectedDemo ? '' : 'without importing'}}
        </g-btn-bs>
        <g-btn-bs v-else style="flex: 1" background-color="#388E3C" @click="completeSetup">
          Complete
        </g-btn-bs>
      </div>
    </div>
    <div class="dialog-overlay" @click="internalValue = false"></div>
  </div>
</template>

<script>
  export default {
    name: "dialogDemo",
    props: {
      modelValue: Boolean,
      mode: {
        type: String,
        default: 'demo'
      },
      address: String,
      phone: [String,Number],
    },
    data() {
      return {
        step: 1,
        listDemo: [],
        selectedDemo: null,
        isFirstDevice: false
      }
    },
    watch: {
      modelValue(val) {
        if (val) {
          this.step = this.mode === 'demo' ? 1 : 2
          cms.socket.emit('get-demo-stores', this.mode === 'paired', (stores, error) => {
            if (error) {
              console.log(error)
              return
            }
            this.listDemo = stores
            this.selectedDemo = this.listDemo.find(s => s.existingData)
          })
        }
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(val) {
          this.$emit('update:modelValue', val)
        }
      },
      title() {
        if (this.step === 1) {
          return 'Limited Features'
        } else if (this.step === 2) {
          return 'Import demo data'
        } else {
          return 'Confirm your details'
        }
      },
      date() {
        return dayjs().add(30, 'day').format('DD MMMM YYYY')
      }
    },
    methods: {
      getBackgroundImage(demo) {
        return {
          'background-image' : `url("${demo.image || '/plugins/pos-plugin/assets/image/no-demo.png'}")`
        }
      },
      selectDemo(demo) {
        console.log('selectDemo', demo)
        if (this.selectedDemo === demo) {
          this.selectedDemo = ''
        } else {
          this.selectedDemo = demo
        }
      },
      back() {
        if (this.step === 3 || (this.step === 2 && this.mode === 'demo')) {
          this.step --
        } else {
          this.internalValue = false
        }
      },
      changeStep(step) {
        this.step = step
      },
      completeSetup() {
        this.internalValue = false
        this.$emit('complete', this.selectedDemo)
        this.selectedDemo = null
        this.isFirstDevice = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 1000;
    background: transparent;

    &-wrapper {
      width: 458px;
      background: #FFFFFF;
      box-shadow: 0 0 6px rgba(0, 0, 0, 0.197143);
      border-radius: 4px;
      padding: 16px;
      z-index: 2;
    }

    &-overlay {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.21);
      backdrop-filter: blur(3px);
    }

    &-title {
      font-size: 20px;
      line-height: 25px;
      font-weight: 700;
      text-align: center;
      margin: 8px;
    }

    &-message {
      font-size: 15px;
      line-height: 19px;
      font-weight: 400;
      margin: 16px 0;
    }

    &-content {
      max-width: 100%;

      &__notice {
        background: #FFCB3A;
        border-radius: 2px;
        padding: 8px;
        color: white;
        margin: 16px 0;
        font-size: 12px;
        line-height: 15px;

        &-title {
          display: flex;
          font-weight: 700;
          font-size: 14px;
          line-height: 18px;
          margin-bottom: 2px;
        }
      }

      p {
        margin: 6px 0;
        line-height: 20px;
      }

      .license {
        background: #FFCB3A;
        border-radius: 4px;
        padding: 4px 8px;
        color: white;
        font-weight: 600;
        font-size: 15px;
        line-height: 19px;
      }
    }

    &-grid {
      max-width: 100%;
      overflow: auto;
      display: flex;
      margin-bottom: 16px;

      &__item {
        border-radius: 2px;
        flex: 0 0 160px;
        width: 160px;
        height: 160px;
        background-size: cover;
        position: relative;
        cursor: pointer;
        margin-right: 8px;

        &--selected {
          border: 3px solid #1271FF;
          box-shadow: 0 0 10px rgba(18, 113, 255, 0.5);

          .dialog-grid__item-title {
            display: block;
          }
        }

        &-title {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          text-transform: capitalize;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 0 0 2px 2px;
          backdrop-filter: blur(3px);
          font-size: 24px;
          line-height: 32px;
          font-weight: 600;
          display: none;
        }

        &:hover &-title {
          display: block;
        }
      }
    }

    &-action {
      display: flex;

      .g-btn-bs {
        margin: 0
      }
    }
  }
</style>
