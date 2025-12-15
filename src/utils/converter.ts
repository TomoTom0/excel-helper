import { parseDelimitedData } from './delimited'

export interface ColumnOption {
  type: 'string' | 'number'
  padding: 'left' | 'right'
  padChar: string
}

export type DelimiterType = 'auto' | 'tsv' | 'csv' | 'fixed'

// Unicode正規表現定数
const UNICODE_SPACE_REGEX = /[\u00A0\u2000-\u200A\u202F\u205F]/g
const UNICODE_CONTROL_REGEX = /[\u00AD\u200B-\u200F]/g

/**
 * Unicode の各種スペース文字と制御文字を正規化
 * - スペース文字：通常スペースに置換
 * - 制御文字：削除
 * - IDEOGRAPHIC SPACE (U+3000) は保持（ユーザーの意図を尊重）
 */
const normalizeUnicodeWhitespace = (value: string): string => {
  // Unicode の各種スペース文字を通常スペースに統一し、制御文字を削除
  return value
    .replace(UNICODE_SPACE_REGEX, ' ')  // 各種スペースを通常スペースに置換
    .replace(UNICODE_CONTROL_REGEX, '')  // ソフトハイフンとゼロ幅文字などの制御文字を削除
}

export const detectDelimiter = (data: string): '\t' | ',' => {
  const lines = data.split('\n').filter(line => line.trim() !== '').slice(0, 10) // 最初の10行（空行を除く）
  if (lines.length === 0) return '\t'
  
  // 各行のタブとカンマの数を集計
  const tabCounts = lines.map(line => (line.match(/\t/g) || []).length)
  const commaCounts = lines.map(line => (line.match(/,/g) || []).length)
  
  // 各行のタブ数/カンマ数が一貫しているかチェック
  const tabConsistent = tabCounts.every((count, _, arr) => count === arr[0] && count > 0)
  const commaConsistent = commaCounts.every((count, _, arr) => count === arr[0] && count > 0)
  
  // タブが一貫していて、カンマは不一致ならTSV
  if (tabConsistent && !commaConsistent) return '\t'
  
  // カンマが一貫していて、タブは不一致ならCSV
  if (commaConsistent && !tabConsistent) return ','
  
  // 両方一貫している場合、または両方不一致の場合は、合計数で判定
  const totalTabs = tabCounts.reduce((sum, count) => sum + count, 0)
  const totalCommas = commaCounts.reduce((sum, count) => sum + count, 0)
  
  return totalTabs >= totalCommas ? '\t' : ','
}

export const getDelimiter = (data: string, type: DelimiterType): '\t' | ',' => {
  if (type === 'auto') return detectDelimiter(data)
  if (type === 'tsv') return '\t'
  if (type === 'csv') return ','
  // type === 'fixed' の場合はデリミタを検出しないため、呼び出すべきではない
  throw new Error("getDelimiter should not be called with type 'fixed'")
}

/**
 * 入力文字列の区切り文字を決定する（parseColumnLengths / parseColumnOptions 用）
 * delimiterType が 'auto' の場合、入力文字列の内容から自動判別
 */
export const getOptionsDelimiter = (input: string, delimiterType: DelimiterType = 'auto'): '\t' | ',' => {
  if (delimiterType === 'auto') {
    return input.includes('\t') ? '\t' : ','
  }
  return delimiterType === 'tsv' ? '\t' : ','
}

export const parseColumnLengths = (input: string, delimiterType: DelimiterType = 'auto'): number[] => {
  const delimiter = getOptionsDelimiter(input, delimiterType)
  return input.split(delimiter).map(v => Number(v.trim())).filter(v => !isNaN(v) && v > 0 && Number.isInteger(v))
}

