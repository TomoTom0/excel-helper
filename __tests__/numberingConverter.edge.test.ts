/**
 * numberingConverter.ts のエッジケーステスト
 * 
 * テスト観点:
 * - 境界値: 20番目の丸数字、21番目以降のフォールバック
 * - 異常系: 不正な形式、予期しない入力
 * - パフォーマンス: 大量データでの動作確認
 */

import { describe, it, expect } from 'vitest'
import { 
  convertNumberingLines,
  formatNumber
} from '../src/utils/numberingConverter'
import { parseCSV, parseTSV, toCSV, toTSV } from '../src/utils/delimited'

describe('numberingConverter - エッジケース', () => {
  describe('エラーケース', () => {
    it('空文字列を変換する', () => {
      expect(convertNumberingLines('', ['dummy'], 'circled', 'x')).toBe('')
    })

    it('検出パターンが空配列の場合', () => {
      const input = 'x項目A\nx項目B'
      expect(convertNumberingLines(input, [], 'circled', 'x')).toBe(input)
    })

    it('ダミー文字が空文字の場合', () => {
      const input = 'x項目A\nx項目B'
      expect(convertNumberingLines(input, ['dummy'], 'circled', '')).toBe(input)
    })
  })

  describe('formatNumber - 境界値テスト', () => {
    it('丸数字形式で20を超える数字は半角丸括弧でフォールバックする', () => {
      expect(formatNumber(21, 'circled')).toBe('(21) ')
      expect(formatNumber(100, 'circled')).toBe('(100) ')
    })

    it('1未満の数字は半角丸括弧でフォールバックする', () => {
      expect(formatNumber(0, 'circled')).toBe('(0) ')
      expect(formatNumber(-1, 'circled')).toBe('(-1) ')
    })
  })

  describe('CSV/TSVパース - 特殊ケース', () => {
    it('エスケープされたダブルクォートをパースする', () => {
      const input = '"He said ""Hello"""'
      expect(parseCSV(input)).toEqual([['He said "Hello"']])
    })

    it('空のフィールドをパースする', () => {
      expect(parseCSV('A,,C')).toEqual([['A', '', 'C']])
      expect(parseTSV('A\t\tC')).toEqual([['A', '', 'C']])
    })

    it('空行を含むデータをパースする', () => {
      const input = 'A,B\n\nC,D'
      expect(parseCSV(input)).toEqual([['A', 'B'], [''], ['C', 'D']])
    })

    it('クォートなしの改行を含むデータ', () => {
      const input = 'A\nB'
      expect(parseTSV(input)).toEqual([['A'], ['B']])
    })
  })

  describe('toCSV/toTSV - 特殊ケース', () => {
    it('空配列を変換する', () => {
      expect(toCSV([])).toBe('')
      expect(toTSV([])).toBe('')
    })

    it('空の行を含む配列を変換する', () => {
      expect(toCSV([['A'], [], ['B']])).toBe('A\n\nB')
      expect(toTSV([['A'], [], ['B']])).toBe('A\n\nB')
    })

    it('ダブルクォートを含むデータをエスケープする', () => {
      const data = [['He said "Hello"']]
      expect(toCSV(data)).toBe('"He said ""Hello"""')
    })

    it('改行を含むデータをクォートで囲む', () => {
      const data = [['Line1\nLine2']]
      expect(toTSV(data)).toBe('"Line1\nLine2"')
    })

    it('タブを含むデータをクォートで囲む', () => {
      const data = [['Tab\there']]
      expect(toTSV(data)).toBe('"Tab\there"')
    })
  })

  describe('convertNumberingLines - 複雑なシナリオ', () => {
    it('複数のパターンが混在する複数行データ', () => {
      const input = `タイトル
①第一項目
1. 第二項目
(1) 第三項目
x第四項目
普通のテキスト
②次の丸数字
2. 次のドット`
      
      const expected = `タイトル
①第一項目
②第二項目
③第三項目
④第四項目
普通のテキスト
⑤次の丸数字
⑥次のドット`
      
      expect(convertNumberingLines(
        input, 
        ['circled', 'dotted', 'parenthesized', 'dummy'],
        'circled',
        'x'
      )).toBe(expected)
    })

    it('全角数字を含むパターンを検出する', () => {
      const input = '１．項目A\n２．項目B'
      const expected = '①項目A\n②項目B'
      expect(convertNumberingLines(input, ['dotted'], 'circled', 'x')).toBe(expected)
    })

    it('全角括弧を含むパターンを検出する', () => {
      const input = '（１）項目A\n（２）項目B'
      const expected = '①項目A\n②項目B'
      expect(convertNumberingLines(input, ['parenthesized'], 'circled', 'x')).toBe(expected)
    })

    it('20項目を超えるリストを変換する', () => {
      const lines = Array.from({ length: 25 }, (_, i) => `x項目${i + 1}`)
      const input = lines.join('\n')
      
      const result = convertNumberingLines(input, ['dummy'], 'circled', 'x')
      const resultLines = result.split('\n')
      
      // 最初の20個は丸数字
      expect(resultLines[0]).toBe('①項目1')
      expect(resultLines[19]).toBe('⑳項目20')
      
      // 21個目以降は半角丸括弧でフォールバック
      expect(resultLines[20]).toBe('(21) 項目21')
      expect(resultLines[24]).toBe('(25) 項目25')
    })

    it('ダミー文字が特殊文字の場合', () => {
      const input = '*項目A\n*項目B'
      const expected = '①項目A\n②項目B'
      expect(convertNumberingLines(input, ['dummy'], 'circled', '*')).toBe(expected)
    })

    it('途中にナンバリング行がない場合でも正しくカウント', () => {
      const input = 'x項目A\n普通のテキスト\n別の普通のテキスト\nx項目B'
      const expected = '①項目A\n普通のテキスト\n別の普通のテキスト\n②項目B'
      expect(convertNumberingLines(input, ['dummy'], 'circled', 'x')).toBe(expected)
    })
  })

  describe('統合テスト - 実際のユースケース', () => {
    it('議事録のアジェンダをナンバリング', () => {
      const input = `"会議アジェンダ"\t"詳細"
"x開会の挨拶\nx前回の議事録確認"\t"①社長から一言\n②確認事項"
"x本題"\t"1. 予算について\n2. スケジュールについて"`

      const parsed = parseTSV(input)
      const converted = parsed.map(row =>
        row.map(cell => convertNumberingLines(
          cell,
          ['dummy', 'circled', 'dotted'],
          'circled',
          'x'
        ))
      )
      const output = toTSV(converted)

      expect(output).toContain('①開会の挨拶')
      expect(output).toContain('②前回の議事録確認')
      expect(output).toContain('①本題')
    })

    it('CSVデータの複数セルを一括変換', () => {
      const input = '"x項目A","x説明A"\n"x項目B","x説明B"'
      const parsed = parseCSV(input)
      const converted = parsed.map(row =>
        row.map(cell => convertNumberingLines(cell, ['dummy'], 'dotted', 'x'))
      )
      const output = toCSV(converted)
      
      expect(output).toBe('1. 項目A,1. 説明A\n1. 項目B,1. 説明B')
    })
  })

  describe('パフォーマンステスト', () => {
    it('大量のデータを処理できる', () => {
      const lines = Array.from({ length: 1000 }, (_, i) => `x項目${i + 1}`)
      const input = lines.join('\n')
      
      const startTime = Date.now()
      const result = convertNumberingLines(input, ['dummy'], 'dotted', 'x')
      const endTime = Date.now()
      
      expect(result.split('\n')).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
    })
  })
})
