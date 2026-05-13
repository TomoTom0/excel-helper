import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DelimiterType, OutputFormat } from '../utils/converter'

export const useConverterStore = defineStore('converter', () => {
  const columnLengths = ref('')
  const dataBody = ref('')
  const columnHeaders = ref('')
  const columnOptions = ref('')
  const delimiterType = ref<DelimiterType>('auto')
  const outputFormat = ref<OutputFormat>('tsv')
  const forceAllString = ref(false)
  const useFirstRowAsHeader = ref(false)

  const clearColumnLengths = () => {
    columnLengths.value = ''
  }

  const clearDataBody = () => {
    dataBody.value = ''
  }

  const clearColumnHeaders = () => {
    columnHeaders.value = ''
  }

  const clearColumnOptions = () => {
    columnOptions.value = ''
  }

  return {
    columnLengths,
    dataBody,
    columnHeaders,
    columnOptions,
    delimiterType,
    outputFormat,
    forceAllString,
    useFirstRowAsHeader,
    clearColumnLengths,
    clearDataBody,
    clearColumnHeaders,
    clearColumnOptions
  }
}, {
  persist: {
    afterHydrate: (ctx) => {
      const store = ctx.store as unknown as { delimiterType: string; outputFormat: string }
      if (store.delimiterType === 'pipe') {
        store.delimiterType = 'sql'
      }
      if (store.outputFormat === 'md-tbl') {
        store.outputFormat = 'md'
      }
      if (store.outputFormat === 'html-tbl') {
        store.outputFormat = 'html'
      }
    }
  }
})
