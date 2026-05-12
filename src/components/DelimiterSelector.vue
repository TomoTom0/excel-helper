<script setup lang="ts">
import type { DelimiterType } from '../utils/converter'

interface Option {
  value: DelimiterType
  label: string
}

interface Props {
  modelValue: DelimiterType
  label?: string
  options?: Option[]
}

const DEFAULT_OPTIONS: Option[] = [
  { value: 'auto', label: '自動判別' },
  { value: 'tsv', label: 'TSV' },
  { value: 'csv', label: 'CSV' },
  { value: 'pipe', label: 'SQL/MD' },
  { value: 'frame', label: 'Frame表' },
  { value: 'html', label: 'HTML' },
  { value: 'fixed', label: '固定長' },
]

defineProps<Props>()
defineEmits<{ (e: 'update:modelValue', value: DelimiterType): void }>()
</script>

<template>
  <div class="delimiter-selector">
    <label v-if="label">{{ label }}</label>
    <label v-for="opt in (options || DEFAULT_OPTIONS)" :key="opt.value">
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
