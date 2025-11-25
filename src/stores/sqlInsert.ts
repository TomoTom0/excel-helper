import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DelimiterType } from '../utils/converter'

export const useSqlInsertStore = defineStore('sqlInsert', () => {
  const tableName = ref('')
  const dataBody = ref('')
  const columnHeaders = ref('')
  const useFirstRowAsHeader = ref(true)
  const delimiterType = ref<DelimiterType>('auto')
  const columnLengths = ref('')
  const insertFormat = ref<'single' | 'multi'>('single')

  const clearTableName = () => {
    tableName.value = ''
  }

  const clearDataBody = () => {
    dataBody.value = ''
  }

  const clearColumnHeaders = () => {
    columnHeaders.value = ''
  }

  const clearColumnLengths = () => {
    columnLengths.value = ''
  }

  return {
    tableName,
    dataBody,
    columnHeaders,
    useFirstRowAsHeader,
    delimiterType,
    columnLengths,
    insertFormat,
    clearTableName,
    clearDataBody,
    clearColumnHeaders,
    clearColumnLengths
  }
}, {
  persist: true
})
