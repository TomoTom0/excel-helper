import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export type DelimiterType = 'csv' | 'tsv' | 'fixed' | 'auto'

const CONTROL_CHAR_RATIO_THRESHOLD = 0.1
const BINARY_CHECK_SIZE = 8000
const PREVIEW_DISPLAY_SIZE = 1000

export interface UseFileUploadOptions {
  dataBody: Ref<string>
  delimiterType: Ref<DelimiterType>
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function useFileUpload(options: UseFileUploadOptions) {
  const { dataBody, delimiterType, onSuccess, onError } = options

  const fileInputRef = ref<HTMLInputElement | null>(null)
  const uploadedFile = ref<File | null>(null)
  const filePreview = ref('')

  const detectDelimiterTypeFromFilename = (filename: string): DelimiterType => {
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
    const totalLength = Math.min(text.length, BINARY_CHECK_SIZE)

    for (let i = 0; i < totalLength; i++) {
      const code = text.charCodeAt(i)
      // Exclude TAB (0x09), LF (0x0A), CR (0x0D)
      if ((code >= 0x00 && code <= 0x08) || (code >= 0x0B && code <= 0x0C) || (code >= 0x0E && code <= 0x1F)) {
        controlCharCount++
      }
    }

    return controlCharCount / totalLength < CONTROL_CHAR_RATIO_THRESHOLD
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
      const blob = file.slice(0, BINARY_CHECK_SIZE)
      const previewText = await blob.text()

      // Binary check
      if (!isTextFile(previewText)) {
        onError?.('バイナリファイルは読み込めません')
        target.value = ''
        return
      }

      // Detect format from filename
      const detectedType = detectDelimiterTypeFromFilename(file.name)
      delimiterType.value = detectedType

      // Store File object (not full text!)
      uploadedFile.value = file

      // Show preview (first 1000 chars only)
      const displayBlob = file.slice(0, PREVIEW_DISPLAY_SIZE)
      const displayText = await displayBlob.text()

      const fileSizeKB = (file.size / 1024).toFixed(1)
      const typeLabels: Record<DelimiterType, string> = {
        auto: '自動判別',
        csv: 'CSV',
        tsv: 'TSV',
        fixed: '固定長',
      }
      const typeLabel = typeLabels[detectedType]

      const previewMessage = file.size > PREVIEW_DISPLAY_SIZE
        ? `\n\n... 以降省略（ファイルサイズ: ${fileSizeKB} KB）\n※変換時に全データを読み込みます`
        : ''

      filePreview.value = displayText + previewMessage
      dataBody.value = '' // Clear manual input

      onSuccess?.(`ファイルを読み込みました（${typeLabel}、${fileSizeKB} KB）`)
    } catch (error) {
      onError?.('ファイルの読み込みに失敗しました')
      console.error(error)
    } finally {
      target.value = ''
    }
  }

  const clearUploadedFile = () => {
    uploadedFile.value = null
    filePreview.value = ''
  }

  const displayDataBody = computed(() => {
    // Show file preview if uploaded
    if (uploadedFile.value && filePreview.value) {
      return filePreview.value
    }
    // Show manual input
    return dataBody.value
  })

  const isDataBodyReadonly = computed(() => uploadedFile.value !== null)

  return {
    fileInputRef,
    uploadedFile,
    filePreview,
    displayDataBody,
    isDataBodyReadonly,
    uploadFile,
    handleFileUpload,
    clearUploadedFile,
  }
}
