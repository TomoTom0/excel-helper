<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { storeToRefs } from 'pinia'
import { transpose, flipVertical, flipHorizontal } from '../utils/tableTransform'
import { parseCSV, parseTSV, parsePipe, parseFrame, parseHtmlTable, toCSV, toTSV, toPipe, toMarkdown, toHtmlTable, toFrame } from '../utils/delimited'
import { detectDelimiter } from '../utils/converter'
import { useTableTransformStore } from '../stores/tableTransform'
import { useNotification } from '../composables/useNotification'
import { useTruncatedDisplay } from '../composables/useTruncatedDisplay'
import { useFileUpload } from '../composables/useFileUpload'
import NotificationToast from '../components/NotificationToast.vue'
import DelimiterSelector from '../components/DelimiterSelector.vue'
import type { OutputFormat, DelimiterType } from '../utils/converter'
import type { TransformType } from '../stores/tableTransform'

const store = useTableTransformStore()
const { inputText, inputFormat, outputFormat, transformTypes } = storeToRefs(store)

const fullResult = ref('')
const conversionType = ref('')
const convertLoading = ref(false)
const copyLoading = ref(false)
const downloadLoading = ref(false)

const { notificationMessage, notificationType, showNotificationFlag, showNotification } = useNotification()
const { displayResult } = useTruncatedDisplay(fullResult)

const {
  fileInputRef: fileInput,
  uploadedFile,
  displayDataBody,
  uploadFile,
  handleFileUpload,
  clearUploadedFile,
} = useFileUpload({
  dataBody: toRef(store, 'inputText'),
  delimiterType: toRef(store, 'inputFormat') as any,
  onSuccess: showNotification,
  onError: (message) => showNotification(message, 'error'),
})

const fileInputRef = fileInput
void fileInputRef

const hasInputText = computed(() => !!(uploadedFile.value || inputText.value))

const parseInput = (text: string, format: DelimiterType): string[][] => {
  if (format === 'html') return parseHtmlTable(text)

  if (format === 'auto') {
    const delimiter = detectDelimiter(text)
    if (delimiter === '\t') return parseTSV(text)
    if (delimiter === ',') return parseCSV(text)
    if (delimiter === '|') return parsePipe(text)
    if (delimiter === '│') return parseFrame(text)
    return parseTSV(text)
  }

  if (format === 'tsv') return parseTSV(text)
  if (format === 'csv') return parseCSV(text)
  if (format === 'sql') return parsePipe(text)
  if (format === 'md') return parsePipe(text)
  if (format === 'frame') return parseFrame(text)
  return parseTSV(text)
}

const formatOutput = (data: string[][], format: OutputFormat): string => {
  if (format === 'csv') return toCSV(data)
  if (format === 'tsv') return toTSV(data)
  if (format === 'sql') return toPipe(data)
  if (format === 'md') return toMarkdown(data)
  if (format === 'html') return toHtmlTable(data)
  if (format === 'frame') return toFrame(data)
  return toTSV(data)
}

const transformLabels: Record<TransformType, string> = {
  transpose: '縦横変換（転置）',
  flipVertical: '上下反転',
  flipHorizontal: '左右反転'
}

const transformAll = (data: string[][], types: TransformType[]): string[][] => {
  return types.reduce((acc, type) => {
    if (type === 'transpose') return transpose(acc)
    if (type === 'flipVertical') return flipVertical(acc)
    if (type === 'flipHorizontal') return flipHorizontal(acc)
    return acc
  }, data)
}

const resultPlaceholder = computed(() => {
  if (outputFormat.value === 'csv') return 'name,age,city\nAlice,30,Tokyo\nBob,25,Osaka\n(変換結果がここに表示されます)'
  if (outputFormat.value === 'sql') return ' name | age | city  \n------+-----+-------\n Alice| 30  | Tokyo \n Bob  | 25  | Osaka \n(変換結果がここに表示されます)'
  if (outputFormat.value === 'md') return '| name | age | city |\n| ---- | --- | ---- |\n| Alice | 30 | Tokyo |\n| Bob | 25 | Osaka |\n(変換結果がここに表示されます)'
  if (outputFormat.value === 'html') return '<table>\n  <tr>\n    <th>name</th>\n    <th>age</th>\n    <th>city</th>\n  </tr>\n  ...\n</table>\n(変換結果がここに表示されます)'
  if (outputFormat.value === 'frame') return '┌──────┬─────┬───────┐\n│ name │ age │ city  │\n├──────┼─────┼───────┤\n│Alice │ 30  │ Tokyo │\n│ Bob  │ 25  │ Osaka │\n└──────┴─────┴───────┘\n(変換結果がここに表示されます)'
  return 'name\tage\tcity\nAlice\t30\tTokyo\nBob\t25\tOsaka\n(変換結果がここに表示されます)'
})

