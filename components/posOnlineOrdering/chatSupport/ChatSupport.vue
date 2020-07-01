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
          <div v-for="contact in sortedContactList" @click.stop="setActiveChat(contact)"
               class="chat-support__container-contact-list__list--item row-flex align-items-center pl-3 pr-3">
            <div class="chat-support__container-contact-list__list--item_left">
              <div style="font-weight: bold;">{{contact.metadata.customerName}}</div>
              <div v-if="contact.metadata.customerPhone">{{contact.metadata.customerPhone}}</div>
            </div>
            <g-spacer/>
            <div class="chat-support__container-contact-list__list--item_right row-flex align-items-center justify-center">
              20
            </div>
          </div>
        </div>
      </div>

      <div class="chat-support__container-chat-window col-8 col-flex">
        <div class="chat-support__container-chat-window__header">
        </div>

        <chat-window class="chat-support__container-chat-window__content flex-grow-1" :texts="texts"/>

        <div class="chat-support__container-chat-window__text-box row-flex">
          <textarea class="ma-2"/>
          <g-btn-bs class="ma-2" background-color="#1271FF" text-color="white">Send</g-btn-bs>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import ChatWindow from './ChatWindow';

  export default {
    name: 'ChatSupport',
    components: { ChatWindow },
    data() {
      return {
        contacts: [
          {
            _id: '1',
            metadata: {
              customerName: 'David Beckham',
              customerPhone: '0123456789'
            },
            name: 'iPhone7',
            lastSeen: dayjs().subtract(10, 'minute').toDate(),
            location: null
          },
          {
            _id: '2',
            metadata: {
              customerName: 'David Beckham2',
            },
            name: 'iPhone7',
            lastSeen: dayjs().subtract(20, 'minute').toDate(),
            location: null
          },
          {
            _id: '3',
            metadata: {
              customerName: 'David Beckham2',
              customerPhone: '0123456789'
            },
            name: 'iPhone7',
            lastSeen: dayjs().subtract(30, 'minute').toDate(),
            location: null
          },
          {
            _id: '4',
            metadata: {
              customerName: 'David Beckham2',
            },
            name: 'iPhone7',
            lastSeen: dayjs().subtract(40, 'minute').toDate(),
            location: null
          },
          {
            _id: '5',
            metadata: {
              customerName: 'David Beckham2',
              customerPhone: '0123456789'
            },
            name: 'iPhone7',
            lastSeen: dayjs().subtract(50, 'minute').toDate(),
            location: null
          },
          {
            _id: '6',
            metadata: {
              customerName: 'David Beckham2',
              customerPhone: '0123456789'
            },
            name: 'iPhone7',
            lastSeen: dayjs().subtract(60, 'minute').toDate(),
            location: null
          },
          {
            _id: '7',
            metadata: {
              customerName: 'David Beckham2',
              customerPhone: '0123456789'
            },
            name: 'iPhone7',
            lastSeen: dayjs().subtract(70, 'minute').toDate(),
            location: null
          },

        ],
        sorting: [
          { text: 'Last contact', value: 'lastSeen' }
        ],
        activeSorting: 'lastSeen',
        testConvo: [
          {
            _id: '1',
            clientId: '1',
            userId: '5c88842f1591d506a250b2a5',
            createdAt: dayjs().subtract(10, 'minute').toDate(),
            text: 'Hello server',
            read: true,
            fromServer: false
          },
          {
            _id: '2',
            clientId: '1',
            userId: '5c88842f1591d506a250b2a5',
            createdAt: dayjs().subtract(8, 'minute').toDate(),
            text: 'Hello client',
            read: true,
            fromServer: true
          },
          {
            _id: '3',
            clientId: '1',
            userId: '5c88842f1591d506a250b2a5',
            createdAt: dayjs().subtract(6, 'minute').toDate(),
            text: 'How can i have my device running',
            read: true,
            fromServer: false
          },
          {
            _id: '4',
            clientId: '1',
            userId: '5c88842f1591d506a250b2a5',
            createdAt: dayjs().subtract(4, 'minute').toDate(),
            text: 'Give it legs',
            read: true,
            fromServer: true
          },
          {
            _id: '5',
            clientId: '1',
            userId: '5c88842f1591d506a250b2a5',
            createdAt: dayjs().subtract(2, 'minute').toDate(),
            text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vel mi quis sem venenatis sagittis at non mauris. Nam vulputate lacus quis nulla laoreet, id interdum mauris facilisis. Nulla auctor malesuada risus, et tempus mauris. Nullam sit amet ex sit amet lacus ultricies posuere. Nullam ante leo, dignissim nec nunc vel, iaculis finibus nulla. Vivamus consequat aliquet dolor. Nunc justo nunc, facilisis et dolor eleifend, aliquam ultrices orci. Nulla iaculis facilisis ex id pharetra. Vestibulum fringilla, tortor in porttitor mollis, felis urna sagittis tellus, ac varius dolor sapien vel massa. Phasellus sit amet venenatis ipsum, eget cursus nisl. Sed ultricies pretium est eu suscipit. Sed ut metus ut sapien aliquet imperdiet ut sed dui. Nullam cursus ex a nisi accumsan, mollis blandit nibh molestie. Integer ultrices ipsum pharetra, tincidunt nulla quis, mollis mi. Mauris ut imperdiet dui.

Phasellus laoreet, sapien sed commodo rhoncus, urna massa aliquet odio, ut bibendum nulla leo fringilla lacus. Fusce viverra at nunc et blandit. Fusce quis dignissim felis. Nunc eu orci maximus, vulputate mi ut, pretium ante. Curabitur ultricies lacinia sodales. In hac habitasse platea dictumst. Sed pellentesque viverra dui at bibendum. Quisque quis imperdiet odio. Morbi pellentesque massa justo, vitae malesuada mauris tempor et.

Vivamus ut odio ac mauris malesuada sollicitudin. Maecenas eget elit tempus, facilisis est et, volutpat ligula. Nullam nisi arcu, tristique sit amet nisl in, dignissim eleifend lectus. Donec convallis sem sit amet arcu venenatis suscipit. Proin molestie tristique justo quis posuere. Nulla cursus auctor leo, interdum rhoncus dui maximus at. Suspendisse feugiat, risus et euismod feugiat, dolor mi facilisis quam, et accumsan nibh urna sit amet nunc. Sed sagittis dignissim mollis.

Praesent eu pretium augue, non molestie nulla. Morbi sodales blandit mauris et imperdiet. Donec ut ante eu massa malesuada aliquet sit amet in mauris. Suspendisse potenti. In ut lectus diam. Duis pulvinar, nisl sed efficitur varius, nibh risus elementum magna, non tempus lorem orci eget metus. Duis in vehicula risus. Donec vestibulum, felis at ultrices sollicitudin, diam est luctus elit, vel rutrum neque purus a lorem. Vestibulum accumsan rutrum ligula, sit amet malesuada libero tristique non. Integer viverra, tellus non auctor convallis, magna felis ultrices nibh, ut dignissim augue felis vitae enim. Ut quis vehicula ipsum, id consequat nibh. Vivamus pellentesque auctor leo, sit amet pellentesque turpis aliquam nec. Phasellus eu tortor quam. Phasellus commodo pulvinar magna et finibus.

Sed convallis ornare turpis rhoncus cursus. Curabitur et erat id nisl fermentum pulvinar tincidunt porta lorem. Aenean odio est, blandit sed lectus eget, consequat gravida nibh. Nulla venenatis pulvinar lectus, a porta metus posuere quis. Pellentesque at mollis risus, quis gravida nisi. Vestibulum ultrices venenatis erat, eu tempus lacus congue ut. Phasellus tempus lorem vel magna dapibus faucibus. Sed euismod neque id eros ornare tincidunt. Cras arcu enim, aliquet quis libero in, scelerisque vestibulum mauris. Aenean consectetur pellentesque suscipit. Vivamus in mi mauris.

`,
            read: true,
            fromServer: false
          },

        ],
        adminId: '5c88842f1591d506a250b2a5',
        texts: [],
        activeChat: null
      }
    },
    created() {

    },
    computed: {
      sortedContactList() {
        switch (this.activeSorting) {
          case 'lastSeen': {
            return this.contacts.sort((cur, next) => {
              return next.lastSeen - cur.lastSeen
            })
          }
          default: {
            return this.contacts
          }
        }
      }
    },
    methods: {
      filter() {

      },
      setActiveChat(contact) {
        this.activeChat = contact
        this.texts = this.testConvo.filter(i => i.clientId === contact._id)
      }
    }
  }
</script>

<style scoped lang="scss">
  .chat-support {
    height: calc(100% - 50px);

    &__title {
      font-size: 20px;
      font-weight: bold;
    }

    &__container {
      background: white;
      width: 100%;
      height: 100%;

      &-contact-list {
        border-right: 1px solid #EFEFEF;

        &__header {
          height: 72px;
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
          }
        }
      }

      &-chat-window {
        &__header {
          flex-basis: 72px;
          height: 72px;
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
