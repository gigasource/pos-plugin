<template>
  <div>
    <g-dialog v-model="dialogSavedList" overlay-color="#6b6f82" overlay-opacity="0.95" bottom max-width="100%" width="100%" eager>
      <div class="w-100">
        <g-simple-table striped fixed-header style="font-size: 14px;">
          <thead>
          <tr>
            <th class="ta-left">Order No.</th>
            <th class="ta-left">Customer</th>
            <th class="ta-right">Qty of Items</th>
            <th class="ta-left">Saved time</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(list, i) in savedLists" :key="i">
            <td class="ta-left text-blue">{{list.id}}</td>
            <td class="ta-left">{{list.customer}}</td>
            <td class="ta-right">{{list.quantity}}</td>
            <td class="ta-left">{{list.date}}</td>
            <td class="ta-left row-flex justify-center align-items-center">
              <g-btn :uppercase="false" background-color="#1271FF" text-color="white" @click.stop="selectList(list)">
                <g-icon class="mr-2" svg>icon-open</g-icon>
                Select
              </g-btn>
              <g-btn :uppercase="false" background-color="#FF4452" text-color="white" class="ml-2" @click="openDeleteDialog(list)">
                <g-icon class="mr-2" svg>icon-delete</g-icon>
                Delete
              </g-btn>
            </td>
          </tr>
          </tbody>
        </g-simple-table>
        <g-toolbar color="#eee" elevation="2">
          <g-btn :uppercase="false" background-color="white" class="mr-2" @click.stop="dialogSavedList = false">
            <g-icon class="mr-2" svg>icon-back</g-icon>
            Back
          </g-btn>
        </g-toolbar>
      </div>
    </g-dialog>
    <g-dialog v-model="dialogDeleteSave" overlay-color="#6b6f82" overlay-opacity="0.95" width="40%" eager>
      <g-card class="w-100">
        <g-card-title>
          Confirmation
        </g-card-title>
        <g-card-text>
          Are you sure you want to delete Saved order <b>"{{listToDelete && listToDelete.id}}"</b>?
        </g-card-text>
        <g-card-actions>
          <g-btn :uppercase="false" flat outlined @click="dialogDeleteSave = false">Cancel</g-btn>
          <g-btn :uppercase="false" flat background-color="red lighten 2" text-color="white" @click="removeList()">OK</g-btn>
        </g-card-actions>
      </g-card>
    </g-dialog>
  </div>
</template>

<script>
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';

  dayjs.extend(relativeTime)

  export default {
    name: 'dialogSavedList',
    props: {
      modelValue: Boolean,
    },
    injectService: ['OrderStore:(savedOrders,selectSavedOrder,removeSavedOrder)'],
    data() {
      return {
        dialogDeleteSave: false,
        listToDelete: null
      }
    },
    computed: {
      dialogSavedList: {
        get() {
          return this.value;
        },
        set(value) {
          this.$emit('update:modelValue', value)
        }
      },
      savedLists() {
        if (this.savedOrders) {
          return this.savedOrders.map(savedOrder => ({
            _id: savedOrder._id,
            id: savedOrder._id,
            customer: savedOrder.customer,
            quantity: savedOrder.items.reduce((acc, cur) => (acc + cur.quantity), 0),
            date: dayjs(savedOrder.date).fromNow(),
          }))
        }
        return []
      }
    },
    methods: {
      openDeleteDialog(list) {
        this.listToDelete = list
        this.dialogDeleteSave = true
      },
      selectList(list) {
        this.selectSavedOrder(list)
        this.dialogSavedList = false
      },
      removeList() {
        this.removeSavedOrder(this.listToDelete)
        this.dialogDeleteSave = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .g-table {
    height: calc(100% - 64px);
    
    thead tr th {
      font-size: inherit;
      background-color: white;
    }
    
    .g-btn {
      margin: 0 8px;
    }
  }
  
  .g-card {
    .g-card-title,
    .g-card-text {
      justify-content: center;
      text-align: center;
      color: #1d1d26;
    }
    
    .g-card-text {
      padding: 32px 64px;
    }
    
    .g-card-actions {
      justify-content: flex-end;
      
      .g-btn {
        min-width: 120px !important;
        
        &.g-btn__outlined {
          border: 1px solid #979797;
          color: #1d1d26;
        }
      }
    }
  }
</style>
