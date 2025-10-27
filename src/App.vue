<script setup lang="ts">
const tabs = [
  { id: 'fixed-length', name: '固定長相互変換' },
  { id: 'numbering-line', name: 'ナンバリング行変換' }
]
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
