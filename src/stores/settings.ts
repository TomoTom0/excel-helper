import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const persistInputs = ref(true)

  return {
    persistInputs
  }
}, {
  persist: true
})
