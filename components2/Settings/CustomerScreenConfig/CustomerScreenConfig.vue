<script>
import { genScopeId } from '../../utils';
import _ from 'lodash';
import { ref, computed } from 'vue'

export default {
  setup() {
    const items = ref([
      { position: 1, img: '/plugins/pos-plugin/assets/image/image 1.png', effect: 'Fade In', duration: 3 },
      { position: 2, img: '/plugins/pos-plugin/assets/image/image 1.png', effect: 'Fade In', duration: 3 },
      { position: 3, img: '/plugins/pos-plugin/assets/image/image 1.png', effect: 'Fade In', duration: 3 },
      { position: 4, img: '/plugins/pos-plugin/assets/image/image 1.png', effect: 'Fade In', duration: 3 },
      { position: 5, img: '/plugins/pos-plugin/assets/image/image 1.png', effect: 'Fade In', duration: 3 },
    ])
    const effects = ['Fade In', 'Fade Out', 'Slide Up', 'Slide Down', 'Slide Right', 'Slide Left']
    const durations = _.range(3, 10).map(i => ({ text: i + 's', value: i }))
    const dialog = ref({
      payment: false
    })
    const photo = ref(null)
    const fit = ref('sketch')

    function getImageStyle() {
      let style = {
        'background-image': `url("${photo.value || '/plugins/pos-plugin/assets/image/g10.png'}")`,
        'background-repeat': 'no-repeat'
      }
      switch (fit.value) {
        case 'sketch':
          Object.assign(style, { 'background-size': 'cover' })
          break;
        case 'fit':
          Object.assign(style, { 'background-position': 'center center', 'background-size': 'contain' })
          break;
        case 'fill':
          Object.assign(style, { 'background-size': 'auto' })
          break;
        default:
          break;
      }
      return style
    }

    const configHeaderRender = genScopeId(() =>
        <div class="config-header">
          <p> Customer screen </p>
          <g-switch/>
          <g-spacer/>
          <g-btn-bs background-color="#388E3C" onClick={() => dialog.value.payment = true}> Payment Screen</g-btn-bs>
        </div>)

    const configTableHeaderRender = genScopeId(() =>
        <div class="config-table__header">
          <div> Position</div>
          <div> Thumbnail</div>
          <div> Detail</div>
          <g-btn-bs background-color="#1271FF">
            Add Photo/Video
          </g-btn-bs>
        </div>)


    const itemRender = (item, idx) => genScopeId(() =>
        <div class={['config-table__row', idx % 2 === 1 && 'config-table__row--even']} key={idx}>
          <div class="config-table__position">
            <div class="config-table__position-tool">
              <g-icon color="#1271FF">
                fas fa-angle-up
              </g-icon>
              <div>
                {item.position} </div>
              <g-icon color="#1271FF">
                fas fa-angle-down
              </g-icon>
            </div>
          </div>
          <div class="config-table__thumbnail">
            <img alt src={item.img}> </img>
          </div>
          <div class="config-table__detail">
            <div style="flex: 1">
              <div class="row-flex align-items-center">
                <div class="col-3">
                  Effect:
                </div>
                <g-select class="col-9 ma-0" text-field-component="GTextFieldBs" items={effects} v-model={item.effect}></g-select>
              </div>
              <div class="row-flex align-items-center">
                <div class="col-3">
                  Duration(s):
                </div>
                <g-select class="col-9 ma-0" text-field-component="GTextFieldBs" items={durations} v-model={item.duration}></g-select>
              </div>
            </div>
            <div class="config-table__btn--delete">
              <g-icon>
                icon-delete2
              </g-icon>
            </div>
          </div>
        </div>)

    const dialogRender = genScopeId(() =>
        <g-dialog fullscreen v-model={dialog.value.payment}>
          {genScopeId(() => <div class="dialog">
            <g-icon class="dialog-icon--close" onClick={() => dialog.value.payment = false}>
              icon-close
            </g-icon>
            <div class="dialog-image" style={getImageStyle()}></div>
            <div class="dialog-detail">
              <div class="dialog-title">
                Payment screen
              </div>
              <div class="dialog-message">
                We recommend using a photo with 3:2 aspect ratio
              </div>
              <div class="row-flex align-items-center">
                <g-btn-bs icon="fas fa-upload" background-color="#1271FF">
                  Upload new photo
                </g-btn-bs>
                <g-btn-bs icon="icon-delete2" backgroundColor={photo.value ? '#FF4452' : '#9E9E9E'}>
                  Delete current photo
                </g-btn-bs>
              </div>
              <div class="fs-small fw-700 mt-3">
                Choose a fit
              </div>
              <div class="row-flex align-items-center">
                <div class={['dialog-item', fit.value === 'sketch' && 'dialog-item--selected']} onClick={() => fit.value = 'sketch'}>
                  Sketch
                </div>
                <div class={['dialog-item', fit.value === 'fit' && 'dialog-item--selected']} onClick={() => fit.value = 'fit'}>
                  Fit
                </div>
                <div class={['dialog-item', fit.value === 'fill' && 'dialog-item--selected']} onClick={() => fit.value = 'fill'}>
                  Fill
                </div>
              </div>
            </div>
          </div>)()
          }
        </g-dialog>)
    return genScopeId(() =>
        <div class="config">
          {configHeaderRender()}
          {configTableHeaderRender()}
          {items.value.map((item, i) => itemRender(item, i)())}
          {dialogRender()}
        </div>)
  }
}
</script>

