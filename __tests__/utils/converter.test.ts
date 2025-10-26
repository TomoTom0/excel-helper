import { describe, it, expect } from 'vitest'
import { parseColumnLengths, parseColumnOptions, padValue, convertFromFixed, tsvToFixedFromString as tsvToFixed, detectDelimiter, getDelimiter } from '../../src/utils/converter'
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

    it('should parse tab-separated lengths', () => {
      expect(parseColumnLengths('10\t20\t15')).toEqual([10, 20, 15])
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

    it('should use default padding char based on type', () => {
      const result = parseColumnOptions('string:right,number:left')
      expect(result).toEqual([
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'number', padding: 'left', padChar: '0' }
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

    it('should truncate value if longer than length', () => {
      const option: ColumnOption = { type: 'string', padding: 'right', padChar: ' ' }
      expect(padValue('verylongtext', 5, option)).toBe('veryl')
    })

    it('should use default padding char based on type when not specified', () => {
      const stringOption: ColumnOption = { type: 'string', padding: 'right', padChar: '' }
      const numberOption: ColumnOption = { type: 'number', padding: 'left', padChar: '' }
      expect(padValue('test', 10, stringOption)).toBe('test      ')
      expect(padValue('123', 5, numberOption)).toBe('00123')
    })
  })

  describe('detectDelimiter', () => {
    it('should detect tab delimiter', () => {
      const data = 'John\tDoe\t30'
      expect(detectDelimiter(data)).toBe('\t')
    })

    it('should detect comma delimiter', () => {
      const data = 'John,Doe,30'
      expect(detectDelimiter(data)).toBe(',')
    })

    it('should default to tab when equal counts', () => {
      const data = 'test'
      expect(detectDelimiter(data)).toBe('\t')
    })
  })

  describe('getDelimiter', () => {
    it('should return tab for tsv type', () => {
      expect(getDelimiter('any data', 'tsv')).toBe('\t')
    })

    it('should return comma for csv type', () => {
      expect(getDelimiter('any data', 'csv')).toBe(',')
    })

    it('should auto-detect for auto type', () => {
      expect(getDelimiter('John,Doe,30', 'auto')).toBe(',')
      expect(getDelimiter('John\tDoe\t30', 'auto')).toBe('\t')
    })
  })

  describe('convertFromFixed', () => {
    it('should convert fixed length to TSV', () => {
      const data = 'John      Doe                 30       '
      const lengths = [10, 20, 10]
      const result = convertFromFixed(data, lengths, 'tsv')
      expect(result).toBe('John\tDoe\t30')
    })

    it('should convert fixed length to CSV', () => {
      const data = 'John      Doe                 30       '
      const lengths = [10, 20, 10]
      const result = convertFromFixed(data, lengths, 'csv')
      expect(result).toBe('John,Doe,30')
    })

    it('should handle multiple lines', () => {
      const data = 'John      Doe                 30       \nJane      Smith               25       '
      const lengths = [10, 20, 10]
      const result = convertFromFixed(data, lengths, 'tsv')
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
      const result = tsvToFixed(data, lengths, options, 'tsv')
      expect(result).toBe('John      Doe                         30')
    })

    it('should convert CSV to fixed length', () => {
      const data = 'John,Doe,30'
      const lengths = [10, 20, 10]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'number', padding: 'left', padChar: ' ' }
      ]
      const result = tsvToFixed(data, lengths, options, 'csv')
      expect(result).toBe('John      Doe                         30')
    })

    it('should auto-detect delimiter', () => {
      const csvData = 'John,Doe,30'
      const tsvData = 'John\tDoe\t30'
      const lengths = [10, 20, 10]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'number', padding: 'left', padChar: ' ' }
      ]
      expect(tsvToFixed(csvData, lengths, options, 'auto')).toBe('John      Doe                         30')
      expect(tsvToFixed(tsvData, lengths, options, 'auto')).toBe('John      Doe                         30')
    })

    it('should handle multiple lines', () => {
      const data = 'John\tDoe\t30\nJane\tSmith\t25'
      const lengths = [10, 20, 10]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'number', padding: 'left', padChar: ' ' }
      ]
      const result = tsvToFixed(data, lengths, options, 'tsv')
      expect(result).toBe('John      Doe                         30\nJane      Smith                       25')
    })

    it('should use default string options when options are empty', () => {
      const data = 'John\tDoe\t30'
      const lengths = [10, 20, 10]
      const options: ColumnOption[] = [
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' },
        { type: 'string', padding: 'right', padChar: ' ' }
      ]
      const result = tsvToFixed(data, lengths, options, 'tsv')
      expect(result).toBe('John      Doe                 30        ')
    })
  })
})
