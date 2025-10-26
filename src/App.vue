<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tabs = [
  { id: 'fixed-length', name: '固定長相互変換' },
  { id: 'numbering-line', name: 'ナンバリング行変換' }
]

const navigateToTab = (tabId: string) => {
  router.push({ name: tabId })
}

const showDocs = () => {
  window.open('https://github.com/TomoTom0/excel-helper/blob/main/docs/usage/usage.md', '_blank')
}
</script>

<template>
  <div class="sidebar">
    <h1>YT Excel Helper</h1>
    <ul class="sidebar-nav">
      <li
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: route.name === tab.id }"
        @click="navigateToTab(tab.id)"
      >
        {{ tab.name }}
      </li>
    </ul>
    <div class="sidebar-footer">
      <a href="https://github.com/yutoo89/excel-helper" target="_blank" class="footer-link">
        <i class="mdi mdi-github"></i>
        GitHub
      </a>
      <button @click="showDocs" class="footer-link btn-link">
        <i class="mdi mdi-book-open-variant"></i>
        Docs
      </button>
    </div>
  </div>
  <div class="main-content">
    <router-view />
  </div>
</template>
