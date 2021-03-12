<script>
import { genScopeId, internalValueFactory } from '../../utils';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { isSameId } from '../../utils';
import { updateUser } from './view-user-logics';
import { selectedUser } from './view-user-logics';

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const avatarList = ref([])
    const selectedAvatar = ref(null)
    //
    const dialogSelectAvatar = internalValueFactory(props, { emit })

    async function submit() {
      selectedUser.value.avatar = selectedAvatar.value.image;
      selectedUser.value.prepend = selectedAvatar.value.image;
      dialogSelectAvatar.value = false;

      console.log(dialogSelectAvatar.value)
      await updateUser(selectedUser.value._id, selectedUser.value);
    }

    async function getAvatarList() {
      return await cms.getModel('Avatar').find();
    }

    (async () => { avatarList.value = await getAvatarList()})()

    watch(() => dialogSelectAvatar.value, () => {
      let checkEqual = false;
      for (const avatar of avatarList.value) {
        if (avatar.image === selectedUser.value.avatar) {
          selectedAvatar.value = avatar;
          checkEqual = true;
        }
      }
      if (!checkEqual) {
        selectedAvatar.value = null;
      }
    })

    const avatarListRender = genScopeId(() =>
        <g-card-text class="content">
          <g-item-group items={avatarList.value} v-model={selectedAvatar.value} v-slots={{
            'item': genScopeId(({ item, toggle, active }) =>
                <g-badge modelValue={active} overlay v-slots={{
                  'default': genScopeId(() =>
                      <g-avatar size="72" class={['ma-3', active && 'avatar__selected']}>
                        <img alt={item.name} src={item.image} onClick={() => toggle(item)}> </img>
                      </g-avatar>)
                  ,
                  'badge': genScopeId(() =>
                      <g-icon style="font-size: 20px; font-weight: bold">
                        done
                      </g-icon>)
                }}>
                </g-badge>
            )
          }}>
          </g-item-group>
        </g-card-text>)
    return genScopeId(() =>
        <g-dialog v-model={dialogSelectAvatar.value} overlay-color="#6b6f82" overlay-opacity="0.95" width="90%" eager>
          {genScopeId(() => <g-card>
            <g-card-title style="font-size: 16px; padding-bottom: 0">
              <span> {t('settings.selectAvatar')} </span>
            </g-card-title>
            {avatarListRender()}
            <g-card-actions>
              <g-spacer/>
              <g-btn uppercase={false} outlined class="mr-3" width="120" onClick={() => dialogSelectAvatar.value = false}>
                {t('ui.cancel')} </g-btn>
              <g-btn uppercase={false} flat background-color="blue accent 3" text-color="white" width="120" onClick={submit}>
                {t('ui.ok')} </g-btn>
            </g-card-actions>
          </g-card>)()
          }
        </g-dialog>)
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
