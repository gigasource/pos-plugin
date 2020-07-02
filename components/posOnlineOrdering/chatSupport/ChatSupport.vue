<template>
  <div class="chat-support pl-5 pr-5 pt-2">
    <div class="chat-support__title mb-2">Chat Support</div>
    <div class="chat-support__container row-flex">
      <div class="chat-support__container-contact-list col-4">
        <div class="chat-support__container-contact-list__header row-flex align-items-center">
          <g-select class="ml-3" :items="sorting" v-model="activeSorting"></g-select>
          <g-spacer/>
          <g-btn class="mr-2" icon @click.stop="filter">
            <g-icon>search</g-icon>
          </g-btn>
        </div>

        <div class="chat-support__container-contact-list__list col-flex">
          <div v-for="contact in sortedDeviceList" :key="contact._id" @click.stop="setActiveChat(contact)"
               class="chat-support__container-contact-list__list--item row-flex align-items-center pl-3 pr-3"
               :class="contact._id === currentClientId ? 'chat-support__container-contact-list__list--item_active' : ''">
            <div class="chat-support__container-contact-list__list--item_left">
              <div style="font-weight: bold;">
                <span>{{concatContactName(contact)}}</span>
              </div>
              <span>
                {{concatContactMetadata(contact)}}
              </span>
            </div>
            <g-spacer/>
            <div v-if="unreadCountMap[contact._id]"
                class="chat-support__container-contact-list__list--item_right
                row-flex align-items-center justify-center">
              {{unreadCountMap[contact._id]}}
            </div>
          </div>
        </div>
      </div>

      <div class="chat-support__container-chat-window col-8 col-flex">
        <div class="chat-support__container-chat-window__header">
          <chat-info
              v-if="currentClientId"
              class="pa-2"
              :assigned-store-id="currentDevice.storeId"
              :username="currentUsername"
              :device-name="currentDevice.name"
              :online="deviceOnlineStatusMap[currentClientId]"
              :last-seen="currentDevice.lastSeen"
              :location="currentDeviceLocation"
              :stores="stores"
              @assign-store="assignStore"
              @update-username="updateUsername"/>
        </div>

        <chat-window class="chat-support__container-chat-window__content flex-grow-1"
                     :texts="sortedChats"
                     :client-id="currentClientId"/>

        <div class="chat-support__container-chat-window__text-box row-flex">
          <textarea class="ma-2 pa-2 fs-normal"
                    v-model="currentChatMsg"
                    @keydown.enter.exact="sendChatMsg"
                    @keydown.etner.shift.exact="currentChatMsg += '\n'"
                    :disabled="!currentClientId"/>
          <g-btn-bs class="ma-2"
                    background-color="#1271FF"
                    text-color="white"
                    @click="sendChatMsg">Send</g-btn-bs>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import ChatWindow from './ChatWindow'
  import axios from 'axios'
  import uniqBy from 'lodash/uniqBy'
  import isNil from 'lodash/isNil'
  import uuidv1 from 'uuid/v1'
  import ChatInfo from "./ChatInfo"

  export default {
    name: 'ChatSupport',
    components: {ChatInfo, ChatWindow },
    data() {
      return {
        devices: [],
        sorting: [
          { text: 'Last contact', value: 'lastSeen' }
        ],
        activeSorting: 'lastSeen',
        adminId: '5c88842f1591d506a250b2a5',

        stores: [],
        currentChats: [],
        currentChatMsg: '',
        currentClientId: null,
        unreadCountMap: {},
        deviceOnlineStatusMap: {},
      }
    },
    async created() {
      await this.getGsmsDevices()

      const stores = await cms.getModel('Store').find().lean()
      this.stores = stores.map(store => {
        return {
          _id: store._id,
          name: `${store.name} (${store.alias})`,
        }
      });

      cms.socket.on('chatMessage', this.receiveChatMessage)
      cms.socket.on('reloadUnassignedDevices', this.getGsmsDevices)

      const updateDeviceStatus = async deviceId => {
        const clientIds = this.sortedDeviceList.map(({_id}) => _id)
        if (!clientIds.length || !clientIds.includes(deviceId)) return
        this.deviceOnlineStatusMap = await this.getDeviceOnlineStatusMap(clientIds)
      }

      cms.socket.on('gsms-device-connected', updateDeviceStatus)
      cms.socket.on('gsms-device-disconnected', updateDeviceStatus)
    },
    computed: {
      sortedDeviceList() {
        switch (this.activeSorting) {
          case 'lastSeen': {
            return this.devices.sort((cur, next) => {
              const curLatestMsgDate = cur.latestChatMessageDate.getTime()
              const nextLatestMsgDate = next.latestChatMessageDate.getTime()

              if (curLatestMsgDate === nextLatestMsgDate) return next.lastSeen - cur.lastSeen
              else return nextLatestMsgDate - curLatestMsgDate
            })
          }
          default: {
            return this.devices
          }
        }
      },
      sortedChats() {
        return uniqBy(this.currentChats, '_id').sort((e1, e2) => {
          return e1.createdAt - e2.createdAt
        });
      },
      currentDevice() {
        return this.sortedDeviceList.find(({_id}) => _id === this.currentClientId)
      },
      currentUsername() {
        return (this.currentDevice &&
            this.currentDevice.metadata &&
            this.currentDevice.metadata.customerName) || 'Unknown name'
      },
      currentDeviceLocation() {
        return (this.currentDevice &&
            this.currentDevice.metadata &&
            this.currentDevice.metadata.deviceLocation) || 'Unknown location'
      }
    },
    watch: {
      async currentClientId() {
        const getChatApiUrl = `/support/chat/messages?clientId=${this.currentClientId}`
        let {data: chats} = await axios.get(getChatApiUrl)
        chats = chats.map(chat => {
          return {
            ...chat,
            createdAt: new Date(chat.createdAt),
          }
        })
        this.currentChats = chats

        await this.setMessagesRead(this.currentClientId)
      },
      async devices() {
        const clientIds = this.sortedDeviceList.map(({_id}) => _id)
        if (!clientIds.length) return

        const getUnreadMapApiUrl = `/support/chat/unread-messages-count?clientIds=${clientIds.join(',')}&fromServer=false`
        const {data: unreadCountMap} = await axios.get(getUnreadMapApiUrl)
        this.unreadCountMap = unreadCountMap

        this.deviceOnlineStatusMap = await this.getDeviceOnlineStatusMap(clientIds)

        cms.socket.emit('watch-chat-message', clientIds)
      }
    },
    methods: {
      filter() {

      },
      async getGsmsDevices() {
        const {data: gsmsDevices} = await axios.get('/gsms-device/devices');

        this.devices = gsmsDevices;
        this.devices = this.devices.map(device => ({
          ...device,
          lastSeen: new Date(device.lastSeen),
          latestChatMessageDate: new Date(device.latestChatMessageDate),
        }))

        return gsmsDevices;
      },
      concatContactName(contact) {
        return contact.name + (contact.metadata && contact.metadata.customerName
            ? ` - ${contact.metadata.customerName}`
            : '')
      },
      concatContactMetadata(contact) {
        let result = ''

        if (contact.metadata) {
          const location = contact.metadata.deviceLocation
          const phoneNumber = contact.metadata.customerPhone

          if (location) result += location

          if (phoneNumber) {
            result += result ? ` | ${phoneNumber}` : phoneNumber
          }
        }

        return result
      },
      setActiveChat(contact) {
        this.currentClientId = contact._id
      },
      sendChatMsg(e) {
        e.preventDefault()
        if (!this.currentChatMsg.replace(/\r?\n|\r/g, '').trim().length) return

        const dummyId = uuidv1()

        const chatPayload = {
          clientId: this.currentClientId,
          userId: cms.loginUser.user._id,
          createdAt: new Date(),
          text: this.currentChatMsg,
        }

        cms.socket.emit('chat-message', chatPayload, savedMsg => {
          this.currentChats = this.currentChats.filter(e => e._id !== dummyId)
          this.currentChats.push(savedMsg)
        });

        this.currentChatMsg = ''
        this.currentChats.push({
          _id: dummyId,
          ...chatPayload,
          fromServer: true,
        })
      },
      async assignStore(storeId) {
        const deviceId = this.currentClientId
        const assingApiUrl = `/support/assign-device/${deviceId}`
        await axios.put(assingApiUrl, {storeId})
        await this.getGsmsDevices()
      },
      receiveChatMessage(chatMessage) {
        const {clientId, createdAt} = chatMessage

        const device = this.devices.find(({_id}) => _id === clientId)

        if (device) {
          // this.$set(device, 'latestChatMessageDate', new Date(createdAt))
          device.latestChatMessageDate = new Date(createdAt)
        }

        if (clientId === this.currentClientId) {
          chatMessage.read = true
          this.currentChats.push(chatMessage)
          this.setMessagesRead(this.currentClientId)
        } else if (!isNil(this.unreadCountMap[clientId])) {
          this.unreadCountMap[clientId]++
        }
      },
      async setMessagesRead(clientId) {
        const setMessageReadApiUrl = `/support/chat/set-message-read?clientId=${clientId}`
        await axios.put(setMessageReadApiUrl)
        this.unreadCountMap[clientId] = 0
      },
      async getDeviceOnlineStatusMap(clientIds) {
        const apiUrl = `/gsms-device/device-online-status?clientIds=${clientIds.join(',')}`
        const {data: onlineStatusMap} = await axios.get(apiUrl)
        return onlineStatusMap
      },
      async updateUsername(username) {
        const apiUrl = `/gsms-device/device-metadata`
        const payload = {clientId: this.currentClientId, metadata: {customerName: username}}
        await axios.put(apiUrl, payload)
        await this.getGsmsDevices()
      }
    }
  }
