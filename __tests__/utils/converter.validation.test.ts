import { describe, it, expect } from 'vitest'
import { validateColumnLengths, validateColumnOptions } from '../../src/utils/converter'

describe('validateColumnLengths', () => {
  it('正しい入力では問題なし', () => {
    expect(validateColumnLengths('10,20,15')).toEqual([])
    expect(validateColumnLengths('10, 20, 15')).toEqual([])
    expect(validateColumnLengths('10\t20\t15')).toEqual([])
    expect(validateColumnLengths('5')).toEqual([])
  })

  it('空入力は問題なし（未指定は呼び出し側の責務）', () => {
    expect(validateColumnLengths('')).toEqual([])
    expect(validateColumnLengths('   ')).toEqual([])
  })

  it('数値でない値を箇所付きで報告する', () => {
    const problems = validateColumnLengths('10,abc,15')
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('2番目')
    expect(problems[0]).toContain('abc')
  })

  it('空の値を報告する（末尾カンマ・連続カンマ）', () => {
    expect(validateColumnLengths('10,,15')[0]).toContain('2番目')
    expect(validateColumnLengths('10,15,')[0]).toContain('3番目')
  })

  it('0と負の数を正の整数でないとして報告する', () => {
    expect(validateColumnLengths('10,0,15')[0]).toContain('0')
    expect(validateColumnLengths('10,-5,15')[0]).toContain('-5')
  })

  it('小数を整数でないとして報告する', () => {
    const problems = validateColumnLengths('10.5,20')
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('10.5')
  })

  it('複数の誤りをすべて報告する', () => {
    const problems = validateColumnLengths('abc,,10.5')
    expect(problems).toHaveLength(3)
  })
})

describe('validateColumnOptions', () => {
  it('正しい入力では問題なし', () => {
    expect(validateColumnOptions('string:right,number:left:0')).toEqual([])
    expect(validateColumnOptions('string')).toEqual([])
    expect(validateColumnOptions('STRING:RIGHT,NUMBER:LEFT')).toEqual([])
    expect(validateColumnOptions('string:right:_')).toEqual([])
  })

  it('空入力は問題なし', () => {
    expect(validateColumnOptions('')).toEqual([])
    expect(validateColumnOptions('   ')).toEqual([])
  })

  it('不正な型を箇所付きで報告する', () => {
    const problems = validateColumnOptions('string:right,invalid,number:left')
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('2番目')
    expect(problems[0]).toContain('invalid')
  })

  it('不正な揃え指定を報告する', () => {
    const problems = validateColumnOptions('string:lfet')
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('left')
    expect(problems[0]).toContain('right')
  })

  it('空の値を報告する', () => {
    expect(validateColumnOptions('string,,number')[0]).toContain('2番目')
  })

  it('揃えを省略した項目は問題なし', () => {
    expect(validateColumnOptions('number,string:right')).toEqual([])
  })
})
