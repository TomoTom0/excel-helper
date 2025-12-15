import { describe, it, expect } from 'vitest'
import { toCSV, toTSV, parseCSV, parseTSV } from '../../src/utils/delimited'

describe('Delimited Data Converter', () => {
  describe('toCSV', () => {
    it('CSV形式に変換できる', () => {
      const data = [['John', 'Tokyo', '25'], ['Alice', 'NewYork', '30']]
      expect(toCSV(data)).toBe('John,Tokyo,25\nAlice,NewYork,30')
    })

    it('forceAllStringがfalseの場合、引用符で囲まない', () => {
      const data = [['001', 'Tokyo', '25']]
      const result = toCSV(data, false)
      expect(result).toBe('001,Tokyo,25')
    })

    it('forceAllStringがtrueの場合、全てのフィールドを引用符で囲む', () => {
      const data = [['001', 'Tokyo', '25']]
      const result = toCSV(data, true)
      expect(result).toBe('"001","Tokyo","25"')
    })

    it('forceAllStringがtrueの場合、引用符を含むフィールドを正しくエスケープする', () => {
      const data = [['John "Johnny" Doe', 'Tokyo', '25']]
      const result = toCSV(data, true)
      expect(result).toBe('"John ""Johnny"" Doe","Tokyo","25"')
    })

    it('複数行のデータを処理できる', () => {
      const data = [
        ['001', 'Tokyo', '25'],
        ['002', 'NewYork', '30'],
        ['003', 'London', '35']
      ]
      const result = toCSV(data, true)
      expect(result).toBe('"001","Tokyo","25"\n"002","NewYork","30"\n"003","London","35"')
    })
  })

  describe('toTSV', () => {
    it('TSV形式に変換できる', () => {
      const data = [['John', 'Tokyo', '25'], ['Alice', 'NewYork', '30']]
      expect(toTSV(data)).toBe('John\tTokyo\t25\nAlice\tNewYork\t30')
    })

    it('forceAllStringがfalseの場合、引用符で囲まない', () => {
      const data = [['001', 'Tokyo', '25']]
      const result = toTSV(data, false)
      expect(result).toBe('001\tTokyo\t25')
    })

    it('forceAllStringがtrueの場合、全てのフィールドを引用符で囲む', () => {
      const data = [['001', 'Tokyo', '25']]
      const result = toTSV(data, true)
      expect(result).toBe('"001"\t"Tokyo"\t"25"')
    })

    it('forceAllStringがtrueの場合、引用符を含むフィールドを正しくエスケープする', () => {
      const data = [['John "Johnny" Doe', 'Tokyo', '25']]
      const result = toTSV(data, true)
      expect(result).toBe('"John ""Johnny"" Doe"\t"Tokyo"\t"25"')
    })

    it('複数行のデータを処理できる', () => {
      const data = [
        ['001', 'Tokyo', '25'],
        ['002', 'NewYork', '30'],
        ['003', 'London', '35']
      ]
      const result = toTSV(data, true)
      expect(result).toBe('"001"\t"Tokyo"\t"25"\n"002"\t"NewYork"\t"30"\n"003"\t"London"\t"35"')
    })
  })

  describe('parseCSV', () => {
    it('CSV文字列をパースできる', () => {
      const input = 'John,Tokyo,25\nAlice,NewYork,30'
      const result = parseCSV(input)
      expect(result).toEqual([['John', 'Tokyo', '25'], ['Alice', 'NewYork', '30']])
    })

    it('引用符で囲まれたフィールドをパースできる', () => {
      const input = '"001","Tokyo","25"'
      const result = parseCSV(input)
      expect(result).toEqual([['001', 'Tokyo', '25']])
    })
  })

  describe('parseTSV', () => {
    it('TSV文字列をパースできる', () => {
      const input = 'John\tTokyo\t25\nAlice\tNewYork\t30'
      const result = parseTSV(input)
      expect(result).toEqual([['John', 'Tokyo', '25'], ['Alice', 'NewYork', '30']])
    })

    it('引用符で囲まれたフィールドをパースできる', () => {
      const input = '"001"\t"Tokyo"\t"25"'
      const result = parseTSV(input)
      expect(result).toEqual([['001', 'Tokyo', '25']])
    })
  })
})
