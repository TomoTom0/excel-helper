export type NumberFormat = 'circled' | 'dotted' | 'parenthesized';
export type PatternType = 'circled' | 'dotted' | 'parenthesized' | 'dummy';

const CIRCLED_NUMBERS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';

const PATTERNS: ReadonlyArray<{ type: PatternType; regex: RegExp }> = [
  { type: 'circled', regex: new RegExp(`^[${CIRCLED_NUMBERS}]`) },
  { type: 'dotted', regex: /^[\d０-９]+[.．]/ },
  { type: 'parenthesized', regex: /^[(（][\d０-９]+[)）]/ },
];

/**
 * 行のパターンタイプを判定する
 */
function getPatternType(line: string, dummyChar: string): PatternType | null {
  if (!line) return null;
  
  for (const pattern of PATTERNS) {
    if (pattern.regex.test(line)) {
      return pattern.type;
    }
  }
  
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
      // 1-20の範囲外の場合は半角丸括弧でフォールバック
      return `(${num}) `;
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
          content = line.replace(/^[\d０-９]+[.．]\s*/, '');
        }
        // 括弧囲み数字を削除
        else if (patternType === 'parenthesized') {
          content = line.replace(/^[\(（][\d０-９]+[\)）]\s*/, '');
        }
        // ダミー文字を削除
        else if (patternType === 'dummy') {
          content = line.substring(dummyChar.length).trimStart();
        }
        
        return formatNumber(numberingCount, format) + content;
      }
    }
    return line;
  });
  
  return convertedLines.join('\n');
}