export const parseColumnOptions = (input: string, delimiterType: DelimiterType = 'auto'): ColumnOption[] => {
  const delimiter = getOptionsDelimiter(input, delimiterType)
  
  return input.split(delimiter)
    .filter(opt => opt.trim() !== '')
    .map(opt => {
      const parts = opt.trim().split(':')
      if (parts.length === 0 || parts[0] === '') {
        return null
      }
      const typeLower = (parts[0] || 'string').toLowerCase()
      if (typeLower !== 'string' && typeLower !== 'number') {
        return null
      }
      const type = typeLower as 'string' | 'number'
      const paddingLower = (parts[1] || 'right').toLowerCase()
      const padding = (paddingLower === 'left' ? 'left' : 'right') as 'left' | 'right'
      let padChar: string
      if (parts[2] !== undefined && parts[2] !== '') {
        padChar = parts[2]
      } else {
        padChar = type === 'number' ? '0' : ' '
      }
      return {
        type,
        padding,
        padChar
      }
    })
    .filter((opt): opt is ColumnOption => opt !== null)
}

export const padValue = (value: string, length: number, option: ColumnOption): string => {
  // フィールド内の改行とタブをスペースに置換
  let normalizedValue = value.replace(/\r?\n/g, ' ').replace(/\t/g, ' ')
  
  // Unicode の各種スペース文字と制御文字を正規化
  normalizedValue = normalizeUnicodeWhitespace(normalizedValue)
  
  const padChar = option.padChar || (option.type === 'number' ? '0' : ' ')
  if (normalizedValue.length >= length) {
    return normalizedValue.substring(0, length)
  }
  if (option.padding === 'left') {
    return normalizedValue.padStart(length, padChar)
  } else {
    return normalizedValue.padEnd(length, padChar)
  }
}

export const convertFromFixed = (data: string, lengths: number[], outputFormat: 'tsv' | 'csv' | 'fixed' = 'tsv', forceAllString = false): string => {
  const lines = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const resultLines: string[] = []

  for (const line of lines) {
    if (line.trim() === '') {
      resultLines.push('')
      continue
    }
    
    const columns: string[] = []
    let position = 0

    for (const length of lengths) {
      let value = line.substring(position, position + length).trim().replace(/\t/g, ' ')
      
      // Unicode の各種スペース文字と制御文字を正規化
      value = normalizeUnicodeWhitespace(value)
      
      columns.push(value)
      position += length
    }

    if (outputFormat === 'fixed') {
      // 固定長形式の場合は、抽出した値を再度固定長にフォーマット
      const option = { type: 'string' as const, padding: 'right' as const, padChar: ' ' }
      let fixedLine = ''
      for (let i = 0; i < lengths.length; i++) {
        const value = columns[i] || ''
        fixedLine += padValue(value, lengths[i], option)
      }
      resultLines.push(fixedLine)
    } else {
      const delimiter = outputFormat === 'csv' ? ',' : '\t'
      // forceAllStringが有効な場合は引用符で囲む
      let line: string
      if (forceAllString) {
        const quotedColumns = columns.map(col => `"${col.replace(/"/g, '""')}"`)
        line = quotedColumns.join(delimiter)
      } else {
        line = columns.join(delimiter)
      }
      resultLines.push(line)
    }
  }

  return resultLines.join('\n')
}

export const tsvToFixed = (parsedData: string[][], lengths: number[], options: ColumnOption[]): string => {
  if (parsedData.length === 0) {
    return ''
  }
  
  const fixedLines: string[] = []

  for (const columns of parsedData) {
    let fixedLine = ''

    for (let i = 0; i < lengths.length; i++) {
      const value = columns[i] || ''
      const option = options[i] || { type: 'string', padding: 'right', padChar: ' ' }
      fixedLine += padValue(value, lengths[i], option)
    }

    fixedLines.push(fixedLine)
  }

  return fixedLines.join('\n')
}

// 後方互換性のためのヘルパー関数
export const tsvToFixedFromString = (data: string, lengths: number[], options: ColumnOption[], delimiterType: DelimiterType = 'auto'): string => {
  if (data === '') {
    return ''
  }
  
  const delimiter = getDelimiter(data, delimiterType)
  const parsedData = parseDelimitedData(data, delimiter)
  
  return tsvToFixed(parsedData, lengths, options)
}
