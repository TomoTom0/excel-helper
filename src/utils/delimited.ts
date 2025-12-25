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
  
  // 区切り線を見つけてカラム位置を特定
  let columnPositions: number[] | null = null;
  const separatorLine = lines.find(line => /^[\s|+-]+$/.test(line));
  
  if (separatorLine) {
    // 区切り線からパイプの位置を取得
    columnPositions = [];
    for (let i = 0; i < separatorLine.length; i++) {
      if (separatorLine[i] === '|' || separatorLine[i] === '+') {
        columnPositions.push(i);
      }
    }
    console.log('カラム位置を検出:', columnPositions);
  }
  
  if (columnPositions && columnPositions.length > 0) {
    // 固定位置パース（改行を含むデータに対応）
    let currentRow: string[] | null = null;
    const expectedColumnCount = columnPositions.length + 1;
    
    for (const line of lines) {
      // 空行はスキップ
      if (line.trim() === '') {
        continue;
      }
      
      // 区切り線をスキップ
      if (/^[\s|+-]+$/.test(line)) {
        continue;
      }
      
      // 行の最初の文字位置でパイプまたはスペースがある場合、新しいレコードの開始
      const isNewRecord = columnPositions[0] === 0 ? 
        (line[0] === '|' || line[0] === ' ') : 
        true;
      
      // パイプが正しい位置にあるかチェック
      let hasPipesAtCorrectPositions = true;
      for (const pos of columnPositions) {
        if (line.length > pos && line[pos] !== '|' && line[pos] !== '+') {
          hasPipesAtCorrectPositions = false;
          break;
        }
      }
      
      console.log('行チェック:', { 
        linePreview: line.substring(0, 60), 
        hasPipes: hasPipesAtCorrectPositions, 
        currentRowLength: currentRow?.length,
        expectedColumnCount 
      });
      
      if (hasPipesAtCorrectPositions && (currentRow === null || currentRow.length === expectedColumnCount)) {
        // 新しいレコードの開始
        if (currentRow !== null) {
          result.push(currentRow);
        }
        
        currentRow = [];
        for (let i = 0; i < columnPositions.length - 1; i++) {
          const start = columnPositions[i] + 1;
          const end = columnPositions[i + 1];
          const value = line.substring(start, end).trim();
          currentRow.push(value);
        }
        // 最後のカラム
        const lastStart = columnPositions[columnPositions.length - 1] + 1;
        const lastValue = line.substring(lastStart).trim();
        currentRow.push(lastValue);
      } else if (currentRow !== null) {
        // 継続行：前の行の最後のカラムに追加
        const continuedValue = line.trim();
        if (continuedValue && currentRow.length > 0) {
          currentRow[currentRow.length - 1] += ' ' + continuedValue;
        }
      }
    }
    
    // 最後の行を追加
    if (currentRow !== null && currentRow.length > 0) {
      result.push(currentRow);
    }
  } else {
    // 区切り線がない場合は通常のパイプ分割
    for (const line of lines) {
      if (line.trim() === '') {
        continue;
      }
      
      if (/^[\s|+-]+$/.test(line)) {
        continue;
      }
      
      let columns = line.split('|').map(col => col.trim());
      
      if (columns.length > 0 && columns[0] === '') {
        columns.shift();
      }
      if (columns.length > 0 && columns[columns.length - 1] === '') {
        columns.pop();
      }
      
      if (columns.length > 0) {
        result.push(columns);
      }
    }
  }
  
  console.log('parsePipe完了:', { totalRows: result.length, firstRow: result[0] });
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
  const colWidths: number[] = [];
  for (const row of data) {
    for (let i = 0; i < row.length; i++) {
      const len = (row[i] || '').length;
      colWidths[i] = Math.max(colWidths[i] || 0, len);
    }
  }
  
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
