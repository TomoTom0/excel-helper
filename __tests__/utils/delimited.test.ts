import { describe, it, expect } from 'vitest'
import { toCSV, toTSV, parseCSV, parseTSV, parsePipe, parseFrame, toPipe, toMarkdown, toHtmlTable } from '../../src/utils/delimited'

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

  describe('parsePipe', () => {
    it('PostgreSQLパイプ区切り形式をパースできる', () => {
      const input = ' id | name     | value\n----+----------+-------\n  1 | Alice    |   100\n  2 | Bob      |   200'
      const result = parsePipe(input)
      expect(result).toEqual([
        ['id', 'name', 'value'],
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200']
      ])
    })

    it('パイプで始まり終わる行をパースできる', () => {
      const input = '| id | name |\n|----|------|\n|  1 | Alice|'
      const result = parsePipe(input)
      expect(result).toEqual([
        ['id', 'name'],
        ['1', 'Alice']
      ])
    })

    it('空行をスキップする', () => {
      const input = ' id | name\n\n----+------\n  1 | Alice\n\n  2 | Bob'
      const result = parsePipe(input)
      expect(result).toEqual([
        ['id', 'name'],
        ['1', 'Alice'],
        ['2', 'Bob']
      ])
    })

    it('空のカラムを含む行を処理できる', () => {
      const input = '| a |  | c |'
      const result = parsePipe(input)
      expect(result).toEqual([['a', '', 'c']])
    })

    it('行頭・行末にパイプがない空カラムを処理できる', () => {
      const input = 'a | | c'
      const result = parsePipe(input)
      expect(result).toEqual([['a', '', 'c']])
    })

    it('MySQL表形式をパースできる', () => {
      const input = '+----+----------+-------+\n| id | name     | value |\n+----+----------+-------+\n|  1 | Alice    |   100 |\n|  2 | Bob      |   200 |\n+----+----------+-------+'
      const result = parsePipe(input)
      expect(result).toEqual([
        ['id', 'name', 'value'],
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200']
      ])
    })

    it('MySQL表形式（ヘッダーなし）をパースできる', () => {
      const input = '+---+-------+-----+\n| 1 | Alice | 100 |\n| 2 | Bob   | 200 |\n+---+-------+-----+'
      const result = parsePipe(input)
      expect(result).toEqual([
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200']
      ])
    })

    it('PostgreSQL形式（ヘッダーなし）をパースできる', () => {
      const input = '  1 | Alice    |   100\n  2 | Bob      |   200'
      const result = parsePipe(input)
      expect(result).toEqual([
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200']
      ])
    })

    it('MySQL表形式（末尾区切り線なし）をパースできる', () => {
      const input = '+----+------+-------+\n| id | name | value |\n+----+------+-------+\n|  1 | Alice|   100 |\n|  2 | Bob  |   200 |'
      const result = parsePipe(input)
      expect(result).toEqual([
        ['id', 'name', 'value'],
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200']
      ])
    })

    it('Markdown表形式をパースできる', () => {
      const input = '| id | name     | value |\n|----|----------|-------|\n|  1 | Alice    |   100 |\n|  2 | Bob      |   200 |'
      const result = parsePipe(input)
      expect(result).toEqual([
        ['id', 'name', 'value'],
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200']
      ])
    })

    it('Markdown表形式（アライメント指定あり）をパースできる', () => {
      const input = '| id | name     | value |\n|:---|:--------:|------:|\n|  1 | Alice    |   100 |\n|  2 | Bob      |   200 |'
      const result = parsePipe(input)
      expect(result).toEqual([
        ['id', 'name', 'value'],
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200']
      ])
    })

    it('Markdown表形式（ヘッダーなし）をパースできる', () => {
      const input = '| 1 | Alice | 100 |\n| 2 | Bob   | 200 |'
      const result = parsePipe(input)
      expect(result).toEqual([
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200']
      ])
    })
  })

  describe('parseFrame', () => {
    it('frame-table形式をパースできる', () => {
      const input = '┌───────────────┬────────┬────────────┐\n│  Model / Bot  │ AvgPen │ Normalized │\n├───────────────┼────────┼────────────┤\n│ pmc:100:1.0   │ 6.38   │ 2.16       │\n├───────────────┼────────┼────────────┤\n│ counting      │ 7.78   │ 1.72       │\n└───────────────┴────────┴────────────┘'
      const result = parseFrame(input)
      expect(result).toEqual([
        ['Model / Bot', 'AvgPen', 'Normalized'],
        ['pmc:100:1.0', '6.38', '2.16'],
        ['counting', '7.78', '1.72']
      ])
    })

    it('セパレータ行のみのframe-tableをパースできる（データなし）', () => {
      const input = '┌────┬──────┐\n└────┴──────┘'
      const result = parseFrame(input)
      expect(result).toEqual([])
    })

    it('空行をスキップする', () => {
      const input = '┌────┬──────┐\n│ id │ name │\n├────┼──────┤\n\n│  1 │ Alice│\n└────┴──────┘'
      const result = parseFrame(input)
      expect(result).toEqual([
        ['id', 'name'],
        ['1', 'Alice']
      ])
    })

    it('空のカラムを含む行を処理できる', () => {
      const input = '┌───┬───┬───┐\n│ a │   │ c │\n└───┴───┴───┘'
      const result = parseFrame(input)
      expect(result).toEqual([['a', '', 'c']])
    })

    it('全て空セルのデータ行をスキップしない', () => {
      const input = '┌───┬───┬───┐\n│ a │ b │ c │\n├───┼───┼───┤\n│   │   │   │\n├───┼───┼───┤\n│ d │ e │ f │\n└───┴───┴───┘'
      const result = parseFrame(input)
      expect(result).toEqual([
        ['a', 'b', 'c'],
        ['', '', ''],
        ['d', 'e', 'f']
      ])
    })

    it('ヘッダーなしのframe-tableをパースできる', () => {
      const input = '┌───┬───────┬─────┐\n│ 1 │ Alice │ 100 │\n│ 2 │ Bob   │ 200 │\n└───┴───────┴─────┘'
      const result = parseFrame(input)
      expect(result).toEqual([
        ['1', 'Alice', '100'],
        ['2', 'Bob', '200']
      ])
    })

    it('末尾セパレータなしのframe-tableをパースできる', () => {
      const input = '┌────┬──────┐\n│ id │ name │\n├────┼──────┤\n│  1 │ Alice│\n│  2 │ Bob  │'
      const result = parseFrame(input)
      expect(result).toEqual([
        ['id', 'name'],
        ['1', 'Alice'],
        ['2', 'Bob']
      ])
    })
  })

  describe('toPipe', () => {
    it('パイプ区切り形式に変換できる', () => {
      const data = [['id', 'name', 'value'], ['1', 'Alice', '100'], ['2', 'Bob', '200']]
      const result = toPipe(data)
      const lines = result.split('\n')
      expect(lines[0]).toBe(' id | name  | value ')
      expect(lines[1]).toBe('----+-------+-------')
      expect(lines[2]).toBe(' 1  | Alice | 100   ')
      expect(lines[3]).toBe(' 2  | Bob   | 200   ')
    })

    it('空データを処理できる', () => {
      const data: string[][] = []
      const result = toPipe(data)
      expect(result).toBe('')
    })
  })

  describe('toMarkdown', () => {
    it('Markdown表形式に変換できる', () => {
      const data = [['id', 'name', 'value'], ['1', 'Alice', '100'], ['2', 'Bob', '200']]
      const result = toMarkdown(data)
      const lines = result.split('\n')
      expect(lines[0]).toBe('| id  | name  | value |')
      expect(lines[1]).toBe('| --- | ----- | ----- |')
      expect(lines[2]).toBe('| 1   | Alice | 100   |')
      expect(lines[3]).toBe('| 2   | Bob   | 200   |')
    })

    it('空データを処理できる', () => {
      const data: string[][] = []
      const result = toMarkdown(data)
      expect(result).toBe('')
    })

    it('短いカラム名でも最低3文字の幅を確保する', () => {
      const data = [['a', 'b'], ['1', '2']]
      const result = toMarkdown(data)
      const lines = result.split('\n')
      expect(lines[0]).toBe('| a   | b   |')
      expect(lines[1]).toBe('| --- | --- |')
    })
  })

  describe('toHtmlTable', () => {
    it('HTML表形式に変換できる', () => {
      const data = [['id', 'name', 'value'], ['1', 'Alice', '100'], ['2', 'Bob', '200']]
      const result = toHtmlTable(data)
      const lines = result.split('\n')
      expect(lines[0]).toBe('<table>')
      expect(lines[1]).toBe('  <tr>')
      expect(lines[2]).toBe('    <th>id</th>')
      expect(lines[3]).toBe('    <th>name</th>')
      expect(lines[4]).toBe('    <th>value</th>')
      expect(lines[5]).toBe('  </tr>')
      expect(lines[6]).toBe('  <tr>')
      expect(lines[7]).toBe('    <td>1</td>')
      expect(lines[8]).toBe('    <td>Alice</td>')
      expect(lines[9]).toBe('    <td>100</td>')
      expect(lines[10]).toBe('  </tr>')
    })

    it('空データを処理できる', () => {
      const data: string[][] = []
      const result = toHtmlTable(data)
      expect(result).toBe('')
    })

    it('HTML特殊文字をエスケープする', () => {
      const data = [['name', 'desc'], ['<script>', 'a & b < c > d "e" \'f\'']]
      const result = toHtmlTable(data)
      expect(result).toContain('&lt;script&gt;')
      expect(result).toContain('a &amp; b &lt; c &gt; d &quot;e&quot; &#039;f&#039;')
    })
  })
})
