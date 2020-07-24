<template>
  <div class="support">
    <div class="support__title">Support</div>
    <div class="support__table">
      <div class="support__table-header">
        <div class="flex-equal pl-2">Restaurant</div>
        <div style="flex: 0 0 80px">Action</div>
        <div class="w-12">Type</div>
        <div class="w-12">Assigned</div>
        <div class="w-12">Device</div>
        <div class="col-2">Location</div>
        <div class="w-10"></div>
      </div>
      <div class="support__table-content">
        <template v-if="!restaurants || restaurants.length === 0">
          <div class="support__table-content--empty">
            <img alt src="/plugins/pos-plugin/assets/empty_group.svg"/>
            <p class="text-grey-darken-1 mt-2">Support restaurants list is currently empty</p>
          </div>
        </template>
        <template v-else>
          <div v-for="(restaurant, i) in restaurants" :key="i" class="support__table-row">
            <div class="flex-equal pl-2">{{restaurant.name}}</div>
            <div style="flex: 0 0 80px">
              <g-icon size="20" class="mr-1" @click="addChat(restaurant)">far fa-comment-alt</g-icon>
              <g-icon size="20" class="mr-1" color="#388E3C" @click="openDialogApprove(restaurant)">fas fa-check</g-icon>
              <g-icon size="20" color="#FF4452">fas fa-times</g-icon>
            </div>
            <div class="w-12">{{restaurant.type}}</div>
            <div class="w-12">{{restaurant.assigned}}</div>
            <div class="w-12">{{restaurant.device}}</div>
            <div class="col-2">{{restaurant.location}}</div>
            <div class="w-10 pr-2">
              <div v-if="restaurant.complete" class="complete">Completed</div>
              <div v-else class="complete--not">Complete</div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div class="chat">
      <div class="chat-item" v-for="(item, index) in chatItems" :key="`chat_${index}`">
        <div class="chat-item--header" @click.stop="minimizeChat(item)">
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
          <div class="chat-item--main"></div>
          <div class="chat-item--footer">
            <textarea rows="1" placeholder="Type a message"/>
            <g-btn-bs class="chat-item--btn-send">
              <g-icon size="16">icon-chat-support-note-send</g-icon>
            </g-btn-bs>
          </div>
        </template>
      </div>
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
          <g-btn-bs width="100" background-color="#2979FF" text-color="white" @click="approve">Confirm</g-btn-bs>
        </div>
      </g-card>
    </g-dialog>
  </div>
</template>

<script>
  export default {
    name: "Support",
    props: {

    },
    data() {
      return {
        restaurants: [
          {
            id: 1,
            name: 'Lorem ipsum dolor sit amet',
            type: 'Sign in',
            assigned: 'Unassigned',
            device: 'Galaxy S10',
            location: 'New York, USA',
            onlineStatus: '45 mins ago',
            complete: false
          },
          {
            id: 2,
            name: 'Lorem ipsum dolor sit amet',
            type: 'New restaurant',
            assigned: 'Unassigned',
            device: 'Galaxy S10',
            location: 'Los Angeles, USA',
            onlineStatus: '45 mins ago',
            complete: true
          },
          {
            id: 3,
            name: 'Lorem ipsum dolor sit amet',
            type: 'New restaurant',
            assigned: 'ABC restaurant',
            device: 'Galaxy S10',
            location: 'New York, USA',
            onlineStatus: '45 mins ago',
            complete: false
          }
        ],
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
          approve: false
        },
        selectedRestaurant: null
      }
    },
    methods: {
      addChat(restaurant) {
        const item = this.chatItems.find(i => i.restaurant.id === restaurant.id)
        if(item) {
          this.$set(item, 'minimize', false)
        } else {
          this.chatItems.push({
            minimize: false,
            restaurant
          })
        }
      },
      openDialogApprove(restaurant) {
        this.selectedRestaurant = restaurant
        this.dialog.approve = true
      },
      approve() {
        //TODO add approve action
        this.dialog.approve = false
      },
      minimizeChat(item) {
        item.minimize = !item.minimize
      },
      closeChat(item) {
        const index = this.chatItems.findIndex(i => i.restaurant.id === item.restaurant.id)
        if(index > -1)
          this.chatItems.splice(index, 1)
      }
    }
  }
</script>

<style scoped lang="scss">
  .support {
    height: 100%;
    width: 100%;
    overflow: hidden;

    &__title {
      font-size: 20px;
      line-height: 25px;
      font-weight: 700;
      color: #000000;
      margin-bottom: 16px;
      margin-left: 5px;
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

          &--not {
            background: #1271FF;
            border-radius: 4px;
            padding: 8px;
            color: white;
            text-align: center;
            cursor: pointer;
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
