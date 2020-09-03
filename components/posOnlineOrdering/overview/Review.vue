<template>
  <div class="review">
    <img class="review-avatar" alt :src="profile_photo_url"/>
    <div class="review-content">
      <p>{{author_name}}</p>
      <div class="row-flex align-items-center">
        <rating color="#FFC700" icon-size="16" :value="rating"/>
        <span class="fw-700 fs-small-2 text-grey-darken-1"> - {{relative_time_description}}</span>
      </div>
      <div v-if="text" class="mb-3" @click="toggleShowmore">
        <pre :id="`comment_${index}`" :class="['review-comment', !showmore && 'review-comment--collapse']" v-html="text"/>
        <div v-if="expandComment" class="review-comment__show">{{showmore ? 'Less' : 'More'}}</div>
      </div>
    </div>
  </div>
</template>

<script>
  import Rating from "./Rating";

  export default {
    name: "Review",
    components: {Rating},
    props: {
      index: [Number, String],
      profile_photo_url: String,
      author_name: String,
      rating: [Number, String],
      relative_time_description: String,
      text: String,
    },
    data() {
      return {
        showmore: false,
        expandComment: false
      }
    },
    mounted() {
      this.$nextTick(() => {
        const comment = document.getElementById(`comment_${this.index}`)
        if(comment && comment.scrollHeight > comment.offsetHeight) {
          this.expandComment = true
        }
      })
    },
    methods: {
      toggleShowmore() {
        this.showmore = !this.showmore
      }
    }
  }
</script>

<style scoped lang="scss">
  .review {
    display: flex;

    &-avatar {
      width: 36px;
      height: 36px;
      margin-right: 16px;
      border-radius: 50%;
    }

    &-comment {
      font-size: 13px;
      font-weight: bold;
      word-break: break-word;
      white-space: pre-wrap;
      margin-bottom: 0;
      flex: 1;
      text-align: justify;
      text-justify: inter-word;

      &--collapse {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        user-select: auto;
        overflow: hidden;
        -webkit-line-clamp: 2;
      }

      &__show {
        font-size: 14px;
        font-weight: bold;
        color: #2979ff;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
    }
  }
</style>