const convert = async () => {
  convertLoading.value = true
  try {
    let data: string
    if (uploadedFile.value) {
      data = await uploadedFile.value.text()
    } else {
      data = inputText.value
    }

    if (!data.trim()) {
      throw new Error('入力データを入力してください')
    }

    const parsed = parseInput(data, inputFormat.value)
    if (parsed.length === 0) {
      throw new Error('有効なデータが見つかりません')
    }

    if (transformTypes.value.length === 0) {
      throw new Error('変換形式を1つ以上選択してください')
    }

    const transformed = transformAll(parsed, transformTypes.value)
    fullResult.value = formatOutput(transformed, outputFormat.value)

    const detected = detectDelimiter(data)
    const inputType = inputFormat.value === 'auto'
      ? (detected === '\t' ? 'TSV' : detected === ',' ? 'CSV' : detected === '|' ? 'SQL/MD' : detected === '│' ? 'Frame表' : 'TSV')
      : inputFormat.value === 'sql' ? 'SQL' : inputFormat.value === 'md' ? 'MD' : inputFormat.value === 'frame' ? 'Frame表' : inputFormat.value.toUpperCase()
    const outputType = outputFormat.value === 'sql' ? 'SQL' : outputFormat.value === 'md' ? 'MD' : outputFormat.value === 'frame' ? 'Frame表' : outputFormat.value.toUpperCase()
    const typeLabels = transformTypes.value.map(t => transformLabels[t]).join('+')
    conversionType.value = `${typeLabels} (${inputType} → ${outputType})`
  } catch (error) {
    fullResult.value = 'エラー: ' + (error as Error).message
    conversionType.value = ''
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
  const extMap: Record<OutputFormat, string> = { csv: '.csv', tsv: '.tsv', sql: '.txt', md: '.md', html: '.html', frame: '.txt', fixed: '.txt' }
  const blob = new Blob([fullResult.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'result' + extMap[outputFormat.value]
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

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    clearUploadedFile()
    inputText.value = text
    showNotification('ペーストしました')
  } catch {
    showNotification('ペーストに失敗しました', 'error')
  }
}

const clearInputData = () => {
  clearUploadedFile()
  store.clearInput()
}
</script>

<template>
  <div class="converter-container">
    <div class="header-row">
      <h2>表変換</h2>
      <DelimiterSelector
        v-model="inputFormat"
        label="入力形式:"
      />
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
            @click="copyFieldToClipboard(displayDataBody, '入力データ')"
            :disabled="!hasInputText"
            title="コピー"
          >
            <i class="mdi mdi-content-copy"></i>
          </button>
          <button
            class="btn btn-icon-small"
            @click="pasteFromClipboard"
            title="ペーストして置換"
          >
            <i class="mdi mdi-content-paste"></i>
          </button>
          <button
            class="btn btn-icon-small"
            @click="clearInputData"
            :disabled="!hasInputText"
            title="クリア"
          >
            <i class="mdi mdi-delete"></i>
          </button>
        </div>
        <h3>入力データ</h3>
      </div>
      <textarea
        v-if="!uploadedFile"
        v-model="inputText"
        rows="8"
        placeholder="name,age,city&#10;Alice,30,Tokyo&#10;Bob,25,Osaka&#10;(CSV/TSV/Markdown/HTML表形式)"
      ></textarea>
      <textarea
        v-else
        :value="displayDataBody"
        readonly
        rows="8"
      ></textarea>
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
          <span class="format-label">出力:</span>
          <label class="format-option">
            <input type="radio" value="tsv" v-model="outputFormat" />
            TSV
          </label>
          <label class="format-option">
            <input type="radio" value="csv" v-model="outputFormat" />
            CSV
          </label>
          <label class="format-option">
            <input type="radio" value="sql" v-model="outputFormat" />
            SQL
          </label>
          <label class="format-option">
            <input type="radio" value="md" v-model="outputFormat" />
            MD
          </label>
          <label class="format-option">
            <input type="radio" value="frame" v-model="outputFormat" />
            Frame表
          </label>
          <label class="format-option">
            <input type="radio" value="html" v-model="outputFormat" />
            HTML
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
        <div class="result-header-right" style="display: flex; align-items: center; gap: 10px;">
          <div class="delimiter-selector" style="display: inline-flex; width: auto; padding: 5px 10px;">
            <label v-for="(label, key) in transformLabels" :key="key">
              <input
                type="checkbox"
                :checked="transformTypes.includes(key)"
                @change="($event: Event) => {
                  const checked = ($event.target as HTMLInputElement).checked
                  if (checked) transformTypes = [...transformTypes, key]
                  else transformTypes = transformTypes.filter(t => t !== key)
                }"
              />
              {{ label }}
            </label>
          </div>
          <h3>実行結果<span v-if="conversionType" class="conversion-type">({{ conversionType }})</span></h3>
        </div>
      </div>
      <textarea :value="displayResult" rows="10" readonly :placeholder="resultPlaceholder"></textarea>
    </div>

    <NotificationToast
      :show="showNotificationFlag"
      :message="notificationMessage"
      :type="notificationType"
    />
  </div>
</template>
