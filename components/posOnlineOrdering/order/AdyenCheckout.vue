<template>
  <!-- NOTE FROM ADYEN: If you are using JavaScript frameworks such as Vue or React, make sure that you use references instead of selectors and that you don't re-render the DOM element. -->
  <div>
    <div id="component-container"></div>
  </div>
</template>
<script>
  export default {
    name: 'AdyenCheckout',
    props: {
      // CONTAINER ---
      selfHost: Boolean,
      hostId: String,

      paymentMethodsResponse: Object,
      environment: String,
      locale: String,
      originKey: String
    },
    data: function () {
      const fakePaymentMethodResponse = {
        "groups": [
          {
            "name": "Gift Card",
            "types": [
              "svs"
            ]
          },
          {
            "name": "BCMC Mobile",
            "types": [
              "bcmc_mobile_QR",
              "bcmc_mobile_app"
            ]
          },
          {
            "name": "Credit Card",
            "types": [
              "amex",
              "bcmc",
              "cup",
              "diners",
              "discover",
              "jcb",
              "maestro",
              "mc",
              "visa"
            ]
          },
          {
            "name": "AliPay",
            "types": [
              "alipay",
              "alipay_wap"
            ]
          },
          {
            "name": "WeChatPay",
            "types": [
              "wechatpayQR",
              "wechatpayWeb"
            ]
          }
        ],
        "paymentMethods": [
          {
            "name": "AliPay",
            "supportsRecurring": true,
            "type": "alipay"
          },
          {
            "name": "AliPay",
            "supportsRecurring": true,
            "type": "alipay_wap"
          },
          {
            "brands": [
              "amex",
              "bcmc",
              "cup",
              "diners",
              "discover",
              "jcb",
              "maestro",
              "mc",
              "visa"
            ],
            "details": [
              {
                "key": "number",
                "type": "text"
              },
              {
                "key": "expiryMonth",
                "type": "text"
              },
              {
                "key": "expiryYear",
                "type": "text"
              },
              {
                "key": "cvc",
                "type": "text"
              },
              {
                "key": "holderName",
                "optional": true,
                "type": "text"
              }
            ],
            "name": "Credit Card",
            "type": "scheme"
          },
          {
            "details": [
              {
                "key": "applepay.token",
                "type": "applePayToken"
              }
            ],
            "name": "Apple Pay",
            "supportsRecurring": true,
            "type": "applepay"
          },
          {
            "name": "Bank Transfer (DE)",
            "supportsRecurring": true,
            "type": "bankTransfer_DE"
          },
          {
            "name": "SEPA Bank Transfer",
            "supportsRecurring": true,
            "type": "bankTransfer_IBAN"
          },
          {
            "details": [
              {
                "key": "number",
                "type": "text"
              },
              {
                "key": "expiryMonth",
                "type": "text"
              },
              {
                "key": "expiryYear",
                "type": "text"
              },
              {
                "key": "holderName",
                "optional": true,
                "type": "text"
              }
            ],
            "name": "Bancontact card",
            "supportsRecurring": true,
            "type": "bcmc"
          },
          {
            "name": "Payconiq by Bancontact",
            "supportsRecurring": true,
            "type": "bcmc_mobile_QR"
          },
          {
            "name": "Payconiq by Bancontact",
            "supportsRecurring": true,
            "type": "bcmc_mobile_app"
          },
          {
            "name": "Boleto",
            "supportsRecurring": true,
            "type": "boleto"
          },
          {
            "name": "Boleto Bancario",
            "supportsRecurring": false,
            "type": "boletobancario_santander"
          },
          {
            "details": [
              {
                "key": "number",
                "type": "text"
              },
              {
                "key": "expiryMonth",
                "type": "text"
              },
              {
                "key": "expiryYear",
                "type": "text"
              },
              {
                "key": "cvc",
                "type": "text"
              },
              {
                "key": "holderName",
                "optional": true,
                "type": "text"
              },
              {
                "key": "telephoneNumber",
                "optional": true,
                "type": "text"
              }
            ],
            "name": "ExpressPay",
            "supportsRecurring": true,
            "type": "cup"
          },
          {
            "name": "Online bank transfer.",
            "supportsRecurring": true,
            "type": "directEbanking"
          },
          {
            "name": "BACS Direct Debit",
            "supportsRecurring": true,
            "type": "directdebit_GB"
          },
          {
            "details": [
              {
                "items": [
                  {
                    "id": "66",
                    "name": "Bank Nowy BFG S.A."
                  },
                  {
                    "id": "92",
                    "name": "Bank Sp�?dzielczy w Brodnicy"
                  },
                  {
                    "id": "11",
                    "name": "Bank transfer / postal"
                  },
                  {
                    "id": "74",
                    "name": "Banki Sp�?dzielcze"
                  },
                  {
                    "id": "73",
                    "name": "BLIK"
                  },
                  {
                    "id": "90",
                    "name": "BNP Paribas - p?ac? z Pl@net"
                  },
                  {
                    "id": "59",
                    "name": "CinkciarzPAY"
                  },
                  {
                    "id": "87",
                    "name": "Credit Agricole PBL"
                  },
                  {
                    "id": "83",
                    "name": "EnveloBank"
                  },
                  {
                    "id": "76",
                    "name": "Getin Bank PBL"
                  },
                  {
                    "id": "81",
                    "name": "Idea Cloud"
                  },
                  {
                    "id": "7",
                    "name": "ING Corporate customers"
                  },
                  {
                    "id": "35",
                    "name": "Kantor Polski"
                  },
                  {
                    "id": "93",
                    "name": "Kasa Stefczyka"
                  },
                  {
                    "id": "44",
                    "name": "Millennium - P?atno?ci Internetowe"
                  },
                  {
                    "id": "10",
                    "name": "Millennium Corporate customers"
                  },
                  {
                    "id": "68",
                    "name": "mRaty"
                  },
                  {
                    "id": "1",
                    "name": "mTransfer"
                  },
                  {
                    "id": "91",
                    "name": "Nest Bank"
                  },
                  {
                    "id": "80",
                    "name": "Noble Pay"
                  },
                  {
                    "id": "50",
                    "name": "Pay Way Toyota Bank"
                  },
                  {
                    "id": "45",
                    "name": "Pay with Alior Bank"
                  },
                  {
                    "id": "65",
                    "name": "Paylink Idea Bank"
                  },
                  {
                    "id": "36",
                    "name": "Pekao24Przelew"
                  },
                  {
                    "id": "70",
                    "name": "Pocztowy24"
                  },
                  {
                    "id": "6",
                    "name": "Przelew24"
                  },
                  {
                    "id": "46",
                    "name": "P?ac? z Citi Handlowy"
                  },
                  {
                    "id": "38",
                    "name": "P?ac? z ING"
                  },
                  {
                    "id": "2",
                    "name": "P?ac? z Inteligo"
                  },
                  {
                    "id": "4",
                    "name": "P?ac? z iPKO"
                  },
                  {
                    "id": "75",
                    "name": "P?ac? z Plus Bank"
                  },
                  {
                    "id": "51",
                    "name": "P?a? z BO?"
                  },
                  {
                    "id": "55",
                    "name": "Raty z Alior Bankiem PLN"
                  },
                  {
                    "id": "89",
                    "name": "Santander"
                  },
                  {
                    "id": "52",
                    "name": "SkyCash"
                  },
                  {
                    "id": "60",
                    "name": "T-Mobile us?ugi bankowe"
                  },
                  {
                    "id": "21",
                    "name": "VIA - Moje Rachunki"
                  },
                  {
                    "id": "84",
                    "name": "Volkswagen Bank direct"
                  }
                ],
                "key": "issuer",
                "type": "select"
              }
            ],
            "name": "Local Polish Payment Methods",
            "supportsRecurring": true,
            "type": "dotpay"
          },
          {
            "name": "Finnish E-Banking",
            "supportsRecurring": true,
            "type": "ebanking_FI"
          },
          {
            "details": [
              {
                "items": [
                  {
                    "id": "231",
                    "name": "POP Pankki"
                  },
                  {
                    "id": "551",
                    "name": "Komer?n� banka"
                  },
                  {
                    "id": "232",
                    "name": "Aktia"
                  },
                  {
                    "id": "552",
                    "name": "Raiffeisen"
                  },
                  {
                    "id": "233",
                    "name": "S��st�pankki"
                  },
                  {
                    "id": "750",
                    "name": "Swedbank"
                  },
                  {
                    "id": "211",
                    "name": "Nordea"
                  },
                  {
                    "id": "553",
                    "name": "?SOB"
                  },
                  {
                    "id": "234",
                    "name": "S-Pankki"
                  },
                  {
                    "id": "751",
                    "name": "SEB"
                  },
                  {
                    "id": "554",
                    "name": "Moneta"
                  },
                  {
                    "id": "235",
                    "name": "OmaSP"
                  },
                  {
                    "id": "752",
                    "name": "Nordea"
                  },
                  {
                    "id": "213",
                    "name": "Op-Pohjola"
                  },
                  {
                    "id": "555",
                    "name": "UniCredit"
                  },
                  {
                    "id": "753",
                    "name": "LHV"
                  },
                  {
                    "id": "556",
                    "name": "Fio"
                  },
                  {
                    "id": "557",
                    "name": "mBank"
                  },
                  {
                    "id": "216",
                    "name": "Handelsbanken"
                  },
                  {
                    "id": "558",
                    "name": "Air Bank"
                  },
                  {
                    "id": "260",
                    "name": "L�nsf�rs�kringar"
                  },
                  {
                    "id": "240",
                    "name": "BankDeposit"
                  },
                  {
                    "id": "265",
                    "name": "Sparbanken"
                  },
                  {
                    "id": "640",
                    "name": "BankDeposit"
                  },
                  {
                    "id": "200",
                    "name": "�landsbanken"
                  },
                  {
                    "id": "940",
                    "name": "Swedbank"
                  },
                  {
                    "id": "500",
                    "name": "?esk� spo?itelna"
                  },
                  {
                    "id": "720",
                    "name": "Swedbank"
                  },
                  {
                    "id": "941",
                    "name": "SEB"
                  },
                  {
                    "id": "204",
                    "name": "Danske Bank"
                  },
                  {
                    "id": "721",
                    "name": "SEB"
                  },
                  {
                    "id": "942",
                    "name": "Citadele"
                  },
                  {
                    "id": "205",
                    "name": "Handelsbanken"
                  },
                  {
                    "id": "722",
                    "name": "DNB"
                  },
                  {
                    "id": "943",
                    "name": "DNB"
                  },
                  {
                    "id": "206",
                    "name": "Nordea"
                  },
                  {
                    "id": "723",
                    "name": "?iauli? bankas"
                  },
                  {
                    "id": "207",
                    "name": "SEB"
                  },
                  {
                    "id": "724",
                    "name": "Nordea"
                  },
                  {
                    "id": "505",
                    "name": "Komer?n� banka"
                  },
                  {
                    "id": "208",
                    "name": "Skandiabanken"
                  },
                  {
                    "id": "209",
                    "name": "Swedbank"
                  }
                ],
                "key": "issuer",
                "type": "select"
              }
            ],
            "name": "Bank Payment",
            "supportsRecurring": true,
            "type": "entercash"
          },
          {
            "details": [
              {
                "key": "bic",
                "optional": true,
                "type": "text"
              }
            ],
            "name": "GiroPay",
            "supportsRecurring": true,
            "type": "giropay"
          },
          {
            "details": [
              {
                "items": [
                  {
                    "id": "1121",
                    "name": "Test Issuer"
                  },
                  {
                    "id": "1154",
                    "name": "Test Issuer 5"
                  },
                  {
                    "id": "1153",
                    "name": "Test Issuer 4"
                  },
                  {
                    "id": "1152",
                    "name": "Test Issuer 3"
                  },
                  {
                    "id": "1151",
                    "name": "Test Issuer 2"
                  },
                  {
                    "id": "1162",
                    "name": "Test Issuer Cancelled"
                  },
                  {
                    "id": "1161",
                    "name": "Test Issuer Pending"
                  },
                  {
                    "id": "1160",
                    "name": "Test Issuer Refused"
                  },
                  {
                    "id": "1159",
                    "name": "Test Issuer 10"
                  },
                  {
                    "id": "1158",
                    "name": "Test Issuer 9"
                  },
                  {
                    "id": "1157",
                    "name": "Test Issuer 8"
                  },
                  {
                    "id": "1156",
                    "name": "Test Issuer 7"
                  },
                  {
                    "id": "1155",
                    "name": "Test Issuer 6"
                  }
                ],
                "key": "issuer",
                "type": "select"
              }
            ],
            "name": "iDEAL",
            "supportsRecurring": true,
            "type": "ideal"
          },
          {
            "name": "Pay later with Klarna.",
            "supportsRecurring": true,
            "type": "klarna"
          },
          {
            "name": "Slice it with Klarna.",
            "supportsRecurring": true,
            "type": "klarna_account"
          },
          {
            "details": [
              {
                "items": [
                  {
                    "id": "fpx_bimb",
                    "name": "Bank Islam"
                  },
                  {
                    "id": "fpx_uob",
                    "name": "UOB Bank"
                  },
                  {
                    "id": "fpx_cimbclicks",
                    "name": "CIMB Clicks"
                  },
                  {
                    "id": "fpx_kfh",
                    "name": "Kuwait Finance House"
                  },
                  {
                    "id": "fpx_rhb",
                    "name": "RHB Now"
                  },
                  {
                    "id": "fpx_abmb",
                    "name": "Alliance Bank"
                  },
                  {
                    "id": "fpx_hsbc",
                    "name": "HSBC"
                  },
                  {
                    "id": "fpx_amb",
                    "name": "Am Online"
                  },
                  {
                    "id": "fpx_ocbc",
                    "name": "OCBC Bank"
                  },
                  {
                    "id": "fpx_abb",
                    "name": "Affin Bank"
                  },
                  {
                    "id": "fpx_scb",
                    "name": "Standard Chartered Bank"
                  },
                  {
                    "id": "fpx_pbb",
                    "name": "Public Bank"
                  },
                  {
                    "id": "fpx_bsn",
                    "name": "Bank Simpanan Nasional"
                  },
                  {
                    "id": "fpx_bmmb",
                    "name": "Bank Muamalat"
                  },
                  {
                    "id": "fpx_hlb",
                    "name": "Hong Leong Connect"
                  },
                  {
                    "id": "fpx_mb2u",
                    "name": "Maybank2u"
                  },
                  {
                    "id": "fpx_bkrm",
                    "name": "Bank Rakyat"
                  }
                ],
                "key": "issuer",
                "type": "select"
              }
            ],
            "name": "Malaysia E-Banking",
            "supportsRecurring": true,
            "type": "molpay_ebanking_fpx_MY"
          },
          {
            "name": "Multibanco",
            "supportsRecurring": true,
            "type": "multibanco"
          },
          {
            "details": [
              {
                "items": [
                  {
                    "id": "1",
                    "name": "Model Bank v2"
                  }
                ],
                "key": "issuer",
                "type": "select"
              }
            ],
            "name": "Online banking",
            "supportsRecurring": false,
            "type": "openbanking_UK"
          },
          {
            "name": "POLi",
            "supportsRecurring": true,
            "type": "poli"
          },
          {
            "details": [
              {
                "key": "sepa.ownerName",
                "type": "text"
              },
              {
                "key": "sepa.ibanNumber",
                "type": "text"
              }
            ],
            "name": "SEPA Direct Debit",
            "supportsRecurring": true,
            "type": "sepadirectdebit"
          },
          {
            "details": [
              {
                "key": "number",
                "type": "text"
              },
              {
                "key": "expiryMonth",
                "optional": true,
                "type": "text"
              },
              {
                "key": "expiryYear",
                "optional": true,
                "type": "text"
              },
              {
                "key": "cvc",
                "optional": true,
                "type": "text"
              },
              {
                "key": "holderName",
                "optional": true,
                "type": "text"
              }
            ],
            "name": "SVS",
            "supportsRecurring": true,
            "type": "svs"
          },
          {
            "name": "Trustly",
            "supportsRecurring": true,
            "type": "trustly"
          },
          {
            "name": "UnionPay",
            "supportsRecurring": true,
            "type": "unionpay"
          },
          {
            "details": [
              {
                "key": "telephoneNumber",
                "optional": true,
                "type": "tel"
              }
            ],
            "name": "Vipps",
            "supportsRecurring": true,
            "type": "vipps"
          },
          {
            "name": "WeChat Pay",
            "supportsRecurring": true,
            "type": "wechatpayQR"
          },
          {
            "name": "WeChat Pay",
            "supportsRecurring": true,
            "type": "wechatpayWeb"
          }
        ]
      }
      
      return { fakePaymentMethodResponse }
    },
    computed: {
      configuration() {
        return {
          locale: this.locale || 'en_US', // "en_US", // The shopper's locale. For a list of supported locales, see https://docs.adyen.com/checkout/components-web/localization-components.
          environment: this.environment || 'test', // "test", // When you're ready to accept live payments, change the value to one of our live environments https://docs.adyen.com/checkout/components-web#testing-your-integration.
          originKey: this.originKey || 'pub.v2.8015899743163612.aHR0cDovL2xvY2FsaG9zdDo4ODg4.dwEBWpKKkL6OlL3aU4sJlPJDWcJ8LA3guqk20KJ6vBM', // "YOUR_ORIGIN_KEY", // Your website's Origin Key. To find out how to generate one, see https://docs.adyen.com/user-management/how-to-get-an-origin-key.
          paymentMethodsResponse: this.paymentMethodsResponse || this.fakePaymentMethodResponse, // The payment methods response returned in step 1.
          onSubmit: this.handleOnSubmit,
          showPayButton: true,
          amount: {
            value: 1,
            currency: 'USD'
          },
          onAdditionalDetails: this.handleOnAdditionalDetails // Your function for handling onAdditionalDetails event
        }
      }
    },
    mounted() {
      // inject script and link
      // note: Adyen provides the SRI hash that you include as the integrity attribute.
      // Refer to our release notes to get the SRI hash for the specific version.
      // https://docs.adyen.com/checkout/release-notes
      let script = document.getElementById('adyen-script')
      if (!script) {
        console.log('script is not exist. try to load new script')
        script = document.createElement('script')
        script.setAttribute('id', 'adyen-script')
        script.setAttribute('integrity', 'sha384-rGkZxBRhUfCECwNuNrllGf8dOpeUsKTMqczAkphoWMne67C32+na/29lUGT3HVOB')
        script.setAttribute('crossorigin', 'anonymous')
        script.onload = () => {
          console.log('script loaded. mount adyen component')
          this.mountAdyenComponent()
        }
        document.body.append(script)
        script.src = 'https://checkoutshopper-test.adyen.com/checkoutshopper/sdk/3.8.1/adyen.js'
      } else {
        this.mountAdyenComponent()
      }
      
      let style = document.getElementById('adyen-style');
      if (!style) {
        style = document.createElement('link')
        style.setAttribute('integrity', 'sha384-y1lKqffK5z+ENzddmGIfP3bcMRobxkjDt/9lyPAvV9H3JXbJYxCSD6L8TdyRMCGM')
        style.setAttribute('crossorigin', 'anonymous')
        style.setAttribute('rel', 'stylesheet')
        style.setAttribute('href', 'https://checkoutshopper-test.adyen.com/checkoutshopper/sdk/3.8.1/adyen.css')
        document.head.append(style)
      }
    },
    methods: {
      mountAdyenComponent() {
        const checkout = new AdyenCheckout(this.configuration);
        const card = checkout.create('dropin').mount('#component-container');
      },
      async handleOnSubmit(state, component) {
        try {
          const response = await this.makePayment(state.data)
          if (response.action) {
            dropin.handleAction(response.action);
          } else {
            this.showFinalResult(response);
          }
        }
        catch (e) {
          throw Error(error);
        }
      },
      async handleOnAdditionalDetails(state, component) {
        try {
          const response = await this.makeDetailsCall(state.data)
          if (response.action) {
            dropin.handleAction(response.action);
          } else {
            this.showFinalResult(response);
          }
        } catch (e) {
          throw Error(error);
        }
      },
      showFinalResult(response) {
        debugger
      },
      async makePayment(data) {
        return (await axios.post('/payment/adyen/payments', { metadata: data })).data
      },
      async makeDetailsCall(data) {
        return (await axios.post('/payment/adyen/payments/details', { metadata: data })).data
      }
    }
  }
</script>
<style scoped>
</style>
