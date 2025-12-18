<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSqlInsertStore } from '../stores/sqlInsert'
import { getDelimiter, parseColumnLengths, convertFromFixed } from '../utils/converter'
import { parseDelimitedData } from '../utils/delimited'
import { generateInsertStatements, parseColumnOptions } from '../utils/sqlInsert'
import NotificationToast from '../components/NotificationToast.vue'

const DEFAULT_TABLE_NAME = 'YOUR_TABLE_NAME'

const store = useSqlInsertStore()
const { tableName, dataBody, columnHeaders, columnOptions, useFirstRowAsHeader, delimiterType, columnLengths, insertFormat, useBacktick, forceAllString } = storeToRefs(store)

const result = ref('')
const fullResult = ref('')
const conversionType = ref('')

const convertLoading = ref(false)
const copyLoading = ref(false)
const downloadLoading = ref(false)

// ファイルアップロード関連
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const filePreview = ref('')

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

// ファイルアップロード関連の関数
const detectDelimiterTypeFromFilename = (filename: string): 'csv' | 'tsv' | 'fixed' | 'auto' => {
  const ext = filename.toLowerCase().split('.').pop()
  if (!ext) return 'auto'

  if (ext === 'csv') return 'csv'
  if (ext === 'tsv') return 'tsv'
  if (ext === 'fix') return 'fixed'

  return 'auto'
}

const isTextFile = (text: string): boolean => {
  // NULL byte check
  if (text.includes('\0')) return false

  // Control character ratio check (exclude TAB, LF, CR)
  let controlCharCount = 0
  const totalLength = Math.min(text.length, 8000)

  for (let i = 0; i < totalLength; i++) {
    const code = text.charCodeAt(i)
    // Exclude TAB (0x09), LF (0x0A), CR (0x0D)
    if ((code >= 0x00 && code <= 0x08) || (code >= 0x0B && code <= 0x0C) || (code >= 0x0E && code <= 0x1F)) {
      controlCharCount++
    }
  }

  return controlCharCount / totalLength < 0.1
}

const uploadFile = () => {
  fileInputRef.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    // Only read first 8KB for binary check
    const previewSize = 8000
    const blob = file.slice(0, previewSize)
    const previewText = await blob.text()

    // Binary check
    if (!isTextFile(previewText)) {
      showNotification('バイナリファイルは読み込めません', 'error')
      target.value = ''
      return
    }

    // Detect format from filename
    const detectedType = detectDelimiterTypeFromFilename(file.name)
    delimiterType.value = detectedType

    // Store File object (not full text!)
    uploadedFile.value = file

    // Show preview (first 1000 chars only)
    const displaySize = 1000
    const displayBlob = file.slice(0, displaySize)
    const displayText = await displayBlob.text()

    const fileSizeKB = (file.size / 1024).toFixed(1)
    const typeLabel = detectedType === 'auto' ? '自動判別' :
                     detectedType === 'csv' ? 'CSV' :
                     detectedType === 'tsv' ? 'TSV' : '固定長'

    const previewMessage = file.size > displaySize
      ? `\n\n... 以降省略（ファイルサイズ: ${fileSizeKB} KB）\n※変換時に全データを読み込みます`
      : ''

    filePreview.value = displayText + previewMessage
    dataBody.value = '' // Clear manual input

    showNotification(`ファイルを読み込みました（${typeLabel}、${fileSizeKB} KB）`)
  } catch (error) {
    showNotification('ファイルの読み込みに失敗しました', 'error')
    console.error(error)
  } finally {
    target.value = ''
  }
}

const clearUploadedFile = () => {
  uploadedFile.value = null
  filePreview.value = ''
}

// データ表示用のcomputed
const displayDataBody = computed(() => {
  // Show file preview if uploaded
  if (uploadedFile.value && filePreview.value) {
    return filePreview.value
  }
  // Show manual input
  return dataBody.value
})

const isDataBodyReadonly = computed(() => uploadedFile.value !== null)

