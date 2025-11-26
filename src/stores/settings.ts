import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useConverterStore } from './converter'
import { useNumberingStore } from './numbering'
import { useSqlInsertStore } from './sqlInsert'

export const useSettingsStore = defineStore('settings', () => {
  const persistInputs = ref(true)

  const clearAllStoresData = () => {
    const converterStore = useConverterStore()
    const numberingStore = useNumberingStore()
    const sqlInsertStore = useSqlInsertStore()

    converterStore.clearColumnLengths()
    converterStore.clearDataBody()
    converterStore.clearColumnTitles()
    converterStore.clearColumnOptions()

    numberingStore.clearDataBody()

    sqlInsertStore.clearTableName()
    sqlInsertStore.clearDataBody()
    sqlInsertStore.clearColumnHeaders()
    sqlInsertStore.clearColumnLengths()
    sqlInsertStore.clearColumnOptions()
  }

  // 設定変更時に他のストアのデータをクリア
  watch(persistInputs, (newValue) => {
    if (!newValue) {
      clearAllStoresData()
    }
  })

  return {
    persistInputs,
    clearAllStoresData
  }
}, {
  persist: true
})
