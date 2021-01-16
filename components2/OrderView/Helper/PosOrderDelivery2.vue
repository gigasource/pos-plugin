<script>
export default {
  setup() {
    return () => <div class="delivery">
      <div class="delivery-info">
        <div class="delivery-info--upper">
          {(deliveryOrderMode === 'tablet' || !showKeyboard) &&
          <div class="delivery-info__favorite">
            {favorites.map((f, i) =>
                <div style={getRandomColor(i)} class="delivery-info__favorite-item"
                     onClick={() => selectFavoriteProduct(f)}
                     key={`favorite_${i}`}>
                  {f.name}
                </div>)}
          </div>}


          <div class="delivery-info__customer">
            {!isNewCustomer ?
                <>
                  {selectedCustomer.addresses.map((item, i) =>
                      <div class={['delivery-info__customer-address', selectedAddress === i && 'delivery-info__customer-address--selected']} onClick={() => selectAddress(i)}>
                        <div class="row-flex align-items-center">
                          <g-radio small v-model={selectedAddress} value={i} label={`Address ${i + 1}`} color="#536DFE"/>
                          <g-spacer/>
                          <g-btn-bs small style="margin: 0 2px; padding: 4px;" background-color="#F9A825"
                                    onClick={() => openDialog('edit', item.address, item.zipcode, i)}>
                            <g-icon size="15">icon-reservation_modify</g-icon>
                          </g-btn-bs>
                          <g-btn-bs small style="margin: 0 2px; padding: 4px;" background-color="#FF4452"
                                    onClick={() => removeAddress(i)}>
                            <g-icon size="15">icon-delete</g-icon>
                          </g-btn-bs>
                        </div>
                        <p>{item.address}</p>
                        <p class="text-grey fs-small">{item.zipcode}</p>
                        <p class="text-grey fs-small">{item.city}</p>
                      </div>)}
                  <g-icon size="40" color="#1271FF" onClick={() => openDialog('add')}>add_circle</g-icon>
                </> :
                (deliveryOrderMode === 'mobile' ?
                    <>
                      <div class="row-flex mt-3 w-100">
                        <div style="flex: 1; margin-right: 2px">
                          <g-text-field outlined dense v-model={phone} label="Phone" onClick={() => showKeyboard = true} virtualEvent={isIOS}/>
                        </div>
                        <div style="flex: 1; margin-left: 2px">
                          <g-text-field outlined dense v-model={name} label="Name" onClick={() => showKeyboard = true} virtualEvent={isIOS}/>
                        </div>
                      </div>
                      <div class="row-flex">
                        <div class="col-9">
                          <g-combobox style="width: 100%" label="Address" v-model={placeId} outlined dense clearable virtualEvent={isIOS} skip-search
                                      items={autocompleteAddresses} onUpdate:searchText={debouceSearchAddress} ref="autocomplete"
                                      onInputClick={() => showKeyboard = true} keep-menu-on-blur menu-class="menu-autocomplete-address"
                                      onUpdate:modelValue={selectAutocompleteAddress}/>
                        </div>
                        <div class="flex-grow-1 ml-1">
                          <g-text-field outlined dense v-model={house} label="Nr" onClick={() => showKeyboard = true} virtualEvent={isIOS}/>
                        </div>
                      </div>
                    </> :
                    <>
                      <g-text-field-bs class="bs-tf__pos" label="Name" v-model={name} onClick={() => openDialog('add')}>
                        {{
                          'append-inner': () => <g-icon onClick={() => openDialog('add')}>icon-keyboard</g-icon>
                        }}
                      </g-text-field-bs>
                      <g-text-field-bs class="bs-tf__pos" label="Address" v-model={address} onClick={() => openDialog('add')}>
                        {{
                          'append-inner': () => <g-icon onClick={() => openDialog('add')}>icon-keyboard</g-icon>
                        }}
                      </g-text-field-bs>
                    </>)}
          </div>
        </div>
        <div class="delivery-info--lower">
          {(calls && calls.length > 0) ?
              <div class={['delivery-info__call', calls && calls[0] && calls[0].type === 'missed' ? 'b-red' : 'b-grey']}>
                <div class="delivery-info__call--info">
                  <p class="fw-700 fs-small">
                    <g-icon size="16" class="mr-1">icon-call</g-icon>
                    {calls[0].customer.phone}
                  </p>
                  <p class="fs-small text-grey-darken-1">{calls[0].customer.name}</p>
                </div>
                <div class={['delivery-info__call-btn', orderType === 'pickup' && 'delivery-info__call-btn--selected']}
                     onClick={() => chooseCustomer('pickup')}>
                  <g-icon size="20">icon-take-away</g-icon>
                </div>
                <div class={['delivery-info__call-btn', orderType === 'delivery' && 'delivery-info__call-btn--selected']}
                     onClick={() => chooseCustomer('delivery')}>
                  <g-icon size="20">icon-delivery-scooter</g-icon>
                </div>
                <div class="delivery-info__call-btn--cancel" onClick={() => deleteCall()}>
                  <g-icon color="white">clear</g-icon>
                </div>
              </div> :
              <>
                <div class="delivery-info__call--empty">
                  <p class="fw-700">Empty</p>
                  <p class="text-grey-darken-1">No pending calls</p>
                </div>
                {(missedCalls && missedCalls.length > 0) && <g-menu v-model={menuMissed} top left nudge-top="5">
                  {{
                    activator: ({ on }) =>
                        <div v-on="on"
                             className={['delivery-info__call--missed', menuMissed && 'delivery-info__call--missed--selected']}>
                          <b>Missed</b>
                          <div className="delivery-info__call--missed-num">
                            {missedCalls.length}
                          </div>
                        </div>
                  }}
                  <div class="menu-missed">
                    {missedCalls.map((call, i) =>
                        <div class="menu-missed__call" key={`missed_${i}`}>
                          <div class="menu-missed__call--info">
                            <p class="fw-700 fs-small">
                              <g-icon size="16" class="mr-1">icon-call</g-icon>
                              {call.customer.phone}
                            </p>
                            <p class="fs-small text-grey-darken-1">{call.customer.name}</p>
                          </div>
                          <div class={['delivery-info__call-btn']}
                               onClick={() => chooseMissedCustomer(i, 'pickup')}>
                            <g-icon size="20">icon-take-away</g-icon>
                          </div>
                          <div class={['delivery-info__call-btn']}
                               onClick={() => chooseMissedCustomer(i, 'delivery')}>
                            <g-icon size="20">icon-delivery-scooter</g-icon>
                          </div>
                          <div class="delivery-info__call-btn--cancel" onClick={() => deleteCall(i)}>
                            <g-icon color="white">clear</g-icon>
                          </div>
                        </div>)}
                  </div>
                </g-menu>}
              </>}
        </div>
      </div>
      <div class="delivery-order">
        {(deliveryOrderMode === 'mobile') ?
            <>
              <g-spacer/>
              <pos-order-delivery-keyboard mode="active" keyboardConfig={keyboardConfig} onSubmit={chooseProduct}/>
            </> :
            <>
              <div class="delivery-order__content">
                <g-autocomplete text-field-component="GTextFieldBs" v-model={selectedProduct} items={products}
                                ref="autocomplete" return-object
                                filter={(itemText, text) => {return itemText.toLowerCase().includes(text.toLowerCase())}}/>
                {selectedProduct && <>
                  <g-text-field-bs class="bs-tf__pos quantity" v-model={quantity} label="Quantity"/>
                  <g-text-field-bs class="bs-tf__pos" modelValue={selectedProduct.price} label="Price"
                                   onUpdate:modelValue={debouceUpdatePrice}/>
                  <g-text-field-bs class="bs-tf__pos" v-model={selectedProduct.note} label="Note"/>
                </>}
                {(selectedProduct && selectedProduct.choices && selectedProduct.choices.length > 0) &&
                selectedProduct.choices.map((choice, iC) =>
                    <div class="delivery-order__choice" key={`choice_${iC}`}>
                      <p class="delivery-order__choice-title">
                        {choice.name}
                        {choice.mandatory && <span class="text-red">*</span>}
                      </p>
                      <div class="delivery-order__options">
                        {choice.options.map((option, i0) =>
                            <div key={`option_${iC}_ ${iO}`}
                                 onClick_stop={selectOption(choice, option)}
                                 class={['delivery-order__option', isModifierSelect(option) && 'delivery-order__option--selected']}>
                              {option.name} - {$t('common.currency', storeLocale)}{option.price}
                            </div>
                        )}
                      </div>
                    </div>)}
              </div>
              <g-btn-bs block large class="elevation-2" icon="icon-kitchen" background-color="#0EA76F"
                        disabled={unavailableToAdd} onClick={addProduct}>Add to order list
              </g-btn-bs>
            </>}
      </div>
      <div class="delivery-detail">
        <div class="delivery-detail__info">
          <g-avatar size="36">
            <img alt src={avatar}/>
          </g-avatar>
          <div class="delivery-detail__info-username">{username}</div>
          <g-spacer/>
          <g-btn-bs class="elevation-1" onClick={back} style="border-radius: 50%; padding: 6px">
            <g-icon>icon-back</g-icon>
          </g-btn-bs>
          <g-spacer/>
          <div class="delivery-detail__total">{$t('common.currency', storeLocale)}{$filters.formatCurrency(paymentTotal)}</div>
        </div>
        <div class="delivery-detail__order">
          {itemsWithQty.map((item, i) =>
              <div key={i} class="item">
                <div class="item-detail">
                  <div>
                    <p class="item-detail__name">{item.id}. {item.name}</p>
                    <p>
                      <span class={['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']}>â‚¬{$filters.formatCurrency(item.originalPrice)}</span>
                      {isItemDiscounted(item) &&
                      <span class="item-detail__price--new">{$t('common.currency', storeLocale)} {$filters.formatCurrency(item.price)}</span>}
                    </p>
                  </div>
                  <div class="item-action">
                    <g-icon onClick_stop={removeItem(item)}>remove_circle_outline</g-icon>
                    <span>{item.quantity}</span>
                    <g-icon onClick_stop={addItem(item)}>add_circle_outline</g-icon>
                  </div>
                </div>
                {item.modifiers && <div> {item.modifiers.map((modifier, index) =>
                    <div key={`${item._id}_${index}`}>
                      <g-chip label small text-color="#616161" close onClose={removeModifier(item, index)}>
                        {modifier.name} | {$t('common.currency', storeLocale)}{
                        $filters.formatCurrency(modifier.price)
                      }
                      </g-chip>
                    </div>)}
                </div>}
              </div>)}
        </div>
        <g-btn-bs block large class="elevation-2" icon="icon-print" background-color="#2979FF"
                  onClick={() => dialog.order = true}>Send to
          kitchen
        </g-btn-bs>
      </div>
      <dialog-form-input v-model={dialog.input} onSubmit={addNewCustomer} eager={false}>
        {{
          input: () =>
              <div class="row-flex flex-wrap justify-around">
                <pos-textfield-new style="width: 48%" label="Name" v-model={name}/>
                <pos-textfield-new style="width: 48%" label="Phone" v-model={phone}/>
                <g-combobox style="width: 98%" label="Address" modelValue={placeId} clearable virtualEvent={isIOS} skip-search
                            items={autocompleteAddresses} onUpdate:searchText={debouceSearchAddress}
                            onUpdate:modelValue={selectAutocompleteAddress}/>
                <pos-textfield-new style="width: 23%" label="Street" placeholder="Street name (Autofill)"
                                   v-model={street}/>
                <pos-textfield-new style="width: 23%" label="House no." placeholder="House number (Autofill)"
                                   v-model={house}/>
                <pos-textfield-new style="width: 23%" label="Zipcode" placeholder="Zipcode (Autofill)"
                                   v-model={zipcode}/>
                <pos-textfield-new style="width: 23%" label="City" placeholder="City (Autofill)" v-model={city}/>
              </div>
        }}
      </dialog-form-input>
      <g-dialog v-model={dialog.order} width="500" eager>
        <g-card class="dialog r">
          <g-icon class="dialog-icon--close" onClick={closeDialogConfirm} size="20">icon-close</g-icon>
          <div class="mx-2">
            <b>Name: </b> {selectedCustomer.name}
          </div>
          <div class="mx-2">
            <b>Phone: </b> {selectedCustomer.phone}
          </div>
          <div class="mx-2">
            <b>Address: </b> {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 &&
          selectedCustomer.addresses[selectedAddress].address}
            {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 &&
            selectedCustomer.addresses[selectedAddress].zipcode}
          </div>
          <g-text-field-bs label="Delivery note:" v-model={note}>
            {{
              'append-inner': () => <g-icon onClick={() => dialog.note = true}>icon-keyboard</g-icon>
            }}
          </g-text-field-bs>
          <div class="ma-2">Time to complete (minute)</div>
          <div class="mb-3">
            <g-btn-bs class="elevation-1" backgroundColor={time === 15 ? '#BBDEFB' : 'white'} onClick={() => time = 15}>15
            </g-btn-bs>
            <g-btn-bs class="elevation-1" backgroundColor={time === 30 ? '#BBDEFB' : 'white'} onClick={() => time = 30}>30
            </g-btn-bs>
            <g-btn-bs class="elevation-1" backgroundColor={time === 45 ? '#BBDEFB' : 'white'} onClick={() => time = 45}>45
            </g-btn-bs>
            <g-btn-bs class="elevation-1" backgroundColor={time === 60 ? '#BBDEFB' : 'white'} onClick={() => time = 60}>60
            </g-btn-bs>
          </div>
          <g-btn-bs disabled={disabledConfirm} block large background-color="#2979FF" onClick={confirmOrder}>Confirm
            -
            {$t('common.currency', storeLocale)}{$filters.formatCurrency(paymentTotal)}
          </g-btn-bs>
        </g-card>
      </g-dialog>
      <g-dialog v-model={dialog.choice} eager width="500">
        <g-card class="dialog r">
          <g-icon class="dialog-icon--close" onClick={() => dialog.choice = false} size="20">icon-close</g-icon>
          <div class="dialog-title">Select options</div>
          {(selectedProduct && selectedProduct.choices) &&
          <div class="dialog-content" key={dialog.choice}>
            {selectedProduct.choices.map((choice, index) =>
                <div class="dialog-content__choice" key={index}>
                  <div class="dialog-content__choice-name">
                    <span class="fw-700">{choice.name}</span>
                    <span class="text-red ml-1">{choice.mandatory ? '*' : ''}</span>
                  </div>
                  <div class="dialog-content__choice-option">
                    {(choice.select === 'one' && choice.mandatory) ?
                        <g-radio-group v-model={modifiers[index]}>
                          {choice.options.map(option =>
                              <g-radio color="#536DFE" value={option} key={option._id}
                                       label={`${option.name} (${$t('common.currency', storeLocale)}${$filters.formatCurrency(option.price)} )`}/>)}
                        </g-radio-group>
                        : choice.options.map(option =>
                            <g-checkbox v-model={modifiers[index]}
                                        color="#536DFE"
                                        value={option}
                                        label={getCheckboxLabel(option)}
                                        key={option._id}
                            />
                        )}
                  </div>
                </div>)}
          </div>}
          <div class="dialog-action">
            <div class="row-flex align-items-center" style="line-height: 2">
              <g-icon onClick_stop={changeQuantity(-1)} color="#424242" size="28">remove_circle_outline</g-icon>
              <span style="margin-left: 4px; margin-right: 4px; min-width: 20px; text-align: center">{quantity}</span>
              <g-icon onClick_stop={changeQuantity(1)} color="#424242" size="28">add_circle</g-icon>
            </div>
            <g-spacer/>
            <g-btn-bs min-width="80" height="100%" text-color="#424242" onClick={() => dialog.choice = false}>Cancel</g-btn-bs>
            <g-btn-bs width="80" height="100%" rounded text-color="#FFFFFF" background-color="#536DFE"
                      disabled={unavailableToAdd} onClick={addProduct}>OK
            </g-btn-bs>
          </div>
        </g-card>
      </g-dialog>
      <dialog-text-filter v-model={dialog.note} label="Delivery note" onSubmit={e => {note = e}}/>
      {showKeyboard && <div class="keyboard">
        <div class="keyboard-overlay" onClick={hideKeyboard}></div>
        <div class="keyboard-wrapper">
          <pos-keyboard-full type="alpha-number" onEnterPressed={submitCustomer}/>
        </div>
      </div>}
    </div>
  }
}
</script>

