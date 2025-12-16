import { describe, it, expect } from 'vitest'
import {
  isNumeric,
  escapeSqlValue,
  sanitizeColumnName,
  generateSingleInsert,
  generateMultiInsert,
  generateInsertStatements,
  parseColumnOptions
} from '../../src/utils/sqlInsert'

describe('SQL Insert Generator', () => {
  describe('isNumeric', () => {
    it('数値文字列をtrueと判定', () => {
      expect(isNumeric('123')).toBe(true)
      expect(isNumeric('0')).toBe(true)
      expect(isNumeric('3.14')).toBe(true)
    })

    it('非数値文字列をfalseと判定', () => {
      expect(isNumeric('abc')).toBe(false)
      expect(isNumeric('')).toBe(false)
      expect(isNumeric('  ')).toBe(false)
    })
  })

  describe('escapeSqlValue', () => {
    it('数値は引用符なし', () => {
      expect(escapeSqlValue('123')).toBe('123')
    })

    it('文字列はシングルクォートで囲む', () => {
      expect(escapeSqlValue('test')).toBe("'test'")
    })

    it('シングルクォートをエスケープ', () => {
      expect(escapeSqlValue("it's")).toBe("'it''s'")
    })

    it('forceAllStringがtrueの場合、数値も文字列として扱う', () => {
      expect(escapeSqlValue('123', undefined, true)).toBe("'123'")
      expect(escapeSqlValue('001', undefined, true)).toBe("'001'")
    })

    it('forceTypeがnumberの場合、数値は引用符なし、非数値はNULL', () => {
      expect(escapeSqlValue('123', 'number')).toBe('123')
      expect(escapeSqlValue('abc', 'number')).toBe('NULL')
      expect(escapeSqlValue('', 'number')).toBe('NULL')
      expect(escapeSqlValue('  ', 'number')).toBe('NULL')
    })

    it('forceTypeがstringの場合、引用符あり', () => {
      expect(escapeSqlValue('123', 'string')).toBe("'123'")
    })
  })

  describe('sanitizeColumnName', () => {
    it('バッククォートで囲む', () => {
      expect(sanitizeColumnName('column')).toBe('`column`')
    })

    it('バッククォートをエスケープ', () => {
      expect(sanitizeColumnName('col`umn')).toBe('`col``umn`')
    })

    it('useBacktickがfalseの場合、そのまま返す', () => {
      expect(sanitizeColumnName('column', false)).toBe('column')
    })
  })

  describe('generateSingleInsert', () => {
    it('単一行INSERT文を生成', () => {
      const result = generateSingleInsert('users', ['id', 'name'], ['1', 'John'])
      expect(result).toBe("INSERT INTO `users` (`id`, `name`) VALUES (1, 'John');")
    })

    it('useBacktickがfalseの場合、バッククォートなし', () => {
      const result = generateSingleInsert('users', ['id', 'name'], ['1', 'John'], undefined, false)
      expect(result).toBe("INSERT INTO users (id, name) VALUES (1, 'John');")
    })

    it('forceAllStringがtrueの場合、全て文字列', () => {
      const result = generateSingleInsert('users', ['id', 'name'], ['1', 'John'], undefined, true, true)
      expect(result).toBe("INSERT INTO `users` (`id`, `name`) VALUES ('1', 'John');")
    })

    it('columnTypesを指定', () => {
      const result = generateSingleInsert('users', ['id', 'name'], ['1', 'John'], ['number', 'string'])
      expect(result).toBe("INSERT INTO `users` (`id`, `name`) VALUES (1, 'John');")
    })
  })

  describe('generateMultiInsert', () => {
    it('複数行INSERT文を生成', () => {
      const result = generateMultiInsert('users', ['id', 'name'], [['1', 'John'], ['2', 'Alice']])
      expect(result).toBe("INSERT INTO `users` (`id`, `name`) VALUES\n  (1, 'John'),\n  (2, 'Alice');")
    })

    it('useBacktickがfalseの場合、バッククォートなし', () => {
      const result = generateMultiInsert('users', ['id', 'name'], [['1', 'John']], undefined, false)
      expect(result).toBe("INSERT INTO users (id, name) VALUES\n  (1, 'John');")
    })

    it('forceAllStringがtrueの場合、全て文字列', () => {
      const result = generateMultiInsert('users', ['id', 'name'], [['1', 'John']], undefined, true, true)
      expect(result).toBe("INSERT INTO `users` (`id`, `name`) VALUES\n  ('1', 'John');")
    })
  })

  describe('generateInsertStatements', () => {
    it('単一行形式でINSERT文を生成', () => {
      const result = generateInsertStatements('users', ['id', 'name'], [['1', 'John'], ['2', 'Alice']], 'single')
      expect(result).toBe("INSERT INTO `users` (`id`, `name`) VALUES (1, 'John');\nINSERT INTO `users` (`id`, `name`) VALUES (2, 'Alice');")
    })

    it('複数行形式でINSERT文を生成', () => {
      const result = generateInsertStatements('users', ['id', 'name'], [['1', 'John'], ['2', 'Alice']], 'multi')
      expect(result).toBe("INSERT INTO `users` (`id`, `name`) VALUES\n  (1, 'John'),\n  (2, 'Alice');")
    })

    it('useBacktickとforceAllStringオプションを使用', () => {
      const result = generateInsertStatements('users', ['id', 'name'], [['001', 'John']], 'single', undefined, false, true)
      expect(result).toBe("INSERT INTO users (id, name) VALUES ('001', 'John');")
    })
  })

  describe('parseColumnOptions', () => {
    it('カンマ区切りのオプションをパース', () => {
      expect(parseColumnOptions('number,string,string')).toEqual(['number', 'string', 'string'])
    })

    it('タブ区切りのオプションをパース', () => {
      expect(parseColumnOptions('number\tstring\tstring', 'tsv')).toEqual(['number', 'string', 'string'])
    })

    it('エイリアスを正規化', () => {
      expect(parseColumnOptions('int,str,num,text')).toEqual(['number', 'string', 'number', 'string'])
    })

    it('不正な値をフィルタ', () => {
      expect(parseColumnOptions('number,invalid,string')).toEqual(['number', 'string'])
    })
  })
})
