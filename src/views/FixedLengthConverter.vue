<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useConverterStore } from '../stores/converter'
import { parseColumnLengths, parseColumnOptions, getDelimiter, parseFixed, tsvToFixed as convertTsvToFixed } from '../utils/converter'
import { parseDelimitedData, parsePipe, toCSV, toTSV, toMarkdown, toHtmlTable } from '../utils/delimited'
import { useNotification } from '../composables/useNotification'
import { useTruncatedDisplay } from '../composables/useTruncatedDisplay'
import { useFileUpload } from '../composables/useFileUpload'
import { usePresetCache } from '../composables/usePresetCache'

const store = useConverterStore()
const { columnLengths, columnHeaders, columnOptions, delimiterType, outputFormat, forceAllString, useFirstRowAsHeader } = storeToRefs(store)

const conversionType = ref('')

const convertLoading = ref(false)
const copyLoading = ref(false)
const downloadLoading = ref(false)

// 結果の完全なデータを保持
const fullResult = ref('')

const { notificationMessage, notificationType, showNotificationFlag, showNotification } = useNotification()
const { displayResult } = useTruncatedDisplay(fullResult)

// プリセットキャッシュ機能
const {
  presetName,
  presets,
  saveCurrentAsPreset,
  loadPreset,
  deletePreset
} = usePresetCache()

const selectedPreset = ref('')
const deleteConfirming = ref(false)

const handleSavePreset = () => {
  const result = saveCurrentAsPreset()
  showNotification(result.message, result.success ? 'success' : 'error')
  if (result.success) {
    selectedPreset.value = presetName.value
  }
}

const handleLoadPreset = () => {
  if (!selectedPreset.value) {
    showNotification('読み込むプリセットを選択してください', 'error')
    return
  }
  const result = loadPreset(selectedPreset.value)
  showNotification(result.message, result.success ? 'success' : 'error')
}

const handleDeletePreset = () => {
  if (!selectedPreset.value) {
    showNotification('削除するプリセットを選択してください', 'error')
    return
  }

  // 2段階削除: 最初のクリックで確認状態、2回目で削除
  if (!deleteConfirming.value) {
    deleteConfirming.value = true
    setTimeout(() => {
      deleteConfirming.value = false
    }, 3000)
    return
  }

  const result = deletePreset(selectedPreset.value)
  showNotification(result.message, result.success ? 'success' : 'error')
  if (result.success) {
    selectedPreset.value = ''
  }
  deleteConfirming.value = false
}

const presetOptions = computed(() => {
  return Object.keys(presets.value)
})

// ファイルアップロード機能
const {
  fileInputRef: fileInput,
  uploadedFile,
  displayDataBody,
  uploadFile,
  handleFileUpload,
  clearUploadedFile,
} = useFileUpload({
  dataBody: toRef(store, 'dataBody'),
  delimiterType,
  onSuccess: showNotification,
  onError: (message) => showNotification(message, 'error'),
})

// テンプレート参照（vue-tscのnoUnusedLocals対策）
const fileInputRef = fileInput
void fileInputRef // テンプレートで使用されるが、スクリプト内では未使用

const hasDataBody = computed(() => !!(uploadedFile.value || store.dataBody))

type ParseResult = { data: string[][] } | { error: string }

const isDelimitedData = (data: string, expectedColumnCount: number): ParseResult | false => {
  // 固定長として明示的に指定されている場合は区切り文字データとして扱わない
  if (delimiterType.value === 'fixed') return false

  const trimmedData = data.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (trimmedData.length === 0) return false

  // 明示的な形式が指定されている場合、その区切り文字がデータに含まれているか検証
  if (delimiterType.value !== 'auto') {
    const expectedDelimiter = delimiterType.value === 'tsv' ? '\t' : delimiterType.value === 'csv' ? ',' : '|'
    const hasExpectedDelimiter = trimmedData.includes(expectedDelimiter)

    if (!hasExpectedDelimiter) {
      const formatName = delimiterType.value === 'tsv' ? 'TSV' : delimiterType.value === 'csv' ? 'CSV' : 'SQL/MD表'
      return { error: `入力形式が「${formatName}」に設定されていますが、${formatName === 'CSV' ? 'カンマ' : formatName === 'TSV' ? 'タブ' : 'パイプ'}が見つかりません。入力形式を見直してください。` }
    }
  }

  try {
    const delimiter = getDelimiter(trimmedData, delimiterType.value)
    let allRows: string[][]

    if (delimiter === '|') {
      allRows = parsePipe(trimmedData)
    } else {
      allRows = parseDelimitedData(trimmedData, delimiter)
    }

    const nonEmptyRows = allRows.filter(row => row.length > 1 || (row.length === 1 && row[0] !== ''))
    if (nonEmptyRows.length === 0) return false

    // 最初の5行をサンプリングしてチェック
    const sample = nonEmptyRows.slice(0, 5)

    // 行間でカラム数が一貫しているかチェック
    const firstColumnCount = sample[0].length
    if (!sample.every(row => row.length === firstColumnCount)) return false

    // 区切り文字が明確に存在する場合（複数カラム）は、カラム数が期待値と異なってもTSV/CSVとして扱う
    // ただし、1カラムしかない場合は固定長の可能性があるので期待値と一致する必要がある
    if (firstColumnCount === 1 && expectedColumnCount !== 1) return false

    // パース成功時は全行を返す
    return { data: allRows }
  } catch {
    // パースに失敗した場合は区切り文字データではないと判断
    return false
  }
}


