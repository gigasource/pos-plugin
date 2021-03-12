import { computed, ref, watch } from 'vue';
import { showNotify } from '../../AppSharedStates';
import orderLayoutApi from '../orderLayoutApi'
import _ from 'lodash'
import {
  selectedCategoryLayout,
  orderLayout,
  updateSelectedCategoryLayout, loadOrderLayout
} from '../../OrderView/pos-ui-shared'

// provide methods to modify OrderLayout
export async function createLayout(columns, rows) {
  await orderLayoutApi.createOrderLayout(columns, rows)
  await loadOrderLayout()
}

export async function changeCategoryColumn(columns) {
  await orderLayoutApi.changeCategoryColumn(orderLayout.value._id, columns)
  showNotify()
  await loadOrderLayout()
}

export async function changeCategoryRow(rows) {
  await orderLayoutApi.changeCategoryRow(orderLayout.value._id, rows)
  showNotify()
  await loadOrderLayout()
}

export const categoryRows = computed(() => orderLayout.value && orderLayout.value.rows)
export const categoryColumns = computed(() => orderLayout.value && orderLayout.value.columns)
