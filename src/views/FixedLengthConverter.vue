<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useConverterStore } from '../stores/converter'
import { parseColumnLengths, parseColumnOptions, getDelimiter, convertFromFixed, tsvToFixed as convertTsvToFixed } from '../utils/converter'
import { parseDelimitedData, toCSV, toTSV } from '../utils/delimited'

const store = useConverterStore()
const { columnLengths, dataBody, columnTitles, columnOptions, delimiterType, outputFormat, forceAllString } = storeToRefs(store)

const conversionType = ref('')

const convertLoading = ref(false)
const copyLoading = ref(false)
const downloadLoading = ref(false)

// 結果の完全なデータを保持
const fullResult = ref('')

// データ本体の表示用（ファイルプレビューまたは手動入力）
const displayDataBody = computed(() => {
  // ファイルがアップロードされている場合はプレビューを表示
  if (uploadedFile.value && filePreview.value) {
    return filePreview.value
  }
  // 手動入力の場合はそのまま表示
  return dataBody.value
})

// データ本体が読み取り専用かどうか（ファイルアップロード時）
const isDataBodyReadonly = computed(() => uploadedFile.value !== null)

const isDelimitedData = (data: string, expectedColumnCount: number): string[][] | false => {
  // 固定長として明示的に指定されている場合は区切り文字データとして扱わない
  if (delimiterType.value === 'fixed') return false
  
  const trimmedData = data.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (trimmedData.length === 0) return false

  try {
    const delimiter = getDelimiter(trimmedData, delimiterType.value)
    const allRows = parseDelimitedData(trimmedData, delimiter)
    
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
    return allRows
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
  } else {
    return 'John,Tokyo,25\nAlice,NewYork,30\n(変換結果がここに表示されます)'
  }
})

const handleDelimitedInput = (lengths: number[], parsedData: string[][], data: string) => {
  const delimiter = getDelimiter(data, delimiterType.value)
  const inputType = delimiter === '\t' ? 'TSV' : 'CSV'

  if (outputFormat.value === 'fixed') {
    // TSV/CSV → 固定長
    conversionType.value = `${inputType} → 固定長`
    const options = columnOptions.value.trim()
      ? parseColumnOptions(columnOptions.value)
      : lengths.map(() => ({ type: 'string' as const, padding: 'right' as const, padChar: ' ' }))
    fullResult.value = convertTsvToFixed(parsedData, lengths, options)
  } else {
    // TSV/CSV → TSV/CSV (区切り文字変換)
    const outputType = outputFormat.value === 'csv' ? 'CSV' : 'TSV'
    conversionType.value = `${inputType} → ${outputType}`
    fullResult.value = outputFormat.value === 'csv' ? toCSV(parsedData, forceAllString.value) : toTSV(parsedData, forceAllString.value)
  }
}

const handleFixedWidthInput = (lengths: number[], data: string) => {
  // 固定長 → TSV/CSV/固定長
  if (outputFormat.value === 'fixed') {
    conversionType.value = '固定長 → 固定長'
  } else {
    const outputType = outputFormat.value === 'csv' ? 'CSV' : 'TSV'
    conversionType.value = `固定長 → ${outputType}`
  }
  fullResult.value = convertFromFixed(data, lengths, outputFormat.value, forceAllString.value)
}

