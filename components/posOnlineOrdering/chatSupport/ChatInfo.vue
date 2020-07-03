<template>
  <div class="chat-info">
    <div class="chat-info__title row-flex justify-start">
      <g-edit-view-input :value="username" @input="updateUsername"/>
    </div>

    <div class="row-flex justify-start align-items-center mt-1">
      <g-icon class="mr-1" svg>icon-mobile-phone</g-icon>
      <span>{{deviceName}}</span>
      <span class="mx-2" >|</span>

      <g-icon class="mr-1" svg>icon-last-seen</g-icon>
      <span v-if="online">Active now</span>
      <span v-else>Last seen {{lastSeen | fromNow}}</span>
      <span class="mx-2" >|</span>

      <g-icon class="mr-1" svg>icon-location</g-icon>
      <span>{{location}}</span>
      <span class="mx-2" >|</span>

      <g-autocomplete class="store-assign-box"
                      :items="stores"
                      item-text="name"
                      item-value="_id"
                      :value="assignedStoreId"
                      @input="assignStore"
                      placeholder="No store assigned"/>
<!--      <g-text-field-bs small append-inner-icon="icon-select-store" readonly
                       style="width: initial" v-model="storeName" @click="showStoreAssignDialog = true"/>
      <store-assign-dialog v-model="showStoreAssignDialog"/>-->
      <g-spacer/>

      <g-icon class="mr-2" svg>icon-chat-support-note</g-icon>
      <span>{{chatSupportNotes && chatSupportNotes.length || 0}}</span>
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

    &__title {
      font-weight: bold;
    }
  }

  .store-assign-box {
    width: 20%;

    ::v-deep .g-tf {
      margin: unset;
    }
  }
</style>
