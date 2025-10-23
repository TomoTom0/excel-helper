<script setup lang="ts">
import { ref } from 'vue'
import { parseColumnLengths, parseColumnOptions, fixedToTsv as convertFixedToTsv, tsvToFixed as convertTsvToFixed, type DelimiterType } from '../utils/converter'

const columnLengths = ref('')
const dataBody = ref('')
const columnTitles = ref('')
const columnOptions = ref('')
const delimiterType = ref<DelimiterType>('auto')
const result = ref('')

const fixedToTsv = () => {
  try {
    const lengths = parseColumnLengths(columnLengths.value)
    const outputType = delimiterType.value === 'auto' ? 'tsv' : delimiterType.value
    result.value = convertFixedToTsv(dataBody.value, lengths, outputType)
  } catch (error) {
    result.value = 'エラー: ' + (error as Error).message
  }
}

const tsvToFixed = () => {
  try {
    const lengths = parseColumnLengths(columnLengths.value)
    const options = columnOptions.value.trim() 
      ? parseColumnOptions(columnOptions.value)
      : lengths.map(() => ({ type: 'string' as const, padding: 'right' as const, padChar: ' ' }))
    result.value = convertTsvToFixed(dataBody.value, lengths, options, delimiterType.value)
  } catch (error) {
    result.value = 'エラー: ' + (error as Error).message
  }
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(result.value).then(() => {
    alert('コピーしました')
  })
}

const downloadResult = () => {
  const blob = new Blob([result.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'result.txt'
  a.click()
  URL.revokeObjectURL(url)
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
      <h3>カラムごとの長さ</h3>
      <textarea v-model="columnLengths" rows="2"></textarea>
      <p>例: 10,20,15 (カンマ区切り)</p>
    </div>

    <div class="input-section">
      <h3>データ本体</h3>
      <textarea v-model="dataBody" rows="8"></textarea>
      <p>固定長形式またはTSV形式のデータを入力</p>
    </div>

    <div class="input-section">
      <h3>カラムタイトル（省略可）</h3>
      <textarea v-model="columnTitles" rows="2"></textarea>
      <p>例: ID,Name,Age (カンマ区切り)</p>
    </div>

    <div class="input-section">
      <h3>カラムごとのオプション（省略可）</h3>
      <textarea v-model="columnOptions" rows="3"></textarea>
      <p>例: string:right,string:right,number:left</p>
      <p>形式: データ型:padding方向[:padding文字]</p>
      <p>※省略時は全てstring型、右パディング、半角空白</p>
      <p>※padding文字省略時: numberは'0'、stringは半角空白</p>
    </div>

    <div class="button-group">
      <button class="btn btn-primary" @click="fixedToTsv">固定長 → TSV/CSV</button>
      <button class="btn btn-secondary" @click="tsvToFixed">TSV/CSV → 固定長</button>
    </div>

    <div class="result-section">
      <h3>実行結果</h3>
      <textarea v-model="result" rows="10" readonly></textarea>
      <div class="result-actions">
        <button class="btn btn-success" @click="copyToClipboard">コピー</button>
        <button class="btn btn-success" @click="downloadResult">ダウンロード</button>
      </div>
    </div>
  </div>
</template>
