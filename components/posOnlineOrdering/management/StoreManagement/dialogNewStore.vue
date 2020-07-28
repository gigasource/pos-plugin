<template>
  <g-dialog v-model="internalValue" width="40%" eager>
    <div class="dialog">
      <div class="dialog-title">Add New Store</div>
      <g-text-field-bs large label="Name" v-model="name"/>
      <g-select v-if="groups" deletable-chips multiple text-field-component="GTextFieldBs" label="Group" :items="listGroups" v-model="group"/>
      <g-text-field-bs large label="Address" v-model="address"/>
      <g-text-field-bs v-if="googleMapPlaceId" large label="Google Place ID" readonly :value="googleMapPlaceId"/>
      <g-select returnObject item-text="name" text-field-component="GTextFieldBs" label="Country" :items="countries" v-model="country"/>
      <div class="dialog-buttons">
        <g-btn-bs large width="100" text-color="#424242" @click="internalValue = false">Cancel</g-btn-bs>
        <g-btn-bs large width="100" text-color="white" background-color="indigo-accent-2" :disabled="invalid" @click="submit">OK</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogNewStore",
    props:{
      value: null,
      groups: Array,
      countries: Array,
      googleMapPlaceId: String,
    },
    data() {
      return {
        name: '',
        group: null,
        address: '',
        country: null,
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.name = ''
          this.group = null
          this.address = ''
          this.country = null
          this.$emit('input', val)
        }
      },
      listGroups() {
        return this.groups.map(g => ({
          text: g.name,
          value: g._id
        }))
      },
      invalid() {
        if(!this.group || !this.name)
          return true
        return false
      }
    },
    methods: {
      submit() {
        const store = {
          groups: this.group,
          settingName: this.name,
          settingAddress: this.address,
          country: this.country,
          googleMapPlaceId: this.googleMapPlaceId,
        }
        this.$emit('submit', store)
        this.internalValue = false
      },
    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    background: white;
    border-radius: 4px;
    width: 100%;
    padding: 40px;
    display: flex;
    flex-direction: column;

    &-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 28px;
    }

    &-buttons {
      display: flex;
      align-self: flex-end;
      margin-top: 24px;
      margin-right: -8px;
    }
  }
</style>
