import { describe, it, expect } from 'vitest'
import { transpose, flipVertical, flipHorizontal, transformAll } from '../../src/utils/tableTransform'

describe('tableTransform', () => {
  describe('transpose', () => {
    it('should transpose a simple 2x3 matrix', () => {
      const data = [
        ['a', 'b', 'c'],
        ['d', 'e', 'f']
      ]
      expect(transpose(data)).toEqual([
        ['a', 'd'],
        ['b', 'e'],
        ['c', 'f']
      ])
    })

    it('should handle empty array', () => {
      expect(transpose([])).toEqual([])
    })

    it('should handle single row', () => {
      expect(transpose([['a', 'b', 'c']])).toEqual([
        ['a'],
        ['b'],
        ['c']
      ])
    })

    it('should handle single column', () => {
      expect(transpose([['a'], ['b'], ['c']])).toEqual([
        ['a', 'b', 'c']
      ])
    })

    it('should handle ragged rows by filling with empty strings', () => {
      const data = [
        ['a', 'b', 'c'],
        ['d', 'e']
      ]
      expect(transpose(data)).toEqual([
        ['a', 'd'],
        ['b', 'e'],
        ['c', '']
      ])
    })
  })

  describe('flipVertical', () => {
    it('should reverse row order', () => {
      const data = [
        ['a', 'b'],
        ['c', 'd'],
        ['e', 'f']
      ]
      expect(flipVertical(data)).toEqual([
        ['e', 'f'],
        ['c', 'd'],
        ['a', 'b']
      ])
    })

    it('should not modify the original array', () => {
      const data = [['a'], ['b']]
      const result = flipVertical(data)
      expect(data).toEqual([['a'], ['b']])
      expect(result).toEqual([['b'], ['a']])
    })

    it('should handle empty array', () => {
      expect(flipVertical([])).toEqual([])
    })
  })

  describe('flipHorizontal', () => {
    it('should reverse column order', () => {
      const data = [
        ['a', 'b', 'c'],
        ['d', 'e', 'f']
      ]
      expect(flipHorizontal(data)).toEqual([
        ['c', 'b', 'a'],
        ['f', 'e', 'd']
      ])
    })

    it('should not modify the original array', () => {
      const data = [['a', 'b']]
      const result = flipHorizontal(data)
      expect(data).toEqual([['a', 'b']])
      expect(result).toEqual([['b', 'a']])
    })

    it('should handle empty array', () => {
      expect(flipHorizontal([])).toEqual([])
    })

    it('should handle rows with single column', () => {
      expect(flipHorizontal([['a'], ['b']])).toEqual([['a'], ['b']])
    })
  })

  describe('transformAll', () => {
    it('should return data unchanged when no transform types are given', () => {
      const data = [
        ['a', 'b'],
        ['c', 'd']
      ]
      expect(transformAll(data, [])).toEqual(data)
    })

    it('should apply a single transform', () => {
      const data = [
        ['a', 'b'],
        ['c', 'd']
      ]
      expect(transformAll(data, ['transpose'])).toEqual([
        ['a', 'c'],
        ['b', 'd']
      ])
    })

    it('should apply multiple transforms in the given order', () => {
      const data = [
        ['a', 'b'],
        ['c', 'd']
      ]
      // transpose -> flipVertical
      expect(transformAll(data, ['transpose', 'flipVertical'])).toEqual([
        ['b', 'd'],
        ['a', 'c']
      ])
    })

    it('should not modify the original array', () => {
      const data = [['a', 'b'], ['c', 'd']]
      const result = transformAll(data, ['flipHorizontal'])
      expect(data).toEqual([['a', 'b'], ['c', 'd']])
      expect(result).toEqual([['b', 'a'], ['d', 'c']])
    })
  })
})
