<script>
import { genScopeId } from '../utils';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue'
import { locale } from '../AppSharedStates';

export default {
  emits: ['changeLocale'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const languages = computed(() => ([
      { icon: 'icon-germany', title: t('login.german'), locale: 'de' },
      { icon: 'icon-english', title: t('login.english'), locale: 'en' },
      { icon: 'icon-vietnam', title: t('login.vietnam'), locale: 'vn' }]))
    const currentLang = computed(() => {
      return languages.value.find(i => i.locale === locale.value)
    })

    const showMenu = ref(false)

    function chooseLanguage(language) {
      emit('changeLocale', language.locale)
    }

    return genScopeId(() =>
        <div class="row-flex align-items-center">
          <g-menu v-model={showMenu.value} close-on-content-click top content-class="menu-language" v-slots={{
            'default': genScopeId(() =>
                <div class="menu">
                  {languages.value.map((lang, i) =>
                      <g-btn-bs key={i} icon={lang.icon} text-color="#201F2B" class="my-2" onClick={() => chooseLanguage(lang)}>
                        {lang.title}
                      </g-btn-bs>
                  )}
                </div>)
            ,
            'activator': genScopeId(({ on }) =>
                <g-btn-bs flat uppercase={false} icon-after="arrow_drop_down" text-color="#3B3B3B" onClick={on.click} height="100%">
                  {currentLang.value && currentLang.value.title}
                </g-btn-bs>)
          }}/>
        </div>
    )
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
