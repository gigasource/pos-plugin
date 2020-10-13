<template>
  <g-dialog v-model="internalValue" width="60%">
    <g-card>
      <g-card-title>
        <div>Table detail</div>
        <g-spacer/>
        <g-icon @click.stop="close">close</g-icon>
      </g-card-title>
      <g-card-text>
        <div class="mb-4">
          <div class="fw-700 mb-2" style="font-size: 16px">Guest number</div>
          <div class="guest-number-input">
            <g-grid-select
                class="guest-number-input__defined-numbers"
                :grid="false"
                :items="guestPickers"
                v-model="numberOfCustomers">
              <template #default="{ toggleSelect, item, index }">
                <g-btn-bs class="mb-2 picker-btn" background-color="#f6f6f6" border-color="#7d7d7d" border-radius="4px"
                          @click.stop="toggleSelect(item); submit()">
                  <span class="fw-700">{{ item.text }}</span>
                </g-btn-bs>
              </template>
              <template #selected="{ toggleSelect, item, index }">
                <g-btn-bs class="mb-2 picker-btn" background-color="#E3F2FD" border-color="#2E81FD" border-radius="4px"
                          @click.stop="toggleSelect(item); submit()">
                  <span class="fw-700">{{ item.text }}</span>
                </g-btn-bs>
              </template>
            </g-grid-select>
            <pos-textfield-new
                class="guest-number-input__custom-numbers mb-2"
                style="width: 20%"
                v-model="numberOfCustomersText"
                placeholder="Custom"/>
          </div>
        </div>
        <div class="mb-5">
          <g-grid-select :grid="false" :items="customerTypes" v-model="customerType">
            <template #default="{ toggleSelect, item, index }">
              <g-btn-bs class="picker-btn" background-color="#f6f6f6" border-color="#7d7d7d" border-radius="4px"
                        @click.stop="toggleSelect(item); submit()">
                {{ item.text }}
              </g-btn-bs>
            </template>
            <template #selected="{ toggleSelect, item, index }">
              <g-btn-bs class="picker-btn" background-color="#E3F2FD" border-color="#2E81FD" border-radius="4px"
                        @click.stop="toggleSelect(item); submit()">
                {{ item.text }}
              </g-btn-bs>
            </template>
          </g-grid-select>
        </div>
        <div class="keyboard-container">
          <pos-keyboard-full
              class="keyboard"
              @enter-pressed="submit"
              type="numeric"
              width="100%"/>
        </div>
      </g-card-text>
    </g-card>
  </g-dialog>
</template>

<script>
  import isNil from 'lodash/isNil';

  export default {
    name: 'NumberOfCustomersDialog',
    props: {
      value: Boolean
    },
    data() {
      return {
        guestPickers: [
          { text: '1', value: 1 },
          { text: '2', value: 2 },
          { text: '3', value: 3 },
          { text: '4', value: 4 },
          { text: '5', value: 5 },
          { text: '6', value: 6 },
        ],
        customerTypes: [
          { text: 'Company customers', value: 'apply' },
          { text: 'Regular customers', value: 'passthrough' },
        ],
        numberOfCustomers: null,
        numberOfCustomersText: '',
        customerType: null
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        }
      }
    },
    methods: {
      close() {
        this.internalValue = false
      },
      submit() {
        this.$emit('submit',
          { numberOfCustomers: this.numberOfCustomers || '', tseMethod: this.customerType || 'auto' })
      }
    },
    watch: {
      numberOfCustomersText(val) {
        if (!isNil(val)) this.numberOfCustomers = +val
      },
      internalValue(val) {
        if (val) {
          this.numberOfCustomers = null
          this.numberOfCustomersText = ''
          this.customerType = null
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .keyboard-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .keyboard {
    background-color: #bdbdbd;
    padding: 0.5rem;
    width: 450px;
  }

  ::v-deep .key {
    border: 1px solid #BDBDBD;
    border-radius: 2px;
    font-size: 24px;
    font-weight: 700;
    box-shadow: unset;
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .picker-btn {
    padding: 7px 15px;
    margin-left: 0;
    margin-right: 12px;
  }

  .g-tf-wrapper ::v-deep{
    margin: 1px 0 0 0;
    height: 38px;

    .input {
      height: 38px;

      input {
        padding: 0 6px;
      }
    }
  }

  .guest-number-input {
    display: flex;
    flex-direction: row;
    align-items: center;

    &__defined-numbers {
      flex-grow: 0;
    }

    &__custom-numbers {
      flex-basis: 30%;
      flex-grow: 1;
    }
  }
</style>
