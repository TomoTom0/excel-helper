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
  return input.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
}

export const parseColumnOptions = (input: string): ColumnOption[] => {
  return input.split(',').map(opt => {
    const parts = opt.trim().split(':')
    return {
      type: (parts[0] || 'string') as 'string' | 'number',
      padding: (parts[1] || 'right') as 'left' | 'right',
      padChar: parts[2] || ' '
    }
  })
}

export const padValue = (value: string, length: number, option: ColumnOption): string => {
  const padChar = option.padChar || ' '
  if (option.padding === 'left') {
    return value.padStart(length, padChar)
  } else {
    return value.padEnd(length, padChar)
  }
}

export const fixedToTsv = (data: string, lengths: number[], delimiterType: DelimiterType = 'tsv'): string => {
  const lines = data.split('\n').filter(line => line.trim())
  const delimiter = delimiterType === 'csv' ? ',' : '\t'
  const resultLines: string[] = []

  for (const line of lines) {
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

export const tsvToFixed = (data: string, lengths: number[], options: ColumnOption[], delimiterType: DelimiterType = 'auto'): string => {
  const lines = data.split('\n').filter(line => line.trim())
  const delimiter = getDelimiter(data, delimiterType)
  const fixedLines: string[] = []

  for (const line of lines) {
    const columns = line.split(delimiter)
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
