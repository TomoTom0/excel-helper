<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSqlInsertStore } from '../stores/sqlInsert'
import { getDelimiter, parseColumnLengths, convertFromFixed } from '../utils/converter'
import { parseDelimitedData } from '../utils/delimited'
import { generateInsertStatements, parseColumnOptions } from '../utils/sqlInsert'
import InputSection from '../components/InputSection.vue'
import NotificationToast from '../components/NotificationToast.vue'

const store = useSqlInsertStore()
const { tableName, dataBody, columnHeaders, columnOptions, useFirstRowAsHeader, delimiterType, columnLengths, insertFormat } = storeToRefs(store)

const result = ref('')
const conversionType = ref('')

const convertLoading = ref(false)
const copyLoading = ref(false)
const downloadLoading = ref(false)

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

// データがTSV/CSV/固定長のどれかを判定
const parseInputData = (data: string): string[][] | false => {
  const trimmedData = data.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (trimmedData.length === 0) return false

  // 固定長として明示的に指定されている場合
  if (delimiterType.value === 'fixed') {
    const lengths = parseColumnLengths(columnLengths.value)
    if (lengths.length === 0) return false
    
    // 固定長→TSVに変換してからパース
    const tsvData = convertFromFixed(trimmedData, lengths, 'tsv')
    return parseDelimitedData(tsvData, '\t')
  }

  // TSV/CSVとしてパース
  try {
    const delimiter = getDelimiter(trimmedData, delimiterType.value)
    return parseDelimitedData(trimmedData, delimiter)
  } catch {
    return false
  }
}