const resultPlaceholder = computed(() => {
  if (outputFormat.value === 'fixed') {
    return 'John      Tokyo     25\nAlice     NewYork   30\n(変換結果がここに表示されます)'
  } else if (outputFormat.value === 'tsv') {
    return 'John\tTokyo\t25\nAlice\tNewYork\t30\n(変換結果がここに表示されます)'
  } else if (outputFormat.value === 'md-tbl') {
    return '| name | city    | age |\n| ---- | ------- | --- |\n| John | Tokyo   | 25  |\n| Alice| NewYork | 30  |\n(変換結果がここに表示されます)'
  } else if (outputFormat.value === 'html-tbl') {
    return '<table>\n  <tr>\n    <th>name</th>\n    <th>city</th>\n    <th>age</th>\n  </tr>\n  ...\n</table>\n(変換結果がここに表示されます)'
  } else {
    return 'John,Tokyo,25\nAlice,NewYork,30\n(変換結果がここに表示されます)'
  }
})

const handleDelimitedInput = (lengths: number[], parsedData: string[][], data: string) => {
  const delimiter = getDelimiter(data, delimiterType.value)
  const inputType = delimiter === '\t' ? 'TSV' : delimiter === '|' ? 'SQL/MD表' : 'CSV'

  // useFirstRowAsHeaderがtrueの場合、1行目をスキップ
  let dataRows = parsedData
  if (useFirstRowAsHeader.value) {
    dataRows = parsedData.slice(1)
  }

  if (outputFormat.value === 'fixed') {
    // TSV/CSV/SQL/MD表 → 固定長
    conversionType.value = `${inputType} → 固定長`
    const options = columnOptions.value.trim()
      ? parseColumnOptions(columnOptions.value)
      : lengths.map(() => ({ type: 'string' as const, padding: 'right' as const, padChar: ' ' }))
    fullResult.value = convertTsvToFixed(dataRows, lengths, options)
  } else if (outputFormat.value === 'md-tbl') {
    // TSV/CSV/SQL/MD表 → md-tbl
    conversionType.value = `${inputType} → md-tbl`
    fullResult.value = toMarkdown(dataRows)
  } else if (outputFormat.value === 'html-tbl') {
    // TSV/CSV/SQL/MD表 → html-tbl
    conversionType.value = `${inputType} → html-tbl`
    fullResult.value = toHtmlTable(dataRows)
  } else {
    // TSV/CSV/SQL/MD表 → TSV/CSV (区切り文字変換)
    const outputType = outputFormat.value === 'csv' ? 'CSV' : 'TSV'
    conversionType.value = `${inputType} → ${outputType}`
    fullResult.value = outputFormat.value === 'csv' ? toCSV(dataRows, forceAllString.value) : toTSV(dataRows, forceAllString.value)
  }
}

