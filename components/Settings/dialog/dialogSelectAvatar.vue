<template>
  <g-dialog v-model="dialogSelectAvatar" overlay-color="#6b6f82" overlay-opacity="0.95" width="90%" eager>
    <g-card>
      <g-card-title style="font-size: 16px; padding-bottom: 0">
        <span>{{$t('settings.selectAvatar')}}</span>
      </g-card-title>
      <g-card-text class="content">
        <g-item-group :items="listAvatars" v-model="selectedAvatar">
          <template v-slot:item="{item, toggle, active}">
            <g-badge :model-value="active" overlay>
              <template v-slot:badge>
                <g-icon style="font-size: 20px; font-weight: bold">done</g-icon>
              </template>
              <g-avatar size="72" :class="['ma-3', active && 'avatar__selected']">
                <img :alt="item.name" :src="item.image" @click="toggle(item)"/>
              </g-avatar>
            </g-badge>
          </template>
        </g-item-group>
      </g-card-text>
      <g-card-actions>
        <g-spacer/>
        <g-btn :uppercase="false" outlined class="mr-3" width="120" @click="dialogSelectAvatar = false">{{$t('ui.cancel')}}</g-btn>
        <g-btn :uppercase="false" flat background-color="blue accent 3" text-color="white" width="120" @click="submit">{{$t('ui.ok')}}</g-btn>
      </g-card-actions>
    </g-card>
  </g-dialog>
</template>

<script>
  export default {
    name: 'dialogSelectAvatar',
    props: {
      modelValue: null,
    },
    data() {
      return {
        listAvatars: [],
        selectedAvatar: null
      }
    },
    injectService: [
      'SettingsStore:selectedUser',
      'SettingsStore:updateUser',
      'SettingsStore:getListAvatar'
    ],
    computed: {
      dialogSelectAvatar: {
        get() {
          return this.modelValue;
        },
        set(val) {
          this.$emit('update:modelValue', val);
        }
      },
    },
    methods: {
      async submit() {
        this.selectedUser.avatar = this.selectedAvatar.image;
        this.selectedUser.prepend = this.selectedAvatar.image;
        this.dialogSelectAvatar = false;
        await this.updateUser(this.selectedUser._id, this.selectedUser);
      }
    },
    async mounted() {
      this.listAvatars = await this.getListAvatar();
    },
    watch: {
      modelValue() {
        let checkEqual = false;
        for (const avatar of this.listAvatars) {
          if (avatar.image === this.selectedUser.avatar) {
            this.selectedAvatar = avatar;
            checkEqual = true;
          }
        }
        if (!checkEqual) {
          this.selectedAvatar = null;
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .content {

    .g-item-group {
      flex-wrap: wrap !important;
    }

    ::v-deep .g-avatar {
      box-sizing: content-box;
      border: 2px solid transparent;

      &.avatar__selected {
        border: 2px solid #1271ff;
      }
    }

    ::v-deep .g-badge {
      transform: translate(-65%, 65%) !important;
      padding: 0 !important;
    }

  }

  .action {
    margin-top: 32px;
    display: flex;
    justify-content: flex-end;
  }
</style>
