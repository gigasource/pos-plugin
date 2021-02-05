<script>
  import { username, avatar, formattedDateTime } from '../../AppSharedStates';
  import { genScopeId } from '../../utils';

  export default {
    name: 'PosOrderScreenInfoRight',
    injectService: ['PosStore:(systemDate, timeFormat, dateFormat)'],
    setup() {
      return genScopeId(() => (
          <div>
            <g-avatar size="36">
              <img src={avatar.value}/>
            </g-avatar>
            <div class="ta-right pa-1" style="line-height: 16px">
              <p class="username">{username.value}</p>
              <p class="fs-small-2">{formattedDateTime.value}</p>
            </div>
          </div>
      ))
    }
  }
</script>

<style scoped lang="scss">
  .info__right {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    padding: 0 6px;

    .username {
      word-break: break-all;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 14px;
      font-weight: 700;
    }
  }
</style>