const handleFixedWidthInput = (lengths: number[], data: string) => {
  // 固定長 → TSV/CSV/md-tbl/html-tbl/固定長
  const parsedData = parseFixed(data, lengths)

  let processedData = parsedData
  if (useFirstRowAsHeader.value) {
    processedData = processedData.slice(1)
  }

  if (columnHeaders.value.trim() && !useFirstRowAsHeader.value) {
    const headerDelimiter = getDelimiter(columnHeaders.value, 'auto')
    const headers = headerDelimiter === '|'
      ? parsePipe(columnHeaders.value)[0]
      : parseDelimitedData(columnHeaders.value, headerDelimiter)[0]
    processedData = [headers, ...processedData]
  }

  if (outputFormat.value === 'fixed') {
    conversionType.value = '固定長 → 固定長'
    const options = columnOptions.value.trim()
      ? parseColumnOptions(columnOptions.value)
      : lengths.map(() => ({ type: 'string' as const, padding: 'right' as const, padChar: ' ' }))
    fullResult.value = convertTsvToFixed(processedData, lengths, options)
  } else if (outputFormat.value === 'md-tbl') {
    conversionType.value = '固定長 → md-tbl'
    fullResult.value = toMarkdown(processedData)
  } else if (outputFormat.value === 'html-tbl') {
    conversionType.value = '固定長 → html-tbl'
    fullResult.value = toHtmlTable(processedData)
  } else {
    const outputType = outputFormat.value === 'csv' ? 'CSV' : 'TSV'
    conversionType.value = `固定長 → ${outputType}`
    fullResult.value = outputFormat.value === 'csv' ? toCSV(processedData, forceAllString.value) : toTSV(processedData, forceAllString.value)
  }
}

const convert = async () => {
  convertLoading.value = true
  try {
    // データの取得（ファイルまたは手動入力）
    let data: string
    if (uploadedFile.value) {
      // ファイルの場合は変換時に全データを読み込む
      data = await uploadedFile.value.text()
    } else {
      // 手動入力の場合
      data = store.dataBody
    }

    if (!data.trim()) {
      throw new Error(`データが空です（uploadedFile: ${!!uploadedFile.value}, dataBody長: ${store.dataBody.length}, data長: ${data.length}）`)
    }

    // まず区切り文字データかどうか判定（カラム長は後で確認）
    const lengths = parseColumnLengths(columnLengths.value)
    const parseResult = isDelimitedData(data, lengths.length || 1)

    // エラーがある場合は表示して終了
    if (parseResult && 'error' in parseResult) {
      throw new Error(parseResult.error)
    }

    if (parseResult && 'data' in parseResult) {
      // 区切り文字データ（TSV/CSV/SQL表）の場合
      // 固定長への変換時のみカラム長が必要
      if (outputFormat.value === 'fixed') {
        if (lengths.length === 0) {
          throw new Error('固定長への変換にはカラム長が必要です')
        }
      }
      handleDelimitedInput(lengths, parseResult.data, data)
    } else {
      // 固定長データの場合は必ずカラム長が必要
      if (lengths.length === 0) {
        throw new Error('カラム長が指定されていません')
      }
      handleFixedWidthInput(lengths, data)
    }
  } catch (error) {
    fullResult.value = 'エラー: ' + (error as Error).message
  } finally {
    convertLoading.value = false
  }
}

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
  a.download = 'result.txt'
  a.click()
  URL.revokeObjectURL(url)
  setTimeout(() => {
    downloadLoading.value = false
    showNotification('ダウンロードしました（完全なデータ）')
  }, 300)
}

const copyFieldToClipboard = (text: string, fieldName: string) => {
  navigator.clipboard.writeText(text).then(() => {
    showNotification(`${fieldName}をコピーしました`)
  }).catch(() => {
    showNotification('コピーに失敗しました', 'error')
  })
}

