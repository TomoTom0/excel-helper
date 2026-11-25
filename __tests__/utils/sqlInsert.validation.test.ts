import { describe, it, expect } from 'vitest'
import { validateColumnOptions } from '../../src/utils/sqlInsert'

describe('validateColumnOptions (SQL INSERT用)', () => {
  it('正しい入力では問題なし', () => {
    expect(validateColumnOptions('number,string')).toEqual([])
    expect(validateColumnOptions('number, string')).toEqual([])
    expect(validateColumnOptions('number')).toEqual([])
    expect(validateColumnOptions('number\tstring')).toEqual([])
  })

  it('型の別名と大文字小文字を許容する', () => {
    expect(validateColumnOptions('num,int,integer,str,text')).toEqual([])
    expect(validateColumnOptions('NUMBER,String')).toEqual([])
  })

  it('空入力は問題なし（未指定は呼び出し側の責務）', () => {
    expect(validateColumnOptions('')).toEqual([])
    expect(validateColumnOptions('   ')).toEqual([])
  })

  it('解釈できない型を箇所付きで報告する', () => {
    const problems = validateColumnOptions('number,foo,string')
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('2番目')
    expect(problems[0]).toContain('foo')
  })

  it('空の値を報告する（末尾カンマ・連続カンマ）', () => {
    expect(validateColumnOptions('number,,string')[0]).toContain('2番目')
    expect(validateColumnOptions('number,')[0]).toContain('2番目')
  })

  it('複数の誤りをすべて報告する', () => {
    const problems = validateColumnOptions('foo,,bar')
    expect(problems).toHaveLength(3)
  })
})
