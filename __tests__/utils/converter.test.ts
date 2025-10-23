import { describe, it, expect } from 'vitest'
import { parseColumnLengths, parseColumnOptions, padValue, fixedToTsv, tsvToFixed } from '../../src/utils/converter'
import type { ColumnOption } from '../../src/utils/converter'

describe('Fixed Length Converter', () => {
  describe('parseColumnLengths', () => {
    it('should parse comma-separated lengths', () => {
      expect(parseColumnLengths('10,20,15')).toEqual([10, 20, 15])
    })

    it('should handle spaces', () => {
      expect(parseColumnLengths('10, 20, 15')).toEqual([10, 20, 15])
    })

    it('should filter out invalid values', () => {
      expect(parseColumnLengths('10,abc,15')).toEqual([10, 15])
    })
  })

  describe('parseColumnOptions', () => {
    it('should parse column options', () => {
      const result = parseColumnOptions('string:right: ,number:left:0')
      expect(result).toEqual([
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'number', padding: 'left', padChar: '0' }
      ])
    })

    it('should use default values for incomplete options', () => {
      const result = parseColumnOptions('string')
      expect(result).toEqual([
        { type: 'string', padding: 'right', padChar: ' ' }
      ])
    })
  })

  describe('padValue', () => {
    it('should pad right with spaces', () => {
      const option: ColumnOption = { type: 'string', padding: 'right', padChar: ' ' }
      expect(padValue('test', 10, option)).toBe('test      ')
    })

    it('should pad left with zeros', () => {
      const option: ColumnOption = { type: 'number', padding: 'left', padChar: '0' }
      expect(padValue('123', 5, option)).toBe('00123')
    })

    it('should pad left with spaces', () => {
      const option: ColumnOption = { type: 'string', padding: 'left', padChar: ' ' }
      expect(padValue('test', 10, option)).toBe('      test')
    })
  })

  describe('fixedToTsv', () => {
    it('should convert fixed length to TSV', () => {
      const data = 'John      Doe                 30       '
      const lengths = [10, 20, 10]
      const result = fixedToTsv(data, lengths)
      expect(result).toBe('John\tDoe\t30')
    })

    it('should handle multiple lines', () => {
      const data = 'John      Doe                 30       \nJane      Smith               25       '
      const lengths = [10, 20, 10]
      const result = fixedToTsv(data, lengths)
      expect(result).toBe('John\tDoe\t30\nJane\tSmith\t25')
    })
  })

  describe('tsvToFixed', () => {
    it('should convert TSV to fixed length', () => {
      const data = 'John\tDoe\t30'
      const lengths = [10, 20, 10]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'number', padding: 'left', padChar: ' ' }
      ]
      const result = tsvToFixed(data, lengths, options)
      expect(result).toBe('John      Doe                         30')
    })

    it('should handle multiple lines', () => {
      const data = 'John\tDoe\t30\nJane\tSmith\t25'
      const lengths = [10, 20, 10]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'number', padding: 'left', padChar: ' ' }
      ]
      const result = tsvToFixed(data, lengths, options)
      expect(result).toBe('John      Doe                         30\nJane      Smith                       25')
    })
  })
})
