<script>
import { ref, onBeforeUnmount, computed } from 'vue'
import { genScopeId } from '../../utils';
import { username , avatar } from '../../AppSharedStates';
import { useRouter } from 'vue-router'

export default {
  name: "PosRetailMobileInfo",
  props: {},
  setup() {
    // update time
    const time = ref(null)
    time.value = new Date()
    const interval = setInterval(() => {
      time.value = new Date()
    }, 60000)
    onBeforeUnmount(() => {
      clearInterval(interval)
    })
    const dateTime = computed(() => {
      return dayjs(time.value).format('MMM DD, YY • HH:mm')
    })

    const router = useRouter()
    function back() {
      router.push({path: '/pos-dashboard'})
    }

    return genScopeId(() => (
        <div class="info">
          <g-avatar size="40">
            <g-img src={avatar.value}></g-img>
          </g-avatar>
          <div style="margin-left: 8px; line-height: 1.2; font-weight: 600">
            <p class="username">{username.value}</p>
            <p class="dateTime">{dateTime.value}</p>
          </div>
          <g-spacer/>
          <g-btn-bs class="elevation-2" onClick={back}>
            <g-icon>icon-back</g-icon>
          </g-btn-bs>
        </div>
    ))
  }
}
</script>

<style scoped lang="scss">
.info {
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 14px;
}
</style>
