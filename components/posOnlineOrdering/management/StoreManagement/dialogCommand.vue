<template>
  <g-dialog width="60%" v-model="showDialog">
    <g-card>
      <div class="command-display mx-2 mt-2 py-2">
        <div class="mb-2" v-for="({isCommand, text}, i) of commands" :key="'posCommand-' + i">

          <div v-if="isCommand" class="command-display__command">
            <div class="row-flex justify-end">
              <div class="command-display__command-bubble mr-3">
                <span style="white-space: pre-line">{{text}}</span>
              </div>
            </div>
          </div>

          <div v-else class="command-display__response">
            <div class="row-flex">
              <div class="command-display__response-bubble ml-3">
                <div>{{text}}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <textarea class="command-input mt-2 mx-2 pa-2 fs-normal"
                v-model="command"
                @keydown.enter.exact="sendCommand"/>
    </g-card>
  </g-dialog>
</template>

<script>
export default {
  name: "dialogCommand",
  props: {
    value: Boolean,
    deviceId: String,
    commands: Array,
  },
  data() {
    return {
      command: '',
    }
  },
  computed: {
    showDialog: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit('input', value)
      }
    }
  },
  methods: {
    sendCommand(e) {
      e.preventDefault()
      if (!this.command.replace(/\r?\n|\r/g, '').trim().length) return

      this.$emit('sendCommand', this.command);
      this.command = '';
    },
  },
}
</script>

<style scoped lang="scss">
  .command-input {
    width: calc(100% - 1rem);
  }

  .command-display {
    overflow: scroll;
    height: 60vh;
    border: 1px solid #767676;

    &__command {
      &-bubble {
        background-color: #F5F5F5;
        border-radius: 20px;
        padding: 16px;
        position: relative;
        max-width: 60%;
      }
    }

    &__response {
      &-bubble {
        background-color: #F5F5F5;
        border-radius: 20px;
        padding: 16px;
        position: relative;
        max-width: 60%;
      }
    }
  }
</style>