// データがTSV/CSV/固定長のどれかを判定
const parseInputData = (data: string): string[][] | false => {
  const trimmedData = data.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (trimmedData.length === 0) return false

  // 固定長として明示的に指定されている場合
  if (delimiterType.value === 'fixed') {
    const lengths = parseColumnLengths(columnLengths.value, delimiterType.value)
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

const convert = async () => {
  convertLoading.value = true
  try {
    // Get data (file or manual input)
    let data: string
    if (uploadedFile.value) {
      // Read full file only on conversion
      data = await uploadedFile.value.text()
    } else {
      data = dataBody.value
    }

    if (!data.trim()) {
      throw new Error('データが空です')
    }

    const parsedData = parseInputData(data)
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
      ? parseColumnOptions(columnOptions.value, delimiterType.value) 
      : undefined

    // テーブル名（空の場合はデフォルト値）
    const finalTableName = tableName.value.trim() || DEFAULT_TABLE_NAME

    // INSERT文生成
    const inputType = delimiterType.value === 'fixed' ? '固定長' :
                     getDelimiter(data, delimiterType.value) === '\t' ? 'TSV' : 'CSV'
    const outputType = insertFormat.value === 'single' ? '単一行INSERT' : '複数行INSERT'
    conversionType.value = `${inputType} → SQL INSERT (${outputType})`

    const generatedResult = generateInsertStatements(
      finalTableName,
      columns,
      dataRows,
      insertFormat.value,
      columnTypes,
      useBacktick.value,
      forceAllString.value
    )

    // Store full result
    fullResult.value = generatedResult

    // Display result (limit to 10,000 chars)
    const DISPLAY_LIMIT = 10000
    if (generatedResult.length > DISPLAY_LIMIT) {
      const truncated = generatedResult.substring(0, DISPLAY_LIMIT)
      const totalLines = generatedResult.split('\n').length
      result.value = truncated + `\n\n... 以降省略（全${totalLines}行、${(generatedResult.length / 1024).toFixed(1)} KB）\n※コピー・ダウンロード時は全データが出力されます`
    } else {
      result.value = generatedResult
    }
  } catch (error) {
    result.value = 'エラー: ' + (error as Error).message
    fullResult.value = ''
    conversionType.value = ''
  } finally {
    convertLoading.value = false
  }
}

const copyToClipboard = () => {
  copyLoading.value = true
  // Use full result for copy (not truncated)
  const textToCopy = fullResult.value || result.value
  navigator.clipboard.writeText(textToCopy).then(() => {
    copyLoading.value = false
    showNotification('コピーしました')
  }).catch(() => {
    copyLoading.value = false
    showNotification('コピーに失敗しました', 'error')
  })
}

const downloadResult = () => {
  downloadLoading.value = true
  // Use full result for download (not truncated)
  const textToDownload = fullResult.value || result.value
  const blob = new Blob([textToDownload], { type: 'text/plain' })
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
  return `INSERT INTO \`${DEFAULT_TABLE_NAME}\` (\`id\`, \`name\`, \`age\`) VALUES (1, 'John', 25);\nINSERT INTO \`${DEFAULT_TABLE_NAME}\` (\`id\`, \`name\`, \`age\`) VALUES (2, 'Alice', 30);\n(変換結果がここに表示されます)`
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
        :placeholder="DEFAULT_TABLE_NAME"
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

    <div class="input-section">
      <input
        type="file"
        ref="fileInputRef"
        @change="handleFileUpload"
        style="display: none"
      />
      <div class="input-header">
        <h3>データ本体</h3>
        <div class="input-actions">
          <button
            class="btn btn-icon-small"
            @click="uploadFile"
            title="ファイルから読み込み"
          >
            <i class="mdi mdi-file-upload"></i>
          </button>
          <button
            class="btn btn-icon-small"
            @click="copyFieldToClipboard(displayDataBody, 'データ本体')"
            :disabled="!displayDataBody"
            title="コピー"
          >
            <i class="mdi mdi-content-copy"></i>
          </button>
          <button
            class="btn btn-icon-small"
            @click="uploadedFile ? clearUploadedFile() : store.clearDataBody()"
            :disabled="!displayDataBody"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
      </div>
      <textarea
        :value="displayDataBody"
        @input="!isDataBodyReadonly && (dataBody = ($event.target as HTMLTextAreaElement).value)"
        :readonly="isDataBodyReadonly"
        rows="8"
        placeholder="1,John,25&#10;2,Alice,30&#10;（CSV/TSV/固定長形式）"
      ></textarea>
      <div class="checkbox-container">
        <label>
          <input type="checkbox" v-model="useFirstRowAsHeader" />
          1行目をヘッダーとして使用
        </label>
      </div>
    </div>

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
      <div class="checkbox-container">
        <label>
          <input type="checkbox" v-model="useBacktick" />
          バッククォートを使用
        </label>
        <label>
          <input type="checkbox" v-model="forceAllString" />
          全て文字列
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
