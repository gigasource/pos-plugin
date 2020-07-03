<template>
  <div class="chat-window col-flex" ref="chatWindow">
    <template v-if="formattedTexts && formattedTexts.length > 0">
      <div class="mb-2" v-for="{text, createdAt, fromServer, client, user} in formattedTexts">
        <div v-if="fromServer" class="chat-window__server">
          <div class="row-flex justify-end">
            <div class="chat-window__server--bubble mr-3">
              <div style="color: #424242; font-size: 11px;">{{createdAt}}</div>
              <span style="white-space: pre-line">{{text}}</span>
            </div>
            <div class="ta-center">
              <g-icon svg size="32">icon-contact</g-icon>
              <div>{{user}}</div>
            </div>
          </div>
        </div>
        <div v-else class="chat-window__client">
          <div class="row-flex">
            <div class="ta-center">
              <g-icon size="32">icon-contact</g-icon>
              <div>{{client}}</div>
            </div>
            <div class="chat-window__client--bubble ml-3">
              <div style="color: #424242; font-size: 11px;">{{createdAt}}</div>
              <div>{{text}}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="row-flex justify-center align-items-center fill-height">
        <span>{{clientId ? 'Empty chat history' : 'Select a conversation'}}</span>
      </div>
    </template>
  </div>
</template>

<script>
  export default {
    name: 'ChatWindow',
    props: {
      texts: Array,
      clientId: String,
    },
    data() {
      return {
        formattedTexts: []
      }
    },
    mounted() {
      this.$nextTick(() => {
        if (this.$el) {
          this.$el.scrollTop = this.$el.scrollHeight
        }
      })
    },
    activated() {
      this.$nextTick(() => {
        if (this.$el) {
          this.$el.scrollTop = this.$el.scrollHeight
        }
      })
    },
    watch: {
      texts: {
        async handler(val, oldVal) {
          if (!val || val === oldVal) return
          this.formattedTexts = await Promise.all(val.sort((cur, next) => cur.createdAt - next.createdAt)
          .map(async ({ createdAt, fromServer, text, userId }) => {
            const user = await cms.getModel('User').findById(userId)

            return {
              text: text,
              createdAt: dayjs(createdAt).format('DD.MM.YYYY HH:mm'),
              client: '',
              user: user.name,
              fromServer: fromServer
            };
          }))

          this.$nextTick(() => {
            if (this.$el) {
              this.$el.scrollTop = this.$el.scrollHeight
            }
          })
        },
        immediate: true
      }
    }
  }
</script>

<style scoped lang="scss">
  .chat-window {
    overflow: scroll;
    padding: 36px;

    &__client {

      &--bubble {
        background: #F5F5F5;
        border-radius: 20px;
        padding: 16px;
        position: relative;
        max-width: 60%;
      }
    }

    &__server {

      &--bubble {
        color: white;
        background: #536DFE;
        border-radius: 20px;
        padding: 16px;
        position: relative;
        max-width: 60%;
      }
    }
  }
</style>
