<template>
  <div class="pos-management">
    <pos-dashboard-sidebar default-path="item.0" :items="sidebarItems" @node-selected="onNodeSelected" ref="sidebar"/>
    <div class="pos-management__main">
      <store-management v-if="view === 'store-management'"/>
      <version-control v-else-if="view === 'version' && versionControlPerm"/>
      <account v-else-if="view === 'account' && manageAccountPerm"/>
      <chat-support v-else-if="view === 'chatSupport' && (chatSupportPerm || appReviewerPerm)"
                    :has-new-messages="hasNewMessages"
                    :selected-device-id-prop="selectedDeviceIdForChat"
                    @all-messages-replied="checkNewMessages"/>
      <support @select-chat="supportSelectChat" v-else-if="view === 'support' && signInSupportPerm"/>
      <affiliate-management v-else-if="view === 'affiliate' && manageAffiliatePerm"/>
    </div>
  </div>
</template>
<script>
  import Account from "./AccountManagement/Account";
  import StoreManagement from './StoreManagement/StoreManagement';
  import VersionControl from "./VersionControl/VersionControl";
  import ChatSupport from "../chatSupport/ChatSupport";
  import Support from "./Support/Support";
  import axios from 'axios';
  import AffiliateManagement from "./AffiliateManagement/AffiliateManagement";

  export default {
    name: 'ManagementView',
    components: {AffiliateManagement, Support, ChatSupport, StoreManagement, Account, VersionControl},
    props: {},
    injectService: [
      'PermissionStore:(versionControlPerm,manageAccountPerm,chatSupportPerm,signInSupportPerm,appReviewerPerm,manageAffiliatePerm)'
    ],
    data: function () {
      return {
        username: cms.loginUser.user.username,
        view: 'store-management',
        selectedDeviceIdForChat: '',
        hasNewMessages: false,
        newChatMessageNotificationSound: new Audio('/plugins/pos-plugin/assets/sounds/new-chat-message.mp3'),
      }
    },
    async created() {
      await this.checkNewMessages()

      cms.socket.on('chatMessageNotification', () => {
        if (this.view !== 'chatSupport') {
          this.hasNewMessages = true
          this.newChatMessageNotificationSound.play()
        }
      })
    },
    computed: {
      sidebarItems() {
        const items = []
        if(this.view === 'store-management') {
          items.push({ title: 'Store Management', icon: 'icon-management_white', onClick: () => this.changeView('store-management') })
        } else {
          items.push({ title: 'Store Management', icon: 'icon-management', onClick: () => this.changeView('store-management') })
        }

        if(this.versionControlPerm) {
          if(this.view === 'version') {
            items.push({ title: 'Version Control', icon: 'icon-version_control_white', onClick: () => this.changeView('version', 'Version Control') })
          } else  {
            items.push({ title: 'Version Control', icon: 'icon-version_control', onClick: () => this.changeView('version', 'Version Control') })
          }
        }

        if(this.manageAccountPerm) {
          if(this.view === 'account') {
            items.push({ title: 'Account Management', icon: 'icon-account-management_white', onClick: () => this.changeView('account', 'Account Management') })
          } else {
            items.push({ title: 'Account Management', icon: 'icon-account-management', onClick: () => this.changeView('account', 'Account Management') })
          }
        }

        if (this.chatSupportPerm || this.appReviewerPerm) {
          items.push({
            icon: 'headset_mic',
            ...this.hasNewMessages && {appendIcon: 'icon-new-chat-messages-notification'},
            title: 'Chat Support',
            onClick: () => this.changeView('chatSupport', 'Chat Support')
          })
        }

        if (this.signInSupportPerm) {
          items.push({ title: 'Sign-in Requests', icon: 'headset_mic', onClick: () => this.changeView('support', 'Sign-in Requests') })
        }
        if(this.manageAffiliatePerm) {
          if(this.view === 'affiliate') {
            items.push({ title: 'Affiliate Management', icon: 'icon-affiliate-management_white', onClick: () => this.changeView('affiliate', 'Affiliate Management')})
          } else {
            items.push({ title: 'Affiliate Management', icon: 'icon-affiliate-management', onClick: () => this.changeView('affiliate', 'Affiliate Management')})
          }
        }
        return items
      },
    },
    methods: {
      onNodeSelected(node) {
        node.onClick && node.onClick.bind(this)();
      },
      changeView(view) {
        if(view) {
          this.view = view
        }
      },
      supportSelectChat(deviceId) {
        this.selectedDeviceIdForChat = deviceId
        this.changeView('chatSupport', 'Sign-in Requests')
        this.$refs.sidebar.setSidebarItem('item.3')
      },
      async checkNewMessages() {
        const {data: {notRepliedCount: notRepliedMessageCount}} = await axios.get('/support/chat/messages/not-replied')
        this.hasNewMessages = notRepliedMessageCount > 0
      },
    }
  }
</script>

<style scoped lang="scss">
  .pos-management {
    display: flex;
    width: 100vw;
    height: 100vh;
    font-size: 15px;

    &__main {
      flex: 1;
      background-color: #F4F7FB;
      padding: 50px 50px 20px 80px;
      overflow: hidden;
    }
  }
</style>

<style lang="scss">
  .bs-tf-wrapper.bs-tf__large {
    margin-left: 0;
    margin-bottom: 16px;

    .bs-tf-label {
      font-size: 15px;
      margin-bottom: 12px;
    }

    .bs-tf-input {
      line-height: 28px;
      font-size: 15px;
    }
  }

  .g-select {
    .bs-tf-wrapper {
      margin-left: 0;
      margin-bottom: 16px;
    }

    .bs-tf-inner-input-group {
      height: 46px;
    }

    .g-chip {
      border-radius: 2px;
    }
  }
</style>
