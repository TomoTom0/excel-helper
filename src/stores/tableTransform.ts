import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DelimiterType, OutputFormat } from '../utils/converter'
import type { TransformType } from '../utils/tableTransform'

export const useTableTransformStore = defineStore('tableTransform', () => {
  const inputText = ref('')
  const inputFormat = ref<DelimiterType>('auto')
  const outputFormat = ref<OutputFormat>('tsv')
  const transformTypes = ref<TransformType[]>(['transpose'])

  const clearInput = () => {
    inputText.value = ''
  }

  return {
    inputText,
    inputFormat,
    outputFormat,
    transformTypes,
    clearInput
  }
}, {
  persist: {
    afterHydrate: (ctx) => {
      const store = ctx.store as unknown as { inputFormat: string; outputFormat: string }
      if (store.inputFormat === 'pipe') {
        store.inputFormat = 'sql'
      }
      if (store.outputFormat === 'markdown') {
        store.outputFormat = 'md'
      }
    }
  }
})