const convert = () => {
  convertLoading.value = true
  try {
    if (!dataBody.value.trim()) {
      throw new Error('データが空です')
    }
    
    const parsedData = parseInputData(dataBody.value)
    if (!parsedData || parsedData.length === 0) {
      throw new Error('データのパースに失敗しました')
    }

    let columns: string[]
    let dataRows: string[][]

    if (useFirstRowAsHeader.value) {
      // 1行目をヘッダーとして使用
      columns = parsedData[0]
      dataRows = parsedData.slice(1)
      conversionType.value = '1行目をヘッダーとして使用'
    } else {
      // 別途入力されたヘッダーを使用
      if (!columnHeaders.value.trim()) {
        throw new Error('ヘッダーが入力されていません')
      }
      const delimiter = getDelimiter(columnHeaders.value, 'auto')
      const headerData = parseDelimitedData(columnHeaders.value, delimiter)
      columns = headerData[0]
      dataRows = parsedData
      conversionType.value = '別途入力したヘッダーを使用'
    }

    if (dataRows.length === 0) {
      throw new Error('データ行がありません')
    }

    // カラムオプションのパース
    const columnTypes = columnOptions.value.trim() 
      ? parseColumnOptions(columnOptions.value) 
      : undefined

    // テーブル名（空の場合はデフォルト値）
    const finalTableName = tableName.value.trim() || 'YOUR_TABLE_NAME'

    // INSERT文生成
    const inputType = delimiterType.value === 'fixed' ? '固定長' : 
                     getDelimiter(dataBody.value, delimiterType.value) === '\t' ? 'TSV' : 'CSV'
    const outputType = insertFormat.value === 'single' ? '単一行INSERT' : '複数行INSERT'
    conversionType.value = `${inputType} → SQL INSERT (${outputType})`

    result.value = generateInsertStatements(
      finalTableName,
      columns,
      dataRows,
      insertFormat.value,
      columnTypes
    )
  } catch (error) {
    result.value = 'エラー: ' + (error as Error).message
    conversionType.value = ''
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
  a.download = 'insert.sql'
  a.click()
  URL.revokeObjectURL(url)
  setTimeout(() => {
    downloadLoading.value = false
    showNotification('ダウンロードしました')
  }, 300)
}

const resultPlaceholder = computed(() => {
  return `INSERT INTO \`YOUR_TABLE_NAME\` (\`id\`, \`name\`, \`age\`) VALUES (1, 'John', 25);\nINSERT INTO \`YOUR_TABLE_NAME\` (\`id\`, \`name\`, \`age\`) VALUES (2, 'Alice', 30);\n(変換結果がここに表示されます)`
})
</script>

<template>
  <div class="converter-container">
    <div class="header-row">
      <h2>SQL INSERT文生成</h2>
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
        <label>
          <input type="radio" value="fixed" v-model="delimiterType" />
          固定長
        </label>
      </div>
    </div>

    <div class="input-section input-section-inline">
      <div class="input-header">
        <h3>テーブル名<span class="optional">（省略可）</span></h3>
        <div class="input-actions">
          <button 
            class="btn btn-icon-small" 
            @click="copyFieldToClipboard(tableName, 'テーブル名')"
            :disabled="!tableName"
            title="コピー"
          >
            <i class="mdi mdi-content-copy"></i>
          </button>
          <button 
            class="btn btn-icon-small" 
            @click="store.clearTableName()"
            :disabled="!tableName"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
      </div>
      <input 
        type="text"
        v-model="tableName"
        placeholder="YOUR_TABLE_NAME"
        class="table-name-input"
      />
    </div>

    <div class="input-section">
      <div class="input-header">
        <h3>カラム長<span class="optional">（固定長の場合のみ）</span></h3>
        <div class="input-actions">
          <button 
            class="btn btn-icon-small" 
            @click="copyFieldToClipboard(columnLengths, 'カラム長')"
            :disabled="!columnLengths || delimiterType !== 'fixed'"
            title="コピー"
          >
            <i class="mdi mdi-content-copy"></i>
          </button>
          <button 
            class="btn btn-icon-small" 
            @click="store.clearColumnLengths()"
            :disabled="!columnLengths || delimiterType !== 'fixed'"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
      </div>
      <textarea 
        v-model="columnLengths"
        :disabled="delimiterType !== 'fixed'"
        rows="2" 
        placeholder="10,20,15&#10;(CSV or TSV形式)"
      ></textarea>
    </div>

    <InputSection
      v-model="dataBody"
      label="データ本体"
      placeholder="1,John,25&#10;2,Alice,30&#10;（CSV/TSV/固定長形式）"
      :rows="8"
      @copy="copyFieldToClipboard(dataBody, 'データ本体')"
      @clear="store.clearDataBody()"
    >
      <div class="checkbox-container">
        <label>
          <input type="checkbox" v-model="useFirstRowAsHeader" />
          1行目をヘッダーとして使用
        </label>
      </div>
    </InputSection>

    <div class="input-section">
      <div class="input-header">
        <h3>カラムヘッダー</h3>
        <div class="input-actions">
          <button 
            class="btn btn-icon-small" 
            @click="copyFieldToClipboard(columnHeaders, 'カラムヘッダー')"
            :disabled="!columnHeaders || useFirstRowAsHeader"
            title="コピー"
          >
            <i class="mdi mdi-content-copy"></i>
          </button>
          <button 
            class="btn btn-icon-small" 
            @click="store.clearColumnHeaders()"
            :disabled="!columnHeaders || useFirstRowAsHeader"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
      </div>
      <textarea 
        v-model="columnHeaders"
        :disabled="useFirstRowAsHeader"
        rows="2" 
        placeholder="id,name,age&#10;(CSV or TSV形式)"
      ></textarea>
    </div>

    <div class="input-section">
      <div class="input-header">
        <h3>カラムオプション<span class="optional">（省略可）</span></h3>
        <div class="input-actions">
          <button 
            class="btn btn-icon-small" 
            @click="copyFieldToClipboard(columnOptions, 'カラムオプション')"
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
      <textarea 
        v-model="columnOptions"
        rows="3" 
        placeholder="number,string,string&#10;(CSV or TSV形式)&#10;※データ型を指定してSQL値のフォーマットを制御"
      ></textarea>
      <p class="field-description">形式: データ型をカンマ区切りで指定（number=引用符なし、string=引用符あり）</p>
      <p class="field-description field-note">※省略時は全て自動判定（数値は引用符なし、それ以外は引用符あり）</p>
    </div>

    <div class="button-group">
      <button 
        class="btn btn-primary" 
        @click="convert"
        :disabled="convertLoading"
        :class="{ loading: convertLoading }"
      >
        <i class="mdi mdi-auto-fix"></i>
        <span>生成</span>
      </button>
    </div>

    <div class="result-section">
      <div class="input-header">
        <h3>実行結果<span v-if="conversionType" class="conversion-type">（{{ conversionType }}）</span></h3>
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
          <label>INSERT形式:</label>
          <label>
            <input type="radio" value="single" v-model="insertFormat" />
            単一行
          </label>
          <label>
            <input type="radio" value="multi" v-model="insertFormat" />
            複数行
          </label>
        </div>
      </div>
    </div>

    <NotificationToast 
      :show="showNotificationFlag"
      :message="notificationMessage"
      :type="notificationType"
    />
  </div>
</template>