<style scoped lang="scss">
.config {
  overflow: auto;
  height: 100%;

  &-header {
    padding: 8px;
    display: flex;
    align-items: center;

    p {
      font-size: 16px;
      font-weight: 700;
      margin-right: 4px;
      margin-left: 8px;
    }
  }

  &-table {
    &__header {
      display: flex;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 2;
      background-color: #E1E3EB;
      border-top: 1px solid #BDCBDD;
      border-bottom: 1px solid #BDCBDD;
      padding: 8px;

      div:nth-child(1) {
        flex: 0 0 100px;
        padding-left: 8px;
        font-weight: 700;
      }

      div:nth-child(2) {
        flex: 0 0 200px;
        font-weight: 700;
      }

      div:nth-child(3) {
        flex: 1;
        font-weight: 700;
      }
    }

    &__row {
      display: flex;
      padding: 16px 0;
      align-items: center;
      border-bottom: 1px solid #BDCBDD;

      &--even {
        background-color: #EDF0F5;
      }
    }

    &__position {
      flex: 0 0 100px;
      display: flex;
      justify-content: center;
      align-items: center;

      &-tool {
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
        border-radius: 19px;
        background-color: white;
        width: 38px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    }

    &__thumbnail {
      flex: 0 0 200px;
      padding-left: 8px;

      img {
        width: 189px;
      }
    }

    &__detail {
      flex: 1;
      margin-left: 8px;
      display: flex;
      align-items: center;
      padding-right: 16px;
    }

    &__btn--delete {
      background-color: #ff4452;
      border-radius: 4px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.dialog {
  background-color: white;
  width: 100%;
  position: relative;
  padding: 16px;
  display: flex;
  align-items: stretch;

  &-icon--close {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  &-image {
    flex: 0 0 40%;
  }

  &-detail {
    flex: 0 0 60%;
    padding: 16px;
  }

  &-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  &-message {
    font-size: 15px;
    margin-bottom: 16px;
  }

  &-item {
    width: 72px;
    text-align: center;
    border: 1px solid #E0E0E0;
    border-radius: 2px;
    margin-right: 8px;
    margin-top: 8px;
    padding: 4px 0;
    font-size: 14px;

    &--selected {
      background: #E3F2FD;
      border: 1px solid #90CAF9;
    }
  }
}
</style>
