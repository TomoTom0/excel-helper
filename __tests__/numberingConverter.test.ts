/**
 * numberingConverter.ts のテスト
 * 
 * テスト観点:
 * - パターン検出: 丸数字、ドット、括弧の各形式を正しく検出
 * - 形式変換: 各形式間の相互変換が正しく動作
 * - エッジケース: 空文字、連続ナンバリング、混在パターン
 * - 全角/半角: 全角数字と半角数字の両方に対応
 */

import { describe, it, expect } from 'vitest';
import {
  detectNumberingLine,
  convertNumberingLines,
  parseCSV,
  parseTSV,
  formatNumber,
  PatternType,
  toTSV,
  toCSV,
} from '../src/utils/numberingConverter';

describe('numberingConverter', () => {
  describe('detectNumberingLine', () => {
    it('丸数字を検出する', () => {
      expect(detectNumberingLine('①テスト', ['circled'], 'x')).toBe(true);
      expect(detectNumberingLine('②別のテスト', ['circled'], 'x')).toBe(true);
      expect(detectNumberingLine('⑳最後', ['circled'], 'x')).toBe(true);
    });

    it('数字+ドット（半角）を検出する', () => {
      expect(detectNumberingLine('1. テスト', ['dotted'], 'x')).toBe(true);
      expect(detectNumberingLine('2. 別のテスト', ['dotted'], 'x')).toBe(true);
      expect(detectNumberingLine('10. 十番目', ['dotted'], 'x')).toBe(true);
    });

    it('数字+ドット（全角）を検出する', () => {
      expect(detectNumberingLine('１．テスト', ['dotted'], 'x')).toBe(true);
      expect(detectNumberingLine('２．別のテスト', ['dotted'], 'x')).toBe(true);
    });

    it('括弧囲み数字（半角）を検出する', () => {
      expect(detectNumberingLine('(1) テスト', ['parenthesized'], 'x')).toBe(true);
      expect(detectNumberingLine('(2) 別のテスト', ['parenthesized'], 'x')).toBe(true);
      expect(detectNumberingLine('(10) 十番目', ['parenthesized'], 'x')).toBe(true);
    });

    it('括弧囲み数字（全角）を検出する', () => {
      expect(detectNumberingLine('（１）テスト', ['parenthesized'], 'x')).toBe(true);
      expect(detectNumberingLine('（２）別のテスト', ['parenthesized'], 'x')).toBe(true);
    });

    it('ダミー文字を検出する', () => {
      expect(detectNumberingLine('x テスト', ['dummy'], 'x')).toBe(true);
      expect(detectNumberingLine('x別のテスト', ['dummy'], 'x')).toBe(true);
    });

    it('カスタムダミー文字を検出する', () => {
      expect(detectNumberingLine('* テスト', ['dummy'], '*')).toBe(true);
      expect(detectNumberingLine('- 別のテスト', ['dummy'], '-')).toBe(true);
    });

    it('検出パターンに含まれない行は検出しない', () => {
      expect(detectNumberingLine('①テスト', ['dotted'], 'x')).toBe(false);
      expect(detectNumberingLine('x テスト', ['circled'], 'x')).toBe(false);
    });

    it('ナンバリング行でない行は検出しない', () => {
      expect(detectNumberingLine('普通のテキスト', ['circled', 'dotted', 'parenthesized', 'dummy'], 'x')).toBe(false);
      expect(detectNumberingLine('テスト①', ['circled'], 'x')).toBe(false);
      expect(detectNumberingLine(' ①テスト', ['circled'], 'x')).toBe(false);
    });
  });

  describe('formatNumber', () => {
    it('丸数字形式で出力する', () => {
      expect(formatNumber(1, 'circled')).toBe('①');
      expect(formatNumber(2, 'circled')).toBe('②');
      expect(formatNumber(10, 'circled')).toBe('⑩');
      expect(formatNumber(20, 'circled')).toBe('⑳');
    });

    it('数字+ドット形式で出力する', () => {
      expect(formatNumber(1, 'dotted')).toBe('1. ');
      expect(formatNumber(2, 'dotted')).toBe('2. ');
      expect(formatNumber(10, 'dotted')).toBe('10. ');
    });

    it('括弧囲み形式で出力する', () => {
      expect(formatNumber(1, 'parenthesized')).toBe('(1) ');
      expect(formatNumber(2, 'parenthesized')).toBe('(2) ');
      expect(formatNumber(10, 'parenthesized')).toBe('(10) ');
    });
  });

  describe('convertNumberingLines', () => {
    it('検出したナンバリング行を指定した出力形式に変換する', () => {
      const input = 'x項目A\nx項目B\nx項目C';
      const expected = '①項目A\n②項目B\n③項目C';
      expect(convertNumberingLines(input, ['dummy'], 'circled', 'x')).toBe(expected);
    });

    it('ダミー文字xのナンバリング行を数字+ドットに変換する', () => {
      const input = 'x項目A\nx項目B';
      const expected = '1. 項目A\n2. 項目B';
      expect(convertNumberingLines(input, ['dummy'], 'dotted', 'x')).toBe(expected);
    });

    it('ダミー文字xのナンバリング行を括弧囲みに変換する', () => {
      const input = 'x項目A\nx項目B';
      const expected = '(1) 項目A\n(2) 項目B';
      expect(convertNumberingLines(input, ['dummy'], 'parenthesized', 'x')).toBe(expected);
    });

    it('混在するナンバリング行を統一形式に変換する', () => {
      const input = '①項目A\n1. 項目B\n(1) 項目C\nx項目D';
      const expected = '①項目A\n②項目B\n③項目C\n④項目D';
      expect(convertNumberingLines(
        input,
        ['circled', 'dotted', 'parenthesized', 'dummy'],
        'circled',
        'x'
      )).toBe(expected);
    });

    it('ナンバリング行以外はそのまま保持する', () => {
      const input = 'タイトル\nx項目A\n説明文\nx項目B';
      const expected = 'タイトル\n①項目A\n説明文\n②項目B';
      expect(convertNumberingLines(input, ['dummy'], 'circled', 'x')).toBe(expected);
    });

    it('空行はそのまま保持する', () => {
      const input = 'x項目A\n\nx項目B';
      const expected = '①項目A\n\n②項目B';
      expect(convertNumberingLines(input, ['dummy'], 'circled', 'x')).toBe(expected);
    });
  });

  describe('parseTSV', () => {
    it('シンプルなTSVをパースする', () => {
      const input = 'A\tB\tC';
      expect(parseTSV(input)).toEqual([['A', 'B', 'C']]);
    });

    it('ダブルクォートで囲まれた要素をパースする', () => {
      const input = '"A"\t"B"\t"C"';
      expect(parseTSV(input)).toEqual([['A', 'B', 'C']]);
    });

    it('改行を含む要素をパースする', () => {
      const input = '"①説明文\n②別の説明"\t"x項目A\nx項目B"';
      expect(parseTSV(input)).toEqual([['①説明文\n②別の説明', 'x項目A\nx項目B']]);
    });

    it('複数行のTSVをパースする', () => {
      const input = 'A\tB\nC\tD';
      expect(parseTSV(input)).toEqual([
        ['A', 'B'],
        ['C', 'D'],
      ]);
    });
  });

  describe('parseCSV', () => {
    it('シンプルなCSVをパースする', () => {
      const input = 'A,B,C';
      expect(parseCSV(input)).toEqual([['A', 'B', 'C']]);
    });

    it('ダブルクォートで囲まれた要素をパースする', () => {
      const input = '"A","B","C"';
      expect(parseCSV(input)).toEqual([['A', 'B', 'C']]);
    });

    it('改行を含む要素をパースする', () => {
      const input = '"①説明文\n②別の説明","x項目A\nx項目B"';
      expect(parseCSV(input)).toEqual([['①説明文\n②別の説明', 'x項目A\nx項目B']]);
    });

    it('カンマを含む要素をパースする', () => {
      const input = '"A,B","C,D"';
      expect(parseCSV(input)).toEqual([['A,B', 'C,D']]);
    });
  });

  describe('integration tests', () => {
    it('TSVデータのナンバリング行を変換する', () => {
      const input = '"①説明文\n②別の説明"\t"x項目A\nx項目B"';
      const parsed = parseTSV(input);
      
      // 各セルに対してナンバリング変換を適用
      const converted = parsed.map(row => 
        row.map(cell => convertNumberingLines(
          cell,
          ['circled', 'dummy'],
          'circled',
          'x'
        ))
      );
      
      const output = toTSV(converted);
      expect(output).toBe('"①説明文\n②別の説明"\t"①項目A\n②項目B"');
    });

    it('CSVデータのナンバリング行を変換する', () => {
      const input = '"①説明文\n②別の説明","x項目A\nx項目B"';
      const parsed = parseCSV(input);
      
      // 各セルに対してナンバリング変換を適用
      const converted = parsed.map(row => 
        row.map(cell => convertNumberingLines(
          cell,
          ['circled', 'dummy'],
          'circled',
          'x'
        ))
      );
      
      const output = toCSV(converted);
      expect(output).toBe('"①説明文\n②別の説明","①項目A\n②項目B"');
    });

    it('複数行のTSVデータを変換する', () => {
      const input = '"x項目A\nx項目B"\t"タイトル"\n"①説明"\t"x内容"';
      const parsed = parseTSV(input);
      
      const converted = parsed.map(row => 
        row.map(cell => convertNumberingLines(
          cell,
          ['circled', 'dummy'],
          'circled',
          'x'
        ))
      );
      
      const output = toTSV(converted);
      expect(output).toBe('"①項目A\n②項目B"\tタイトル\n①説明\t①内容');
    });
  });
});
