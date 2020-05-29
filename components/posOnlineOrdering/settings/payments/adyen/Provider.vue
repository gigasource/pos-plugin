<template>
  <div class="provider">
    <div class="provider__logo">
      <img draggable="false" src="/plugins/pos-plugin/assets/adyen.svg" width="95"/>
    </div>
    <div class="provider__description">
      <div>Enable customers to pay via Adyen.</div>
    </div>
  
    <div>
      <div>Please provide information so we can use it as a wallet for your store</div>
      <div>
        <div>Email</div>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.email" prefix="Email" placeholder="tim@green.com" required/>
      </div>
      <div>
        <div>Individual Details:</div>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.individualDetails.name.firstName" placeholder="Tim" prefix="First Name" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.individualDetails.name.lastName" prefix="Last Name" placeholder="Green" required/>
        <g-select text-field-component="GTextFieldBs" v-model="accountHolder.accountHolderDetails.individualDetails.name.gender" :items="genders" prefix="Gender" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.individualDetails.personalData.dateOfBirth" prefix="Date Of Birth" placeholder="1987-01-01" required/>
        <g-text-field-bs v-if="documentDataNumberRequired" v-model="accountHolder.accountHolderDetails.individualDetails.personalData.documentData.number" prefix="Document Data Number" placeholder="123-45-6789" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.fullPhoneNumber" prefix="Full Phone Number" placeholder="+49 561 7009xx" required/>
      </div>
      <div>
        <div>Address:</div>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.address.postalCode" prefix="PostalCode" placeholder="34119" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.address.houseNumberOrName" prefix="House Number Or Name" placeholder="68-72" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.address.street" prefix="Street" placeholder="Königstor" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.address.city" prefix="City" placeholder="Kassel" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.address.country" prefix="Country Code" placeholder="DE" required/>
      </div>
      <div>
        <div>Bank Account Details</div>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.bankAccountDetails[0].ownerName" prefix="Owner Name" placeholder="Tim" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.bankAccountDetails[0].countryCode" prefix="Country Code" placeholder="DE" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.bankAccountDetails[0].currencyCode" prefix="Currency Code" placeholder="EUR" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.bankAccountDetails[0].iban" prefix="IBAN" placeholder="DE41100000000000xxxx78" required/>
      </div>
    </div>
    <div style="display: flex; justify-content: flex-end">
      <g-btn-bs v-if="isActivated" background-color="#536DFE" text-color="#FFF" @click="$emit('deactive')" style="margin-right: 0">Deactive Adyen</g-btn-bs>
      <g-btn-bs v-else background-color="#536DFE" text-color="#FFF" @click="activateAdyen" style="margin-right: 0">Activate Adyen</g-btn-bs>
    </div>
  </div>
</template>
<script>
  // https://docs.adyen.com/marketpay/onboarding-and-verification/verification-checks
  
  
  
  export default {
    name: 'AdyenProvider',
    props: {
      store: Object
    },
    data: function () {
      return {
        // available options
        genders: [
          { text: 'Male', value: 'MALE' },
          { text: 'Female', value: 'FEMALE' },
          { text: 'Unknown', value: 'UNKNOWN' },
        ],
        // model
        accountHolder: {
          "accountHolderCode": "GENERATE",
          "accountHolderDetails": {
            "email": "",
            "fullPhoneNumber": "",
            "individualDetails": {
              "name": {
                "firstName": "",
                "gender": "UNKNOWN",
                "lastName": ""
              },
              "personalData": {
                "dateOfBirth": "",
                "documentData": {
                  "number": ''
                }
              }
            },
            "address": {
              "city": "",
              "country": "",
              "houseNumberOrName": "",
              "postalCode": "",
              "street": ""
            },
            "bankAccountDetails": [
              {
                "ownerName": "",
                "countryCode": "",
                "currencyCode": "",
                "iban": "",
              }
            ]
          },
          "legalEntity": "Individual"
        }
      }
    },
    computed: {
      isActivated() {
        return this.store.paymentProviders.adyen.accountHolder
      },
      documentDataNumberRequired() {
        // https://docs.adyen.com/marketpay/onboarding-and-verification/verification-checks/identity-check#providing-an-id-number
        switch (this.store.country.locale) {
          case 'en-US': return true;
          case 'de-DE': return false;
        }
      }
    },
    methods: {
      activateAdyen() {
        this.generateAccountHolderCode()
        this.removeUnnecessaryInfo()
        this.$emit('active', this.accountHolder)
      },
      generateAccountHolderCode() {
        // Must be between three (3) and fifty (50) characters long. Only letters, digits, and hyphens (-) are permitted.
        // _ still work :/
        this.accountHolder.accountHolderCode = this.store._id + '_' + new Date().getTime()
      },
      removeUnnecessaryInfo() {
        switch (this.store.country.locale) {
          case 'en-US':
            break;
          case 'de-DE':
            delete this.accountHolder.accountHolderDetails.individualDetails.personalData.documentData
            break;
        }
      }
    }
  }
</script>
<style scoped lang="scss">
  .provider {
    width: 49%;
    background: #FFF;
    border-radius: 4px;
    padding: 30px;
    
    &__logo {
    
    }
    
    &__description {
      color: #757575;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    
    &__balance-info {
      
      &__kv {
        /*display: flex;*/
        /*justify-content: space-between;*/
      }
      
      &__key {
        font-weight: bold;
        font-size: 18px;
      }
      
      &__value {
        color: #536DFE;
        font-family: Muli;
        font-style: normal;
        font-weight: 600;
        font-size: 18px;
      }
    }
    
    &__notice {
      color: #616161;
      margin-top: 20px;
      &>ul {
        margin-block-start: 0 !important;
        font-style: italic;
        &>li {
          font-size: 14px;
        }
      }
    }
  }
  
  ::v-deep {
    .bs-tf-input-prepend > *:first-child {
      width: 180px;
    }
    
    .g-select {
      .bs-tf-wrapper {
        margin-left: 5px;
        margin-bottom: 8px;
      }
      
      .bs-tf-inner-input-group {
        height: 38px;
      }
    }
  }
</style>
