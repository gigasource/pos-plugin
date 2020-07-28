<template>
  <div class="support">
    <div class="support__header">
      <g-text-field-bs
          class="support__header__search mr-3"
          prepend-inner-icon="search"
          placeholder="Search"
          v-model="requestSearchText"/>
      <g-select class="support__header__filter"
                label="Filter"
                :items="filterSelections"
                v-model="activeFilterSelection"/>
    </div>
    <div class="support__table">
      <div class="support__table-header">
        <div class="flex-equal pl-2">Restaurant</div>
        <div style="flex: 0 0 100px">Action</div>
        <div class="w-10">Type</div>
        <div class="assigned-store">Assigned</div>
        <div class="w-12">Device</div>
        <div class="col-2">Location</div>
        <div class="w-10"></div>
      </div>
      <div class="support__table-content">
        <template v-if="!signInRequests || signInRequests.length === 0">
          <div class="support__table-content--empty">
            <img alt src="/plugins/pos-plugin/assets/empty_group.svg"/>
            <p class="text-grey-darken-1 mt-2">Support restaurants list is currently empty</p>
          </div>
        </template>
        <template v-else>
          <div v-for="(request, i) in sortedRequests" :key="i" class="support__table-row">
            <div class="flex-equal pl-2">{{request.requestStoreName}}</div>
            <div style="flex: 0 0 100px">
              <g-icon size="20" class="mr-2" @click="addChat(request.deviceId)">far fa-comment-alt</g-icon>
              <g-icon v-if="!request.storeId" size="20" class="mr-2" @click="addNewStore(request)">icon-add-restaurant</g-icon>
              <g-icon v-if="request.storeId && request.status === 'pending'" size="20" class="mr-2" color="#388E3C" @click="openDialogApprove(request._id)">fas fa-check</g-icon>
              <g-icon v-if="request.status === 'pending'" size="20" color="#FF4452" @click="openDialogDeny(request._id)">fas fa-times</g-icon>
            </div>
            <div class="w-10">{{request.storeId ? 'Sign in' : 'New restaurant'}}</div>
            <div class="assigned-store pr-2">
              <g-autocomplete text-field-component="GTextFieldBs" class="flex-equal"
                              solo
                              rounded
                              :arrow="false"
                              :items="stores"
                              item-text="name"
                              item-value="_id"
                              :value="request.storeId"
                              @input="val => assignStore(request, val)"
                              placeholder="No store assigned"/>
            </div>
            <div class="w-12">{{request.deviceName}}</div>
            <div class="col-2">{{request.deviceLocation}}</div>
            <div class="w-10 pr-2">
              <div v-if="request.status === 'approved'" class="complete">Approved</div>
              <div v-else-if="request.status === 'pending'" class="complete complete--not">Pending</div>
              <div v-else-if="request.status === 'notApproved'" class="complete complete--denied">Not Approved</div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div class="chat">
<!--      <div class="chat-item" v-for="(item, index) in chatItems" :key="`chat_${index}`">
        <div class="chat-item&#45;&#45;header" @click.stop="minimizeChat(item)">
          <div>
            <p class="fs-small fw-700">{{item.restaurant.name}}</p>
            <p class="fs-small-2 text-grey-darken-1">
              <span>{{item.restaurant.assigned}}</span>
              <span class="mx-1">&middot;</span>
              <span>{{item.restaurant.onlineStatus}}</span>
            </p>
          </div>
          <g-spacer/>
          <g-icon @click="closeChat(item)" color="black" size="30">fas fa-times</g-icon>
        </div>
        <template v-if="!item.minimize">
          <div class="chat-item&#45;&#45;main"></div>
          <div class="chat-item&#45;&#45;footer">
            <textarea rows="1" placeholder="Type a message"/>
            <g-btn-bs class="chat-item&#45;&#45;btn-send">
              <g-icon size="16">icon-chat-support-note-send</g-icon>
            </g-btn-bs>
          </div>
        </template>
      </div>-->
    </div>
    <g-dialog v-model="dialog.approve" width="381">
      <g-card class="pa-4">
        <div class="fs-large-2 fw-600">Approve sign-in request</div>
        <div class="pa-3 ta-center">
          <p>Approve the following sign-in request?</p>
          <p class="fw-700">{{selectedRestaurant && selectedRestaurant.name}}</p>
        </div>
        <div class="row-flex align-items-center mt-3">
          <g-spacer/>
          <g-btn-bs text-color="#424242" @click="dialog.approve = false">Cancel</g-btn-bs>
          <g-btn-bs width="100" background-color="#2979FF" text-color="white" @click="approveRequest">Confirm</g-btn-bs>
        </div>
      </g-card>
    </g-dialog>

    <g-dialog v-model="dialog.deny" width="381">
      <g-card class="pa-4">
        <div class="fs-large-2 fw-600">Deny sign-in request</div>
        <div class="pa-3 ta-center">
          <p>Deny the following sign-in request?</p>
          <p class="fw-700">{{selectedRestaurant && selectedRestaurant.name}}</p>
        </div>
        <div class="row-flex align-items-center mt-3">
          <g-spacer/>
          <g-btn-bs text-color="#424242" @click="dialog.deny = false">Cancel</g-btn-bs>
          <g-btn-bs width="100" background-color="#D32F2F" text-color="white" @click="denyRequest">Deny</g-btn-bs>
        </div>
      </g-card>
    </g-dialog>

    <dialog-new-store v-model="dialog.newStore"
                      @submit="addStore($event)"
                      :google-map-place-id="selectedGoogleMapPlaceId"
                      :groups="storeGroups"
                      :countries="countries"/>
  </div>
