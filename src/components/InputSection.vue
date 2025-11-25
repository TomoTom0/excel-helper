<script setup lang="ts">
interface Props {
  modelValue: string
  label: string
  placeholder?: string
  rows?: number
  optional?: boolean
  description?: string | string[]
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'copy'): void
  (e: 'clear'): void
}

withDefaults(defineProps<Props>(), {
  placeholder: '',
  rows: 2,
  optional: false
})

const emit = defineEmits<Emits>()

const updateValue = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="input-section">
    <div class="input-header">
      <h3>{{ label }}<span v-if="optional" class="optional">（省略可）</span></h3>
      <div class="input-actions">
        <button 
          class="btn btn-icon-small" 
          @click="emit('copy')"
          :disabled="!modelValue"
          title="コピー"
        >
          <i class="mdi mdi-content-copy"></i>
        </button>
        <button 
          class="btn btn-icon-small" 
          @click="emit('clear')"
          :disabled="!modelValue"
          title="クリア"
        >
          <i class="mdi mdi-delete"></i>
        </button>
      </div>
    </div>
    <textarea 
      :value="modelValue" 
      @input="updateValue"
      :rows="rows" 
      :placeholder="placeholder"
    ></textarea>
    <template v-if="description">
      <p v-if="typeof description === 'string'" class="field-description">{{ description }}</p>
      <p v-else v-for="(desc, index) in description" :key="index" class="field-description field-note">{{ desc }}</p>
    </template>
    <slot></slot>
  </div>
</template>
