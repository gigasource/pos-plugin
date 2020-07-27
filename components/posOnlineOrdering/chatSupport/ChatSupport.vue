<template>
  <div class="chat-support pl-5 pr-5 pt-2">
    <div class="chat-support__container row-flex">
      <div class="chat-support__container-contact-list col-4" @scroll="onDeviceListScroll" ref="deviceList">
        <div style="position: sticky; top: 0; background: #F4F7FB">
          <div class="chat-support__container-contact-list__title mb-2 row-flex align-items-center">
            <g-select class="chat-support__container-contact-list__title__filter"
                      label="Filter"
                      :items="filterSelections"
                      v-model="activeFilterSelection"></g-select>
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
               :id="'device-' + contact._id"
               class="chat-support__container-contact-list__list--item row-flex align-items-center pl-3 pr-3"
               :class="contact._id === selectedDeviceId ? 'chat-support__container-contact-list__list--item_active' : ''">
            <div class="chat-support__container-contact-list__list--item_left">
              <div style="font-weight: bold;">
                <span>{{contact.displayName}}</span>
              </div>
              <span>
                {{concatContactMetadata(contact)}}
              </span>
            </div>
            <g-spacer/>
            <div v-if="contact.unreadMessages"
                 class="chat-support__container-contact-list__list--item_right row-flex align-items-center justify-center">
              {{contact.unreadMessages}}
            </div>
          </div>
        </div>

        <div v-if="loadingMoreDevices && moreDevicesAvailable" class="my-2 ta-center">
          <span >Loading devices</span>
          <g-progress-circular indeterminate color="#536DFE" class="ml-2"/>
        </div>
      </div>

      <div class="chat-support__container-chat-window col-8 col-flex">
        <div class="chat-support__container-chat-window__header">
          <chat-info
              v-if="selectedDevice"
              :device="selectedDevice"
              :username="selectedUsername"
              :location="selectedDeviceLocation"
              :stores="stores"
              :username-map="usernameMap"
              @assign-store="assignStore"
              @update-username="updateUsername"
              @delete-device="deleteDevice"
              @add-note="addNote"
          />
        </div>

        <call-center :device-id="selectedDeviceId" ref="callCenter"/>

        <chat-window class="chat-support__container-chat-window__content flex-grow-1"
                     :chats="sortedChats"
                     :username-map="usernameMap"
                     :device="selectedDevice"
                     :device-id="selectedDeviceId"
                     :loading-more-chats="loadingMoreChats"
                     :more-chats-available="moreChatsAvailable"
                     @load-more-chat="loadMoreChat"/>

        <div class="chat-support__container-chat-window__text-box row-flex">
          <textarea class="my-2 ml-2 pa-2 fs-normal"
                    v-model="currentChatMsg"
                    @keydown.enter.exact="sendChatMsg"
                    @keydown.etner.shift.exact="currentChatMsg += '\n'"
                    :disabled="!selectedDevice"/>
          <g-btn-bs class="my-2 px-6"
                    background-color="#1271FF"
                    text-color="white"
                    @click="makeAPhoneCall">
            <g-icon>phone</g-icon>
          </g-btn-bs>
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
  import debounce from 'lodash/debounce'
  import cloneDeep from 'lodash/cloneDeep'
  import ChatInfo from './ChatInfo'
  import uuidv1 from 'uuid/v1'
  import CallCenter from './CallCenter';

  export default {
    name: 'ChatSupport',
    components: { CallCenter, ChatInfo, ChatWindow},
    props: {
      selectedDeviceIdProp: String,
    },
    data() {
      return {
        devices: [],

        sortTypes: [
          {text: 'Installation date', value: 'createdAt.desc'},
          {text: 'Unread messages', value: 'unreadMessages.desc'},
        ],
        activeSortType: 'createdAt.desc',

        filterSelections: [
          {text: 'None', value: 'none'},
          {text: 'Assigned', value: 'assigned'},
          {text: 'Unassigned', value: 'unassigned'},
          {text: 'Chat started', value: 'chatStarted'},
          {text: 'Chat not started', value: 'chatNotStarted'},
        ],
        activeFilterSelection: 'none',

        adminId: '5c88842f1591d506a250b2a5',
        contactSearch: '',

        loadingMoreDevices: false,
        moreDevicesAvailable: true,
        loadedDeviceIndex: 0,
        devicesPerLoad: 15,

        loadingMoreChats: false,
        moreChatsAvailable: false,
        loadedChatIndex: 0,
        chatsPerLoad: 20,

        stores: [],
        currentChats: [],
        currentChatMsg: '',
        selectedDeviceId: '',
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
      cms.socket.on('newGsmsDevice', device => this.devices.unshift(this.convertDevice(device)))

      const updateDeviceStatus = async (deviceId, online) => {
        const device = this.sortedDeviceList.find(({_id}) => _idc === deviceId)
        if (device) device.online = online
      }

      cms.socket.on('gsms-device-connected', deviceId => updateDeviceStatus(deviceId, true))
      cms.socket.on('gsms-device-disconnected', deviceId => updateDeviceStatus(deviceId, false))
    },
    async mounted() {
      const selectedDeviceIdProp = this.selectedDeviceIdProp.trim()
      if (selectedDeviceIdProp) {
        if (this.devices.map(({_id}) => _id).includes(selectedDeviceIdProp)) {
          this.selectedDeviceId = selectedDeviceIdProp
          this.scrollDeviceIntoView(this.selectedDeviceId)
        } else {
          const {data: selectedDevice} = await axios.get(`/gsms-device/devices/${selectedDeviceIdProp}`)
          if (selectedDevice) {
            this.devices.push(selectedDevice)
            this.selectedDeviceId = selectedDeviceIdProp
            this.scrollDeviceIntoView(this.selectedDeviceId)
          }
        }
      }
    },
    computed: {
      sortedDeviceList() {
        let devices = cloneDeep(this.devices)

        devices = devices.map(d => ({
          ...d,
          displayName: this.concatContactName(d),
        }))

        if (this.contactSearch && this.contactSearch.trim().length) {
          devices = devices.filter(d => {
            if (d._id === this.selectedDeviceId) return true
            return d.displayName.toLowerCase().includes(this.contactSearch.toLowerCase())
          })
        }

        switch (this.activeFilterSelection) {
          case 'assigned': {
            devices = devices.filter(d => !isNil(d.storeId))
            break;
          }
          case 'unassigned': {
            devices = devices.filter(d => isNil(d.storeId))
            break;
          }
          case 'chatStarted': {
            devices = devices.filter(d => d.messageCount)
            break;
          }
          case 'chatNotStarted': {
            devices = devices.filter(d => !d.messageCount)
            break;
          }
        }

        switch (this.activeSortType) {
          case 'createdAt.desc': {
            devices = devices.sort((cur, next) => {
              const curCreatedAt = cur.createdAt.getTime()
              const nextCreatedAt = next.createdAt.getTime()

              return nextCreatedAt - curCreatedAt
            });
            break;
          }
          case 'unreadMessages.desc': {
            devices = devices.sort((cur, next) => {
              const curLatestMsgDate = cur.latestChatMessageDate.getTime()
              const nextLatestMsgDate = next.latestChatMessageDate.getTime()

              return nextLatestMsgDate - curLatestMsgDate
            });
            break;
          }
        }

        if (!this.loadingMoreDevices && this.moreDevicesAvailable && devices.length < this.devicesPerLoad) {
          this.$nextTick(this.getGsmsDevices)
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
      contactSearch(val, oldVal) {
        if (val === oldVal || !val.trim().length) return

        this.selectedDeviceId = null
        this.searchDevices(val)
      },
      activeSortType(val, oldVal) {
        if (val === oldVal || !val.trim().length) return

        this.selectedDeviceId = null
        if (this.moreDevicesAvailable) {
          this.loadedDeviceIndex = 0
          this.loadingMoreDevices = false
          this.devices = []
          this.getGsmsDevices()
        }
      },
      activeFilterSelection(val, oldVal) {
        if (val === oldVal || !val.trim().length) return
        this.selectedDeviceId = null
      },
      async selectedDeviceId(val) {
        this.currentChats = []
        if (!val) return

        // Get chat messages of selected device
        this.loadedChatIndex = this.chatsPerLoad
        const chats = await this.getChatMessages(val, this.chatsPerLoad)
        this.currentChats = chats

        // Check if there are more chat messages to load
        const messageCountObj = await this.getChatMessageCount([val])
        const messageCount = messageCountObj[val]
        this.moreChatsAvailable = chats.length <= messageCount
        // Set unread notification number to 0
        await this.setMessagesRead(val)
        // map userId to user's name, used for chat user info & notes feature
        await this.mapNoteUserIdsToNames()
      },
      async devices() {
        const deviceIds = this.sortedDeviceList.map(({_id}) => _id)
        if (!deviceIds.length) return

        cms.socket.emit('watch-chat-message', deviceIds)
      }
    },
    methods: {
      scrollDeviceIntoView(deviceId) {
        this.$nextTick(() => {
          const el = this.$el.querySelector('#device-' + deviceId)
          if (el) el.scrollIntoView()
        })
      },
      searchDevices: debounce(async function (searchText) {
        if (!this.moreDevicesAvailable) return

        this.loadingMoreDevices = true
        const searchApiUrl = `gsms-device/devices`
        let {data: devices} = await axios.get(searchApiUrl, {
          params: {
            sort: this.activeSortType === this.sortTypes[0].value ? this.activeSortType : [this.activeSortType, 'createdAt.desc'],
            nameSearch: searchText,
          }
        })

        if (devices.length) {
          devices = devices.map(this.convertDevice)
          this.devices = uniqBy([...this.devices, ...devices], '_id')
        }

        this.loadingMoreDevices = false
      }, 750),
      convertDevice(device) {
        return {
          ...device,
          messageCount: device.messageCount || 0,
          lastSeen: new Date(device.lastSeen),
          latestChatMessageDate: new Date(device.latestChatMessageDate),
          createdAt: device.createdAt ? new Date(device.createdAt) : new Date(0), // backward compatibility, some devices don't have this property
          ...device.notes ? {notes: device.notes.map(note => ({...note, createdAt: new Date(note.createdAt)}))} : {}
        }
      },
      async getGsmsDevices() {
        if (!this.moreDevicesAvailable || this.loadingMoreDevices) return

        this.loadingMoreDevices = true
        const {data: gsmsDevices} = await axios.get('/gsms-device/devices', {
          params: {
            n: this.devicesPerLoad,
            offset: this.loadedDeviceIndex,
            sort: this.activeSortType === this.sortTypes[0].value ? this.activeSortType : [this.activeSortType, 'createdAt.desc'],
          }
        })

        this.loadedDeviceIndex += this.devicesPerLoad
        if (!gsmsDevices.length || (gsmsDevices.length % this.devicesPerLoad > 0)) this.moreDevicesAvailable = false

        this.devices = uniqBy([...this.devices, ...gsmsDevices], '_id')
        this.devices = this.devices.map(device => this.convertDevice(device))

        const deviceIds = this.devices.map(({_id}) => _id)
        this.getChatMessageCount(deviceIds).then(messageCountMap => {
          Object.keys(messageCountMap).forEach(deviceId => {
            const device = this.sortedDeviceList.find(({_id}) => _id === deviceId)
            if (device) {
              device.messageCount = messageCountMap[deviceId]
              this.updateDevice(device)
            }
          })
        })

        this.loadingMoreDevices = false
        return this.devices
      },
      async getChatMessages(deviceId, n, offset) {
        this.loadingMoreChats = true
        let getChatApiUrl = `/support/chat/messages`

        let {data: chats} = await axios.get(getChatApiUrl, {
          params: {
            clientId: deviceId,
            ...n ? {n} : {},
            ...offset ? {offset} : {},
          }
        })

        this.loadingMoreChats = false
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
            ...deviceIds ? {clientIds: deviceIds.join(',')} : {},
            ...(!_.isNil(fromServer)) ? {fromServer} : {},
            ...(!_.isNil(read)) ? {read} : {},
          }
        })
        return data
      },
      concatContactName(contact) {
        const contactStore = this.stores.find(({_id}) => _id === contact.storeId)

        const customerNameString = contact.metadata && contact.metadata.customerName
            ? ` - ${contact.metadata.customerName}`
            : ''

        const storeNameString = contactStore
            ? ` - ${contactStore.name}`
            : ''

        return contact.name + customerNameString + storeNameString
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

        this.sendChatMsgDebounced(this.currentChatMsg)
        this.currentChatMsg = ''
        const device = this.sortedDeviceList.find(({_id}) => _id === this.selectedDeviceId)
        device.messageCount = device.messageCount + 1
      },
      sendChatMsgDebounced: debounce(function(text) {
        const dummyId = uuidv1()
        const userId = cms.loginUser.user._id
        const clientId = this.selectedDeviceId

        const chatPayload = {
          clientId,
          userId,
          createdAt: new Date(),
          text: text.trim(),
        }

        console.debug(`sentry:eventType=gsmsChat,clientId=${clientId},userId=${userId}`,
            `Online-order frontend send chat msg to backend`, JSON.stringify(chatPayload, null, 2))

        cms.socket.emit('chat-message', chatPayload, savedMsg => {
          console.debug(`sentry:eventType=gsmsChat,clientId=${clientId},userId=${userId}`,
              `Online-order frontend received chat msg ack from backend`, JSON.stringify(savedMsg, null, 2))

          const sentChat = this.currentChats.find(e => e._id === dummyId)
          sentChat._id = savedMsg._id
          sentChat.unsent = false
        })

        this.currentChats.push({
          _id: dummyId,
          ...chatPayload,
          fromServer: true,
          unsent: true,
        })
      }, 500, {
        leading: true,
        trailing: false,
      }),
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

        const device = this.sortedDeviceList.find(({_id}) => _id === this.selectedDeviceId)

        if (device) {
          device.storeId = storeId
          this.updateDevice(device)
        }
      },
      receiveChatMessage(chatMessage) {
        const {clientId, userId, createdAt} = chatMessage
        console.debug(`sentry:eventType=gsmsChat,clientId=${clientId},userId=${userId}`,
            `Online-order frontend received chat msg from backend`, JSON.stringify(chatMessage, null, 2))

        const device = this.sortedDeviceList.find(({_id}) => _id === clientId)
        device.messageCount = device.messageCount + 1

        if (device) device.latestChatMessageDate = new Date(createdAt)

        if (clientId === this.selectedDeviceId) {
          chatMessage.read = true
          this.currentChats.push(chatMessage)
          this.setMessagesRead(this.selectedDeviceId)
        } else if (device) {
          device.unreadMessages = device.unreadMessages || 0
          device.unreadMessages++
        }
      },
      async setMessagesRead(deviceId) {
        const device = this.sortedDeviceList.find(({_id}) => _id === deviceId)

        if (device) {
          device.unreadMessages = 0
          this.updateDevice(device)
        }

        const setMessageReadApiUrl = `/support/chat/set-message-read?clientId=${deviceId}`
        await axios.put(setMessageReadApiUrl)
      },
      updateDevice(device) {
        const deviceIndex = this.devices.findIndex(({_id}) => _id === device._id)
        this.devices.splice(deviceIndex, 1, {...device})
      },
      async updateUsername(username) {
        const apiUrl = `/gsms-device/device-metadata`
        const payload = {clientId: this.selectedDeviceId, metadata: {customerName: username}}
        await axios.put(apiUrl, payload)

        const device = this.sortedDeviceList.find(({_id}) => _id === this.selectedDeviceId)

        if (device) {
          device.metadata = device.metadata || {}
          device.metadata.customerName = username
          this.updateDevice(device)
        }
      },
      async deleteDevice(deviceId) {
        this.selectedDeviceId = null
        const deviceIndex = this.sortedDeviceList.findIndex(({_id}) => _id === deviceId)
        if (!isNil(deviceIndex)) this.devices.splice(deviceIndex, 1)

        const apiUrl = `/gsms-device/devices/${deviceId}`
        await axios.delete(apiUrl)
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
        if (!this.moreChatsAvailable || this.loadingMoreChats || !this.selectedDeviceId) return

        const chats = await this.getChatMessages(this.selectedDeviceId, this.chatsPerLoad, this.loadedChatIndex)
        this.loadedChatIndex += this.chatsPerLoad
        if (chats.length < this.chatsPerLoad) this.moreChatsAvailable = false
        this.currentChats = [...chats, ...this.currentChats]
      },
      onDeviceListScroll: debounce(function () {
        if (this.loadingMoreChats) return

        const el = this.$refs.deviceList
        if (!el) return

        const scrollTop = el.scrollTop
        const clientHeight = el.clientHeight
        const scrollHeight = el.scrollHeight

        if ((scrollTop + clientHeight) >= (scrollHeight - 40)) {
          this.getGsmsDevices()
        }
      }, 300),
      makeAPhoneCall() {
        this.$refs.callCenter.makeAPhoneCall(this.selectedDeviceId)
      }
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

        &__title {
          &__filter, &__sort {
            min-width: 30%;
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
        position: relative;

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
