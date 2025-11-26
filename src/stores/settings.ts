import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useConverterStore } from './converter'
import { useNumberingStore } from './numbering'
import { useSqlInsertStore } from './sqlInsert'

export const useSettingsStore = defineStore('settings', () => {
  const persistInputs = ref(true)

  // 設定変更時に他のストアのデータをクリア
  watch(persistInputs, (newValue) => {
    if (!newValue) {
      // 永続化を無効にする場合、既存のデータをクリア
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
  })

  return {
    persistInputs
  }
}, {
  persist: true
})
