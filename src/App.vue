<script setup lang="ts">
import { ref } from 'vue'
import FixedLengthConverter from './views/FixedLengthConverter.vue'
import NumberingLineConverter from './views/NumberingLineConverter.vue'

const currentTab = ref('fixed-length')

const tabs = [
  { id: 'fixed-length', name: '固定長相互変換' },
  { id: 'numbering-line', name: 'ナンバリング行変換' }
]

const showDocs = () => {
  window.open('/docs/usage/usage.md', '_blank')
}
</script>

<template>
  <div class="sidebar">
    <h1>YT Excel Helper</h1>
    <ul class="sidebar-nav">
      <li
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: currentTab === tab.id }"
        @click="currentTab = tab.id"
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
    <FixedLengthConverter v-if="currentTab === 'fixed-length'" />
    <NumberingLineConverter v-if="currentTab === 'numbering-line'" />
  </div>
</template>
