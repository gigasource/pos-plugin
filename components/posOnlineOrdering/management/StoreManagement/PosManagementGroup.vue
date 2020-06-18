<template>
  <div class="pos-management-group">
    <div class="pos-management-group__header"
         @click="toggleContent"
         @mouseenter="showGroupActionBtns = true"
         @mouseleave="showGroupActionBtns = false">

      <!-- Group expand/collapse -->
      <g-icon class="icon-first" size="20" v-if="showContent">expand_less</g-icon>
      <g-icon class="icon-first" size="20" v-else>expand_more</g-icon>

      <!-- Group name/editname -->
      <g-edit-view-input
          :value="name"
          @click.native.stop.prevent="() => {}"
          @input="(value, cb) => $emit('update:groupName', _id, value, cb)">
        <template v-slot:action="{mode, switchToEditMode, applyChange, resetValue}">
          <g-menu v-if="mode !== 'edit' && manageGroupPerm" v-model="nameEditMenu" close-on-content-click
                  nudge-bottom="5" nudge-left="30">
            <template v-slot:activator="{on}">
              <div class="btn-edit" :style="[nameEditMenu && {background: '#F4F5FA'}]">
                <g-icon v-if="showGroupActionBtns || nameEditMenu" :class="[nameEditMenu && 'btn-edit--active']" size="16"
                        @click="on.click">mdi-pencil-outline
                </g-icon>
              </div>
            </template>
            <div class="menu-edit">
              <div @click="switchToEditMode()">Rename</div>
              <div v-if="stores.length === 0" @click="$emit('delete:group', _id)">Delete</div>
            </div>
          </g-menu>
          <g-icon v-if="mode === 'edit'" @click="applyChange()" class="ml-1">mdi-check</g-icon>
          <g-icon v-if="mode === 'edit'" @click="resetValue()" class="ml-1">mdi-close</g-icon>
        </template>
      </g-edit-view-input>

      <!-- Group More Actions -->
      <g-menu v-if="(showGroupActionBtns || menuCtx.showMoreGroupAction) && type === 'franchises'" v-model="menuCtx.showMoreGroupAction" close-on-content-click>
        <template v-slot:activator="{on}">
          <g-icon @click.prevent.stop="menuCtx.showMoreGroupAction = true">more_horiz</g-icon>
        </template>
        <div class="menu-action">
          <div class="menu-action__option row-flex align-items-center" @click="showGroupEmbeddedCode">
            <img src="/plugins/pos-plugin/assets/coding.svg" draggable="false" width="20"/>
            <span class="ml-1" style="line-height: 20px">Get embeded code</span>
          </div>
        </div>
      </g-menu>
    </div>
    
    <g-expand-transition>
      <template v-if="showContent || searchText">
        <div class="pos-management-group__content">
          <div v-for="(store, i) in stores" :class="getStoreRowClass(i)">
            <div class="pos-management-group__content-info" @click="toggleStoreSetting(store)">
              <div style="flex: 0 0 25%; padding-left: 16px">
                <div class="fw-700 text-blue-accent-3">ID: {{store.id}}</div>
                <div>{{store.settingName}}</div>
                <div>{{store.settingAddress}}</div>
                <div style="font-size: 12px;" v-if="viewMonthlyRevenuePerm">
                  <div v-if="store.prevMonthReport">
                    <span style="font-weight: bold;">Previous month: </span>
                    <span>{{store.prevMonthReport.orders}} orders, {{store.prevMonthReport.total | currency(store.country.locale)}}</span>
                  </div>
                  <div v-if="store.currentMonthReport">
                    <span style="font-weight: bold;">Current month: </span>
                    <span>{{store.currentMonthReport.orders}} orders, {{store.currentMonthReport.total | currency(store.country.locale)}}</span>
                  </div>
                </div>
              </div>
              <div style="flex: 1">
                <div class="row-flex mb-1" v-for="(device, index) in store.devices"
                     :key="`device_${store.id}_${index}`">
                  <div class="row-flex col-2">
                    <g-icon style="min-width: 24px">{{getDeviceIcon(device)}}</g-icon>
                    <span class="ml-1">
                      <div>{{device.name}}</div>
                      <div style="font-size: 10px; font-style: italic; color: #757575; margin-top: -5px;"
                           v-if="device.features.onlineOrdering"> (Online ordering)</div>
                    </span>
                  </div>
                  <div class="col-2">
                    {{device.hardware}}
                  </div>
                  <div class="row-flex col-3">
                    {{ `${device.appVersion} (${device.appName}, ${device.appRelease})` }}
                  </div>
                  <div class="row-flex col-4">
                    <template v-if="updateAppPerm">
                      <g-select class="w-60" :items="device.versions" v-model="device.updateVersion"/>
                      <p v-if="device.updateVersion && device.canUpdate" class="ml-3 text-indigo-accent-2"
                         style="cursor: pointer"
                         @click="$emit('update:deviceAppVersion', device)">Update</p>
                    </template>
                  </div>
                  <div class="col-1 row-flex align-items-center">
                    <!-- remote control -->
                    <g-tooltip v-if="remoteControlPerm" :open-on-hover="true" top speech-bubble color="#000"
                               transition="0.3">
                      <template v-slot:activator="{on}">
                        <div :class="device.online && device.paired && device.features && device.features.proxy && !disableRemoteControlBtn
                                  ? 'pos-management-group__content-btn' : 'pos-management-group__content-btn--disabled'"
                             @mouseenter="on.mouseenter"
                             @mouseleave="on.mouseleave"
                             @click="() => {openWebRTCRemoteControl(store, device); on.mouseleave()}">
                        </div>
                      </template>
                      <span>Web RTC Remote Control</span>
                    </g-tooltip>
                    <!-- extra actions -->
                    <g-menu v-model="device.menu" close-on-content-click nudge-bottom="5">
                      <template v-slot:activator="{on}">
                        <g-icon :class="[device.menu && 'menu--active', 'ml-2']" @click="on.click">more_horiz</g-icon>
                      </template>
                      <div class="menu-action">
                        <div v-if="featureControlPerm" class="menu-action__option"
                             @click="$emit('open:editDeviceFeatureDialog', store, device)">Feature control
                        </div>
                        <div v-if="settingsPerm" class="menu-action__option"
                             @click="$emit('open:editDeviceNameDialog', device)">Edit name
                        </div>
                        <div v-if="settingsPerm" class="menu-action__option"
                             @click="$emit('open:deleteDeviceDialog', device)">Delete device
                        </div>
                        <div v-if="featureControlPerm" class="menu-action__option"
                             @click="startRemoteControl(device)">Proxy Remote Control
                        </div>
                      </div>
                    </g-menu>
                  </div>
                </div>
              </div>
            </div>
            <div class="pos-management-group__content-action">
              <div v-if="settingsPerm" class="action-item">
                <g-tooltip open-on-hover bottom speech-bubble color="#000" transition="0.3" remove-content-on-close>
                  <template v-slot:activator="{on}">
                    <div class="action-item__btn cog"
                         @mouseenter="on.mouseenter"
                         @mouseleave="on.mouseleave"
                         @click.stop.prevent="$emit('view:settings', store)">
                      <g-icon size="16">icon-cog2</g-icon>
                    </div>
                  </template>
                  <span>Settings</span>
                </g-tooltip>
              </div>
              <div v-if="configOnlineOrderingPerm" class="action-item">
                <g-tooltip open-on-hover bottom speech-bubble color="#000" transition="0.3" remove-content-on-close>
                  <template v-slot:activator="{on}">
                    <div class="action-item__btn fork_knife"
                         @mouseenter="on.mouseenter"
                         @mouseleave="on.mouseleave"
                         @click.stop.prevent="openWebShopSetting(store)">
                      <g-icon size="16">icon-fork_knife_setting</g-icon>
                    </div>
                  </template>
                  <span>Online Ordering Config</span>
                </g-tooltip>
              </div>
              <div v-if="configOnlineOrderingPerm" class="action-item">
                <g-tooltip open-on-hover bottom speech-bubble color="#000" transition="0.3" remove-content-on-close>
                  <template v-slot:activator="{on}">
                    <div class="action-item__btn preview"
                         @mouseenter="on.mouseenter"
                         @mouseleave="on.mouseleave"
                         @click.stop.prevent="openWebShopStore(store)">
                      <g-icon size="16">icon-preview</g-icon>
                    </div>
                  </template>
                  <span>Online Ordering Preview</span>
                </g-tooltip>
              </div>
              <div v-if="settingsPerm" class="action-item">
                <g-tooltip open-on-hover bottom speech-bubble color="#000" transition="0.3" remove-content-on-close>
                  <template v-slot:activator="{on}">
                    <div class="action-item__btn chain"
                         @mouseenter="on.mouseenter"
                         @mouseleave="on.mouseleave"
                         @click.stop.prevent="$emit('open:pairDeviceDialog', store)">
                      <g-icon size="16">icon-chain</g-icon>
                    </div>
                  </template>
                  <span>Pair New Device</span>
                </g-tooltip>
              </div>
            </div>
          </div>

          <!-- Proxy -->
          <g-dnd-dialog v-if="remoteControlPerm" v-model="showIframe" :width="iframeWidth"
                        :height="iframeHeight" lazy @close="stopRemoteControl"
                        @dragStart="iframeDragging = true" @dragEnd="iframeDragging = false"
                        @resizeStart="iframeDragging = true" @resizeEnd="iframeDragging = false">
            <template #title>
              Remote Control
            </template>

            <div v-if="showIframe && iframeDragging"
                 style="height: 100%; width: 100%; position: absolute; background: transparent"/>
            <iframe v-if="showIframe" :src="proxyUrl" width="100%" height="100%" @load="onIframeLoad" ref="iframe"/>
          </g-dnd-dialog>

          <!-- WebRTC remote control -->
          <g-dnd-dialog v-model="dialog.webRTC.show"
                        lazy
                        :width="dialog.webRTC.width"
                        :height="dialog.webRTC.height"
                        @dragStart="dialog.webRTC.dragging = true" @dragEnd="dialog.webRTC.dragging = false"
                        @resizeStart="dialog.webRTC.dragging = true" @resizeEnd="dialog.webRTC.dragging = false"
                        @close="closeWebRTCRemoteControl">
            <template v-if="dialog.webRTC.show" #title>WebRTC remote control ({{ dialog.webRTC.device._id }})</template>
            <div v-if="dialog.webRTC.show && dialog.webRTC.dragging"
                 style="height: 100%; width: 100%; position: absolute; background: transparent"/>
            <iframe v-if="dialog.webRTC.show" :src="dialog.webRTC.src" width="100%" height="100%"/>
          </g-dnd-dialog>
        </div>
      </template>
    </g-expand-transition>
  
    <dialog-gen-html-code v-model="dialog.embeddedCode.show" v-bind="dialog.embeddedCode"/>
  </div>
