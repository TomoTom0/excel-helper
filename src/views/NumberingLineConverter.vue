<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { 
  convertNumberingLines, 
  parseCSV, 
  parseTSV, 
  toCSV, 
  toTSV
} from '../utils/numberingConverter'
import { getDelimiter } from '../utils/converter'
import { useNumberingStore } from '../stores/numbering'

const store = useNumberingStore()
const { 
  dataBody, 
  dummyChar, 
  outputFormat, 
  inputDelimiterType, 
  outputDelimiterType, 
  detectPatterns 
} = storeToRefs(store)

const result = ref('')
const convertLoading = ref(false)
const copyLoading = ref(false)
const downloadLoading = ref(false)

const notificationMessage = ref('')
const notificationType = ref<'success' | 'error'>('success')
const showNotificationFlag = ref(false)

const resultPlaceholder = computed(() => {
  const delimiter = outputDelimiterType.value === 'tsv' ? '\t' : ','
  let numberingExample = ''
  
  if (outputFormat.value === 'circled') {
    numberingExample = `項目A${delimiter}項目B\n"①手順1\n②手順2\n注意事項\n③手順3"${delimiter}"①概要\n②詳細\n③まとめ"`
  } else if (outputFormat.value === 'dotted') {
    numberingExample = `項目A${delimiter}項目B\n"1. 手順1\n2. 手順2\n注意事項\n3. 手順3"${delimiter}"1. 概要\n2. 詳細\n3. まとめ"`
  } else {
    numberingExample = `項目A${delimiter}項目B\n"(1) 手順1\n(2) 手順2\n注意事項\n(3) 手順3"${delimiter}"(1) 概要\n(2) 詳細\n(3) まとめ"`
  }
  
  return `${numberingExample}\n(変換結果がここに表示されます)`
})

const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notificationMessage.value = message
  notificationType.value = type
  showNotificationFlag.value = true
  setTimeout(() => {
    showNotificationFlag.value = false
  }, 2000)
}

const convert = () => {
  convertLoading.value = true
  try {
    const actualDelimiter = getDelimiter(dataBody.value, inputDelimiterType.value)
    
    const parsed = actualDelimiter === 'tsv' 
      ? parseTSV(dataBody.value)
      : parseCSV(dataBody.value)
    
    const converted = parsed.map(row => 
      row.map(cell => convertNumberingLines(
        cell,
        detectPatterns.value,
        outputFormat.value,
        dummyChar.value
      ))
    )
    
    result.value = outputDelimiterType.value === 'tsv'
      ? toTSV(converted)
      : toCSV(converted)
  } catch (error) {
    result.value = 'エラー: ' + (error as Error).message
  } finally {
    convertLoading.value = false
  }
}

const copyToClipboard = () => {
  copyLoading.value = true
  navigator.clipboard.writeText(result.value).then(() => {
    copyLoading.value = false
    showNotification('コピーしました')
  }).catch(() => {
    copyLoading.value = false
    showNotification('コピーに失敗しました', 'error')
  })
}