const pasteFromClipboard = async (field: 'columnLengths' | 'dataBody' | 'columnHeaders' | 'columnOptions') => {
  try {
    const text = await navigator.clipboard.readText()
    if (field === 'columnLengths') {
      columnLengths.value = text
    } else if (field === 'dataBody') {
      clearUploadedFile()
      store.dataBody = text
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

const clearDataBody = () => {
  clearUploadedFile()
  store.clearDataBody()
}
</script>

<template>
  <div class="converter-container">
    <div class="header-row">
      <h2>固定長相互変換</h2>
    </div>

    <div class="preset-section">
      <div class="preset-input">
        <input
          type="text"
          v-model="presetName"
          placeholder="プリセット名"
          class="preset-name-input"
        />
        <select v-model="selectedPreset" class="preset-select">
          <option value="">選択...</option>
          <option v-for="name in presetOptions" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </div>
      <div class="preset-actions">
        <button class="btn btn-small" @click="handleSavePreset" title="現在の設定を保存">
          <i class="mdi mdi-content-save"></i>
          保存
        </button>
        <button class="btn btn-small" @click="handleLoadPreset" :disabled="!selectedPreset" title="選択したプリセットを読み込み">
          <i class="mdi mdi-folder-open"></i>
          読込
        </button>
        <button
          class="btn btn-small"
          :class="deleteConfirming ? 'btn-danger' : ''"
          @click="handleDeletePreset"
          :disabled="!selectedPreset"
          :title="deleteConfirming ? 'もう一度クリックして削除' : '選択したプリセットを削除'"
        >
          <i class="mdi" :class="deleteConfirming ? 'mdi-alert' : 'mdi-delete'"></i>
          <span v-if="deleteConfirming">?</span>
        </button>
      </div>
    </div>

    <div class="input-section">
      <div class="input-header">
        <div class="input-actions">
          <button 
            class="btn btn-icon-small" 
            @click="copyFieldToClipboard(columnLengths, 'カラム長')"
            :disabled="!columnLengths"
            title="コピー"
          >
            <i class="mdi mdi-content-copy"></i>
          </button>
          <button 
            class="btn btn-icon-small" 
            @click="pasteFromClipboard('columnLengths')"
            title="ペーストして置換"
          >
            <i class="mdi mdi-content-paste"></i>
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
        <h3>カラム長</h3>
      </div>
      <textarea v-model="columnLengths" rows="2" placeholder="10,20,15&#10;(CSV or TSV形式)"></textarea>
    </div>

    <div class="input-section">
      <div class="input-header">
        <div class="input-actions">
          <input
            type="file"
            ref="fileInputRef"
            @change="handleFileUpload"
            style="display: none"
          />
          <button
            class="btn btn-icon-small"
            @click="copyFieldToClipboard(displayDataBody, 'データ本体')"
            :disabled="!hasDataBody"
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
            @click="clearDataBody()"
            :disabled="!hasDataBody"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
          <button
            class="btn btn-icon-small"
            @click="uploadFile"
            title="ファイルから読み込み"
          >
            <i class="mdi mdi-file-upload"></i>
          </button>
        </div>
        <h3>データ本体</h3>
      </div>
      <textarea
        v-if="!uploadedFile"
        v-model="store.dataBody"
        rows="8"
        placeholder="John      Tokyo     25&#10;Alice     NewYork   30&#10;（固定長形式）&#10;&#10;John,Tokyo,25&#10;Alice,NewYork,30&#10;（CSV/TSV形式）"
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
        placeholder="ID,Name,Age&#10;(CSV or TSV形式)"
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
      <textarea v-model="columnOptions" rows="3" placeholder="string:right,string:right,number:left&#10;(CSV or TSV形式)"></textarea>
      <p class="field-description">形式: データ型:padding方向[:padding文字]</p>
      <p class="field-description field-note">※省略時は全てstring型、右パディング、半角空白</p>
      <p class="field-description field-note">※padding文字省略時: numberは'0'、stringは半角空白</p>
      <div class="checkbox-container">
        <label>
          <input type="checkbox" v-model="forceAllString" />
          全て文字列
        </label>
      </div>
    </div>

    <div class="conversion-row">
      <button
        class="btn btn-primary"
        @click="convert"
        :disabled="convertLoading"
        :class="{ loading: convertLoading }"
      >
        <i class="mdi mdi-auto-fix"></i>
        <span>変換</span>
      </button>

      <div class="format-selectors">
        <div class="format-group">
          <span class="format-label">入力:</span>
          <label class="format-option">
            <input type="radio" value="auto" v-model="delimiterType" />
            自動
          </label>
          <label class="format-option">
            <input type="radio" value="tsv" v-model="delimiterType" />
            TSV
          </label>
          <label class="format-option">
            <input type="radio" value="csv" v-model="delimiterType" />
            CSV
          </label>
          <label class="format-option">
            <input type="radio" value="pipe" v-model="delimiterType" />
            SQL/MD
          </label>
          <label class="format-option">
            <input type="radio" value="fixed" v-model="delimiterType" />
            固定長
          </label>
        </div>

        <span class="format-arrow"><i class="mdi mdi-arrow-right"></i></span>

        <div class="format-group">
          <span class="format-label">出力:</span>
          <label class="format-option">
            <input type="radio" value="fixed" v-model="outputFormat" />
            固定長
          </label>
          <label class="format-option">
            <input type="radio" value="tsv" v-model="outputFormat" />
            TSV
          </label>
          <label class="format-option">
            <input type="radio" value="csv" v-model="outputFormat" />
            CSV
          </label>
          <label class="format-option">
            <input type="radio" value="md-tbl" v-model="outputFormat" />
            md-tbl
          </label>
          <label class="format-option">
            <input type="radio" value="html-tbl" v-model="outputFormat" />
            html-tbl
          </label>
        </div>
      </div>
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
      <textarea :value="displayResult" rows="10" readonly :placeholder="resultPlaceholder"></textarea>
    </div>

    <!-- 通知メッセージ -->
    <div v-if="showNotificationFlag" :class="['notification', notificationType]">
      {{ notificationMessage }}
    </div>
  </div>
</template>
