export type NumberFormat = 'circled' | 'dotted' | 'parenthesized';
export type PatternType = 'circled' | 'dotted' | 'parenthesized' | 'dummy';

const CIRCLED_NUMBERS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';

/**
 * 行のパターンタイプを判定する
 */
function getPatternType(line: string, dummyChar: string): PatternType | null {
  if (!line) return null;
  
  if (CIRCLED_NUMBERS.includes(line[0])) return 'circled';
  if (/^[\d１-９０]+[.．]/.test(line)) return 'dotted';
  if (/^[\(（][\d１-９０]+[\)）]/.test(line)) return 'parenthesized';
  if (dummyChar && line.startsWith(dummyChar)) return 'dummy';
  
  return null;
}

/**
 * ナンバリング行かどうかを判定する
 */
export function detectNumberingLine(
  line: string,
  detectPatterns: PatternType[],
  dummyChar: string = 'x'
): boolean {
  const patternType = getPatternType(line, dummyChar);
  return patternType !== null && detectPatterns.includes(patternType);
}

/**
 * 数字を指定した形式でフォーマットする
 */
export function formatNumber(num: number, format: NumberFormat): string {
  switch (format) {
    case 'circled':
      if (num >= 1 && num <= 20) {
        return CIRCLED_NUMBERS[num - 1];
      }
      // 20を超える場合はフォールバック
      return `${num}.`;
    case 'dotted':
      return `${num}. `;
    case 'parenthesized':
      return `(${num}) `;
  }
}

/**
 * テキスト内のナンバリング行を変換する
 */
export function convertNumberingLines(
  text: string,
  detectPatterns: PatternType[],
  format: NumberFormat,
  dummyChar: string = 'x'
): string {
  const lines = text.split('\n');
  let numberingCount = 0;
  
  const convertedLines = lines.map(line => {
    if (detectNumberingLine(line, detectPatterns, dummyChar)) {
      numberingCount++;
      
      const patternType = getPatternType(line, dummyChar);
      
      if (patternType) {
        // ナンバリング部分を削除して本文のみ取得
        let content = line;
        
        // 丸数字を削除
        if (patternType === 'circled') {
          content = line.substring(1);
        }
        // 数字+ドットを削除
        else if (patternType === 'dotted') {
          content = line.replace(/^[\d１-９０]+[.．]\s*/, '');
        }
        // 括弧囲み数字を削除
        else if (patternType === 'parenthesized') {
          content = line.replace(/^[\(（][\d１-９０]+[\)）]\s*/, '');
        }
        // ダミー文字を削除
        else if (patternType === 'dummy') {
          content = line.substring(dummyChar.length);
        }
        
        return formatNumber(numberingCount, format) + content;
      }
    }
    return line;
  });
  
  return convertedLines.join('\n');
}

/**
 * 区切り文字列をパースする（共通関数）
 */
function parseDelimited(input: string, delimiter: ',' | '\t'): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < input.length) {
    const char = input[i];
    const nextChar = input[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // エスケープされたクォート
        currentCell += '"';
        i += 2;
      } else if (char === '"') {
        // クォート終了
        inQuotes = false;
        i++;
      } else {
        currentCell += char;
        i++;
      }
    } else {
      if (char === '"') {
        // クォート開始
        inQuotes = true;
        i++;
      } else if (char === delimiter) {
        // セル区切り
        currentRow.push(currentCell);
        currentCell = '';
        i++;
      } else if (char === '\n') {
        // 行区切り
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
      } else {
        currentCell += char;
        i++;
      }
    }
  }
  
  // 最後のセルと行を追加
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }
  
  return rows;
}

/**
 * TSV文字列をパースする
 */
export function parseTSV(input: string): string[][] {
  return parseDelimited(input, '\t');
}

/**
 * CSV文字列をパースする
 */
export function parseCSV(input: string): string[][] {
  return parseDelimited(input, ',');
}

/**
 * 2次元配列を区切り文字列に変換する（共通関数）
 */
function toDelimitedString(data: string[][], delimiter: ',' | '\t'): string {
  return data.map(row => 
    row.map(cell => {
      // 区切り文字、改行、クォートを含む場合はクォートで囲む
      if (cell.includes(delimiter) || cell.includes('\n') || cell.includes('"')) {
        return '"' + cell.replace(/"/g, '""') + '"';
      }
      return cell;
    }).join(delimiter)
  ).join('\n');
}

/**
 * 2次元配列をTSV文字列に変換する
 */
export function toTSV(data: string[][]): string {
  return toDelimitedString(data, '\t');
}

/**
 * 2次元配列をCSV文字列に変換する
 */
export function toCSV(data: string[][]): string {
  return toDelimitedString(data, ',');
}

/**
 * 区切り文字データをパースする（CSV/TSV対応）
 */
export function parseDelimitedData(input: string, delimiter: ',' | '\t'): string[][] {
  return parseDelimited(input, delimiter);
}
