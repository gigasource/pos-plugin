<template>
  <div class="chat-info">
    <div class="chat-info--left">
      <g-edit-view-input class="fw-700" :value="username" @input="updateUsername"/>
      <div class="row-flex align-items-center text-grey fs-small">
        <span v-if="device.online">Active now</span>
        <span v-else>Last seen {{device.lastSeen | fromNow}}</span>
      </div>
      <div class="row-flex align-items-center">
        <g-icon :title="device.displayName" class="mr-1" size="16">icon-device</g-icon>
        <span :title="device.displayName"
              class="chat-info__info chat-info--device-name">
          {{device.displayName}}
        </span>

        <template v-if="deviceIp">
          <span class="mx-2">|</span>
          <g-icon :title="deviceIp" class="mr-1" size="16">fa fa-address-book</g-icon>
          <span :title="deviceIp"
                class="chat-info__info chat-info--device-ip">
          {{deviceIp}}
          </span>
        </template>

        <span class="mx-2">|</span>
        <g-icon :title="location" class="mr-1" size="16" color="#9e9e9e">place</g-icon>
        <span :title="location"
              class="chat-info__info chat-info--device-location">
          {{location}}
        </span>
      </div>
    </div>
    <div class="chat-info--right">
      <g-autocomplete text-field-component="GTextFieldBs" class="flex-equal"
                      solo
                      rounded
                      :arrow="false"
                      append-inner-icon="icon-zoom@16"
                      :items="stores"
                      item-text="name"
                      item-value="_id"
                      :value="device.storeId"
                      @input="assignStore"
                      placeholder="No store assigned"/>
      <g-badge :value="true" :color="sortedNotes.length ? '#536DFE' : '#424242'" overlay nudge-top="-4" nudge-right="-4" badge-size="14">
        <template v-slot:badge>
          <span style="font-size: 9px">{{sortedNotes.length}}</span>
        </template>
        <g-btn-bs rounded elevation="1" style="border: none; padding: 10px; margin: 0" @click="showNoteDialog = true">
          <g-icon size="16">icon-pen</g-icon>
        </g-btn-bs>
      </g-badge>
      <g-menu v-model="menu" close-on-content-click nudge-bottom="5">
        <template v-slot:activator="{on}">
          <g-btn-bs v-on="on" rounded elevation="1" :background-color="menu ? '#BBDEFB' : 'white'"
                    style="border: none; padding: 6px;">
            <g-icon :color="menu ? 'indigo accent-2' : 'gery darken-1'">more_vert</g-icon>
          </g-btn-bs>
        </template>
        <div class="menu">
          <div @click="showDeleteConfirmDialog = true" class="menu-option">Delete</div>
        </div>
      </g-menu>
      <div></div>
    </div>

    <g-dialog :value="showDeleteConfirmDialog" persistent width="40%">
      <g-card elevation="16">
        <g-card-title class="delete-confirm-dialog--title">
          Deleting device {{device.displayName}}
        </g-card-title>
        <g-card-text class="mt-3">
          <span>
            <b>Warning: Deleting this device will</b>
            <br>
            - Remove this device from contact list
            <br>
            - Make chat history of this device inaccessible
            <br>
            - Remove this device from assigned store (if any)
            <br>
            - Device will not appear in Chat Support tab again unless user re-installs the app
          </span>
        </g-card-text>
        <g-card-actions>
          <g-btn background-color="warning" text-color="#ffffff" @click="showDeleteConfirmDialog = false">Cancel</g-btn>
          <g-btn background-color="#FF4C4C" text-color="#ffffff" @click="deleteDevice">Delete</g-btn>
        </g-card-actions>
      </g-card>
    </g-dialog>

    <g-dialog class="chat-info__note-dialog" :value="showNoteDialog" width="50%" persistent>
      <g-card>
        <g-card-title class="chat-info__note-dialog__title">
          <span class="ml-3">Note</span>
          <g-spacer/>
          <g-btn icon @click="showNoteDialog = false">
            <g-icon color="#424242" >fa fa-times</g-icon>
          </g-btn>
        </g-card-title>

        <g-card-text class="chat-info__note-dialog__content">
          <div v-for="(note, i) of sortedNotes"
               :key="note._id"
               class="row-flex"
               :class="i < sortedNotes.length - 1 ? 'mb-2 pb-2' : ''"
               :style="i < sortedNotes.length - 1 ? 'border-bottom: 1px solid #EFEFEF' : ''">
            <div class="col-1 row-flex justify-center">
              <g-icon xLarge>icon-chat-support-note-user</g-icon>
            </div>

            <div class="col-flex col-11">
              <div>
                <span class="fs-normal fw-700">{{usernameMap[note.userId] || 'Unknown username'}}</span>
                <span> • </span>
                <span class="fs-small-2 fw-200">{{note.createdAt | formatNoteDate}}</span>
              </div>

              <div>
                {{note.text}}
              </div>
            </div>
          </div>
        </g-card-text>

        <g-card-actions class="chat-info__note-dialog__action-bar">
          <div class="row-flex" style="width: 100%">
            <textarea class="flex-grow-1 pa-2 fs-normal"
                      v-model="currentNoteText"
                      @keydown.enter.exact="addNote"
                      @keydown.etner.shift.exact="currentNoteText += '\n'"/>
            <g-btn-bs class="flex-grow-0 px-6 mr-0"
                      background-color="#1271FF"
                      text-color="white"
                      @click="addNote">
              <g-icon>icon-chat-support-note-send</g-icon>
            </g-btn-bs>
          </div>
        </g-card-actions>
      </g-card>
    </g-dialog>
  </div>
