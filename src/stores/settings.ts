import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const persistInputs = ref(true)

  // 設定変更時に他のストアの永続化を制御
  watch(persistInputs, (newValue) => {
    if (!newValue) {
      // 永続化を無効にする場合、既存のデータをクリア
      localStorage.removeItem('converter')
      localStorage.removeItem('numbering')
      localStorage.removeItem('sqlInsert')
    }
  })

  return {
    persistInputs
  }
}, {
  persist: true
})