</template>

<script>
  import _ from 'lodash'
  import DialogFeatureControl from './dialogFeatureControl';
  import DialogPairNewDeviceSuccess from './dialogPairNewDeviceSuccess';
  import DialogEditDeviceName from './dialogEditDeviceName';
  import DialogGenHtmlCode from './dialogGenHtmlCode';

  export default {
    name: "PosManagementGroup",
    components: { DialogGenHtmlCode, DialogEditDeviceName, DialogPairNewDeviceSuccess, DialogFeatureControl},
    props: {
      _id: String,
      name: String,
      type: String,
      stores: Array,
      appItems: Array,
    },
    injectService: [
      'PosOnlineOrderManagementStore:(searchText)',
      // permissions
      'PermissionStore:(versionControlPerm,manageAccountPerm,manageGroupPerm,manageStorePerm,settingsPerm,updateAppPerm,remoteControlPerm,featureControlPerm,configOnlineOrderingPerm,viewMonthlyRevenuePerm)'
    ],
    filters: {
      currency(val, locale = 'en') {
        return `${$t('common.currency', locale)} ${!isNaN(val) && val > 0 ? val.toFixed(2): 0}`
      },
    },
    data() {
      return {
        showContent: false,
        showStoreSetting: {},
        iframeWidth: window.innerWidth * 0.6,
        iframeHeight: window.innerHeight * 0.6,
        showIframe: false,
        iframeDragging: false,
        iframeRefreshInterval: null,
        remoteControlDeviceId: null,
        disableRemoteControlBtn: false,
        nameEditMenu: false,
        selectedStore: null,
        selectedDevice: null,
        proxyInfo: null,
        proxyUrl: 'about:blank',
        showGroupActionBtns: false,
        
        //
        menuCtx: {
          showMoreGroupAction: false,
        },
        
        //
        dialog: {
          webRTC: {
            show: false,
            width: 1024 + 4 /*border left-right 2px*/,
            height: 600 + 4 + 32 /*border top-bottom dnd header*/,
            src: 'about:blank',
            device: null,
            dragging: false
          },
          embeddedCode: {
            show: false,
            id: null,
            type: null,
            locale: null
          }
        }
      }
    },
    computed: {},
    methods: {
      getDeviceIcon(device) {
        return device.online ? 'icon-screen_blue' : 'icon-screen'
      },
      toggleContent() {
        this.showContent = !this.showContent
      },
      toggleStoreSetting(store) {
        if (!_.has(this.showStoreSetting, store._id)) {
          this.$set(this.showStoreSetting, store._id, true)
        } else {
          this.showStoreSetting[store._id] = !this.showStoreSetting[store._id]
        }
      },
      // style
      getStoreRowClass(index) {
        return (index % 2 === 0) ? 'pos-management-group__content--even' : 'pos-management-group__content--odd'
      },
      getStatusClass(status) {
        return (status === 'online') ? 'pos-management-group__status--online' : (status === 'offline') ? 'pos-management-group__status--offline' : ''
      },
      //
      openWebShopSetting(store) {
        window.open(`${location.origin}/setting/${store.alias || store._id}`)
      },
      openWebShopStore(store) {
        window.open(`${location.origin}/store/${store.alias || store._id}`)
      },
      openWebRTCRemoteControl(store, device) {
        this.dialog.webRTC.device = device
        window.cms.socket.emit('startStream', device._id)
        this.dialog.webRTC.src = `https://screencast.gigasource.io/remoteControl.html?deviceId=device_${device._id}&showMenuButton=false&autoScaleViewport=true`
        this.dialog.webRTC.show = true
      },
      closeWebRTCRemoteControl() {
        if (this.dialog.webRTC.device) {
          console.log('close web rtc remote control')
          window.cms.socket.emit('stopStream', this.dialog.webRTC.device._id)
          this.dialog.webRTC.src = 'about:blank'
          this.dialog.webRTC.show = false
          this.dialog.webRTC.device = null
        }
      },
      startRemoteControl({_id: deviceId, online}) {
        if (!online || this.disableRemoteControlBtn) return
        this.disableRemoteControlBtn = true

        this.remoteControlDeviceId = deviceId
        const {socket} = window.cms

        socket.emit('startRemoteControl', this.remoteControlDeviceId, (proxyHost, proxyPort) => {
          let proxyUrl = `${location.protocol}//${location.hostname}:${proxyPort}`

          const {proxyUrlTemplate, proxyRetryInterval} = this.proxyInfo
          if (proxyUrlTemplate) proxyUrl = proxyUrlTemplate.replace('${port}', proxyPort)

          if (proxyPort) {
            this.proxyUrl = proxyUrl
            this.showIframe = true

            if (proxyRetryInterval > 0) {
              this.iframeRefreshInterval = setInterval(() => {
                this.proxyUrl = ''
                this.$nextTick(() => this.proxyUrl = proxyUrl)
              }, proxyRetryInterval)
            }
          } else {
            console.error('Error occurred: no proxy port is available')
          }
        })
      },
      stopRemoteControl() {
        this.disableRemoteControlBtn = false

        if (this.iframeRefreshInterval) clearInterval(this.iframeRefreshInterval)
        if (!this.remoteControlDeviceId) return

        window.cms.socket.emit('stopRemoteControl', this.remoteControlDeviceId)
        this.remoteControlDeviceId = null
      },
      onIframeLoad() {
        if (this.iframeRefreshInterval) clearInterval(this.iframeRefreshInterval)
      },
      
      // embedded code
      showGroupEmbeddedCode() {
        this.$set(this.dialog, 'embeddedCode', {
          show: true,
          id: this._id,
          locale: null,
          type: 'franchise'
        })
      }
    },
    created() {
      window.cms.socket.emit('getProxyInfo', proxyInfo => this.proxyInfo = proxyInfo)
    },
    beforeDestroy() {
      this.stopRemoteControl()
    },
  }
