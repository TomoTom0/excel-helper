import { parseDelimitedData } from './delimited'

export interface ColumnOption {
  type: 'string' | 'number'
  padding: 'left' | 'right'
  padChar: string
}

export type DelimiterType = 'auto' | 'tsv' | 'csv' | 'fixed'

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

export const parseColumnLengths = (input: string, delimiterType: DelimiterType = 'auto'): number[] => {
  // delimiter を取得（データとして使う）
  const delimiter = delimiterType === 'auto' ? (input.includes('\t') ? '\t' : ',') : (delimiterType === 'tsv' ? '\t' : ',')
  return input.split(delimiter).map(v => Number(v.trim())).filter(v => !isNaN(v) && v > 0 && Number.isInteger(v))
}

export const parseColumnOptions = (input: string, delimiterType: DelimiterType = 'auto'): ColumnOption[] => {
  // delimiter を取得（データとして使う）
  const delimiter = delimiterType === 'auto' ? (input.includes('\t') ? '\t' : ',') : (delimiterType === 'tsv' ? '\t' : ',')
  
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
  
  // Unicode の各種スペース文字を通常スペースに統一
  // NBSP (U+00A0), EN SPACE (U+2002), EM SPACE (U+2003) など
  // 注: IDEOGRAPHIC SPACE (U+3000/全角スペース) は意図的に使用される可能性があるため、置換しない
  normalizedValue = normalizedValue
    .replace(/\u00A0/g, ' ')  // NO-BREAK SPACE
    .replace(/[\u2000-\u200A]/g, ' ')  // EN QUAD ～ HAIR SPACE
    .replace(/\u202F/g, ' ')  // NARROW NO-BREAK SPACE
    .replace(/\u205F/g, ' ')  // MEDIUM MATHEMATICAL SPACE
  
  // 制御文字（幅なしスペースなど）を削除
  normalizedValue = normalizedValue
    .replace(/\u200B/g, '')  // ZERO WIDTH SPACE
    .replace(/[\u200C-\u200D]/g, '')  // ZERO WIDTH NON-JOINER, JOINER
    .replace(/\u200E/g, '')  // LEFT-TO-RIGHT MARK
    .replace(/\u200F/g, '')  // RIGHT-TO-LEFT MARK
    .replace(/\u00AD/g, '')  // SOFT HYPHEN
  
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

export const convertFromFixed = (data: string, lengths: number[], outputFormat: 'tsv' | 'csv' | 'fixed' = 'tsv'): string => {
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
      
      // Unicode の各種スペース文字を通常スペースに統一
      // 注: IDEOGRAPHIC SPACE (U+3000/全角スペース) は意図的に使用される可能性があるため、置換しない
      value = value
        .replace(/\u00A0/g, ' ')  // NO-BREAK SPACE
        .replace(/[\u2000-\u200A]/g, ' ')  // EN QUAD ～ HAIR SPACE
        .replace(/\u202F/g, ' ')  // NARROW NO-BREAK SPACE
        .replace(/\u205F/g, ' ')  // MEDIUM MATHEMATICAL SPACE
      
      // 制御文字（幅なしスペースなど）を削除
      value = value
        .replace(/\u200B/g, '')  // ZERO WIDTH SPACE
        .replace(/[\u200C-\u200D]/g, '')  // ZERO WIDTH NON-JOINER, JOINER
        .replace(/\u200E/g, '')  // LEFT-TO-RIGHT MARK
        .replace(/\u200F/g, '')  // RIGHT-TO-LEFT MARK
        .replace(/\u00AD/g, '')  // SOFT HYPHEN
      
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
      resultLines.push(columns.join(delimiter))
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