const downloadResult = () => {
  downloadLoading.value = true
  const blob = new Blob([result.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'result.txt'
  a.click()
  URL.revokeObjectURL(url)
  setTimeout(() => {
    downloadLoading.value = false
    showNotification('ダウンロードしました')
  }, 300)
}

const copyFieldToClipboard = (text: string, fieldName: string) => {
  navigator.clipboard.writeText(text).then(() => {
    showNotification(`${fieldName}をコピーしました`)
  }).catch(() => {
    showNotification('コピーに失敗しました', 'error')
  })
}

const { clearDataBody, togglePattern } = store
</script>

<template>
  <div class="converter-container">
    <div class="header-row">
      <h2>ナンバリング行変換</h2>
      <div class="delimiter-selector">
        <label>入力形式:</label>
        <label>
          <input type="radio" value="auto" v-model="inputDelimiterType" />
          自動判別
        </label>
        <label>
          <input type="radio" value="tsv" v-model="inputDelimiterType" />
          TSV
        </label>
        <label>
          <input type="radio" value="csv" v-model="inputDelimiterType" />
          CSV
        </label>
      </div>
    </div>

    <div class="input-section">
      <div class="input-header">
        <h3>データ本体</h3>
        <div class="input-actions">
          <button 
            class="btn btn-icon-small" 
            @click="copyFieldToClipboard(dataBody, 'データ本体')"
            :disabled="!dataBody"
            title="コピー"
          >
            <i class="mdi mdi-content-copy"></i>
          </button>
          <button 
            class="btn btn-icon-small" 
            @click="clearDataBody"
            :disabled="!dataBody"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
      </div>
      <textarea v-model="dataBody" rows="8" placeholder="項目A	項目B&#10;&quot;①手順1&#10;②手順2&#10;x注意事項&#10;③手順3&quot;	&quot;(1)概要&#10;(2)詳細&#10;(1)まとめ&quot;&#10;(TSV/CSV形式)"></textarea>
    </div>

    <div class="input-section">
      <h3>検出対象パターン</h3>
      <div class="delimiter-selector" style="flex-wrap: wrap;">
        <label>
          <input type="checkbox" :checked="detectPatterns.includes('circled')" @change="togglePattern('circled')" />
          丸数字 <span class="pattern-example">①②③</span>
        </label>
        <label>
          <input type="checkbox" :checked="detectPatterns.includes('dotted')" @change="togglePattern('dotted')" />
          数字+ドット <span class="pattern-example">1. 2. 3.</span>
        </label>
        <label>
          <input type="checkbox" :checked="detectPatterns.includes('parenthesized')" @change="togglePattern('parenthesized')" />
          括弧囲み数字 <span class="pattern-example">(1) (2) (3)</span>
        </label>
        <label class="dummy-char-label">
          <input type="checkbox" :checked="detectPatterns.includes('dummy')" @change="togglePattern('dummy')" />
          ダミー文字
          <input 
            type="text" 
            v-model="dummyChar" 
            maxlength="1" 
            class="dummy-char-input"
          />
          <span class="pattern-example">x項目A</span>
        </label>
      </div>
    </div>

    <div class="button-group">
      <button 
        class="btn btn-primary" 
        @click="convert"
        :disabled="convertLoading"
        :class="{ loading: convertLoading }"
      >
        <i class="mdi mdi-auto-fix"></i>
        <span>変換</span>
      </button>
    </div>

    <div class="result-section">
      <div class="input-header">
        <h3>実行結果</h3>
        <div class="input-actions">
          <button 
            class="btn btn-icon-small" 
            @click="copyToClipboard"
            :disabled="copyLoading || !result"
            :class="{ loading: copyLoading }"
            title="コピー"
          >
            <i :class="copyLoading ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-content-copy'"></i>
          </button>
          <button 
            class="btn btn-icon-small" 
            @click="downloadResult"
            :disabled="downloadLoading || !result"
            :class="{ loading: downloadLoading }"
            title="ダウンロード"
          >
            <i :class="downloadLoading ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-download'"></i>
          </button>
        </div>
      </div>
      <textarea v-model="result" rows="10" readonly :placeholder="resultPlaceholder"></textarea>
      <div class="result-actions">
        <div class="output-format-selector">
          <label>番号:</label>
          <label>
            <input type="radio" value="circled" v-model="outputFormat" />
            ①②③
          </label>
          <label>
            <input type="radio" value="dotted" v-model="outputFormat" />
            1. 2. 3.
          </label>
          <label>
            <input type="radio" value="parenthesized" v-model="outputFormat" />
            (1) (2) (3)
          </label>
        </div>
        <div class="output-format-selector">
          <label>形式:</label>
          <label>
            <input type="radio" value="tsv" v-model="outputDelimiterType" />
            TSV
          </label>
          <label>
            <input type="radio" value="csv" v-model="outputDelimiterType" />
            CSV
          </label>
        </div>
      </div>
    </div>

    <div v-if="showNotificationFlag" :class="['notification', notificationType]">
      {{ notificationMessage }}
    </div>
  </div>
</template>

<style scoped>
.pattern-example {
  color: #7f8c8d;
  margin-left: 5px;
}

.dummy-char-label {
  display: flex;
  align-items: center;
  gap: 5px;
}

.dummy-char-input {
  width: 40px;
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin: 0 5px;
}
</style>