</template>

<script>
  import dayjs from 'dayjs'

  export default {
    name: "ChatInfo",
    components: {
      // StoreAssignDialog
    },
    data() {
      return {
        // showStoreAssignDialog: false,
        selectedStore: 'null',
        menu: false,
        showDeleteConfirmDialog: false,
        showNoteDialog: false,
        currentNoteText: '',
      }
    },
    props: {
      device: Object,
      username: String,
      location: String,
      stores: Array,
      storeName: {
        type: String,
        default: 'Unassigned',
      },
      assignedStoreId: String,
      usernameMap: Object,
    },
    computed: {
      sortedNotes() {
        return (this.device.notes || []).sort((e1, e2) => e2.createdAt - e1.createdAt)
      },
      deviceIp() {
        return (this.device.metadata && this.device.metadata.deviceIp) || ''
      }
    },
    methods: {
      assignStore(storeId) {
        this.$emit('assign-store', storeId)
      },
      updateUsername(username) {
        this.$emit('update-username', username)
      },
      deleteDevice() {
        this.$emit('delete-device', this.device._id)
        this.showDeleteConfirmDialog = false
      },
      addNote(e) {
        e.preventDefault()
        if (!this.currentNoteText.replace(/\r?\n|\r/g, '').trim().length) return

        const note = {
          clientId: this.device._id,
          text: this.currentNoteText,
          userId: cms.loginUser.user._id,
        }

        this.currentNoteText = ''
        this.$emit('add-note', note)
      },
    },
    filters: {
      fromNow(val) {
        if (!val) return ''
        return dayjs(val).fromNow()
      },
      formatNoteDate(date) {
        return dayjs(date).format(`${$t('dates.timeFormat')}, ${$t('dates.dateFormat')}`)
      },
    }
  }
</script>

<style scoped lang="scss">
  .chat-info {
    width: 100%;
    height: 100%;
    display: flex;
    border-radius: 2px 0 0 2px;
    padding: 8px 16px;

    &--left, &--right {
      overflow: hidden;
    }

    &--left {
      flex: 0 0 60%;
      max-width: 60%;
    }

    &--right {
      flex: 0 0 40%;
      max-width: 40%;
      display: flex;
      align-items: center;

      ::v-deep .bs-tf-inner-input-group {
        background: white;
      }
    }

    &__info {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-size: 14px;
    }

    &--device-name {
      max-width: 30%;
    }

    &--device-ip {
      max-width: 20%;
    }

    &--device-location {
      max-width: 50%;
    }

    .contact-note-dialog {
      &__action-bar {
        &__input {
          flex-grow: 1;
        }

        &__send-btn {
         flex-grow: 0;
        }
      }
    }


    &__note-dialog {
      &__title {
        font-size: 20px !important;
      }

      &__content {
        height: 50vh;
        overflow: auto;
      }

      &__action-bar {
        height: 76px;
        flex-basis: 76px;

        textarea {
          height: 60px;
          width: 100%;
          border: solid 1px #9e9e9e;
          border-radius: 4px;
        }
      }
    }
  }

  .menu {
    background: #FFFFFF;
    border: 1px solid #D3D3D3;
    border-radius: 2px;
    padding: 8px;

    &-option {
      font-size: 14px;
      color: #201F2B;
      padding: 4px;
      cursor: pointer;
    }
  }

  .delete-confirm-dialog--title {
    background-color: #FF4C4C;
    color: white;
  }
</style>
