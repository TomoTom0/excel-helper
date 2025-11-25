<script setup lang="ts">
interface Props {
  show: boolean
  message: string
  type?: 'success' | 'error'
}

withDefaults(defineProps<Props>(), {
  type: 'success'
})
</script>

<template>
  <div v-if="show" :class="['notification', type]">
    {{ message }}
  </div>
</template>
