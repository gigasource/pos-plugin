<template>
  <div class="chat-info">
    <div class="chat-info--left">
      <g-edit-view-input class="fw-700" :value="username" @input="updateUsername"/>
      <div class="row-flex align-items-center text-grey fs-small">
        <span v-if="online">Active now</span>
        <span v-else>Last seen {{lastSeen | fromNow}}</span>
      </div>
      <div class="row-flex align-items-center">
        <g-icon :title="deviceName" class="mr-1" size="16">icon-device</g-icon>
        <span :title="deviceName" class="chat-info__info">{{deviceName}}</span>
        <span class="mx-2" >|</span>
        <g-icon :title="location" class="mr-1" size="16" color="#9e9e9e">place</g-icon>
        <span :title="location" class="chat-info__info">{{location}}</span>
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
                      :value="assignedStoreId"
                      @input="assignStore"
                      placeholder="No store assigned"/>
      <g-badge :value="true" color="#424242" overlay nudge-top="-4" nudge-right="-4" badge-size="14">
        <template v-slot:badge>
          <span style="font-size: 9px">{{chatSupportNotes && chatSupportNotes.length || 0}}</span>
        </template>
        <g-btn-bs rounded elevation="1" style="border: none; padding: 10px; margin: 0">
          <g-icon size="16">icon-pen</g-icon>
        </g-btn-bs>
      </g-badge>
      <g-menu v-model="menu" close-on-content-click nudge-bottom="5">
        <template v-slot:activator="{on}">
          <g-btn-bs v-on="on" rounded elevation="1" :background-color="menu ? '#BBDEFB' : 'white'" style="border: none; padding: 6px;">
            <g-icon :color="menu ? 'indigo accent-2' : 'gery darken-1'">more_vert</g-icon>
          </g-btn-bs>
        </template>
        <div class="menu">
          <div class="menu-option">Delete</div>
        </div>
      </g-menu>
      <div></div>
    </div>

  </div>
</template>

<script>
  import dayjs from 'dayjs'
  // import StoreAssignDialog from "./StoreAssignDialog";

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
      }
    },
    computed: {
    },
    methods: {
      assignStore(storeId) {
        this.$emit('assign-store', storeId)
      },
      updateUsername(username) {
        this.$emit('update-username', username)
      }
    },
    props: {
      username: String,
      deviceName: String,
      lastSeen: Date,
      location: String,
      stores: Array,
      storeName: {
        type: String,
        default: 'Unassigned',
      },
      chatSupportNotes: [],
      assignedStoreId: String,
      online: Boolean,
    },
    filters: {
      fromNow(val) {
        if (!val) return ''
        return dayjs(val).fromNow()
      }
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
      flex: 0 0 50%;
      max-width: 50%;
      overflow: hidden;
    }

    &--right {
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
      max-width: 40%;
      font-size: 14px;
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
</style>
