import { computed, ref, watch } from 'vue';
import { showNotify } from '../../AppSharedStates';
import orderLayoutApi from '../orderLayoutApi'
import _ from 'lodash'
import {
  selectedCategoryLayout,
  orderLayout,
  updateOrderLayout,
  updateSelectedCategoryLayout
} from '../../OrderView/pos-ui-shared'

// provide methods to modify OrderLayout
export async function createLayout(columns, rows) {
  const result = orderLayoutApi.createOrderLayout(columns, rows)
  updateOrderLayout(result)
}

export async function changeCategoryColumn(columns) {
  const result = await orderLayoutApi.changeCategoryColumn(orderLayout.value._id, columns)
  showNotify()
  updateOrderLayout(result)
}

export async function changeCategoryRow(rows) {
  const result = await orderLayoutApi.changeCategoryRow(orderLayout.value._id, rows)
  showNotify()
  updateOrderLayout(result)
}

export const categoryRows = computed(() => orderLayout.value && orderLayout.value.rows)
export const categoryColumns = computed(() => orderLayout.value && orderLayout.value.columns)
