<script>
import { useI18n } from 'vue-i18n';
import { genScopeId } from '../../utils'
import dialogChoosePopupModifierLogicsFactory from './dialog-choose-popup-modifier-logics'
import { ObjectID } from 'bson';
import { onBeforeMount } from 'vue';
import { appHooks } from '../../AppSharedStates';
import { GGridSelect } from '../../../../../backoffice/pos-vue-framework';
import { getScopeAttrs} from '../../../utils/helpers';

export default {
  props: ['product', 'modelValue'],
  components: [GGridSelect],
  setup(props, { emit }) {
    const { t, locale } = useI18n()
    const fakeProps = {
      modelValue: true,
      product: {
        name: 'Water',
        activePopupModifierGroup: new ObjectID('600e91fe59aa8475e361e257')
      }
    }
    onBeforeMount(() => {
      appHooks.emit('updateModifiers')
    })
    const {
      internalValue,
      categories,
      enableSaveBtn,
      activeItem,
      onClickModifier,
      getModifierQty,
      onSave
    } = dialogChoosePopupModifierLogicsFactory(fakeProps, { emit })

    props = fakeProps
    return genScopeId(() => <g-dialog v-model={internalValue.value} width="60%">
      <g-card class="pt-3 pr-4 pb-3 pl-4">
        <g-card-title>
          <div class="row-flex flex-grow-1">
            <div class="flex-grow-1">{props.product.name}</div>
            <g-icon
                onClick={() => internalValue.value = false}>icon-close
            </g-icon>
          </div>
        </g-card-title>
        <g-card-text>
          {categories.value.map((category, cIndex) =>
              <>
                <div>
                  <span>{category.name}</span>
                  {category.mandatory && <span style="color: #FF4452;">*</span>}
                </div>
                <div class="mt-2 mb-3">
                  <g-grid-select
                      items={category.items}
                      grid={false}
                      return-object={true}
                      multiple={!category.selectOne}
                      mandatory={category.mandatory}
                      modelValue={activeItem(category).value} v-slots={{
                    default: ({toggleSelect, item, index}) =>
                        <g-btn uppercase={false} border-radius="2" outlined={true} class="mr-3 mb-2" background-color="#F0F0F0"
                               style="border: 1px solid #C9C9C9" key={`${cIndex}_${index}`}
                               onClick={() => onClickModifier(item, category, toggleSelect)}
                            {...getScopeAttrs()}
                        >
                          {item.name} - {t('common.currency', locale.value)}{item.price}
                        </g-btn>,
                    selected: ({toggleSelect, item, index}) => <>
                      <span key={`${cIndex}_${index}_selected`} {...getScopeAttrs()}>
                        {getModifierQty(item) > 1 ?
                            <g-badge overlay color="#FF4452" class="mr-3 mb-2" v-slots={{
                              badge: () => <div> {getModifierQty(item)} </div>,
                              default: () => <g-btn
                                  uppercase={false} border-radius="2" flat background-color="#2979FF" text-color="#fff"
                                  onClick={() => onClickModifier(item, category, toggleSelect)}
                                  {...getScopeAttrs()}
                              >
                                {item.name} - {t('common.currency', locale.value)}{item.price}
                              </g-btn>
                            }}>
                            </g-badge> :
                            <g-btn
                                uppercase={false} border-radius="2" flat class="mr-3 mb-2" background-color="#2979FF" text-color="#fff"
                                onClick={() => onClickModifier(item, category, toggleSelect)}
                                {...getScopeAttrs()}
                            >
                              {item.name}-{t('common.currency', locale.value)}{item.price}
                            </g-btn>}
                      </span>
                    </>
                  }}>
                  </g-grid-select>
                </div>
              </>)}
        </g-card-text>
        <g-card-actions>
          <g-btn background-color="#2979FF" text-color="#fff"
                 onClick={onSave} disabled={!enableSaveBtn.value}>Save
          </g-btn>
        </g-card-actions>
      </g-card>
    </g-dialog>)
  }
}
</script>

<style scoped lang="scss">
.modifier-group {
  cursor: pointer;
  font-size: 16px;

  &__active {
    font-weight: bold;
  }
}

.modifier {

  &__active {

  }
}
</style>
