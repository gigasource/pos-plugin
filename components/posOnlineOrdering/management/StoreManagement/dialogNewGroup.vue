<template>
  <g-dialog v-model="internalValue" width="40%" eager>
    <div class="dialog">
      <div class="dialog-title">Add New Group</div>
      <g-text-field-bs large label="Group Name:" :rules="rules" placeholder="e.g: Pizza, KFC,..." v-model="group"/>
      <g-switch v-model="isFranchisesGroup" label="Franchise group"/>
      <div class="dialog-buttons">
        <g-btn-bs width="100" large text-color="#424242" @click="internalValue = false">Cancel</g-btn-bs>
        <g-btn-bs width="100" large text-color="white" background-color="indigo-accent-2" :disabled="invalid"
                  @click="submit">OK
        </g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  import _ from 'lodash'
  
  export default {
    name: "dialogNewGroup",
    props: {
      value: null,
      groups: Array,
    },
    data() {
      return {
        group: '',
        isFranchisesGroup: false,
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.group = ''
          this.$emit('input', val)
        }
      },
      rules() {
        const names = this.groups.map(g => g.name)
        return [val => !names.includes(val) || 'This name is already taken']
      },
      invalid() {
        if (this.group === '')
          return true
        if (_.includes(this.groups.map(g => g.name), this.group)) {
          return true
        }
        return false
      },
    },
    methods: {
      submit() {
        this.$emit('submit', {
          name: this.group,
          type: this.isFranchisesGroup ? 'franchises' : undefined
        })
      }
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
