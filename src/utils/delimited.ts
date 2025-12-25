import { parse, unparse } from 'papaparse';

/**
 * 区切り文字データをパースする（共通関数）
 */
function parseDelimited(input: string, delimiter: ',' | '\t'): string[][] {
  const result = parse(input, {
    delimiter,
    newline: '\n',
    skipEmptyLines: false,
  });
  return result.data as string[][];
}

/**
 * CSV文字列をパースする
 */
export function parseCSV(input: string): string[][] {
  return parseDelimited(input, ',');
}

/**
 * TSV文字列をパースする
 */
export function parseTSV(input: string): string[][] {
  return parseDelimited(input, '\t');
}

/**
 * PostgreSQLパイプ区切り形式をパースする
 * 例:
 *  id | name     | value
 * ----+----------+-------
 *   1 | Alice    |   100
 *   2 | Bob      |   200
 */
export function parsePipe(input: string): string[][] {
  const lines = input.split('\n');
  const result: string[][] = [];

  // 各行を処理
  for (const line of lines) {
    // 空行をスキップ
    if (line.trim() === '') {
      continue;
    }

    // 区切り線をスキップ（"-", "+", "|", スペースのみで構成される行）
    if (/^[\s|+-]+$/.test(line)) {
      continue;
    }

    // パイプで分割
    let trimmedLine = line.trim();
    
    // 行頭のパイプを削除
    if (trimmedLine.startsWith('|')) {
      trimmedLine = trimmedLine.slice(1);
    }
    // 行末のパイプを削除
    if (trimmedLine.endsWith('|')) {
      trimmedLine = trimmedLine.slice(0, -1);
    }
    
    const columns = trimmedLine.split('|').map(col => col.trim());

    // 有効なカラムがあれば追加
    if (columns.length > 0) {
      result.push(columns);
    }
  }

  return result;
}

/**
 * 2次元配列を区切り文字列に変換する（共通関数）
 */
function unparseDelimited(data: string[][], delimiter: ',' | '\t', forceAllString = false): string {
  return unparse(data, {
    delimiter,
    newline: '\n',
    quotes: forceAllString,
    quoteChar: '"',
    escapeChar: '"',
  });
}

/**
 * 2次元配列をCSV文字列に変換する
 */
export function toCSV(data: string[][], forceAllString = false): string {
  return unparseDelimited(data, ',', forceAllString);
}

/**
 * 2次元配列をTSV文字列に変換する
 */
export function toTSV(data: string[][], forceAllString = false): string {
  return unparseDelimited(data, '\t', forceAllString);
}

/**
 * 2次元配列をパイプ区切り文字列に変換する
 */
export function toPipe(data: string[][]): string {
  if (data.length === 0) return '';
  
  // 各列の最大幅を計算
  const colWidths = data.reduce<number[]>((widths, row) => {
    row.forEach((cell, i) => {
      widths[i] = Math.max(widths[i] || 0, (cell || '').length);
    });
    return widths;
  }, []);
  
  // 各行をフォーマット
  const lines: string[] = [];
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const paddedCols = row.map((col, i) => {
      const width = colWidths[i] || 0;
      return (col || '').padEnd(width, ' ');
    });
    lines.push(' ' + paddedCols.join(' | ') + ' ');
    
    // ヘッダー行の後に区切り線を追加
    if (rowIndex === 0) {
      const separators = colWidths.map(w => '-'.repeat(w));
      lines.push('-' + separators.join('-+-') + '-');
    }
  }
  
  return lines.join('\n');
}

/**
 * 区切り文字データをパースする（CSV/TSV対応）
 */
export function parseDelimitedData(input: string, delimiter: ',' | '\t'): string[][] {
  return parseDelimited(input, delimiter);
}
