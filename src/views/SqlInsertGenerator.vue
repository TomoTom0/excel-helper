<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSqlInsertStore } from '../stores/sqlInsert'
import { getDelimiter, parseColumnLengths, convertFromFixed } from '../utils/converter'
import { parseDelimitedData, parsePipe, parseFrame } from '../utils/delimited'
import { generateInsertStatements, parseColumnOptions } from '../utils/sqlInsert'
import NotificationToast from '../components/NotificationToast.vue'
import DelimiterSelector from '../components/DelimiterSelector.vue'
import { useFileUpload } from '../composables/useFileUpload'
import { useNotification } from '../composables/useNotification'
import { useTruncatedDisplay } from '../composables/useTruncatedDisplay'

const DEFAULT_TABLE_NAME = 'YOUR_TABLE_NAME'
const AUTO_REGEN_LIMIT = 100000

const store = useSqlInsertStore()
const { tableName, dataBody, columnHeaders, columnOptions, useFirstRowAsHeader, delimiterType, columnLengths, insertFormat, useBacktick, forceAllString } = storeToRefs(store)

const fullResult = ref('')
const conversionType = ref('')

const convertLoading = ref(false)
const copyLoading = ref(false)
const downloadLoading = ref(false)

const { notificationMessage, notificationType, showNotificationFlag, showNotification } = useNotification()
const { displayResult } = useTruncatedDisplay(fullResult)

// ファイルアップロードコンポーザブルを使用
const {
  fileInputRef: fileInput,
  uploadedFile,
  displayDataBody,
  uploadFile,
  handleFileUpload,
  clearUploadedFile,
} = useFileUpload({
  dataBody,
  delimiterType,
  onSuccess: showNotification,
  onError: (message) => showNotification(message, 'error'),
})

// テンプレート参照（vue-tscのnoUnusedLocals対策）
const fileInputRef = fileInput
void fileInputRef // テンプレートで使用されるが、スクリプト内では未使用

// パース済みデータ（INSERT形式切替時の再生成用）
interface ParsedState {
  columns: string[]
  dataRows: string[][]
  columnTypes: ReturnType<typeof parseColumnOptions> | undefined
  finalTableName: string
  inputType: string
}
const parsedState = ref<ParsedState | null>(null)

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
    const lengths = parseColumnLengths(columnLengths.value, delimiterType.value)
    if (lengths.length === 0) return false

    // 固定長→TSVに変換してからパース
    const tsvData = convertFromFixed(trimmedData, lengths, 'tsv')
    return parseDelimitedData(tsvData, '\t')
  }

  // frame-tableとして明示的に指定されている場合
  if (delimiterType.value === 'frame') {
    return parseFrame(trimmedData)
  }

  // TSV/CSV/SQL表としてパース
  try {
    const delimiter = getDelimiter(trimmedData, delimiterType.value)
    if (delimiter === '|') {
      return parsePipe(trimmedData)
    }
    if (delimiter === '│') {
      return parseFrame(trimmedData)
    }
    return parseDelimitedData(trimmedData, delimiter)
  } catch {
    return false
  }
}

const buildInputType = (data: string): string => {
  const delimiter = delimiterType.value === 'fixed' ? null : getDelimiter(data, delimiterType.value)
  return delimiterType.value === 'fixed' ? '固定長' :
         delimiterType.value === 'frame' ? 'Frame表' :
         delimiter === '\t' ? 'TSV' :
         delimiter === '|' ? 'SQL/MD表' :
         delimiter === '│' ? 'Frame表' : 'CSV'
}

const generateFromState = () => {
  if (!parsedState.value) return
  const { columns, dataRows, columnTypes, finalTableName, inputType } = parsedState.value
  const outputType = insertFormat.value === 'single' ? '単一行INSERT' : '複数行INSERT'
  conversionType.value = `${inputType} → SQL INSERT (${outputType})`

  fullResult.value = generateInsertStatements(
    finalTableName,
    columns,
    dataRows,
    insertFormat.value,
    columnTypes,
    useBacktick.value,
    forceAllString.value
  )
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
    } else {
      // 別途入力されたヘッダーを使用
      if (!columnHeaders.value.trim()) {
        throw new Error('ヘッダーが入力されていません')
      }
      const delimiter = getDelimiter(columnHeaders.value, 'auto')
      let headerData: string[][]
      if (delimiter === '|') {
        headerData = parsePipe(columnHeaders.value)
      } else if (delimiter === '│') {
        headerData = parseFrame(columnHeaders.value)
      } else {
        headerData = parseDelimitedData(columnHeaders.value, delimiter)
      }
      columns = headerData[0]
      dataRows = parsedData
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
    const inputType = buildInputType(data)

    // パース済み状態を保存
    parsedState.value = { columns, dataRows, columnTypes, finalTableName, inputType }

    generateFromState()
  } catch (error) {
    fullResult.value = 'エラー: ' + (error as Error).message
    conversionType.value = ''
    parsedState.value = null
  } finally {
    convertLoading.value = false
  }
}

// INSERT形式切替時に自動再生成（データ量が大きくない場合）
watch(insertFormat, () => {
  if (!parsedState.value) return
  if (fullResult.value.length <= AUTO_REGEN_LIMIT) {
    generateFromState()
  }
})

const copyToClipboard = () => {
  copyLoading.value = true
  navigator.clipboard.writeText(fullResult.value).then(() => {
    copyLoading.value = false
    showNotification('コピーしました（完全なデータ）')
  }).catch(() => {
    copyLoading.value = false
    showNotification('コピーに失敗しました', 'error')
  })
}

