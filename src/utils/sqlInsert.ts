/**
 * 値が数値かどうかを判定
 */
import type { DelimiterType } from './converter'
import { getOptionsDelimiter } from './converter'

export const isNumeric = (value: string): boolean => {
  if (value.trim() === '') return false
  return !isNaN(Number(value))
}

/**
 * SQL用に値をエスケープ
 */
export const escapeSqlValue = (value: string, forceType?: 'number' | 'string', forceAllString = false): string => {
  // 全て文字列として扱う場合
  if (forceAllString) {
    return `'${value.replace(/'/g, "''")}'`
  }

  // 強制的に型が指定されている場合
  if (forceType === 'number') {
    return isNumeric(value) ? value : 'NULL'
  }
  if (forceType === 'string') {
    return `'${value.replace(/'/g, "''")}'`
  }

  // 自動判定
  if (isNumeric(value)) {
    return value
  }
  // シングルクォートをエスケープ
  return `'${value.replace(/'/g, "''")}'`
}

/**
 * カラム名をサニタイズ（バッククォートで囲む）
 */
export const sanitizeColumnName = (name: string, useBacktick = true): string => {
  if (!useBacktick) {
    return name
  }
  return `\`${name.replace(/`/g, '``')}\``
}

/**
 * 単一行INSERT文を生成
 */
export const generateSingleInsert = (
  tableName: string,
  columns: string[],
  row: string[],
  columnTypes?: Array<'number' | 'string'>,
  useBacktick = true,
  forceAllString = false
): string => {
  const columnNames = columns.map(c => sanitizeColumnName(c, useBacktick)).join(', ')
  const values = row.map((value, i) =>
    escapeSqlValue(value, columnTypes?.[i], forceAllString)
  ).join(', ')
  const tableNameFormatted = useBacktick ? `\`${tableName}\`` : tableName
  return `INSERT INTO ${tableNameFormatted} (${columnNames}) VALUES (${values});`
}

/**
 * 複数行INSERT文を生成
 */
export const generateMultiInsert = (
  tableName: string,
  columns: string[],
  rows: string[][],
  columnTypes?: Array<'number' | 'string'>,
  useBacktick = true,
  forceAllString = false
): string => {
  const columnNames = columns.map(c => sanitizeColumnName(c, useBacktick)).join(', ')
  const valuesList = rows.map(row =>
    `  (${row.map((value, i) => escapeSqlValue(value, columnTypes?.[i], forceAllString)).join(', ')})`
  ).join(',\n')
  const tableNameFormatted = useBacktick ? `\`${tableName}\`` : tableName

  return `INSERT INTO ${tableNameFormatted} (${columnNames}) VALUES\n${valuesList};`
}

/**
 * カラムオプション文字列をパース
 */
export const parseColumnOptions = (input: string, delimiterType: DelimiterType = 'auto'): Array<'number' | 'string'> => {
  if (!input.trim()) return []
  
  const delimiter = getOptionsDelimiter(input, delimiterType)
  return input.split(delimiter)
    .map(v => v.trim().toLowerCase())
    .map(v => {
      if (v === 'number' || v === 'num' || v === 'int' || v === 'integer') return 'number'
      if (v === 'string' || v === 'str' || v === 'text') return 'string'
      return null
    })
    .filter((v): v is 'number' | 'string' => v !== null)
}

/**
 * データからINSERT文を生成
 */
export const generateInsertStatements = (
  tableName: string,
  columns: string[],
  rows: string[][],
  format: 'single' | 'multi' = 'single',
  columnTypes?: Array<'number' | 'string'>,
  useBacktick = true,
  forceAllString = false
): string => {
  if (rows.length === 0) {
    return ''
  }

  if (format === 'multi') {
    return generateMultiInsert(tableName, columns, rows, columnTypes, useBacktick, forceAllString)
  } else {
    return rows.map(row => generateSingleInsert(tableName, columns, row, columnTypes, useBacktick, forceAllString)).join('\n')
  }
}
