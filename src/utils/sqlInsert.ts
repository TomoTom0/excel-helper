/**
 * 値が数値かどうかを判定
 */
export const isNumeric = (value: string): boolean => {
  if (value.trim() === '') return false
  return !isNaN(Number(value))
}

/**
 * SQL用に値をエスケープ
 */
export const escapeSqlValue = (value: string): string => {
  if (isNumeric(value)) {
    return value
  }
  // シングルクォートをエスケープ
  return `'${value.replace(/'/g, "''")}'`
}

/**
 * カラム名をサニタイズ（バッククォートで囲む）
 */
export const sanitizeColumnName = (name: string): string => {
  return `\`${name.replace(/`/g, '``')}\``
}

/**
 * 単一行INSERT文を生成
 */
export const generateSingleInsert = (
  tableName: string,
  columns: string[],
  row: string[]
): string => {
  const columnNames = columns.map(sanitizeColumnName).join(', ')
  const values = row.map(escapeSqlValue).join(', ')
  return `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${values});`
}

/**
 * 複数行INSERT文を生成
 */
export const generateMultiInsert = (
  tableName: string,
  columns: string[],
  rows: string[][]
): string => {
  const columnNames = columns.map(sanitizeColumnName).join(', ')
  const valuesList = rows.map(row => 
    `  (${row.map(escapeSqlValue).join(', ')})`
  ).join(',\n')
  
  return `INSERT INTO \`${tableName}\` (${columnNames}) VALUES\n${valuesList};`
}

/**
 * データからINSERT文を生成
 */
export const generateInsertStatements = (
  tableName: string,
  columns: string[],
  rows: string[][],
  format: 'single' | 'multi' = 'single'
): string => {
  if (rows.length === 0) {
    return ''
  }

  if (format === 'multi') {
    return generateMultiInsert(tableName, columns, rows)
  } else {
    return rows.map(row => generateSingleInsert(tableName, columns, row)).join('\n')
  }
}
