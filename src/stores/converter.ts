import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DelimiterType } from '../utils/converter'

export const useConverterStore = defineStore('converter', () => {
  const columnLengths = ref('')
  const dataBody = ref('')
  const columnTitles = ref('')
  const columnOptions = ref('')
  const delimiterType = ref<DelimiterType>('auto')
  const outputFormat = ref<'tsv' | 'csv' | 'fixed'>('tsv')
  const forceAllString = ref(false)

  const clearColumnLengths = () => {
    columnLengths.value = ''
  }

  const clearDataBody = () => {
    dataBody.value = ''
  }

  const clearColumnTitles = () => {
    columnTitles.value = ''
  }

  const clearColumnOptions = () => {
    columnOptions.value = ''
  }

  return {
    columnLengths,
    dataBody,
    columnTitles,
    columnOptions,
    delimiterType,
    outputFormat,
    forceAllString,
    clearColumnLengths,
    clearDataBody,
    clearColumnTitles,
    clearColumnOptions
  }
}, {
  persist: true
})
