<template>
  <div class="tutorial">
    <div class="tutorial-main">
      <div v-for="(video, index) in computedVideos" :key="index" @click="openVideo(video)"
           class="tutorial-main__video">
        <div class="tutorial-main__video-thumbnail">
          <img alt :src="video.thumbnail"/>
        </div>
        <div class="tutorial-main__video-info">
          <div class="tutorial-main__video-title">{{video.title}}</div>
          <div class="tutorial-main__video-duration">
            <g-icon size="15" class="mr-1">icon-video-duration</g-icon>
            {{video.duration}}
          </div>
        </div>
      </div>
    </div>
    <div class="tutorial-toolbar">
      <g-toolbar height="64px" elevation="0" color="#eee">
        <g-btn-bs class="elevation-2" background-color="white" icon="icon-back" @click="back">{{$t('ui.back')}}</g-btn-bs>
        <g-btn-bs class="elevation-2" :background-color="mode === 'tablet' ? '#1271FF' : 'white'" icon="icon-tablet" @click="chooseMode('tablet')">Tablet</g-btn-bs>
        <g-btn-bs class="elevation-2" :background-color="mode === 'mobile' ? '#1271FF' : 'white'" icon="icon-smartphone" @click="chooseMode('mobile')">Mobile</g-btn-bs>
        <g-spacer/>
        <g-btn-bs class="elevation-2" background-color="white" icon="icon-restriction" @click="dialog.hide = true">Hide tutorial tab</g-btn-bs>
      </g-toolbar>
    </div>
    <g-dialog v-model="dialog.video" :width="width" eager>
      <object :key="dialog.video" :data="url" :width="width" :height="height"></object>
    </g-dialog>
    <g-dialog v-model="dialog.hide" width="434">
      <div class="bg-white pa-3 br-2 w-100">
        <div class="fs-large-2 fw-700 mt-2 mb-4 ta-center">Hide tutorial tab</div>
        <div class="ta-center mb-5 fs-small">
          <p>You can enable tutorial tab again in</p>
          <p class="fw-700">Setting - General</p>
        </div>
        <div class="row-flex justify-end align-items-center">
          <g-btn-bs width="120" border-color="#979797" text-color="#1d1d26" @click="dialog.hide = false">Cancel</g-btn-bs>
          <g-btn-bs width="120" background-color="#1271FF" @click="hideTutorial">OK</g-btn-bs>
        </div>
      </div>
    </g-dialog>
  </div>
</template>

<script>
  export default {
    name: "Tutorial",
    props: {},
    data() {
      return {
        dialog: {
          video: false,
          hide: false,
        },
        index: 0,
        mode: 'tablet',
        url: '',
        videos: [],
        width: 0,
        height: 0
      }
    },
    async created() {
      this.videos = (await cms.getModel('Tutorial').find()).sort((a, b) => (a.position - b.position))
      this.width = window.innerWidth * 0.9
      this.height = window.innerHeight * 0.9
    },
    computed: {
      computedVideos() {
        let videos = this.videos
        if(this.mode) {
          videos = videos.filter(video => !video.type || video.type === this.mode)
        }
        return videos.map(video => ({
          ...video,
          url: video.url + '?cc_load_policy=1&rel=0&VQ=HD720' // force open subtitles & no suggestion
        }))
      }
    },
    methods: {
      back() {
        this.$router.push({
          path: '/pos-dashboard'
        })
      },
      openVideo(video) {
        this.url = video.url
        this.dialog.video = true
      },
      chooseMode(mode) {
        if(this.mode === mode) {
          this.mode = ''
        } else {
          this.mode = mode
        }
      },
      async hideTutorial() {
        await cms.getModel('PosSetting').findOneAndUpdate({},
          {
            $set: {
              'generalSetting.showTutorial': false
            }
          }
        )
        this.dialog.hide = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .tutorial {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;

    &-main {
      flex: 1;
      overflow: auto;
      background-image: url("/plugins/pos-plugin/assets/out.png");
      padding: 12px 4px 12px 12px;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: flex-start;

      &__video {
        background-color: white;
        border-radius: 8px;
        width: calc(20% - 8px);
        margin-right: 8px;
        margin-bottom: 8px;
        border: 0.5px solid #EDF0F5;
        box-shadow: 1px 1px 6px rgba(0, 0, 0, 0.08);

        &-thumbnail {
          img {
            width: 100%;
          }
        }

        &-info {
          padding: 8px;
        }

        &-title {
          font-size: 15px;
          font-weight: 700;
          line-height: 19px;
          height: 38px;
        }

        &-duration {
          font-size: 12px;
          line-height: 15px;
          color: #737A8D;
          margin-top: 4px;
          display: flex;
          align-items: center;
        }
      }
    }

    &-toolbar {
      flex: 0 0 64px;

      .g-btn-bs {
        font-size: 14px;
      }
    }
  }
</style>
