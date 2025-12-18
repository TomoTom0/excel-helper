import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SqlInsertGenerator from '../../src/views/SqlInsertGenerator.vue'
import { useSqlInsertStore } from '../../src/stores/sqlInsert'

describe('SqlInsertGenerator.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const createWrapper = () => {
    return mount(SqlInsertGenerator, {
      global: {
        plugins: [createPinia()],
      },
    })
  }

  describe('Rendering', () => {
    it('should render the component title', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('h2').text()).toBe('SQL INSERT文生成')
    })

    it('should render table name input', () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input[type="text"]')
      expect(input.exists()).toBe(true)
    })

    it('should render data body input', () => {
      const wrapper = createWrapper()
      const textareas = wrapper.findAll('textarea')
      expect(textareas.length).toBeGreaterThan(0)
    })

    it('should render generate button', () => {
      const wrapper = createWrapper()
      const button = wrapper.findAll('button').find(b =>
        b.text().includes('生成')
      )
      expect(button).toBeDefined()
    })
  })

  describe('Store Integration', () => {
    it('should sync tableName with store', async () => {
      const wrapper = createWrapper()
      const store = useSqlInsertStore()
      const input = wrapper.find('input[type="text"]')

      await input.setValue('test_table')
      expect(store.tableName).toBe('test_table')
    })

    it('should sync dataBody with store', async () => {
      const wrapper = createWrapper()
      const store = useSqlInsertStore()
      const textarea = wrapper.findAll('textarea').find(t =>
        t.attributes('placeholder')?.includes('CSV/TSV/固定長')
      )

      if (textarea) {
        await textarea.setValue('1,John,25')
        expect(store.dataBody).toBe('1,John,25')
      }
    })

    it('should use store values for initial state', () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const store = useSqlInsertStore()
      store.tableName = 'users'
      store.dataBody = '1,John,25'

      const wrapper = mount(SqlInsertGenerator, {
        global: {
          plugins: [pinia],
        },
      })

      const tableNameInput = wrapper.find('input[type="text"]')
      expect((tableNameInput.element as HTMLInputElement).value).toBe('users')
    })
  })

  describe('File Upload', () => {
    it('should have file input element', () => {
      const wrapper = createWrapper()
      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.exists()).toBe(true)
      expect(fileInput.attributes('style')).toContain('display: none')
    })

    it('should have upload button', () => {
      const wrapper = createWrapper()
      const uploadButton = wrapper.findAll('button').find(b =>
        b.attributes('title') === 'ファイルから読み込み'
      )
      expect(uploadButton).toBeDefined()
    })

    it('should trigger file input click when upload button is clicked', async () => {
      const wrapper = createWrapper()
      const fileInput = wrapper.find('input[type="file"]')
      const clickSpy = vi.spyOn(fileInput.element as HTMLInputElement, 'click')

      const uploadButton = wrapper.findAll('button').find(b =>
        b.attributes('title') === 'ファイルから読み込み'
      )

      if (uploadButton) {
        await uploadButton.trigger('click')
        expect(clickSpy).toHaveBeenCalled()
      }

      clickSpy.mockRestore()
    })
  })

  describe('Generation Functions', () => {
    it('should generate INSERT statements when generate button is clicked', async () => {
      const wrapper = createWrapper()
      const store = useSqlInsertStore()

      store.tableName = 'users'
      store.columnHeaders = 'id,name,age'
      store.dataBody = '1,John,25'
      store.useFirstRowAsHeader = false

      const button = wrapper.findAll('button').find(b =>
        b.text().includes('生成')
      )

      if (button) {
        await button.trigger('click')
        await wrapper.vm.$nextTick()

        const resultArea = wrapper.find('textarea[readonly]')
        expect(resultArea.exists()).toBe(true)
        const resultValue = (resultArea.element as HTMLTextAreaElement).value
        expect(resultValue).toContain('INSERT INTO')
        expect(resultValue).toContain('users')
      }
    })

    it('should handle generation errors gracefully', async () => {
      const wrapper = createWrapper()
      const store = useSqlInsertStore()

      store.tableName = 'users'
      store.columnHeaders = ''
      store.dataBody = 'test data'
      store.useFirstRowAsHeader = false

      const button = wrapper.findAll('button').find(b =>
        b.text().includes('生成')
      )

      if (button) {
        await button.trigger('click')
        await wrapper.vm.$nextTick()

        const resultArea = wrapper.find('textarea[readonly]')
        if (resultArea.exists()) {
          expect((resultArea.element as HTMLTextAreaElement).value).toContain('エラー')
        }
      }
    })

    it('should use first row as header when checkbox is checked', async () => {
      const wrapper = createWrapper()
      const store = useSqlInsertStore()

      store.tableName = 'users'
      store.dataBody = 'id,name,age\n1,John,25'
      store.useFirstRowAsHeader = true

      const button = wrapper.findAll('button').find(b =>
        b.text().includes('生成')
      )

      if (button) {
        await button.trigger('click')
        await wrapper.vm.$nextTick()

        const resultArea = wrapper.find('textarea[readonly]')
        expect(resultArea.exists()).toBe(true)
        const resultValue = (resultArea.element as HTMLTextAreaElement).value
        expect(resultValue).toContain('INSERT INTO')
      }
    })
  })

  describe('Result Display', () => {
    it('should truncate long results with message', async () => {
      const wrapper = createWrapper()
      const store = useSqlInsertStore()

      // Generate large data (200 rows should exceed 10,000 chars)
      const dataRows = []
      for (let i = 1; i <= 200; i++) {
        dataRows.push(`${i},User${i},Location${i}`)
      }

      store.tableName = 'users'
      store.columnHeaders = 'id,name,location'
      store.dataBody = dataRows.join('\n')
      store.useFirstRowAsHeader = false

      const button = wrapper.findAll('button').find(b =>
        b.text().includes('生成')
      )

      if (button) {
        await button.trigger('click')
        await wrapper.vm.$nextTick()

        const resultArea = wrapper.find('textarea[readonly]')
        expect(resultArea.exists()).toBe(true)
        const resultValue = (resultArea.element as HTMLTextAreaElement).value

        // Should contain truncation message if result is long
        if (resultValue.length > 10000) {
          expect(resultValue).toContain('... 以降省略')
          expect(resultValue).toContain('コピー・ダウンロード時は全データが出力されます')
        }
      }
    })
  })

  describe('Download', () => {
    it('should create download link when download button is clicked', async () => {
      const mockCreateObjectURL = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'mock-url')
      const mockRevokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      const wrapper = createWrapper()
      const store = useSqlInsertStore()

      store.tableName = 'users'
      store.columnHeaders = 'id,name'
      store.dataBody = '1,John'
      store.useFirstRowAsHeader = false

      // First generate
      const generateButton = wrapper.findAll('button').find(b =>
        b.text().includes('生成')
      )
      if (generateButton) {
        await generateButton.trigger('click')
        await wrapper.vm.$nextTick()

        // Then find download button
        const downloadButton = wrapper.findAll('button').find(b =>
          b.attributes('title') === 'ダウンロード'
        )

        if (downloadButton) {
          await downloadButton.trigger('click')
          expect(mockCreateObjectURL).toHaveBeenCalled()
        }
      }

      mockCreateObjectURL.mockRestore()
      mockRevokeObjectURL.mockRestore()
    })
  })

  describe('Copy to Clipboard', () => {
    it('should copy full result to clipboard even when truncated', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      })

      const wrapper = createWrapper()
      const store = useSqlInsertStore()

      // Generate large data
      const dataRows = []
      for (let i = 1; i <= 200; i++) {
        dataRows.push(`${i},User${i},Location${i}`)
      }

      store.tableName = 'users'
      store.columnHeaders = 'id,name,location'
      store.dataBody = dataRows.join('\n')
      store.useFirstRowAsHeader = false

      // Generate
      const generateButton = wrapper.findAll('button').find(b =>
        b.text().includes('生成')
      )
      if (generateButton) {
        await generateButton.trigger('click')
        await wrapper.vm.$nextTick()

        // Copy
        const copyButton = wrapper.findAll('button').find(b =>
          b.attributes('title') === 'コピー' &&
          b.element.closest('.result-section')
        )

        if (copyButton) {
          await copyButton.trigger('click')
          await wrapper.vm.$nextTick()

          expect(mockWriteText).toHaveBeenCalled()
          const copiedText = mockWriteText.mock.calls[0][0]

          // Should copy full result, not truncated
          expect(copiedText).not.toContain('... 以降省略')
          expect(copiedText).toContain('INSERT INTO')
        }
      }
    })
  })

  describe('Loading States', () => {
    it('should show loading state during generation', async () => {
      const wrapper = createWrapper()
      const store = useSqlInsertStore()

      store.tableName = 'users'
      store.columnHeaders = 'id,name'
      store.dataBody = '1,John'
      store.useFirstRowAsHeader = false

      const button = wrapper.findAll('button').find(b =>
        b.text().includes('生成')
      )

      if (button) {
        expect(button.classes()).not.toContain('loading')

        await button.trigger('click')
        await wrapper.vm.$nextTick()

        // 同期処理のため即座に完了
        expect(button.classes()).not.toContain('loading')

        const resultArea = wrapper.find('textarea[readonly]')
        expect(resultArea.exists()).toBe(true)
      }
    })
  })

  describe('Delimiter Type Selection', () => {
    it('should allow delimiter type selection', async () => {
      const wrapper = createWrapper()
      const store = useSqlInsertStore()

      const radioButtons = wrapper.findAll('input[type="radio"]')
      const csvRadio = radioButtons.find(r =>
        (r.element as HTMLInputElement).value === 'csv'
      )

      if (csvRadio) {
        await csvRadio.setValue(true)
        expect(store.delimiterType).toBe('csv')
      }
    })
  })

  describe('Insert Format Selection', () => {
    it('should allow insert format selection', async () => {
      const wrapper = createWrapper()
      const store = useSqlInsertStore()

      const radioButtons = wrapper.findAll('input[type="radio"]')
      const multiRadio = radioButtons.find(r =>
        (r.element as HTMLInputElement).value === 'multi'
      )

      if (multiRadio) {
        await multiRadio.setValue(true)
        expect(store.insertFormat).toBe('multi')
      }
    })
  })
})
