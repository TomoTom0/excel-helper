<script setup lang="ts">
const tabs = [
  { id: 'fixed-length', name: '固定長相互変換' },
  { id: 'numbering-line', name: 'ナンバリング行変換' }
]
</script>

<template>
  <div class="sidebar">
    <h1>YT Excel Helper</h1>
    <ul class="sidebar-nav">
      <router-link v-for="tab in tabs" :key="tab.id" :to="{ name: tab.id }" custom v-slot="{ navigate, isActive }">
        <li :class="{ active: isActive }" @click="navigate" @keydown.enter="navigate" role="link" tabindex="0">
          {{ tab.name }}
        </li>
      </router-link>
    </ul>
    <div class="sidebar-footer">
      <a href="https://github.com/TomoTom0/excel-helper" target="_blank" class="footer-link">
        <i class="mdi mdi-github"></i>
        GitHub
      </a>
      <a href="https://github.com/TomoTom0/excel-helper/blob/main/docs/usage/usage.md" target="_blank" class="footer-link">
        <i class="mdi mdi-book-open-variant"></i>
        Docs
      </a>
    </div>
  </div>
  <div class="main-content">
    <router-view />
  </div>
</template>
