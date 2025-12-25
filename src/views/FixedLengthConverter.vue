<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useConverterStore } from '../stores/converter'
import { parseColumnLengths, parseColumnOptions, getDelimiter, convertFromFixed, tsvToFixed as convertTsvToFixed } from '../utils/converter'
import { parseDelimitedData, parsePipe, toCSV, toTSV } from '../utils/delimited'
import { useNotification } from '../composables/useNotification'
import { useTruncatedDisplay } from '../composables/useTruncatedDisplay'

const store = useConverterStore()
const { columnLengths, columnTitles, columnOptions, delimiterType, outputFormat, forceAllString } = storeToRefs(store)

const conversionType = ref('')

const convertLoading = ref(false)
const copyLoading = ref(false)
const downloadLoading = ref(false)

// 結果の完全なデータを保持
const fullResult = ref('')

const { notificationMessage, notificationType, showNotificationFlag, showNotification } = useNotification()
const { displayResult } = useTruncatedDisplay(fullResult)

// ファイルアップロードコンポーザブルを使用
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const filePreview = ref('')

const uploadFile = () => {
  fileInputRef.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  uploadedFile.value = file
  const text = await file.text()
  filePreview.value = text.slice(0, 1000) + (file.size > 1000 ? '\n\n... (省略)' : '')
  store.dataBody = ''
  showNotification('ファイルを読み込みました')
}

const clearUploadedFile = () => {
  uploadedFile.value = null
  filePreview.value = ''
}

const displayDataBody = computed(() => uploadedFile.value ? filePreview.value : store.dataBody)
const hasDataBody = computed(() => !!(uploadedFile.value || store.dataBody))

const isDelimitedData = (data: string, expectedColumnCount: number): string[][] | false => {
  // 固定長として明示的に指定されている場合は区切り文字データとして扱わない
  if (delimiterType.value === 'fixed') return false
  
  const trimmedData = data.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (trimmedData.length === 0) return false

  try {
    const delimiter = getDelimiter(trimmedData, delimiterType.value)
    console.log('detectDelimiter結果:', { delimiterType: delimiterType.value, detectedDelimiter: delimiter })
    let allRows: string[][]
    
    if (delimiter === '|') {
      allRows = parsePipe(trimmedData)
    } else {
      allRows = parseDelimitedData(trimmedData, delimiter)
    }
    
    console.log('パース結果:', { rowCount: allRows.length, firstRow: allRows[0] })
    
    const nonEmptyRows = allRows.filter(row => row.length > 1 || (row.length === 1 && row[0] !== ''))
    if (nonEmptyRows.length === 0) return false

    // 最初の5行をサンプリングしてチェック
    const sample = nonEmptyRows.slice(0, 5)
    
    // 行間でカラム数が一貫しているかチェック
    const firstColumnCount = sample[0].length
    const columnCounts = sample.map(row => row.length)
    console.log('カラム数チェック:', { firstColumnCount, columnCounts, isConsistent: sample.every(row => row.length === firstColumnCount) })
    if (!sample.every(row => row.length === firstColumnCount)) return false
    
    // 区切り文字が明確に存在する場合（複数カラム）は、カラム数が期待値と異なってもTSV/CSVとして扱う
    // ただし、1カラムしかない場合は固定長の可能性があるので期待値と一致する必要がある
    if (firstColumnCount === 1 && expectedColumnCount !== 1) return false
    
    console.log('isDelimitedData: true を返します')
    // パース成功時は全行を返す
    return allRows
  } catch (e) {
    // パースに失敗した場合は区切り文字データではないと判断
    console.log('isDelimitedData: パース失敗', e)
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
  const inputType = delimiter === '\t' ? 'TSV' : delimiter === '|' ? 'パイプ' : 'CSV'

  if (outputFormat.value === 'fixed') {
    // TSV/CSV/パイプ → 固定長
    conversionType.value = `${inputType} → 固定長`
    const options = columnOptions.value.trim()
      ? parseColumnOptions(columnOptions.value)
      : lengths.map(() => ({ type: 'string' as const, padding: 'right' as const, padChar: ' ' }))
    fullResult.value = convertTsvToFixed(parsedData, lengths, options)
  } else {
    // TSV/CSV/パイプ → TSV/CSV (区切り文字変換)
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
    console.log('convert開始:', {
      uploadedFile: !!uploadedFile.value,
      dataBodyLength: store.dataBody.length,
      displayDataBodyLength: displayDataBody.value.length
    })
    
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
    const parsedData = isDelimitedData(data, lengths.length || 1)
    
    if (parsedData) {
      // 区切り文字データ（TSV/CSV/パイプ）の場合
      // 固定長への変換時のみカラム長が必要
      if (outputFormat.value === 'fixed') {
        if (lengths.length === 0) {
          throw new Error('固定長への変換にはカラム長が必要です')
        }
      }
      handleDelimitedInput(lengths, parsedData, data)
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

const pasteFromClipboard = async (field: 'columnLengths' | 'dataBody' | 'columnTitles' | 'columnOptions') => {
  try {
    const text = await navigator.clipboard.readText()
    if (field === 'columnLengths') {
      columnLengths.value = text
    } else if (field === 'dataBody') {
      clearUploadedFile()
      store.dataBody = text
    } else if (field === 'columnTitles') {
      columnTitles.value = text
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
          <input type="radio" value="pipe" v-model="delimiterType" />
          パイプ
        </label>
        <label>
          <input type="radio" value="fixed" v-model="delimiterType" />
          固定長
        </label>
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
    </div>

    <div class="input-section">
      <div class="input-header">
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
            @click="pasteFromClipboard('columnTitles')"
            title="ペーストして置換"
          >
            <i class="mdi mdi-content-paste"></i>
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
        <h3>カラムタイトル<span class="optional">（省略可）</span></h3>
      </div>
      <textarea v-model="columnTitles" rows="2" placeholder="ID,Name,Age&#10;(CSV or TSV形式)"></textarea>
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
