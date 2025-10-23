<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useConverterStore } from '../stores/converter'
import { parseColumnLengths, parseColumnOptions, fixedToTsv as convertFixedToTsv, tsvToFixed as convertTsvToFixed } from '../utils/converter'

const store = useConverterStore()
const { columnLengths, dataBody, columnTitles, columnOptions, delimiterType, outputFormat } = storeToRefs(store)

const result = ref('')

const fixedToTsvLoading = ref(false)
const tsvToFixedLoading = ref(false)
const copyLoading = ref(false)
const downloadLoading = ref(false)

const fixedToTsv = () => {
  fixedToTsvLoading.value = true
  try {
    const lengths = parseColumnLengths(columnLengths.value)
    result.value = convertFixedToTsv(dataBody.value, lengths, outputFormat.value)
  } catch (error) {
    result.value = 'エラー: ' + (error as Error).message
  } finally {
    setTimeout(() => {
      fixedToTsvLoading.value = false
    }, 300)
  }
}

const tsvToFixed = () => {
  tsvToFixedLoading.value = true
  try {
    const lengths = parseColumnLengths(columnLengths.value)
    const options = columnOptions.value.trim() 
      ? parseColumnOptions(columnOptions.value)
      : lengths.map(() => ({ type: 'string' as const, padding: 'right' as const, padChar: ' ' }))
    result.value = convertTsvToFixed(dataBody.value, lengths, options, delimiterType.value)
  } catch (error) {
    result.value = 'エラー: ' + (error as Error).message
  } finally {
    setTimeout(() => {
      tsvToFixedLoading.value = false
    }, 300)
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

const notificationMessage = ref('')
const notificationType = ref<'success' | 'error'>('success')
const showNotificationFlag = ref(false)

const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notificationMessage.value = message
  notificationType.value = type
  showNotificationFlag.value = true
  setTimeout(() => {
    showNotificationFlag.value = false
  }, 2000)
}

const copyFieldToClipboard = (text: string, fieldName: string) => {
  navigator.clipboard.writeText(text).then(() => {
    showNotification(`${fieldName}をコピーしました`)
  }).catch(() => {
    showNotification('コピーに失敗しました', 'error')
  })
}
</script>

<template>
  <div class="converter-container">
    <div class="header-row">
      <h2>固定長相互変換</h2>
      <div class="delimiter-selector">
        <label>
          <input type="radio" value="auto" v-model="delimiterType" />
          自動判別
        </label>
        <label>
          <input type="radio" value="tsv" v-model="delimiterType" />
          TSV
        </label>
        <label>
          <input type="radio" value="csv" v-model="delimiterType" />
          CSV
        </label>
      </div>
    </div>

    <div class="input-section">
      <div class="input-header">
        <h3>カラムごとの長さ</h3>
        <div class="input-actions">
          <button 
            class="btn btn-icon-small" 
            @click="copyFieldToClipboard(columnLengths, 'カラムごとの長さ')"
            :disabled="!columnLengths"
            title="コピー"
          >
            <i class="mdi mdi-content-copy"></i>
          </button>
          <button 
            class="btn btn-icon-small" 
            @click="store.clearColumnLengths()"
            :disabled="!columnLengths"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
      </div>
      <textarea v-model="columnLengths" rows="2"></textarea>
      <p>例: 10,20,15 (カンマ区切りで各カラムの文字数を指定)</p>
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
            @click="store.clearDataBody()"
            :disabled="!dataBody"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
      </div>
      <textarea v-model="dataBody" rows="8"></textarea>
      <p>固定長形式またはTSV形式のデータを入力</p>
    </div>

    <div class="input-section">
      <div class="input-header">
        <h3>カラムタイトル（省略可）</h3>
        <div class="input-actions">
          <button 
            class="btn btn-icon-small" 
            @click="copyFieldToClipboard(columnTitles, 'カラムタイトル')"
            :disabled="!columnTitles"
            title="コピー"
          >
            <i class="mdi mdi-content-copy"></i>
          </button>
          <button 
            class="btn btn-icon-small" 
            @click="store.clearColumnTitles()"
            :disabled="!columnTitles"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
      </div>
      <textarea v-model="columnTitles" rows="2"></textarea>
      <p>例: ID,Name,Age (カンマ区切り)</p>
    </div>

    <div class="input-section">
      <div class="input-header">
        <h3>カラムごとのオプション（省略可）</h3>
        <div class="input-actions">
          <button 
            class="btn btn-icon-small" 
            @click="copyFieldToClipboard(columnOptions, 'カラムごとのオプション')"
            :disabled="!columnOptions"
            title="コピー"
          >
            <i class="mdi mdi-content-copy"></i>
          </button>
          <button 
            class="btn btn-icon-small" 
            @click="store.clearColumnOptions()"
            :disabled="!columnOptions"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
      </div>
      <textarea v-model="columnOptions" rows="3"></textarea>
      <p>例: string:right,string:right,number:left</p>
      <p>形式: データ型:padding方向[:padding文字]</p>
      <p>※省略時は全てstring型、右パディング、半角空白</p>
      <p>※padding文字省略時: numberは'0'、stringは半角空白</p>
    </div>

    <div class="button-group">
      <button 
        class="btn btn-primary" 
        @click="fixedToTsv"
        :disabled="fixedToTsvLoading"
        :class="{ loading: fixedToTsvLoading }"
      >
        <i class="mdi mdi-arrow-right-bold"></i>
        <span>固定長 → TSV/CSV</span>
      </button>
      <button 
        class="btn btn-secondary" 
        @click="tsvToFixed"
        :disabled="tsvToFixedLoading"
        :class="{ loading: tsvToFixedLoading }"
      >
        <i class="mdi mdi-arrow-left-bold"></i>
        <span>TSV/CSV → 固定長</span>
      </button>
    </div>

    <div class="result-section">
      <h3>実行結果</h3>
      <textarea v-model="result" rows="10" readonly></textarea>
      <div class="result-actions">
        <button 
          class="btn btn-icon" 
          @click="copyToClipboard"
          :disabled="copyLoading || !result"
          :class="{ loading: copyLoading }"
          title="コピー"
        >
          <i :class="copyLoading ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-content-copy'"></i>
        </button>
        <button 
          class="btn btn-icon" 
          @click="downloadResult"
          :disabled="downloadLoading || !result"
          :class="{ loading: downloadLoading }"
          title="ダウンロード"
        >
          <i :class="downloadLoading ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-download'"></i>
        </button>
        <div class="output-format-selector">
          <label>出力形式:</label>
          <label>
            <input type="radio" value="tsv" v-model="outputFormat" />
            TSV
          </label>
          <label>
            <input type="radio" value="csv" v-model="outputFormat" />
            CSV
          </label>
        </div>
      </div>
    </div>

    <!-- 通知メッセージ -->
    <div v-if="showNotificationFlag" :class="['notification', notificationType]">
      {{ notificationMessage }}
    </div>
  </div>
</template>
