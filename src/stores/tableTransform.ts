import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DelimiterType } from '../utils/converter'

export type OutputFormat = 'csv' | 'tsv' | 'markdown' | 'html'
export type TransformType = 'transpose' | 'flipVertical' | 'flipHorizontal'

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
  persist: true
})
