import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useConverterStore } from '../stores/converter'
import type { DelimiterType } from '../utils/converter'

interface PresetData {
  columnLengths: string
  columnHeaders: string
  columnOptions: string
  delimiterType: DelimiterType
  outputFormat: 'tsv' | 'csv' | 'fixed' | 'md-tbl' | 'html-tbl'
  forceAllString: boolean
  useFirstRowAsHeader: boolean
}

interface StoredPresets {
  [key: string]: PresetData
}

const STORAGE_KEY = 'fixed-length-converter-presets'

export function usePresetCache() {
  const store = useConverterStore()
  const {
    columnLengths,
    columnHeaders,
    columnOptions,
    delimiterType,
    outputFormat,
    forceAllString,
    useFirstRowAsHeader
  } = storeToRefs(store)

  const presetName = ref('')
  const presets = ref<StoredPresets>({})

  // ローカルストレージからプリセットを読み込み
  const loadPresets = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          presets.value = parsed
        }
      }
    } catch {
      presets.value = {}
    }
  }

  // プリセットをローカルストレージに保存
  const savePresets = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.value))
    } catch (e) {
      console.error('Failed to save presets:', e)
    }
  }

  // 現在の設定をプリセットとして保存
  const saveCurrentAsPreset = (): { success: boolean; message: string } => {
    const name = presetName.value.trim()
    if (!name) {
      return { success: false, message: 'プリセット名を入力してください' }
    }

    // 同名のプリセットが存在する場合は上書き確認
    if (presets.value[name]) {
      const overwrite = window.confirm(
        `プリセット「${name}」は既に存在します。上書き保存しますか？`
      )

      if (!overwrite) {
        return { success: false, message: '保存をキャンセルしました' }
      }
    }

    presets.value[name] = {
      columnLengths: columnLengths.value,
      columnHeaders: columnHeaders.value,
      columnOptions: columnOptions.value,
      delimiterType: delimiterType.value,
      outputFormat: outputFormat.value,
      forceAllString: forceAllString.value,
      useFirstRowAsHeader: useFirstRowAsHeader.value
    }

    savePresets()
    return { success: true, message: `プリセット「${name}」を保存しました` }
  }

  // 指定したプリセットを読み込み
  const loadPreset = (name: string): { success: boolean; message: string } => {
    const preset = presets.value[name]
    if (!preset) {
      return { success: false, message: 'プリセットが見つかりません' }
    }

    columnLengths.value = preset.columnLengths
    columnHeaders.value = preset.columnHeaders
    columnOptions.value = preset.columnOptions
    delimiterType.value = preset.delimiterType
    outputFormat.value = preset.outputFormat
    forceAllString.value = preset.forceAllString
    useFirstRowAsHeader.value = preset.useFirstRowAsHeader

    presetName.value = name
    return { success: true, message: `プリセット「${name}」を読み込みました` }
  }

  // 指定したプリセットを削除
  const deletePreset = (name: string): { success: boolean; message: string } => {
    if (!presets.value[name]) {
      return { success: false, message: 'プリセットが見つかりません' }
    }

    delete presets.value[name]
    savePresets()

    if (presetName.value === name) {
      presetName.value = ''
    }

    return { success: true, message: `プリセット「${name}」を削除しました` }
  }

  // 初期化時にプリセットを読み込み
  loadPresets()

  return {
    presetName,
    presets,
    saveCurrentAsPreset,
    loadPreset,
    deletePreset
  }
}
