export interface ColumnOption {
  type: 'string' | 'number'
  padding: 'left' | 'right'
  padChar: string
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

export const fixedToTsv = (data: string, lengths: number[]): string => {
  const lines = data.split('\n').filter(line => line.trim())
  const tsvLines: string[] = []

  for (const line of lines) {
    const columns: string[] = []
    let position = 0

    for (const length of lengths) {
      const value = line.substring(position, position + length).trim()
      columns.push(value)
      position += length
    }

    tsvLines.push(columns.join('\t'))
  }

  return tsvLines.join('\n')
}

export const tsvToFixed = (data: string, lengths: number[], options: ColumnOption[]): string => {
  const lines = data.split('\n').filter(line => line.trim())
  const fixedLines: string[] = []

  for (const line of lines) {
    const columns = line.split('\t')
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