</script>

<style scoped lang="scss">
  .chat-support {
    height: 100%;
    overflow: hidden;

    &__title {
      font-size: 20px;
      font-weight: bold;
    }

    &__container {
      background: white;
      width: 100%;
      height: calc(100% - 50px);

      &-contact-list {
        border-right: 1px solid #EFEFEF;
        overflow: auto;

        &__header {
          height: 84px;
          border-bottom: 1px solid #EFEFEF;

          .g-select ::v-deep {
            .g-tf {
              margin: unset;

              &:before {
                display: none;
              }
            }
          }
        }

        &__list {


          &--item {
            height: 96px;
            border-bottom: 1px solid #EFEFEF;

            &_left {

            }

            &_right {
              width: 40px;
              height: 40px;
              background: #ff4452;
              color: #F9FAFB;
              font-size: 20px;
              font-weight: bold;
              border-radius: 20px;
            }

            &_active {
              background: #90cafa;
            }
          }
        }
      }

      &-chat-window {
        &__header {
          flex-basis: 84px;
          height: 84px;
          border-bottom: 1px solid #EFEFEF;
          background: #EFEFEF;
        }

        &__content {

        }

        &__text-box {
          height: 76px;
          flex-basis: 76px;
          background: #EFEFEF;

          textarea {
            height: 60px;
            width: 100%;
            border: solid 1px #9e9e9e;
            border-radius: 4px;
          }
        }
      }
    }
  }
</style>
