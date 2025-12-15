import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DelimiterType } from '../utils/converter'

export const useSqlInsertStore = defineStore('sqlInsert', () => {
  const tableName = ref('')
  const dataBody = ref('')
  const columnHeaders = ref('')
  const columnOptions = ref('')
  const useFirstRowAsHeader = ref(true)
  const delimiterType = ref<DelimiterType>('auto')
  const columnLengths = ref('')
  const insertFormat = ref<'single' | 'multi'>('single')
  const useBacktick = ref(true)
  const forceAllString = ref(false)

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

  const clearColumnOptions = () => {
    columnOptions.value = ''
  }

  return {
    tableName,
    dataBody,
    columnHeaders,
    columnOptions,
    useFirstRowAsHeader,
    delimiterType,
    columnLengths,
    insertFormat,
    useBacktick,
    forceAllString,
    clearTableName,
    clearDataBody,
    clearColumnHeaders,
    clearColumnLengths,
    clearColumnOptions
  }
}, {
  persist: true
})
