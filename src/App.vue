<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from './stores/settings'

const settingsStore = useSettingsStore()
const { darkMode } = storeToRefs(settingsStore)

const tabs = [
  { id: 'fixed-length', name: '固定長相互変換' },
  { id: 'numbering-line', name: 'ナンバリング行変換' },
  { id: 'sql-insert', name: 'SQL INSERT文生成' },
  { id: 'settings', name: '設定' }
]

// ダークモードのクラスを適用
watch(darkMode, (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark-mode')
  } else {
    document.documentElement.classList.remove('dark-mode')
  }
}, { immediate: true })
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <img src="/favicon-32x32.png" alt="YT Excel Helper" class="sidebar-icon">
      <h1>YT Excel Helper</h1>
    </div>
    <ul class="sidebar-nav">
      <li v-for="tab in tabs" :key="tab.id">
        <router-link :to="{ name: tab.id }">{{ tab.name }}</router-link>
      </li>
    </ul>
    <div class="sidebar-footer">
      <a href="https://github.com/TomoTom0/excel-helper" target="_blank" class="footer-link">
        <i class="mdi mdi-github"></i>
        GitHub
      </a>
      <a href="https://github.com/TomoTom0/excel-helper/blob/main/docs/usage/README.md" target="_blank" class="footer-link">
        <i class="mdi mdi-book-open-variant"></i>
        Docs
      </a>
    </div>
  </div>
  <div class="main-content">
    <router-view />
  </div>
</template>
