import Papa from 'papaparse';

/**
 * CSV文字列をパースする
 */
export function parseCSV(input: string): string[][] {
  const result = Papa.parse(input, {
    delimiter: ',',
    newline: '\n',
    skipEmptyLines: false,
  });
  return result.data as string[][];
}

/**
 * TSV文字列をパースする
 */
export function parseTSV(input: string): string[][] {
  const result = Papa.parse(input, {
    delimiter: '\t',
    newline: '\n',
    skipEmptyLines: false,
  });
  return result.data as string[][];
}

/**
 * 2次元配列をCSV文字列に変換する
 */
export function toCSV(data: string[][]): string {
  return Papa.unparse(data, {
    delimiter: ',',
    newline: '\n',
    quotes: false,
    quoteChar: '"',
    escapeChar: '"',
  });
}

/**
 * 2次元配列をTSV文字列に変換する
 */
export function toTSV(data: string[][]): string {
  return Papa.unparse(data, {
    delimiter: '\t',
    newline: '\n',
    quotes: false,
    quoteChar: '"',
    escapeChar: '"',
  });
}

/**
 * 区切り文字データをパースする（CSV/TSV対応）
 */
export function parseDelimitedData(input: string, delimiter: ',' | '\t'): string[][] {
  return delimiter === ',' ? parseCSV(input) : parseTSV(input);
}