</script>

<style scoped lang="scss">
  .pos-management-group {
    width: 100%;

    &__header {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 14px;
      font-weight: 700;
      border-bottom: 1px solid #EFEFEF;

      .icon-first {
        margin: 16px;
        box-shadow: 0.5px 0px 2px rgba(0, 0, 0, 0.1398);
      }
    }

    &__content {
      border-bottom: 1px solid #EFEFEF;

      &--even {
        background: #FFFFFF;
      }

      &--odd {
        background: #FAFAFC;
      }

      &-info {
        display: flex;
        align-items: flex-start;
        font-size: 14px;
        color: #201F28;
        cursor: pointer;

        & > div {
          padding: 10px 0;
        }

        .g-select ::v-deep {
          .g-tf-wrapper {
            margin: 0;
            background: #efefef;
            border-radius: 2px;

            &:before, &:after {
              display: none;
            }

            .input {
              padding-left: 8px;
              width: 100%;
              overflow: auto;
              white-space: nowrap;
              scrollbar-width: none;

              &::-webkit-scrollbar {
                display: none;
              }
            }

            .g-tf-input {
              display: none;
            }
          }
        }
      }

      &-btn {
        background-image: url("/plugins/pos-plugin/assets/remote_control.svg");
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center;
        width: 25px;
        height: 25px;
        cursor: pointer;

        &:hover {
          background-image: url("/plugins/pos-plugin/assets/remote_control_blue.svg");
        }

        &--disabled {
          background-image: url("/plugins/pos-plugin/assets/remote_control.svg");
          background-repeat: no-repeat;
          background-size: contain;
          background-position: center;
          width: 25px;
          height: 25px;
          opacity: 0.2;
        }
      }


      &-action {
        display: flex;
        align-items: center;
        margin-left: 16px;

        .action-item {
          margin: 8px 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;

          &:not(:last-child):after {
            content: '|';
            margin: 8px;
            color: #9E9E9E;
          }

          &__btn {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;

            &.cog:hover > .icon-cog2 {
              background-image: url("/plugins/pos-plugin/assets/cog2_blue.svg");
            }

            &.chain:hover > .icon-chain {
              background-image: url("/plugins/pos-plugin/assets/chain_blue.svg");
            }

            &.preview:hover > .icon-preview {
              background-image: url("/plugins/pos-plugin/assets/preview_blue.svg");
            }

            &.fork_knife:hover > .icon-fork_knife_setting {
              background-image: url("/plugins/pos-plugin/assets/fork_knife_setting_blue.svg");
            }
          }

          &:hover .action-item__btn {
            background: #eeeeee;
          }

        }
      }
    }

    &__status {
      &--online {
        background: #DFF2DF;
        color: #4CAF50;
        border-radius: 16px;
        line-height: 2;
        padding: 0 8px;
        text-transform: capitalize;
      }

      &--offline {
        background: #FFF3E0;
        color: #FF9800;
        border-radius: 16px;
        line-height: 2;
        padding: 0 8px;
        text-transform: capitalize;
      }
    }

    .btn-edit {
      width: 25px;
      height: 25px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 8px;

      &--active {
        color: #536DFE !important;
      }
    }
  }

  .menu {
    &-edit {
      background: white;
      border-radius: 2px;

      & > div {
        padding: 6px 12px;
        cursor: pointer;

        &:hover {
          background-color: #EFEFEF;
        }
      }
    }

    &--active {
      border-radius: 50%;
      background: #F4F5FA;
      color: #536DFE !important;
    }

    &-action {
      background: white;
      border-radius: 2px;

      &__option {
        color: #201F2B;
        padding: 8px 36px 8px 12px;
        white-space: nowrap;
        font-size: 14px;
        cursor: pointer;

        &:hover {
          background-color: #EFEFEF;
        }
      }
    }
  }
</style>
<style lang="css">
  /*change entire web page*/
  .g-dnddialog-content {
    overflow-y: initial !important;
  }
</style>
