import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PatternType, NumberFormat } from '../utils/numberingConverter'

export const useNumberingStore = defineStore('numbering', () => {
  const dataBody = ref('')
  const dummyChar = ref('x')
  const outputFormat = ref<NumberFormat>('circled')
  const inputDelimiterType = ref<'auto' | 'tsv' | 'csv'>('auto')
  const outputDelimiterType = ref<'tsv' | 'csv'>('tsv')
  const detectPatterns = ref<PatternType[]>(['dummy', 'circled'])

  const clearDataBody = () => {
    dataBody.value = ''
  }

  const clearDummyChar = () => {
    dummyChar.value = 'x'
  }

  const togglePattern = (pattern: PatternType) => {
    const index = detectPatterns.value.indexOf(pattern)
    if (index > -1) {
      detectPatterns.value = detectPatterns.value.filter(p => p !== pattern)
    } else {
      detectPatterns.value = [...detectPatterns.value, pattern]
    }
  }

  return {
    dataBody,
    dummyChar,
    outputFormat,
    inputDelimiterType,
    outputDelimiterType,
    detectPatterns,
    clearDataBody,
    clearDummyChar,
    togglePattern
  }
}, {
  persist: true
})
