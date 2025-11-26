<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useConverterStore } from '../stores/converter'
import { parseColumnLengths, parseColumnOptions, getDelimiter, convertFromFixed, tsvToFixed as convertTsvToFixed } from '../utils/converter'
import { parseDelimitedData, toCSV, toTSV } from '../utils/delimited'

const store = useConverterStore()
const { columnLengths, dataBody, columnTitles, columnOptions, delimiterType, outputFormat } = storeToRefs(store)

const result = ref('')
const conversionType = ref('')

const convertLoading = ref(false)
const copyLoading = ref(false)
const downloadLoading = ref(false)

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

const handleDelimitedInput = (lengths: number[], parsedData: string[][]) => {
  const delimiter = getDelimiter(dataBody.value, delimiterType.value)
  const inputType = delimiter === '\t' ? 'TSV' : 'CSV'
  
  if (outputFormat.value === 'fixed') {
    // TSV/CSV → 固定長
    conversionType.value = `${inputType} → 固定長`
    const options = columnOptions.value.trim() 
      ? parseColumnOptions(columnOptions.value)
      : lengths.map(() => ({ type: 'string' as const, padding: 'right' as const, padChar: ' ' }))
    result.value = convertTsvToFixed(parsedData, lengths, options)
  } else {
    // TSV/CSV → TSV/CSV (区切り文字変換)
    const outputType = outputFormat.value === 'csv' ? 'CSV' : 'TSV'
    conversionType.value = `${inputType} → ${outputType}`
    result.value = outputFormat.value === 'csv' ? toCSV(parsedData) : toTSV(parsedData)
  }
}

const handleFixedWidthInput = (lengths: number[]) => {
  // 固定長 → TSV/CSV/固定長
  if (outputFormat.value === 'fixed') {
    conversionType.value = '固定長 → 固定長'
  } else {
    const outputType = outputFormat.value === 'csv' ? 'CSV' : 'TSV'
    conversionType.value = `固定長 → ${outputType}`
  }
  result.value = convertFromFixed(dataBody.value, lengths, outputFormat.value)
}

const convert = () => {
  convertLoading.value = true
  try {
    const lengths = parseColumnLengths(columnLengths.value)
    if (lengths.length === 0) {
      throw new Error('カラム長が指定されていません')
    }
    if (!dataBody.value.trim()) {
      throw new Error('データが空です')
    }
    
    const parsedData = isDelimitedData(dataBody.value, lengths.length)
    if (parsedData) {
      handleDelimitedInput(lengths, parsedData)
    } else {
      handleFixedWidthInput(lengths)
    }
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
      <textarea v-model="dataBody" rows="8" placeholder="John      Tokyo     25&#10;Alice     NewYork   30&#10;（固定長形式）&#10;&#10;John,Tokyo,25&#10;Alice,NewYork,30&#10;（CSV/TSV形式）"></textarea>
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
