import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNumberingStore } from '../../src/stores/numbering'

describe('useNumberingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should have default values', () => {
    const store = useNumberingStore()
    
    expect(store.dataBody).toBe('')
    expect(store.dummyChar).toBe('x')
    expect(store.outputFormat).toBe('circled')
    expect(store.inputDelimiterType).toBe('auto')
    expect(store.outputDelimiterType).toBe('tsv')
    expect(store.detectPatterns).toEqual(['dummy', 'circled'])
  })

  it('should clear data body', () => {
    const store = useNumberingStore()
    store.dataBody = 'test data'
    
    store.clearDataBody()
    
    expect(store.dataBody).toBe('')
  })

  it('should clear dummy char to default', () => {
    const store = useNumberingStore()
    store.dummyChar = '*'
    
    store.clearDummyChar()
    
    expect(store.dummyChar).toBe('x')
  })

  it('should toggle pattern on', () => {
    const store = useNumberingStore()
    store.detectPatterns = ['dummy']
    
    store.togglePattern('circled')
    
    expect(store.detectPatterns).toContain('circled')
    expect(store.detectPatterns).toHaveLength(2)
  })

  it('should toggle pattern off', () => {
    const store = useNumberingStore()
    store.detectPatterns = ['dummy', 'circled']
    
    store.togglePattern('circled')
    
    expect(store.detectPatterns).not.toContain('circled')
    expect(store.detectPatterns).toEqual(['dummy'])
  })

  it('should update dataBody', () => {
    const store = useNumberingStore()
    
    store.dataBody = 'x項目A\nx項目B'
    
    expect(store.dataBody).toBe('x項目A\nx項目B')
  })

  it('should update dummyChar', () => {
    const store = useNumberingStore()
    
    store.dummyChar = '*'
    
    expect(store.dummyChar).toBe('*')
  })

  it('should update outputFormat', () => {
    const store = useNumberingStore()
    
    store.outputFormat = 'dotted'
    
    expect(store.outputFormat).toBe('dotted')
  })

  it('should update inputDelimiterType', () => {
    const store = useNumberingStore()
    
    store.inputDelimiterType = 'csv'
    
    expect(store.inputDelimiterType).toBe('csv')
  })

  it('should update outputDelimiterType', () => {
    const store = useNumberingStore()
    
    store.outputDelimiterType = 'csv'
    
    expect(store.outputDelimiterType).toBe('csv')
  })

  it('should handle multiple pattern toggles', () => {
    const store = useNumberingStore()
    store.detectPatterns = []
    
    store.togglePattern('circled')
    store.togglePattern('dotted')
    store.togglePattern('parenthesized')
    
    expect(store.detectPatterns).toEqual(['circled', 'dotted', 'parenthesized'])
    
    store.togglePattern('dotted')
    
    expect(store.detectPatterns).toEqual(['circled', 'parenthesized'])
  })
})
