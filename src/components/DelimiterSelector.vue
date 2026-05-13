<script setup lang="ts">
import { computed } from 'vue'
import type { DelimiterType } from '../utils/converter'

interface Option {
  value: DelimiterType
  label: string
}

interface Props {
  modelValue: DelimiterType
  label?: string
  options?: Option[]
  excludeAuto?: boolean
}

const ALL_OPTIONS: Option[] = [
  { value: 'auto', label: '自動判別' },
  { value: 'tsv', label: 'TSV' },
  { value: 'csv', label: 'CSV' },
  { value: 'sql', label: 'SQL' },
  { value: 'md', label: 'MD' },
  { value: 'frame', label: 'Frame表' },
  { value: 'html', label: 'HTML' },
  { value: 'fixed', label: '固定長' },
]

const props = defineProps<Props>()
defineEmits<{ (e: 'update:modelValue', value: DelimiterType): void }>()

const resolvedOptions = computed(() => {
  const base = props.options || ALL_OPTIONS
  if (props.excludeAuto) {
    return base.filter(opt => opt.value !== 'auto')
  }
  return base
})
</script>

<template>
  <div class="delimiter-selector">
    <label v-if="label">{{ label }}</label>
    <label v-for="opt in resolvedOptions" :key="opt.value">
      <input
        type="radio"
        :value="opt.value"
        :checked="modelValue === opt.value"
        @change="$emit('update:modelValue', opt.value)"
      />
      {{ opt.label }}
    </label>
  </div>
</template>
