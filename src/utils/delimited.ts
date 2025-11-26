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
 * 2次元配列を区切り文字列に変換する（共通関数）
 */
function unparseDelimited(data: string[][], delimiter: ',' | '\t'): string {
  return unparse(data, {
    delimiter,
    newline: '\n',
    quotes: false,
    quoteChar: '"',
    escapeChar: '"',
  });
}

/**
 * 2次元配列をCSV文字列に変換する
 */
export function toCSV(data: string[][]): string {
  return unparseDelimited(data, ',');
}

/**
 * 2次元配列をTSV文字列に変換する
 */
export function toTSV(data: string[][]): string {
  return unparseDelimited(data, '\t');
}

/**
 * 区切り文字データをパースする（CSV/TSV対応）
 */
export function parseDelimitedData(input: string, delimiter: ',' | '\t'): string[][] {
  return parseDelimited(input, delimiter);
}
