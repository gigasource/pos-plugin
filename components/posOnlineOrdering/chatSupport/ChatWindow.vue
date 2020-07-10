<template>
  <div class="chat-window col-flex"
       @scroll="onChatWindowScroll"
       ref="chatWindow">
    <template v-if="deviceId && processedChats && processedChats.length > 0">
      <div class="mb-5 ta-center">
        <g-progress-circular v-if="loadingMoreChats && moreChatsAvailable" indeterminate color="#536DFE"/>
        <span v-else-if="!moreChatsAvailable">No more chat messages available</span>
      </div>
      <div class="mb-2"
           v-for="({_id, text, createdAt, fromServer, client, username, unsent}, i) of processedChats"
           :key="'chat_window_msg' + _id">
        <div v-if="fromServer"
             class="chat-window__server"
             :id="i === 0 ? 'firstChatMsg' : ''">
          <div class="row-flex justify-end">
            <div class="chat-window__server-bubble mr-3"
                 :class="unsent ? 'chat-window__server-bubble--unsent' : ''">
              <div style="color: #424242; font-size: 11px;">{{createdAt | formatChatDate}}</div>
              <span style="white-space: pre-line">{{text}}</span>
            </div>
            <div class="ta-center">
              <g-icon svg size="32">icon-contact</g-icon>
              <div>{{username}}</div>
            </div>
          </div>
        </div>
        <div v-else
             class="chat-window__client"
             :id="i === 0 ? 'firstChatMsg' : ''">
          <div class="row-flex">
            <div class="ta-center">
              <g-icon size="32">icon-contact</g-icon>
              <div>{{client}}</div>
            </div>
            <div class="chat-window__client-bubble ml-3">
              <div style="color: #424242; font-size: 11px;">{{createdAt | formatChatDate}}</div>
              <div>{{text}}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!autoScrollToBottom && newMessageFromClient" class="new-message-notification ta-center">
        <span @click="onNewMessageReceivedBtnClick"
              class="new-message-notification__message">
          Received new message
          <g-icon small color="#ffffff">fa fa-arrow-down</g-icon>
        </span>
      </div>
    </template>
    <template v-else>
      <div class="row-flex justify-center align-items-center fill-height">
        <span v-if="loadingMoreChats">Loading chat messages</span>
        <span v-else>{{device ? 'Empty chat history' : 'Select a conversation'}}</span>
      </div>
    </template>
  </div>
</template>

<script>
  import dayjs from "dayjs";

  export default {
    name: 'ChatWindow',
    props: {
      chats: Array,
      device: Object,
      deviceId: String,
      usernameMap: Object,

      loadingMoreChats: Boolean,
      moreChatsAvailable: Boolean,
    },
    data() {
      return {
        formattedTexts: [],
        autoScrollToBottom: true,
        prevFirstChatMsgEl: null,
        newMessageFromClient: false,
      }
    },
    mounted() {
      this.scrollToBottom()
    },
    activated() {
      this.scrollToBottom()
    },
    computed: {
      processedChats() {
        return this.chats.map(chat => {
          let username

          if (chat.fromServer) {
            username = this.usernameMap[chat.userId]
          } else {
            username = this.device && this.device.metadata
                ? (this.device.metadata.customerName ? this.device.metadata.customerName : '')
                : ''
          }

          return {...chat, username}
        })
      }
    },
    watch: {
      deviceId() {
        this.autoScrollToBottom = true
        this.prevFirstChatMsgEl = null
      },
      chats: {
        async handler(val, oldVal) {
          if (!val || val === oldVal) return
          this.scrollToBottom()

          const oldLatestChatMsg = oldVal && oldVal[oldVal.length - 1]
          const newLatestChatMsg = val[val.length - 1]

          if (!oldLatestChatMsg || !newLatestChatMsg) return

          if (oldLatestChatMsg._id === newLatestChatMsg._id) {
            this.scrollToPrevLastChat()
          } else {
            if (newLatestChatMsg.fromServer) {
              this.autoScrollToBottom = true
              this.scrollToBottom()
            } else {
              if (!this.autoScrollToBottom) this.newMessageFromClient = true
            }
          }
        },
        immediate: true
      }
    },
    methods: {
      scrollToBottom() {
        if (!this.autoScrollToBottom) return

        this.$nextTick(() => {
          const el = this.$refs.chatWindow
          if (el) el.scrollTop = el.scrollHeight
        })
      },
      scrollToPrevLastChat() {
        this.$nextTick(() => {
          if (!this.prevFirstChatMsgEl) return
          this.prevFirstChatMsgEl.scrollIntoView()
        })
      },
      onNewMessageReceivedBtnClick() {
        this.newMessageFromClient = false
        this.autoScrollToBottom = true
        this.scrollToBottom()
      },

      onChatWindowScroll: _.debounce(function () {
        if (this.loadingMoreChats) return

        const el = this.$refs.chatWindow
        if (!el) return

        const scrollTop = el.scrollTop
        const clientHeight = el.clientHeight
        const scrollHeight = el.scrollHeight

        this.autoScrollToBottom = (scrollTop + clientHeight) >= (scrollHeight - 30)
        if (this.autoScrollToBottom) this.newMessageFromClient = false

        if (scrollTop <= 100 && !this.loadingMoreChats && this.moreChatsAvailable) {
          this.prevFirstChatMsgEl = this.$el.querySelector('#firstChatMsg')
          this.$emit('load-more-chat')
        }
      }, 150),
    },
    filters: {
      formatChatDate(date) {
        return dayjs(date).format(`${$t('dates.timeFormat')}, ${$t('dates.dateFormat')}`)
      },
    },
  }
</script>

<style scoped lang="scss">
  .chat-window {
    overflow: scroll;
    padding: 36px 36px 8px;
    position: relative;

    &__client {
      &-bubble {
        background-color: #F5F5F5;
        border-radius: 20px;
        padding: 16px;
        position: relative;
        max-width: 60%;
      }
    }

    &__server {

      &-bubble {
        color: white;
        background-color: #536DFE;
        border-radius: 20px;
        padding: 16px;
        position: relative;
        max-width: 60%;

        &--unsent {
          opacity: 0.5;
        }
      }
    }

    .new-message-notification {
      width: 100%;
      position: sticky;
      bottom: 0;
      margin-bottom: -36px;
      color: white;

      &__message {
        cursor: pointer;
        padding: 8px;
        background-color: #455A64;
        border-radius: 8px;
      }
    }
  }
</style>