</template>

<script>
  import axios from 'axios'
  import cloneDeep from 'lodash/cloneDeep'
  import supportedCountries from '../../../Store/supportedCountries';

  export default {
    name: "Support",
    data() {
      return {
        signInRequests: [],
        chatItems: [
          {
            minimize: true,
            restaurant: {
              id: 4,
              name: 'ABC restaurant',
              assigned: 'Unassigned',
              onlineStatus: '45 mins ago'
            }
          },
          {
            minimize: false,
            restaurant: {
              id: 5,
              name: 'ABC restaurant',
              assigned: 'Unassigned',
              onlineStatus: '45 mins ago'
            }
          },
        ],
        dialog: {
          approve: false,
          deny: false,
          newStore: false,
        },
        selectedRestaurant: null,
        selectedRequestId: null,

        filterSelections: [
          {text: 'None', value: 'none'},
          {text: 'Approved', value: 'approved'},
          {text: 'Pending', value: 'pending'},
          {text: 'Not approved', value: 'notApproved'},
        ],
        activeFilterSelection: 'pending',
        requestSearchText: '',
        stores: [],
        storeGroups: [],
        countries: supportedCountries,
        selectedGoogleMapPlaceId: '',
      }
    },
    async created() {
      cms.socket.on('newSignInRequest', request => this.signInRequests.push(request))
      this.signInRequests = (await axios.get('/store/sign-in-requests')).data
      await this.loadStoreGroups()

      const stores = await cms.getModel('Store').find().lean()
      this.stores = stores.map(store => {
        return {
          _id: store._id,
          id: store.id,
          name: `${store.id}. ${store.name || store.settingName} (${store.alias})`,
        }
      }).sort((s1, s2) => +s1.id - +s2.id)
    },
    computed: {
      sortedRequests() {
        let requests = cloneDeep(this.signInRequests)

        switch (this.activeFilterSelection) {
          case 'approved': {
            requests = requests.filter(e => e.status === 'approved')
            break
          }
          case 'pending': {
            requests = requests.filter(e => e.status === 'pending')
            break
          }
          case 'notApproved': {
            requests = requests.filter(e => e.status === 'notApproved')
            break
          }
        }

        requests = requests.sort((cur, next) => {
          const curCreatedAt = (cur.createdAt || new Date()).getTime()
          const nextCreatedAt = (next.createdAt || new Date()).getTime()

          return nextCreatedAt - curCreatedAt
        })

        if (this.requestSearchText && this.requestSearchText.trim().length) {
          requests = requests.filter(r => r.requestStoreName.toLowerCase().includes(this.requestSearchText.toLowerCase()))
        }

        return requests
      },
    },
    methods: {
      addChat(deviceId) {
        this.$emit('select-chat', deviceId)

/*        const item = this.chatItems.find(i => i.restaurant.id === restaurant.id)
        if(item) {
          this.$set(item, 'minimize', false)
        } else {
          this.chatItems.push({
            minimize: false,
            restaurant
          })
        }*/
      },
      openDialogApprove(requestId) {
        this.selectedRequestId = requestId
        this.dialog.approve = true
      },
      openDialogDeny(requestId) {
        this.selectedRequestId = requestId
        this.dialog.deny = true
      },
      async approveRequest() {
        this.dialog.approve = false
        const requestId = this.selectedRequestId
        await axios.put(`/store/sign-in-requests/${requestId}`, {status: 'approved'})
        this.signInRequests.find(e => e._id === requestId).status = 'approved'
      },
      async denyRequest() {
        this.dialog.deny = false
        const requestId = this.selectedRequestId
        await axios.put(`/store/sign-in-requests/${requestId}`, {status: 'notApproved'})
        this.signInRequests.find(e => e._id === requestId).status = 'notApproved'
      },
      async assignStore(request, storeId) {
        const requestId = request._id
        const newRequest = await axios.put(`/store/sign-in-requests/${requestId}`, {storeId})

        const {settingName, name, _id} = newRequest.data.store
        request.storeName = settingName || name
        request.storeId = _id
        request.status = 'pending'
        this.updateRequest(request)
      },
      async addStore({ settingName, settingAddress, groups, country, googleMapPlaceId }) {
        await axios.post('/store/new-store', { settingName, settingAddress, groups, country, googleMapPlaceId })
        const {data: {request}} = await axios.get(`/store/sign-in-requests/${this.selectedRequestId}`)
        if (request) this.updateRequest(request)
      },
      addNewStore(request) {
        this.dialog.newStore = true
        this.selectedRequestId = request._id
        this.selectedGoogleMapPlaceId = request.googleMapPlaceId
      },
      async loadStoreGroups() {
        let storeGroups
        if (cms.loginUser.user.role.name === 'admin') {
          storeGroups = await cms.getModel('StoreGroup').find({})
        } else {
          storeGroups = cms.loginUser.user.storeGroups
        }
        this.storeGroups.splice(0, this.storeGroups.length, ...storeGroups)
      },
      updateRequest(request) {
        const requestIndex = this.signInRequests.findIndex(({_id}) => _id === request._id)
        this.signInRequests.splice(requestIndex, 1, {...request})
      },
/*      minimizeChat(item) {
        item.minimize = !item.minimize
      },
      closeChat(item) {
        const index = this.chatItems.findIndex(i => i.restaurant.id === item.restaurant.id)
        if(index > -1)
          this.chatItems.splice(index, 1)
      }*/
    }
  }