const downloadResult = () => {
  downloadLoading.value = true
  const blob = new Blob([fullResult.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'insert.sql'
  a.click()
  URL.revokeObjectURL(url)
  setTimeout(() => {
    downloadLoading.value = false
    showNotification('ダウンロードしました（完全なデータ）')
  }, 300)
}

const clearInputData = () => {
  clearUploadedFile()
  store.clearDataBody()
}

const pasteFromClipboard = async (field: 'tableName' | 'columnLengths' | 'dataBody' | 'columnHeaders' | 'columnOptions') => {
  try {
    const text = await navigator.clipboard.readText()
    if (field === 'tableName') {
      tableName.value = text
    } else if (field === 'columnLengths') {
      columnLengths.value = text
    } else if (field === 'dataBody') {
      clearUploadedFile()
      dataBody.value = text
    } else if (field === 'columnHeaders') {
      columnHeaders.value = text
    } else if (field === 'columnOptions') {
      columnOptions.value = text
    }
    showNotification('ペーストしました')
  } catch {
    showNotification('ペーストに失敗しました', 'error')
  }
}

const resultPlaceholder = computed(() => {
  return `INSERT INTO \`${DEFAULT_TABLE_NAME}\` (\`id\`, \`name\`, \`age\`) VALUES (1, 'John', 25);\nINSERT INTO \`${DEFAULT_TABLE_NAME}\` (\`id\`, \`name\`, \`age\`) VALUES (2, 'Alice', 30);\n(変換結果がここに表示されます)`
})
</script>

<template>
  <div class="converter-container">
    <div class="header-row">
      <h2>SQL INSERT文生成</h2>
      <DelimiterSelector
        v-model="delimiterType"
        label="入力形式:"
      />
    </div>

    <div class="input-section input-section-inline">
      <div class="input-header">
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
            @click="pasteFromClipboard('tableName')"
            title="ペーストして置換"
          >
            <i class="mdi mdi-content-paste"></i>
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
        <h3>テーブル名<span class="optional">（省略可）</span></h3>
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
            @click="pasteFromClipboard('columnLengths')"
            :disabled="delimiterType !== 'fixed'"
            title="ペーストして置換"
          >
            <i class="mdi mdi-content-paste"></i>
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
        <h3>カラム長<span class="optional">（固定長の場合のみ）</span></h3>
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
            @click="pasteFromClipboard('dataBody')"
            title="ペーストして置換"
          >
            <i class="mdi mdi-content-paste"></i>
          </button>
          <button
            class="btn btn-icon-small"
            @click="clearInputData"
            :disabled="!displayDataBody"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
        <h3>データ本体</h3>
      </div>
      <textarea
        v-if="!uploadedFile"
        v-model="dataBody"
        rows="8"
        placeholder="1,John,25&#10;2,Alice,30&#10;（CSV/TSV/固定長形式）"
      ></textarea>
      <textarea
        v-else
        :value="displayDataBody"
        readonly
        rows="8"
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
            @click="pasteFromClipboard('columnHeaders')"
            :disabled="useFirstRowAsHeader"
            title="ペーストして置換"
          >
            <i class="mdi mdi-content-paste"></i>
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
        <h3>カラムヘッダー</h3>
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
            @click="pasteFromClipboard('columnOptions')"
            title="ペーストして置換"
          >
            <i class="mdi mdi-content-paste"></i>
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
        <h3>カラムオプション<span class="optional">（省略可）</span></h3>
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
        <div class="input-actions">
          <button
            class="btn btn-icon-small"
            @click="copyToClipboard"
            :disabled="copyLoading || !fullResult"
            :class="{ loading: copyLoading }"
            title="コピー（完全なデータ）"
          >
            <i :class="copyLoading ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-content-copy'"></i>
          </button>
          <button
            class="btn btn-icon-small"
            @click="downloadResult"
            :disabled="downloadLoading || !fullResult"
            :class="{ loading: downloadLoading }"
            title="ダウンロード（完全なデータ）"
          >
            <i :class="downloadLoading ? 'mdi mdi-loading mdi-spin' : 'mdi mdi-download'"></i>
          </button>
        </div>
        <h3>実行結果<span v-if="conversionType" class="conversion-type">（{{ conversionType }}）</span></h3>
      </div>
      <div class="result-textarea-wrapper">
        <textarea :value="displayResult" rows="10" readonly :placeholder="resultPlaceholder"></textarea>
        <div class="result-textarea-overlay">
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

<style scoped>
.result-textarea-wrapper {
  position: relative;
}

.result-textarea-wrapper textarea {
  width: 100%;
  min-height: 200px;
  padding: 10px;
  padding-bottom: 35px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
  background-color: var(--result-bg);
  color: var(--text-primary);
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
  box-sizing: border-box;
}

.result-textarea-overlay {
  position: absolute;
  bottom: 8px;
  right: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 3px 10px;
  background-color: var(--bg-tertiary);
  border-radius: 4px;
  border: 1px solid var(--border-color-light);
  font-size: 12px;
  color: var(--btn-icon-text);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.result-textarea-overlay label {
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
}

.result-textarea-overlay label:first-child {
  font-weight: 500;
  cursor: default;
}

.result-textarea-overlay input[type="radio"] {
  cursor: pointer;
  margin-right: 2px;
  accent-color: #667eea;
}
</style>
