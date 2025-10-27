import { parseDelimitedData } from './delimited'

export interface ColumnOption {
  type: 'string' | 'number'
  padding: 'left' | 'right'
  padChar: string
}

export type DelimiterType = 'auto' | 'tsv' | 'csv'

export const detectDelimiter = (data: string): '\t' | ',' => {
  const firstLine = data.split('\n')[0] || ''
  const tabCount = (firstLine.match(/\t/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  return tabCount >= commaCount ? '\t' : ','
}

export const getDelimiter = (data: string, type: DelimiterType): '\t' | ',' => {
  if (type === 'auto') return detectDelimiter(data)
  if (type === 'tsv') return '\t'
  return ','
}

export const parseColumnLengths = (input: string): number[] => {
  // タブ区切りまたはカンマ区切りを検出
  const separator = input.includes('\t') ? '\t' : ','
  return input.split(separator).map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0)
}

export const parseColumnOptions = (input: string): ColumnOption[] => {
  return input.split(',')
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
  // フィールド内の改行をスペースに置換
  const normalizedValue = value.replace(/\r?\n/g, ' ')
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
  // 固定長形式の場合はそのまま返す
  if (outputFormat === 'fixed') {
    return data
  }
  
  const lines = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const delimiter = outputFormat === 'csv' ? ',' : '\t'
  const resultLines: string[] = []

  for (const line of lines) {
    if (line.trim() === '') {
      resultLines.push('')
      continue
    }
    
    const columns: string[] = []
    let position = 0

    for (const length of lengths) {
      const value = line.substring(position, position + length).trim()
      columns.push(value)
      position += length
    }

    resultLines.push(columns.join(delimiter))
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
      const rawValue = columns[i] || ''
      const value = rawValue.replace(/[\r\n]+/g, ' ')
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
