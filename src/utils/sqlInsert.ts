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
    return value.trim() === '' ? 'NULL' : isNumeric(value) ? value : 'NULL'
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
 * カラムオプション入力のバリデーション
 *
 * parseColumnOptions は解釈できない項目を黙って除外するため、入力ミスが
 * カラムとの対応ずれを無警告で生む。生成前にこの関数で誤りの箇所を
 * 特定し、利用者に提示する。
 *
 * @param input - カラムオプション入力文字列（例: "number,string"）
 * @param delimiterType - 区切り文字タイプ
 * @returns 問題の説明の配列（問題がなければ空配列）。入力自体が空の場合は空配列
 */
export const validateColumnOptions = (input: string, delimiterType: DelimiterType = 'auto'): string[] => {
  if (input.trim() === '') return []
  const delimiter = getOptionsDelimiter(input, delimiterType)
  const problems: string[] = []
  input.split(delimiter).forEach((token, index) => {
    const value = token.trim()
    const position = index + 1
    if (value === '') {
      problems.push(`${position}番目の値が空です`)
      return
    }
    const lowered = value.toLowerCase()
    if (lowered !== 'number' && lowered !== 'num' && lowered !== 'int' && lowered !== 'integer' &&
        lowered !== 'string' && lowered !== 'str' && lowered !== 'text') {
      problems.push(`${position}番目の値「${value}」は型として解釈できません（number または string で指定してください）`)
    }
  })
  return problems
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
