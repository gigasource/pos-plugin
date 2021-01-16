<script>
export default {
  setup() {
    return () =>
        <dialog-form-input v-model={dialogConfigOrderItem} width="90%" onSubmit={submit} showKeyboard={!tab || !tab.isGlobalMod}>
          {{
            input: () =>
                <g-tabs v-model={tab} items={tabs} text-color="#1d1d26" color="white" active-text-color="#1d1d26"
                        slider-color="#1471ff" slider-size="3">
                  {tabs.map((tabItem, index) =>
                      <g-tab-item key={index} item={tabItem}>
                        {(index === 0) &&
                        <div class="modifier-content row-flex flex-wrap justify-around mb-2">
                          <pos-textfield-new style="width: 48%;" v-model={modifier} label="Modifier" placeholder="Name"/>
                          <pos-textfield-new style="width: 48%;" rules={rules} v-model={price} label="Price" placeholder="Price"/>
                        </div>}

                        {(index === 1) &&
                        <change-value v-model={changeType} originalValue={originalValue} newValueEditable={newValueEditable}
                                      v-model={newValue}/>
                        }

                        {tabItem.isGlobalMod && <>
                          {tabItem.categories.map(category =>
                              <>
                                <div>
                                  <span>{category.name}</span>
                                  {category.mandatory && <span style="color: #FF4452;">*</span>}
                                </div>
                                <div class="mt-2 mb-3">
                                  <g-grid-select items={tabItem.modifiersByCategory[category._id]} grid={false} return-object
                                                 multiple={!category.selectOne} mandatory={category.mandatory}
                                                 modelValue={selectedModifiers[category._id]} onUpdate:modelValue={selectModifier($event, category)}
                                  >
                                    {{
                                      default: ({ toggleSelect, item, index }) =>
                                          <g-btn uppercase={false} border-radius="2" outlined class="mr-3" background-color="#F0F0F0"
                                                 style="border: 1px solid #C9C9C9"
                                                 onClick={onClickModifier(item, category, toggleSelect)}>
                                            <span class="fw-700">{item.name} - {$t('common.currency', storeLocale)}{item.price}</span>
                                          </g-btn>,
                                      selected: ({ toggleSelect, item, index }) => <>
                                        {(getModifierQty(item._id) > 1) ?
                                            <g-badge overlay color="#FF4452" class="mr-3">
                                              {{
                                                badge: () => <div>{getModifierQty(item._id)}</div>,
                                                default: () =>
                                                    <g-btn uppercase={false} border-radius="2" flat background-color="#2979FF" text-color="#fff"
                                                           onClick={onClickModifier(item, category, toggleSelect)}>
                                                      <span class="fw-700">{item.name} - {$t('common.currency', storeLocale)}{item.price}</span>
                                                    </g-btn>
                                              }}
                                            </g-badge> :
                                            <g-btn uppercase={false} border-radius="2" flat class="mr-3" background-color="#2979FF" text-color="#fff"
                                                   onClick={onClickModifier(item, category, toggleSelect)}>
                                              <span class="fw-700">{item.name} - {$t('common.currency', storeLocale)}{item.price}</span>
                                            </g-btn>}
                                      </>
                                    }}
                                  </g-grid-select>
                                </div>
                              </>)}
                        </>}
                      </g-tab-item>)}
                </g-tabs>
          }}
        </dialog-form-input>
  }
}
</script>

<style scoped lang="scss">
.modifier-content {
  margin-top: 8px;

  ::v-deep .bs-tf-label {
    font-size: 16px;
  }
}
</style>
