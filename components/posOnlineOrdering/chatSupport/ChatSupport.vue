<template>
  <div class="chat-support pl-5 pr-5 pt-2">
    <div class="chat-support__container row-flex">
      <div class="chat-support__container-contact-list col-3">
        <div style="position: sticky; top: 0; background: #F4F7FB">
          <div class="chat-support__container-contact-list__title mb-2 row-flex align-items-center">
            <span class="fs-large-2">Chat Support</span>
            <g-spacer/>
            <g-select class="chat-support__container-contact-list__title__sort"
                      label="Sort"
                      :items="sortTypes"
                      v-model="activeSortType"></g-select>
          </div>
          <div class="chat-support__container-contact-list__header row-flex align-items-center">
            <g-text-field-bs
                prepend-inner-icon="search"
                placeholder="Search"
                v-model="contactSearch"/>
          </div>
        </div>

        <div class="chat-support__container-contact-list__list col-flex">
          <div v-for="contact in sortedDeviceList" :key="contact._id" @click.stop="setActiveChat(contact)"
               class="chat-support__container-contact-list__list--item row-flex align-items-center pl-3 pr-3"
               :class="contact._id === selectedDeviceId ? 'chat-support__container-contact-list__list--item_active' : ''">
            <div class="chat-support__container-contact-list__list--item_left">
              <div style="font-weight: bold;">
                <span>{{contact.name}}</span>
              </div>
              <span>
                {{concatContactMetadata(contact)}}
              </span>
            </div>
            <g-spacer/>
            <div v-if="contact.unread"
                 class="chat-support__container-contact-list__list--item_right row-flex align-items-center justify-center">
              {{contact.unread}}
            </div>
          </div>
        </div>
      </div>

      <div class="chat-support__container-chat-window col-8 col-flex">
        <div class="chat-support__container-chat-window__header">
          <chat-info
              v-if="selectedDeviceId"
              :device-id="selectedDeviceId"
              :assigned-store-id="selectedDevice.storeId"
              :username="selectedUsername"
              :device-name="selectedDevice.name"
              :online="selectedDevice.online"
              :last-seen="selectedDevice.lastSeen"
              :location="selectedDeviceLocation"
              :stores="stores"
              :notes="selectedDevice.notes"
              :username-map="usernameMap"
              @assign-store="assignStore"
              @update-username="updateUsername"
              @delete-device="deleteDevice"
              @add-note="addNote"
          />
        </div>

        <chat-window class="chat-support__container-chat-window__content flex-grow-1"
                     :chats="sortedChats"
                     :username-map="usernameMap"
                     :device="selectedDevice"
                     :loading-more-chats="loadingMoreChats"
                     :more-chats-available="moreChatsAvailable"
                     @load-more-chat="loadMoreChat"/>

        <div class="chat-support__container-chat-window__text-box row-flex">
          <textarea class="my-2 ml-2 pa-2 fs-normal"
                    v-model="currentChatMsg"
                    @keydown.enter.exact="sendChatMsg"
                    @keydown.etner.shift.exact="currentChatMsg += '\n'"
                    :disabled="!selectedDeviceId"/>
          <g-btn-bs class="my-2 px-6"
                    background-color="#1271FF"
                    text-color="white"
                    @click="sendChatMsg">
            <g-icon>icon-chat-support-note-send</g-icon>
          </g-btn-bs>
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
    components: {ChatInfo, ChatWindow},
    data() {
      return {
        devices: [],
        sortTypes: [
          {text: 'Installation date', value: 'mostRecentInstall'},
          {text: 'Unread messages', value: 'mostRecentChat'},
        ],
        activeSortType: 'mostRecentInstall',
        adminId: '5c88842f1591d506a250b2a5',
        contactSearch: '',
        loadingMoreChats: false,
        moreChatsAvailable: false,
        loadedChatIndex: 0,
        chatsPerLoad: 15,

        stores: [],
        currentChats: [],
        currentChatMsg: '',
        selectedDeviceId: null,
        unreadCountMap: {},
        deviceOnlineStatusMap: {},
        // map userId to user's name, used for chat user info & notes feature
        usernameMap: {},
      }
    },
    async created() {
      await this.getGsmsDevices()

      const stores = await cms.getModel('Store').find().lean()
      this.stores = stores.map(store => {
        return {
          _id: store._id,
          id: store.id,
          name: `${store.id}. ${store.name || store.settingName} (${store.alias})`,
        }
      }).sort((s1, s2) => +s1.id - +s2.id)

      cms.socket.on('chatMessage', this.receiveChatMessage)
      cms.socket.on('reloadUnassignedDevices', this.getGsmsDevices)

      const updateDeviceStatus = async deviceId => {
        const deviceIds = this.sortedDeviceList.map(({_id}) => _id)
        if (!deviceIds.length || !deviceIds.includes(deviceId)) return
        this.deviceOnlineStatusMap = await this.getDeviceOnlineStatusMap(deviceIds)
      }

      cms.socket.on('gsms-device-connected', updateDeviceStatus)
      cms.socket.on('gsms-device-disconnected', updateDeviceStatus)
    },
    computed: {
      sortedDeviceList() {
        let devices = this.devices

        devices = devices.map(d => ({
          ...d,
          name: this.concatContactName(d),
          unread: this.unreadCountMap[d._id],
          online: this.deviceOnlineStatusMap[d._id],
        }))

        if (this.contactSearch) devices = devices.filter(d => {
          if (d._id === this.selectedDeviceId) return true
          return d.name.toLowerCase().includes(this.contactSearch.toLowerCase())
        })

        switch (this.activeSortType) {
          case 'mostRecentInstall': {
            devices = devices.sort((cur, next) => {
              const curCreatedAt = cur.createdAt.getTime()
              const nextCreatedAt = next.createdAt.getTime()

              if (curCreatedAt === nextCreatedAt) return next.lastSeen - cur.lastSeen
              else return nextCreatedAt - curCreatedAt
            });
            break;
          }
          case 'mostRecentChat': {
            devices = devices.sort((cur, next) => {
              const curLatestMsgDate = cur.latestChatMessageDate.getTime()
              const nextLatestMsgDate = next.latestChatMessageDate.getTime()

              if (curLatestMsgDate === nextLatestMsgDate) return next.lastSeen - cur.lastSeen
              else return nextLatestMsgDate - curLatestMsgDate
            });
            break;
          }
        }

        return devices
      },
      sortedChats() {
        return uniqBy(this.currentChats, '_id').sort((e1, e2) => {
          return e1.createdAt - e2.createdAt
        });
      },
      selectedDevice() {
        return this.sortedDeviceList.find(({_id}) => _id === this.selectedDeviceId)
      },
      selectedUsername() {
        return (this.selectedDevice &&
            this.selectedDevice.metadata &&
            this.selectedDevice.metadata.customerName) || 'Unknown name'
      },
      selectedDeviceLocation() {
        return (this.selectedDevice &&
            this.selectedDevice.metadata &&
            this.selectedDevice.metadata.deviceLocation) || 'Unknown location'
      }
    },
    watch: {
      async selectedDeviceId() {
        // Get chat messages of selected device
        this.loadedChatIndex = this.chatsPerLoad
        const chats = await this.getChatMessages(this.selectedDeviceId, this.chatsPerLoad)
        this.currentChats = chats

        // Check if there are more chat messages to load
        const messageCountObj = await this.getChatMessageCount([this.selectedDeviceId])
        const messageCount = messageCountObj[this.selectedDeviceId]
        this.moreChatsAvailable = chats.length <= messageCount
        // Set unread notification number to 0
        await this.setMessagesRead(this.selectedDeviceId)
        // map userId to user's name, used for chat user info & notes feature
        await this.mapNoteUserIdsToNames()
      },
      async devices() {
        const deviceIds = this.sortedDeviceList.map(({_id}) => _id)
        if (!deviceIds.length) return

        this.unreadCountMap = await this.getChatMessageCount(deviceIds, false, false)
        this.deviceOnlineStatusMap = await this.getDeviceOnlineStatusMap(deviceIds)

        cms.socket.emit('watch-chat-message', deviceIds)
      }
    },
    methods: {
      async getGsmsDevices() {
        const {data: gsmsDevices} = await axios.get('/gsms-device/devices');

        this.devices = gsmsDevices;
        this.devices = this.devices.map(device => ({
          ...device,
          lastSeen: new Date(device.lastSeen),
          latestChatMessageDate: new Date(device.latestChatMessageDate),
          // backward compatibility, some devices don't have this property
          createdAt: device.createdAt ? new Date(device.createdAt) : new Date(0),
          ...device.notes ? {notes: device.notes.map(note => ({...note, createdAt: new Date(note.createdAt)}))} : {}
        }))

        return gsmsDevices;
      },
      async getChatMessages(deviceId, n, offset) {
        let getChatApiUrl = `/support/chat/messages`

        let {data: chats} = await axios.get(getChatApiUrl, {
          params: {
            clientId: deviceId,
            ...n ? {n} : {},
            ...offset ? {offset} : {},
          }
        })
        return chats.map(chat => {
          return {
            ...chat,
            createdAt: new Date(chat.createdAt),
          }
        })
      },
      async getChatMessageCount(deviceIds, fromServer, read) {
        let apiUrl = `/support/chat/messages-count`

        const {data} = await axios.get(apiUrl, {
          params: {
            clientIds: deviceIds.join(','),
            ...(!_.isNil(fromServer)) ? {fromServer} : {},
            ...(!_.isNil(read)) ? {read} : {},
          }
        })
        return data
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
        this.selectedDeviceId = contact._id
      },
      sendChatMsg(e) {
        e.preventDefault()
        if (!this.currentChatMsg.replace(/\r?\n|\r/g, '').trim().length) return

        const dummyId = uuidv1()
        const userId = cms.loginUser.user._id
        const clientId = this.selectedDeviceId

        const chatPayload = {
          clientId,
          userId,
          createdAt: new Date(),
          text: this.currentChatMsg.trim(),
        }

        console.debug(`sentry:eventType=gsmsChat,clientId=${clientId},userId=${userId}`,
            `Online-order frontend send chat msg to backend`, JSON.stringify(chatPayload, null, 2))

        cms.socket.emit('chat-message', chatPayload, savedMsg => {
          console.debug(`sentry:eventType=gsmsChat,clientId=${clientId},userId=${userId}`,
              `Online-order frontend received chat msg ack from backend`, JSON.stringify(savedMsg, null, 2))

          // this.currentChats = this.currentChats.filter(e => e._id !== dummyId)
          // this.currentChats.push(savedMsg)

          const sentChat = this.currentChats.find(e => e._id === dummyId)
          sentChat._id = savedMsg._id
          sentChat.unsent = false
        });

        this.currentChatMsg = ''
        this.currentChats.push({
          _id: dummyId,
          ...chatPayload,
          fromServer: true,
          unsent: true,
        })
      },
      async addNote(note) {
        const apiUrl = '/support/notes'
        const {data} = await axios.post(apiUrl, note)
        this.selectedDevice.notes = this.selectedDevice.notes || []
        this.selectedDevice.notes.unshift(data)

        // Force device update to refresh notes
        const device = this.selectedDevice
        this.devices = this.devices.filter(({_id}) => _id !== device._id)
        this.devices.push(device)
        await this.mapNoteUserIdsToNames()
      },
      async assignStore(storeId) {
        const deviceId = this.selectedDeviceId
        const assingApiUrl = `/support/assign-device/${deviceId}`
        await axios.put(assingApiUrl, {storeId})
        await this.getGsmsDevices()
      },
      receiveChatMessage(chatMessage) {
        const {clientId, userId, createdAt} = chatMessage
        console.debug(`sentry:eventType=gsmsChat,clientId=${clientId},userId=${userId}`,
            `Online-order frontend received chat msg from backend`, JSON.stringify(chatMessage, null, 2))

        const device = this.devices.find(({_id}) => _id === clientId)

        if (device) {
          // this.$set(device, 'latestChatMessageDate', new Date(createdAt))
          device.latestChatMessageDate = new Date(createdAt)
        }

        if (clientId === this.selectedDeviceId) {
          chatMessage.read = true
          this.currentChats.push(chatMessage)
          this.setMessagesRead(this.selectedDeviceId)
        } else if (!isNil(this.unreadCountMap[clientId])) {
          this.unreadCountMap[clientId]++
        }
      },
      async setMessagesRead(deviceId) {
        const setMessageReadApiUrl = `/support/chat/set-message-read?clientId=${deviceId}`
        await axios.put(setMessageReadApiUrl)
        this.unreadCountMap[deviceId] = 0
      },
      async getDeviceOnlineStatusMap(deviceIds) {
        const apiUrl = `/gsms-device/device-online-status?clientIds=${deviceIds.join(',')}`
        const {data: onlineStatusMap} = await axios.get(apiUrl)
        return onlineStatusMap
      },
      async updateUsername(username) {
        const apiUrl = `/gsms-device/device-metadata`
        const payload = {clientId: this.selectedDeviceId, metadata: {customerName: username}}
        await axios.put(apiUrl, payload)
        await this.getGsmsDevices()
      },
      async deleteDevice(deviceId) {
        const apiUrl = `/gsms-device/devices/${deviceId}`
        await axios.delete(apiUrl)
        await this.getGsmsDevices()
        this.selectedDeviceId = null
      },
      async mapNoteUserIdsToNames() {
        if (!this.selectedDevice.notes) return
        const noteUserIds = this.selectedDevice.notes.map(({userId}) => userId)
        const chatUserIds = this.currentChats.map(({userId}) => userId)

        if (noteUserIds) {
          const userIds = _.uniq(noteUserIds.concat(chatUserIds)).filter(id => !this.usernameMap[id])

          if (userIds.length) {
            const apiUrl = `/users/username-mapping?userIds=${userIds.join(',')}`
            const {data} = await axios.get(apiUrl)
            Object.assign(this.usernameMap, data);
          }
        }
      },
      async loadMoreChat() {
        if (!this.moreChatsAvailable || this.loadingMoreChats) return
        this.loadingMoreChats = true

        const chats = await this.getChatMessages(this.selectedDeviceId, this.chatsPerLoad, this.loadedChatIndex)
        this.loadedChatIndex += this.chatsPerLoad
        if (chats.length < this.chatsPerLoad) this.moreChatsAvailable = false
        this.currentChats = [...chats, ...this.currentChats]
        this.loadingMoreChats = false
      },
    }
  }
</script>

<style scoped lang="scss">
  .chat-support {
    height: 100%;
    overflow: hidden;

    &__container {
      width: 100%;
      height: calc(100% - 50px);

      &-contact-list {
        overflow: auto;
        margin-right: 12px;
        position: relative;

        &__header {
          height: 60px;

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

        &__list {
          &--item {
            height: 96px;
            border: 1px solid #EEEEEE;
            border-radius: 2px;
            margin-bottom: 4px;
            background: white;

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
              background: #536DFE;
              color: #F5F5F5;
            }
          }
        }
      }

      &-chat-window {
        background: white;
        border: 1px solid #EEEEEE;
        border-radius: 2px;

        &__header {
          flex-basis: 84px;
          height: 84px;
          border-bottom: 1px solid #EFEFEF;
          background: #F5F5F5;
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