</script>

<style scoped lang="scss">
  .assigned-store {
    max-width: 20%;
    width: 20%;
  }

  .support {
    height: 100%;
    width: 100%;
    overflow: hidden;

    &__header {
      margin-bottom: 16px;
      margin-left: 5px;
      display: flex;
      align-content: center;

      &__filter {
        display: flex;
        width: 20%;

        ::v-deep > div:first-child {
          width: 100%
        }
      }

      ::v-deep &__search {
        display: flex;
        width: 25%;

        div:first-child {
          width: 100%
        }

        .bs-tf-wrapper ::v-deep {
          height: 100%;
          margin: 0;
          padding: 8px 0;
          width: 100%;

          .bs-tf-inner-input-group {
            height: 100%;
            background: white;
            border: 1px solid #EEEEEE;
            border-radius: 2px;
          }
        }
      }
    }

    &__table {
      background: #FFFFFF;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1398);
      border-radius: 2px;
      overflow: hidden;
      height: calc(100% - 120px);

      &-header {
        background: #EFEFEF;
        height: 38px;
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
        color: #757575;

        & > div {
          cursor: pointer;
        }
      }

      &-content {
        height: calc(100% - 38px);
        overflow: hidden auto;
        scrollbar-width: none; // firefox

        &::-webkit-scrollbar {
          display: none;
        }

        &--empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-items: center;
          margin-top: 64px;

          .g-btn-bs ::v-deep > * {
            font-weight: 700;
          }
        }
      }

      &-row {
        display: flex;
        align-items: center;
        height: 55px;
        font-size: 14px;
        color: #424242;
        padding: 16px 0;
        border-bottom: 1px solid #f2f2f2;

        .complete {
          background: #388E3C;
          border-radius: 4px;
          padding: 8px;
          color: white;
          text-align: center;
          cursor: pointer;

          &--not {
            background: #1271FF;
          }

          &--denied {
            background: #D32F2F;
          }
        }

        .g-icon {
          cursor: pointer;
        }
      }
    }

    .chat {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: row-reverse;
      align-items: flex-end;

      &-item {
        border: 1px solid #212121;
        background: white;

        &--header {
          display: flex;
          padding: 8px;
          background: #EFEFEF;
          width: 240px;
        }

        &--main {
          border-top: 1px solid #212121;
          border-bottom: 1px solid #212121;
          height: 240px;
          overflow: auto;
          padding: 8px;
        }

        &--footer {
          padding: 8px;
          display: flex;
          align-items: center;
          height: 55px;

          textarea {
            border: none;
            outline: none;
            resize: none;

            &::placeholder {
              color: #9e9e9e;
              font-size: 14px;
              letter-spacing: -0.2px;
              font-family: 'Muli', sans-serif;
            }
          }
        }

        &--btn-send {
          background: #1271ff;
          box-shadow: 0px 4px 9px rgba(0, 145, 255, 0.35);
          padding: 8px;
          border-radius: 50%;
          margin: 0;
        }
      }
    }
  }
</style>