<style scoped lang="scss">
.delivery {
  display: flex;
  width: 100%;
  height: 100vh;

  @mixin card {
    flex: 1 1 0;
    padding: 8px;
  }

  &-info {
    @include card;
    z-index: 2;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &__title {
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 8px;
      margin-top: 16px;
    }

    &__favorite {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-gap: 8px;

      &-item {
        padding: 8px;
        font-size: 15px;
        font-weight: bold;
        height: 36px;
        border-radius: 4px;
        text-align: center;
      }
    }

    &__customer {
      display: flex;
      flex-direction: column;
      align-items: center;

      &-address {
        width: 100%;
        border-radius: 4px;
        border: 1px solid #E1E1E1;
        box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.2);
        padding: 0 8px 8px;
        margin: 12px 0;
      }
    }

    ::v-deep .g-tf-wrapper {
      margin: 4px 0 8px;

      fieldset {
        border-width: 1px !important;
        border-color: #9e9e9e;
      }

      &.g-tf__focused fieldset {
        border-color: #1271FF;
      }

      .g-tf-input {
        font-size: 14px;
        padding: 4px;
      }

      .g-tf-label {
        font-size: 14px;
        top: 4px;

        &__active {
          transform: translateY(-13px) translateX(7px) scale(0.75) !important;
        }
      }
    }

    &--upper {
      flex: 1;
      overflow: auto;
    }

    &--lower {
      margin-top: 8px;
      display: flex;
      align-items: stretch;
    }

    &__call {
      display: flex;
      align-items: center;
      flex: 1;
      padding: 6px;
      background: #FFFFFF;
      border-width: 0.4px;
      border-style: solid;
      border-radius: 4px;

      &--info {
        flex: 1;
        line-height: 1.2;
      }

      &-btn {
        padding: 7px;
        border: 1px solid #E0E0E0;
        border-radius: 2px;
        cursor: pointer;
        margin-right: 4px;
        line-height: 1;

        &--selected {
          background-color: #E3F2FD;
          border-color: #1271FF;
        }

        &--cancel {
          width: 36px;
          height: 36px;
          padding: 6px;
          background: #FF4552;
          border-radius: 2px;
          cursor: pointer;
          line-height: 1;
        }
      }

      &--empty {
        padding: 6px;
        flex: 1;
        border-radius: 4px;
        background: #FFFFFF;
        border: 0.4px solid #9E9E9E;
        margin-right: 8px;
        line-height: 1.2;
        font-size: 14px;
      }

      &--missed {
        display: flex;
        align-items: center;
        background-color: white;
        border: 1px solid #FF4452;
        color: #FF4452;
        border-radius: 4px;
        height: 46px;
        padding: 4px;

        &--selected {
          background-color: #FFEBEE;
        }

        &-num {
          width: 20px;
          height: 20px;
          margin-left: 2px;
          border-radius: 50%;
          text-align: center;
          font-size: 14px;
          color: white;
          background-color: #FF4552;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }

  &-order {
    @include card;
    background-color: #FBFBFB;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.25);
    z-index: 1;
    display: flex;
    flex-direction: column;

    &__content {
      flex: 1;
      overflow: auto;
    }

    ::v-deep .bs-tf-wrapper {

      .bs-tf-input-group, .bs-tf-inner-input-group, .bs-tf-input {
        background-color: white;
      }
    }

    &__choice {
      margin-top: 16px;
      padding: 0 4px;

      &-title {
        font-size: 15px;
      }
    }

    &__options {
      display: flex;
      flex-wrap: wrap;
    }

    &__option {
      padding: 8px;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      background: #F0F0F0;
      border: 1px solid #C9C9C9;
      border-radius: 2px;
      margin-right: 8px;
      margin-top: 8px;

      &--selected {
        background-color: #2979FF;
        border-color: #2979FF;
        color: white;
      }
    }
  }

  &-detail {
    @include card;
    display: flex;
    flex-direction: column;

    &__info {
      display: flex;
      margin-bottom: 4px;
      align-items: center;

      &-username {
        font-weight: bold;
        font-size: 13px;
        margin-left: 8px;
      }
    }

    &__total {
      font-size: 18px;
      font-weight: bold;
      color: #FF4552;
    }

    &__order {
      border-radius: 8px;
      border: 1px solid #e8e8e8;
      overflow: scroll;
      margin-bottom: 16px;
      flex: 1;

      .item {
        padding: 8px;

        &:nth-child(even) {
          background-color: #f8f8f8;
        }

        &-detail {
          display: flex;
          justify-content: space-between;

          &__name {
            font-weight: 700;
            font-size: 14px;
          }

          &__price {
            font-size: 12px;
            color: #616161;
            margin-right: 4px;

            &--new {
              font-size: 14px;
              color: #ff5252;
              margin-right: 4px;
            }
          }

          &__discount {
            text-decoration: line-through;
          }

          &__option {
            font-size: 12px;
            font-style: italic;
            font-weight: 700;
          }
        }

        &-action {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-basis: 25%;

          .g-icon {
            cursor: pointer;
            color: #1d1d26;
            -webkit-tap-highlight-color: transparent;
          }
        }
      }
    }
  }
}

.dialog {
  padding: 12px;

  &-icon--close {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  &-title {
    font-weight: 600;
  }

  &-content {
    font-size: 13px;
    overflow-y: auto;
    scrollbar-width: none; // firefox
    -ms-overflow-style: none; //edge
    padding-bottom: 12px;

    &::-webkit-scrollbar {
      display: none;
    }

    &__choice {
      padding: 6px 0;

      &-name {
        margin-bottom: 4px;
      }

      &-option {
        display: flex;
        flex-wrap: wrap;
        align-items: center;

        .g-radio-wrapper,
        .g-checkbox-wrapper {
          margin: 4px 44px 4px 0;

          ::v-deep .g-radio,
          ::v-deep .g-checkbox {
            padding-left: 20px;
          }

          ::v-deep .g-radio-label,
          ::v-deep .g-checkbox-label {
            color: #424242;
            font-size: 15px;
            text-transform: capitalize;
            margin-left: 0;
          }

          ::v-deep .g-radio .g-radio-checkmark:before,
          ::v-deep .g-checkbox .g-checkbox-checkmark:before {
            font-size: 16px;
          }
        }

        ::v-deep .radio-group {
          display: flex;
          flex-wrap: wrap;
        }
      }
    }

    &__note {
      .bs-tf-wrapper {
        margin: 8px 2px;

        ::v-deep .bs-tf-inner-input-group,
        ::v-deep .bs-tf-input {
          background: #fafafa;
          width: 100%;

          .bs-tf-input::placeholder {
            font-size: 12px;
            color: #9e9e9e;
          }
        }
      }
    }
  }

  &-action {
    display: flex;
    background: #efefef;
    margin: 0 -12px -12px;
    padding: 6px;
    border-radius: 0 0 4px 4px;
  }
}

.menu-missed {
  background: #FFFFFF;
  box-shadow: 1px 1px 6px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  width: calc(33vw - 16px);

  &__call {
    display: flex;
    align-items: center;
    flex: 1;
    padding: 6px;
    background: #FFFFFF;
    border-bottom: 0.4px solid #9E9E9E;

    &--info {
      flex: 1;
      line-height: 1.2;
      margin-right: 4px;
    }
  }
}

.keyboard {
  position: fixed;
  left: 33%;
  bottom: 0;
  right: 0;
  top: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;

  &-overlay {
    flex: 1;
    background: rgba(21, 21, 21, 0.42);
  }

  &-wrapper {
    background: #F0F0F0;
    padding: 4px;
  }

  ::v-deep .key {
    transition: none;

    .key-enter {
      font-size: 16px !important;
    }
  }
}
</style>

<style lang="scss">
.menu-autocomplete-address {
  .g-list {
    .g-list-item-content {
      padding-right: 4px;

      .g-list-item-text {
        white-space: normal;
        word-break: break-word;
        line-height: 1.35;
      }
    }

    & > div:not(:last-child) .g-list-item-text {
      border-bottom: 1px solid #F0F0F0;
    }
  }
}
</style>
