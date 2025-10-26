import { describe, it, expect } from 'vitest'
import { parseColumnLengths, parseColumnOptions, convertFromFixed, tsvToFixedFromString as tsvToFixed } from '../../src/utils/converter'
import type { ColumnOption } from '../../src/utils/converter'

describe('converter - エッジケースと追加テスト', () => {
  describe('parseColumnLengths - エッジケース', () => {
    it('空文字列を処理する', () => {
      expect(parseColumnLengths('')).toEqual([])
    })

    it('負の数値を除外する', () => {
      expect(parseColumnLengths('10,-5,15')).toEqual([10, 15])
    })

    it('0を除外する', () => {
      expect(parseColumnLengths('10,0,15')).toEqual([10, 15])
    })

    it('小数点を整数に変換する', () => {
      expect(parseColumnLengths('10.5,20.9,15')).toEqual([10, 20, 15])
    })
  })

  describe('parseColumnOptions - エッジケース', () => {
    it('空文字列を処理する', () => {
      expect(parseColumnOptions('')).toEqual([])
    })

    it('不正な形式をスキップする', () => {
      const result = parseColumnOptions('string:right,invalid,number:left')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ type: 'string', padding: 'right', padChar: ' ' })
      expect(result[1]).toEqual({ type: 'number', padding: 'left', padChar: '0' })
    })

    it('大文字小文字を区別しない', () => {
      const result = parseColumnOptions('STRING:RIGHT,NUMBER:LEFT')
      expect(result).toEqual([
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'number', padding: 'left', padChar: '0' }
      ])
    })

    it('カスタムpadCharを使用する', () => {
      const result = parseColumnOptions('string:right:_,number:left:*')
      expect(result).toEqual([
        { type: 'string', padding: 'right', padChar: '_' },
        { type: 'number', padding: 'left', padChar: '*' }
      ])
    })
  })

  describe('convertFromFixed - エッジケース', () => {
    it('空文字列を処理する', () => {
      expect(convertFromFixed('', [10, 20], 'tsv')).toBe('')
    })

    it('長さが不足する行を処理する', () => {
      const data = 'Short'
      const lengths = [10, 20, 10]
      const result = convertFromFixed(data, lengths, 'tsv')
      expect(result).toBe('Short\t\t')
    })

    it('長さが超過する行を処理する', () => {
      const data = 'A'.repeat(100)
      const lengths = [10, 20]
      const result = convertFromFixed(data, lengths, 'tsv')
      const parts = result.split('\t')
      expect(parts).toHaveLength(2)
      expect(parts[0]).toHaveLength(10)
      expect(parts[1]).toHaveLength(20)
    })

    it('空行を保持する', () => {
      const data = 'John      Doe       \n\nJane      Smith     '
      const lengths = [10, 10]
      const result = convertFromFixed(data, lengths, 'tsv')
      expect(result).toBe('John\tDoe\n\nJane\tSmith')
    })

    it('日本語を含むデータを処理する', () => {
      const data = '山田太郎  東京都   '
      const lengths = [6, 6]
      const result = convertFromFixed(data, lengths, 'tsv')
      expect(result).toBe('山田太郎\t東京都')
    })
  })

  describe('tsvToFixed - エッジケース', () => {
    it('空文字列を処理する', () => {
      const options: ColumnOption[] = []
      expect(tsvToFixed('', [10], options, 'tsv')).toBe('')
    })

    it('カラム数が不一致の場合', () => {
      const data = 'John\tDoe'
      const lengths = [10, 20, 15]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' }
      ]
      const result = tsvToFixed(data, lengths, options, 'tsv')
      const parts = result.split('\n')
      expect(parts[0]).toHaveLength(45) // 10 + 20 + 15
    })

    it('空のフィールドをパディングする', () => {
      const data = '\t\t'
      const lengths = [10, 10, 10]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' }
      ]
      const result = tsvToFixed(data, lengths, options, 'tsv')
      expect(result).toBe(' '.repeat(30))
    })

    it('日本語を含むデータを処理する', () => {
      const data = '山田太郎\t東京都'
      const lengths = [10, 10]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' }
      ]
      const result = tsvToFixed(data, lengths, options, 'tsv')
      expect(result).toHaveLength(20)
      expect(result.startsWith('山田太郎')).toBe(true)
    })

    it('数値のゼロパディング', () => {
      const data = '1\t2\t3'
      const lengths = [5, 5, 5]
      const options: ColumnOption[] = [
        { type: 'number', padding: 'left', padChar: '0' },
        { type: 'number', padding: 'left', padChar: '0' },
        { type: 'number', padding: 'left', padChar: '0' }
      ]
      const result = tsvToFixed(data, lengths, options, 'tsv')
      expect(result).toBe('000010000200003')
    })
  })

  describe('統合テスト - 双方向変換', () => {
    it('TSV→固定長→TSVで元に戻る', () => {
      const original = 'John\tDoe\t30'
      const lengths = [10, 10, 10]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'number', padding: 'left', padChar: ' ' }
      ]
      
      const fixed = tsvToFixed(original, lengths, options, 'tsv')
      const restored = convertFromFixed(fixed, lengths, 'tsv')
      
      expect(restored).toBe(original)
    })

    it('複数行の双方向変換', () => {
      const original = 'John\tDoe\t30\nJane\tSmith\t25'
      const lengths = [10, 10, 10]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'number', padding: 'left', padChar: ' ' }
      ]
      
      const fixed = tsvToFixed(original, lengths, options, 'tsv')
      const restored = convertFromFixed(fixed, lengths, 'tsv')
      
      expect(restored).toBe(original)
    })
  })

  describe('パフォーマンステスト', () => {
    it('大量データの固定長変換', () => {
      const lines = Array.from({ length: 1000 }, (_, i) => 
        `Name${i}`.padEnd(20) + `Value${i}`.padEnd(20)
      ).join('\n')
      
      const startTime = Date.now()
      const result = convertFromFixed(lines, [20, 20], 'tsv')
      const endTime = Date.now()
      
      expect(result.split('\n')).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
    })

    it('大量データのTSV→固定長変換', () => {
      const lines = Array.from({ length: 1000 }, (_, i) => 
        `Name${i}\tValue${i}`
      ).join('\n')
      
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' }
      ]
      
      const startTime = Date.now()
      const result = tsvToFixed(lines, [20, 20], options, 'tsv')
      const endTime = Date.now()
      
      expect(result.split('\n')).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
    })
  })

  describe('特殊文字を含むデータ', () => {
    it('タブ文字を含むCSVフィールド', () => {
      const data = '"Field\twith\ttabs","Normal field"'
      const lengths = [20, 20]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' }
      ]
      const result = tsvToFixed(data, lengths, options, 'csv')
      expect(result).toHaveLength(40)
    })

    it('改行を含むフィールド', () => {
      // NOTE: papaparseはquotes: trueにより、CSV内の改行を含むフィールドを
      // 正しく1つのフィールドとして扱います。
      // padValueで改行をスペースに置換するため、固定長出力では1行になります。
      const data = '"Multi\nLine\nField",Simple'
      const lengths = [20, 20]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' }
      ]
      const result = tsvToFixed(data, lengths, options, 'csv')
      // 改行がスペースに置換されるため、1行になります
      expect(result.split('\n').length).toBe(1)
      expect(result).toContain('Multi Line Field')
      expect(result).toContain('Simple')
    })
  })
})
