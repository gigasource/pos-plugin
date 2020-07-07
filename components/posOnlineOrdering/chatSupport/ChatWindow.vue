<template>
  <div class="chat-window col-flex"
       @scroll="onChatWindowScroll"
       ref="chatWindow">
    <template v-if="processedChats && processedChats.length > 0">
      <div class="mb-5 ta-center">
        <g-progress-circular v-if="loadingMoreChats && moreChatsAvailable" indeterminate color="#536DFE"/>
        <span v-else-if="!moreChatsAvailable">No more chat messages available</span>
      </div>
      <div class="mb-2"
           v-for="({_id, text, createdAt, fromServer, client, username, unsent}, i) of processedChats"
           :key="'chat_window_msg' + _id">
        <div v-if="fromServer"
             class="chat-window__server"
             :ref="i === 0 ? 'firstChatMsg' : ''">
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
             :ref="i === 0 ? 'firstChatMsg' : ''">
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
    </template>
    <template v-else>
      <div class="row-flex justify-center align-items-center fill-height">
        <span>{{device ? 'Empty chat history' : 'Select a conversation'}}</span>
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
      usernameMap: Object,

      loadingMoreChats: Boolean,
      moreChatsAvailable: Boolean,
    },
    data() {
      return {
        formattedTexts: [],
        autoScrollToBottom: true,
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
            username = this.device.metadata
                ? (this.device.metadata.customerName ? this.device.metadata.customerName : '')
                : ''
          }

          return {...chat, username}
        })
      }
    },
    watch: {
      device() {
        this.autoScrollToBottom = true
      },
      chats: {
        async handler(val, oldVal) {
          if (!val || val === oldVal) return

          this.scrollToBottom()
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

      onChatWindowScroll: _.debounce(function (e) {
        if (this.loadingMoreChats) return

        const el = this.$refs.chatWindow
        if (!el) return

        const scrollTop = el.scrollTop
        const clientHeight = el.clientHeight
        const scrollHeight = el.scrollHeight

        this.autoScrollToBottom = (scrollTop + clientHeight) >= (scrollHeight - 30)

        if (scrollTop <= 100 && !this.loadingMoreChats && this.moreChatsAvailable) {
          e.preventDefault()
          if (this.$refs.chatWindow.scrollTop === 0) this.$refs.chatWindow.scrollTop = 150
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
    padding: 36px;

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
  }
</style>