const convert = async () => {
  convertLoading.value = true
  try {
    const lengths = parseColumnLengths(columnLengths.value)
    if (lengths.length === 0) {
      throw new Error('カラム長が指定されていません')
    }

    // データの取得（ファイルまたは手動入力）
    let data: string
    if (uploadedFile.value) {
      // ファイルの場合は変換時に全データを読み込む
      data = await uploadedFile.value.text()
    } else {
      // 手動入力の場合
      data = dataBody.value
    }

    if (!data.trim()) {
      throw new Error('データが空です')
    }

    const parsedData = isDelimitedData(data, lengths.length)
    if (parsedData) {
      handleDelimitedInput(lengths, parsedData, data)
    } else {
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

const clearDataBody = () => {
  uploadedFile.value = null
  filePreview.value = ''
  store.clearDataBody()
}

const hasDataBody = computed(() => {
  return !!(uploadedFile.value || dataBody.value)
})

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const filePreview = ref('')

const uploadFile = () => {
  fileInputRef.value?.click()
}

/**
 * ファイルの拡張子に基づいて入力形式を判定する
 */
const detectDelimiterTypeFromFilename = (filename: string): 'csv' | 'tsv' | 'fixed' | 'auto' => {
  const ext = filename.toLowerCase().split('.').pop()
  if (!ext) return 'auto'

  if (ext === 'csv') return 'csv'
  if (ext === 'tsv') return 'tsv'
  if (ext === 'fix') return 'fixed'

  return 'auto'
}

/**
 * テキストファイルかどうかを判定する（バイナリチェック）
 */
const isTextFile = (text: string): boolean => {
  // NULL文字（0x00）が含まれていればバイナリと判断
  if (text.includes('\0')) return false

  // 制御文字（タブ、改行、キャリッジリターン以外）の割合をチェック
  let controlCharCount = 0
  const totalLength = Math.min(text.length, 8000) // 最初の8000文字をサンプル

  for (let i = 0; i < totalLength; i++) {
    const code = text.charCodeAt(i)
    // 0x00-0x08, 0x0B-0x0C, 0x0E-0x1F は制御文字（0x09=TAB, 0x0A=LF, 0x0D=CR は除外）
    if ((code >= 0x00 && code <= 0x08) || (code >= 0x0B && code <= 0x0C) || (code >= 0x0E && code <= 0x1F)) {
      controlCharCount++
    }
  }

  // 制御文字が10%以上含まれていればバイナリと判断
  return controlCharCount / totalLength < 0.1
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    // 冒頭の一部だけ読み込んでバイナリチェックと拡張子判定
    const previewSize = 8000 // バイナリチェック用
    const blob = file.slice(0, previewSize)
    const previewText = await blob.text()

    // バイナリチェック
    if (!isTextFile(previewText)) {
      showNotification('バイナリファイルは読み込めません', 'error')
      target.value = ''
      return
    }

    // ファイル名から入力形式を判定
    const detectedType = detectDelimiterTypeFromFilename(file.name)
    delimiterType.value = detectedType

    // ファイルオブジェクトを保持（実際の読み込みは変換時）
    uploadedFile.value = file

    // プレビュー用に冒頭1000文字を表示
    const displaySize = 1000
    const displayBlob = file.slice(0, displaySize)
    const displayText = await displayBlob.text()

    const fileSizeKB = (file.size / 1024).toFixed(1)
    const previewMessage = file.size > displaySize
      ? `\n\n... 以降省略（ファイルサイズ: ${fileSizeKB} KB）\n※変換時に全データを読み込みます`
      : ''

    filePreview.value = displayText + previewMessage
    dataBody.value = '' // 手動入力をクリア

    // 判定結果を通知
    const typeLabel = {
      csv: 'CSV形式',
      tsv: 'TSV形式',
      fixed: '固定長形式',
      auto: '自動判別'
    }[detectedType]

    showNotification(`ファイルを読み込みました（${typeLabel}、${fileSizeKB} KB）`)
  } catch (error) {
    showNotification('ファイルの読み込みに失敗しました', 'error')
  } finally {
    // 同じファイルを再度選択できるようにリセット
    target.value = ''
  }
}

// 表示用の制限された結果
const displayResult = computed(() => {
  const maxDisplayLength = 10000 // 最大表示文字数
  if (fullResult.value.length <= maxDisplayLength) {
    return fullResult.value
  }

  const lines = fullResult.value.split('\n')
  const totalLines = lines.length
  const totalChars = fullResult.value.length

  let displayText = ''
  let charCount = 0
  let displayLines = 0

  for (const line of lines) {
    if (charCount + line.length + 1 > maxDisplayLength) break
    displayText += line + '\n'
    charCount += line.length + 1
    displayLines++
  }

  displayText += `\n... 以降省略（全体: ${totalLines}行、${totalChars.toLocaleString()}文字）\n`
  displayText += '※ダウンロードボタンで完全なデータを取得できます'

  return displayText
})
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
        <label>
          <input type="radio" value="fixed" v-model="delimiterType" />
          固定長
        </label>
      </div>
    </div>

    <div class="input-section">
      <div class="input-header">
        <h3>カラム長</h3>
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
            @click="store.clearColumnLengths()"
            :disabled="!columnLengths"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
      </div>
      <textarea v-model="columnLengths" rows="2" placeholder="10,20,15&#10;(CSV or TSV形式)"></textarea>
    </div>

    <div class="input-section">
      <div class="input-header">
        <h3>データ本体</h3>
        <div class="input-actions">
          <input
            type="file"
            ref="fileInputRef"
            @change="handleFileUpload"
            style="display: none"
          />
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
            :disabled="!hasDataBody"
            title="コピー"
          >
            <i class="mdi mdi-content-copy"></i>
          </button>
          <button
            class="btn btn-icon-small"
            @click="clearDataBody()"
            :disabled="!hasDataBody"
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
        placeholder="John      Tokyo     25&#10;Alice     NewYork   30&#10;（固定長形式）&#10;&#10;John,Tokyo,25&#10;Alice,NewYork,30&#10;（CSV/TSV形式）"
      ></textarea>
    </div>

    <div class="input-section">
      <div class="input-header">
        <h3>カラムタイトル<span class="optional">（省略可）</span></h3>
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
      <textarea v-model="columnTitles" rows="2" placeholder="ID,Name,Age&#10;(CSV or TSV形式)"></textarea>
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
        <h3>実行結果<span v-if="conversionType" class="conversion-type">（{{ conversionType }}）</span></h3>
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
      </div>
      <textarea :value="displayResult" rows="10" readonly :placeholder="resultPlaceholder"></textarea>
      <div class="result-actions">
        <div class="output-format-selector">
          <label>出力形式:</label>
          <label>
            <input type="radio" value="fixed" v-model="outputFormat" />
            固定長
          </label>
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
