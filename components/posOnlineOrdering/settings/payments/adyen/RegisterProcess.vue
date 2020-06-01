<template>
  <div>
    <template v-if="page === 'welcome'">
      <div class="intro">
        <a href="https://www.adyen.com/" target="_blank">Adyen</a> is a Dutch payment company that allows businesses to accept e-commerce, mobile, and point-of-sale payments.&nbsp;
        Adyen has more than 3,500 customers and is listed on the stock exchange Euronext.
      </div>
    </template>
    
    <template v-if="page === 'edit-basic-info'">
      <div>Please provide information so we can use it as a wallet for your store</div>
      <div>
        <div>Email address</div>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.email" prefix="Email" placeholder="tim@green.com" required/>
      </div>
  
      <div>
        <div>
          Photo Id
          <g-tooltip open-on-hover color="#414141" speech-bubble>
            <template #activator="{on}">
              <span @mouseleave="on.mouseleave" @mouseenter="on.mouseenter" style="cursor: pointer; font-weight: 900;">?</span>
            </template>
            <div style="background-color: #fff; color: #414141; margin-top: 5px; margin-bottom: 5px; padding: 5px;">
              <div>When you upload a Photo ID, it must meet the following requirements:</div>
              <ul>
                <li>Non-expired.</li>
                <li>Must be in color.</li>
                <li>MRZ must be visible (if available).</li>
                <li>Separate file for front and back of the ID document (only when providing an ID card or driver's license).</li>
                <li>Allowed formats: JPEG, JPG, PDF, or PNG.</li>
                <li>Minimum allowed size: 1 KB for PDF, 100 KB for other formats.</li>
                <li>Maximum allowed size: 4 MB.</li>
                <li>Maximum allowed pages for PDF: 2.</li>
              </ul>
              <img src="/plugins/pos-plugin/assets/images/photoIdRules.png" style="max-width: 777px; max-height: 539px"/>
            </div>
          </g-tooltip>
        </div>
        <g-select text-field-component="GTextFieldBs" v-model="photoIdKind" :items="supportedPhotoIdKinds" prefix="Photo ID Type"/>
        <div v-if="photoIdKind === 'Passport'">
          <g-text-field-bs type="file" prefix="Passport" @change="setFrontPhoto"/>
        </div>
        <div v-else>
          <g-text-field-bs type="file" prefix="Front" @change="setFrontPhoto"/>
          <g-text-field-bs type="file" prefix="Back" @change="setBackPhoto"/>
        </div>
      </div>
      
      <div>
        <div>Individual Detail</div>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.individualDetails.name.firstName" placeholder="Tim" prefix="First Name" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.individualDetails.name.lastName" prefix="Last Name" placeholder="Green" required/>
        <g-select text-field-component="GTextFieldBs" v-model="accountHolder.accountHolderDetails.individualDetails.name.gender" :items="genders" prefix="Gender" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.individualDetails.personalData.dateOfBirth" prefix="Date Of Birth" placeholder="1987-01-01" required/>
        <g-text-field-bs v-if="documentDataNumberRequired" v-model="accountHolder.accountHolderDetails.individualDetails.personalData.documentData.number" prefix="Document Data Number" placeholder="123-45-6789" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.fullPhoneNumber" prefix="Full Phone Number" placeholder="+49 561 7009xx" required/>
      </div>
      
      <div>
        <div>Address</div>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.address.postalCode" prefix="PostalCode" placeholder="34119" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.address.houseNumberOrName" prefix="House Number Or Name" placeholder="68-72" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.address.street" prefix="Street" placeholder="Königstor" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.address.city" prefix="City" placeholder="Kassel" required/>
        <g-text-field-bs v-model="accountHolder.accountHolderDetails.address.country" prefix="Country Code" placeholder="DE" required/>
      </div>
    </template>

    
    <template v-if="page === 'edit-bank'">
      <div>
        <div>Bank account details</div>
        <g-btn-bs @click="addNewBankAccount">+ New banks</g-btn-bs>
        <div v-for="(bankAccountDetail, i) in accountHolder.accountHolderDetails.bankAccountDetails" :key="i">
          <g-text-field-bs v-model="bankAccountDetail.ownerName" prefix="Owner Name" placeholder="Tim" required/>
          <g-text-field-bs v-model="bankAccountDetail.countryCode" prefix="Country Code" placeholder="DE" required/>
          <g-text-field-bs v-model="bankAccountDetail.currencyCode" prefix="Currency Code" placeholder="EUR" required/>
          <g-text-field-bs v-model="bankAccountDetail.iban" prefix="IBAN" placeholder="DE41100000000000xxxx78" required/>
          <g-btn-bs @click="removeBankAccount(i)">Remove bank account</g-btn-bs>
        </div>
      </div>
    </template>
    
    <template v-if="page === 'verification-status'">
      <div>
        <span class="verification-check-label">Identity check:</span> <span>{{ verification.identityCheck }}</span>
      </div>
      <div>
        <span class="verification-check-label">Bank account check:</span> <span>{{ verification.bankAccountCheck }}</span>
      </div>
      <div>
        <span class="verification-check-label">Photo ID check:</span> <span> {{ verification.photoIdCheck }} </span>
      </div>
    </template>
    
    <g-spacer/>
    <div style="display: flex; margin-top: 40px;">
      <g-btn-bs
          v-if="prevBtn"
          background-color="#536DFE"
          text-color="#FFF"
          @click="prevBtn.action" style="margin-right: 0">{{ prevBtn.text }}</g-btn-bs>
      <g-spacer/>
      <g-btn-bs
          v-if="nextBtn"
          background-color="#536DFE"
          text-color="#FFF"
          @click="nextBtn.action" style="margin-right: 0">{{ nextBtn.text }}</g-btn-bs>
    </div>
  </div>
</template>
<script>
  // https://docs.adyen.com/marketpay/onboarding-and-verification/verification-checks
  import { getBase64 } from '../../../../Store/utils';
  import TableExpansionRow from '../../../../Order/components/TableExpansionRow';
  
  export default {
    name: 'RegisterProcess',
    components: { TableExpansionRow },
    props: {
      store: Object
    },
    data: function () {
      return {
        page: 'welcome',
        pages: [
          {
            name: 'welcome',
            prev: null,
            next: {
              action: () => this.page = 'edit-basic-info',
              text: 'Use Adyen'
            }
          },
          {
            name: 'edit-basic-info',
            prev: {
              action: () => this.page = 'welcome',
              text: 'Back',
            },
            next: {
              action: () => {
                const succeeded = this.isBasicInfoFilled()
                if (succeeded)
                  this.page = 'edit-bank'
                else
                  alert('Please fill all info before continue proceed')
              },
              text: 'Next'
            }
          },
          {
            name: 'edit-bank',
            prev: {
              action: () => this.page = 'edit-basic-info',
              text: 'Back'
            },
            next: {
              action: async () => {
                await this.activateAdyen()
                this.page = 'verification-status';
              },
              text: 'Next'
            }
          },
          {
            name: 'verification-status',
            prev: {
              action: () => this.page = 'edit-bank',
              text: 'Back'
            },
            next: null
          }
        ],

        // available options
        genders: [
          { text: 'Male', value: 'MALE' },
          { text: 'Female', value: 'FEMALE' },
          { text: 'Unknown', value: 'UNKNOWN' },
        ],

        // photo Id check
        supportedPhotoIdKinds: [
          { text: 'Passport', value: 'Passport' },
          { text: 'ID card', value: 'ID card' },
          { text: "Driver's license", value: "Driver's license" }
        ],
        photoIdKind: 'Passport',
        frontPhotoFile: null,
        frontPhotoBase64: null,
        backPhotoFile: null,
        backPhotoBase64: null,

        // model
        accountHolder: {
          accountHolderCode: "GENERATE",
          accountHolderDetails: {
            email: "",
            fullPhoneNumber: "",
            individualDetails: {
              name: {
                firstName: "",
                gender: "UNKNOWN",
                lastName: ""
              },
              personalData: {
                dateOfBirth: "",
                documentData: {
                  number: ''
                }
              }
            },
            address: {
              city: "",
              country: "",
              houseNumberOrName: "",
              postalCode: "",
              street: ""
            },
            bankAccountDetails: []
          },
          "legalEntity": "Individual"
        },

        verification: {
          identityCheck: null,
          bankAccountCheck: null,
          photoIdCheck: null,
        }
      }
    },
    computed: {
      documentDataNumberRequired() {
        // https://docs.adyen.com/marketpay/onboarding-and-verification/verification-checks/identity-check#providing-an-id-number
        switch (this.store.country.locale) {
          case 'en-US': return true;
          case 'de-DE': return false;
        }
      },
      currentPage() {
        return this.pages.find(page => page.name === this.page)
      },
      prevBtn() {
        return this.currentPage.prev
      },
      nextBtn() {
        return this.currentPage.next
      }
    },
    methods: {
      // basic info
      setFrontPhoto(e) {
        this.frontPhotoFile = e.target.files[0]
      },
      setBackPhoto(e) {
        this.backPhotoFile = e.target.files[0]
      },
      isBasicInfoFilled() {
        const info = this.accountHolder.accountHolderDetails
        const individualDetails = info.individualDetails
        const addr = info.address
        const isDocRequire = this.isDocumentDataRequired()
        return (
            info.email
            && info.fullPhoneNumber
            && individualDetails.name.firstName
            && individualDetails.name.lastName
            && individualDetails.personalData.dateOfBirth
            && (!isDocRequire || isDocRequire && individualDetails.personalData.documentData.number)
            && addr.city
            && addr.houseNumberOrName
            && addr.postalCode
            && addr.street
            && this.isPhotoIdProvided()
        )
      },
      isPhotoIdProvided() {
        return !(!this.frontPhotoFile || (this.photoIdKind !== 'Passport' && !this.backPhotoFile))
      },
      isDocumentDataRequired() {
        // add more country at this step
        switch (this.store.country.locale) {
          case 'en-US':
            return true;
        }
      },
      
      // banks
      addNewBankAccount() {
        this.accountHolder.accountHolderDetails.bankAccountDetails.push({
          ownerName: "",
          countryCode: "",
          currencyCode: "",
          iban: "",
        })
      },
      removeBankAccount(index) {
        this.accountHolder.accountHolderDetails.bankAccountDetails.splice(index, 1)
      },
      
      // active adyen
      async activateAdyen() {
        await this.convertImageFileToBase64()
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
      },
      async convertImageFileToBase64() {
        this.frontPhotoBase64 = await getBase64(this.frontPhotoFile)
        if (this.photoIdKind !== 'Passport') {
          this.backPhotoBase64 = await getBase64(this.backPhotoFile)
        }
      },
    }
  }
</script>
<style scoped>
</style>
