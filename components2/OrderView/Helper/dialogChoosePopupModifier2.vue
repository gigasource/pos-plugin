<script>
import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const { t: $t } = useI18n()
    return () => <g-dialog v-model={internalValue} width="60%">
      <g-card class="pt-3 pr-4 pb-3 pl-4">
        <g-card-title>
          <div class="row-flex flex-grow-1">
            <div class="flex-grow-1">{product.name}</div>
            <g-icon
                onClick={() => internalValue = false}>icon-close
            </g-icon>
          </div>
        </g-card-title>
        <g-card-text>
          {categories.map((category, cIndex) =>
              <>
                <div>
                  <span>{category.name}</span>
                  {category.mandatory && <span style="color: #FF4452;">*</span>}
                </div>
                <div class="mt-2 mb-3">
                  <g-grid-select
                      items={modifiers[category._id]}
                      grid={false}
                      return-object
                      multiple={!category.selectOne}
                      mandatory={category.mandatory}
                      modelValue={gGridSelectModifierModel[category._id]}
                      onUpdate:modelValue={() => selectModifier($event, category)}>
                    {{
                      default: (toggleSelect, item, index) =>
                          <g-btn uppercase={false} border-radius="2" outlined class="mr-3 mb-2" background-color="#F0F0F0"
                                 style="border: 1px solid #C9C9C9" key={`${cIndex}_${index}`}
                                 onClick={() => onClickModifier(item, category, toggleSelect)}>
                            {item.name} - {$t('common.currency', storeLocale)}{item.price}
                          </g-btn>,
                      selected: (toggleSelect, item, index) => <>
                        <span key={`${cIndex}_${index}_selected`}>
                          {getModifierQty(item._id) > 1 ?
                              <g-badge overlay color="#FF4452" class="mr-3 mb-2">
                                {{
                                  badge: () => <div> {getModifierQty(item._id)} </div>
                                  default: () => <g-btn
                                      uppercase={false} border-radius="2" flat background-color="#2979FF" text-color="#fff"
                                      onClick={() => onClickModifier(item, category, toggleSelect)}>
                                    {item.name} - {$t('common.currency', storeLocale)}{item.price}
                                  </g-btn>
                                }}
                              </g-badge> :
                              <g-btn
                                  uppercase={false} border-radius="2" flat class="mr-3 mb-2" background-color="#2979FF" text-color="#fff"
                                  onClick={() => onClickModifier(item, category, toggleSelect)}>
                                {item.name}
                                -
                                {$t('common.currency', storeLocale)}
                                {item.price}
                              </g-btn>}
                        </span>
                      </>
                    }}
                  </g-grid-select>
                </div>
              </>)}
        </g-card-text>
        <g-card-actions>
          <g-btn background-color="#2979FF" text-color="#fff"
                 onClick={save} disabled={!enableSaveBtn}>Save
          </g-btn>
        </g-card-actions>
      </g-card>
    </g-dialog>
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
