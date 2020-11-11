<template>
  <div>
    <g-simple-table striped>
      <tr>
        <th>Name</th>
        <th>{{$t('common.tax')}}</th>
        <th>Type</th>
      </tr>
      <tr v-for="(tax, i) in listTaxCategories" :key="i" @click="select(tax)"
          :class="[selectedTaxCategory && selectedTaxCategory._id === tax._id && 'bordered']">
        <td>{{tax.name}}</td>
        <td>{{tax.value}}%</td>
        <td>{{tax.type}}</td>
      </tr>
    </g-simple-table>
  </div>
</template>

<script>
  export default {
    name: 'viewTax',
    injectService: [
        'SettingsStore:getAllTaxCategory',
        'SettingsStore:selectedTaxCategory',
        'SettingsStore:listTaxCategories',
    ],
    methods: {
      select(tax) {
        this.selectedTaxCategory = tax;
      }
    },
    async created() {
      this.listTaxCategories = await this.getAllTaxCategory();
    },
    beforeDestroy() {
      this.selectedTaxCategory = null
    }
  }
</script>

<style scoped lang="scss">
  .g-table {
    tr th {
      color: #1d1d26;
      text-align: left;
    }

    th:first-child, td:first-child {
      width: 200px;
    }

    td {
      height: 32px
    }

    .bordered {
      box-shadow: 0 0 4px rgba(18, 113, 255, 0.563019);

      td {
        border-top: 2px solid #1271ff;
        border-bottom: 2px solid #1271ff;
      }

      td:first-child {
        border-left: 2px solid #1271ff;
        padding-left: 14px;
      }

      td:last-child {
        border-right: 2px solid #1271ff;
        padding-right: 14px;
      }
    }
  }
</style>
