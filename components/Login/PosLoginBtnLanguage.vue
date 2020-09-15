<template>
  <div class="row-flex align-items-center">
    <g-menu v-model="menu" close-on-content-click top content-class="menu-language">
      <template v-slot:activator="{on}">
        <g-btn-bs flat :uppercase="false" icon-after="arrow_drop_down" text-color="#3B3B3B" @click="on.click" height="100%">
          {{currentLang.title}}
        </g-btn-bs>
      </template>
      <div class="menu">
        <g-btn-bs v-for="(lang, i) in languages" :key="i"
                  :icon="lang.icon" text-color="#201F2B"
                  class="my-2"
                  @click="chooseLanguage(lang)">
          {{lang.title}}
        </g-btn-bs>
      </div>
    </g-menu>
  </div>
</template>

<script>
  export default {
    name: "PosLoginBtnLanguage",
    props: {
      locale: String
    },
    data() {
      return {
        menu: false,
        languages: [
          { icon: 'icon-germany', title: this.$t('login.german'), locale: 'de'},
          { icon: 'icon-english', title: this.$t('login.english'), locale: 'en'},
        ]
      }
    },
    computed: {
      currentLang() {
        return this.languages.find(i => i.locale === this.locale)
      }
    },
    methods: {
      chooseLanguage(language) {
        this.$emit('changeLocale', language.locale)
      }
    }
  }
</script>

<style scoped lang="scss">
  .g-btn-bs {
    display: flex;
    padding: 0;
    margin: 0;
    justify-content: flex-start;
    font-size: 14px;
  }


  @media screen and (max-width: 1023px) {
    .g-btn-bs {
      font-size: 12px;
    }
  }
</style>

<style lang="scss">
  .menu-language {
    background: white;
    border-radius: 2px;
    padding: 0 6px;
  }
</style>
