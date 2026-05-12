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
 * PostgreSQLパイプ区切り形式、MySQL表形式、Markdown表形式をパースする
 * PostgreSQL例:
 *  id | name     | value
 * ----+----------+-------
 *   1 | Alice    |   100
 *   2 | Bob      |   200
 *
 * MySQL例:
 * +----+----------+-------+
 * | id | name     | value |
 * +----+----------+-------+
 * |  1 | Alice    |   100 |
 * +----+----------+-------+
 *
 * Markdown例:
 * | id | name     | value |
 * |----|----------|-------|
 * |  1 | Alice    |   100 |
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

    // 区切り線をスキップ（"-", "+", "|", ":", スペースのみで構成される行）
    // PostgreSQL: ----+----------+-------
    // MySQL: +----+----------+-------+
    // Markdown: |----|----------|-------| または |:---|:---:|---:|
    if (/^[\s|+:-]+$/.test(line)) {
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
 * Unicode box-drawing文字のframe-tableをパースする
 * 例:
 * ┌───────────────┬────────┬────────────┐
 * │  Model / Bot  │ AvgPen │ Normalized │
 * ├───────────────┼────────┼────────────┤
 * │ pmc:100:1.0   │ 6.38   │ 2.16       │
 * └───────────────┴────────┴────────────┘
 */
export function parseFrame(input: string): string[][] {
  const lines = input.split('\n');
  const result: string[][] = [];

  for (const line of lines) {
    if (line.trim() === '') {
      continue;
    }

    // box-drawing文字のみの行（セパレータ行）をスキップ
    if (/^[\s┌─┬┐├┼┤└┴┘]+$/.test(line)) {
      continue;
    }

    let trimmedLine = line.trim();

    // 行頭・行末の │ (U+2502) を削除
    if (trimmedLine.startsWith('│')) {
      trimmedLine = trimmedLine.slice(1);
    }
    if (trimmedLine.endsWith('│')) {
      trimmedLine = trimmedLine.slice(0, -1);
    }

    const columns = trimmedLine.split('│').map(col => col.trim());

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
 * 2次元配列をパイプ区切り文字列に変換する（PostgreSQL形式）
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
 * 2次元配列をMarkdown表形式に変換する
 */
export function toMarkdown(data: string[][]): string {
  if (data.length === 0) return '';

  // 各列の最大幅を計算（最低3文字）
  const colWidths = data.reduce<number[]>((widths, row) => {
    row.forEach((cell, i) => {
      const cellLen = (cell || '').length;
      widths[i] = Math.max(widths[i] || 3, cellLen);
    });
    return widths;
  }, []);

  // 各行をフォーマット
  const lines: string[] = [];
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const paddedCols = row.map((col, i) => {
      const width = colWidths[i] || 3;
      return (col || '').padEnd(width, ' ');
    });
    lines.push('| ' + paddedCols.join(' | ') + ' |');

    // ヘッダー行の後に区切り線を追加
    if (rowIndex === 0) {
      const separators = colWidths.map(w => '-'.repeat(w));
      lines.push('| ' + separators.join(' | ') + ' |');
    }
  }

  return lines.join('\n');
}

/**
 * HTML特殊文字をエスケープする
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 2次元配列をHTML表形式に変換する
 */
export function toHtmlTable(data: string[][]): string {
  if (data.length === 0) return '';

  const lines: string[] = ['<table>'];

  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const tag = rowIndex === 0 ? 'th' : 'td';

    lines.push('  <tr>');
    for (const cell of row) {
      lines.push(`    <${tag}>${escapeHtml(cell || '')}</${tag}>`);
    }
    lines.push('  </tr>');
  }

  lines.push('</table>');
  return lines.join('\n');
}

/**
 * HTML表形式をパースする
 */
export function parseHtmlTable(input: string): string[][] {
  const result: string[][] = []
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi

  const htmlDecode = (text: string): string => {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim()
  }

  let rowMatch: RegExpExecArray | null
  while ((rowMatch = rowRegex.exec(input)) !== null) {
    const rowContent = rowMatch[1]
    const cells: string[] = []
    let cellMatch: RegExpExecArray | null
    cellRegex.lastIndex = 0
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells.push(htmlDecode(cellMatch[1]))
    }
    if (cells.length > 0) {
      result.push(cells)
    }
  }

  return result
}

/**
 * 区切り文字データをパースする（CSV/TSV対応）
 */
export function parseDelimitedData(input: string, delimiter: ',' | '\t'): string[][] {
  return parseDelimited(input, delimiter);
}
