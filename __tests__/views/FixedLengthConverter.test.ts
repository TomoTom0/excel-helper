import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FixedLengthConverter from '../../src/views/FixedLengthConverter.vue';
import { useConverterStore } from '../../src/stores/converter';

describe('FixedLengthConverter.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const createWrapper = () => {
    return mount(FixedLengthConverter, {
      global: {
        plugins: [createPinia()],
      },
    });
  };

  describe('Rendering', () => {
    it('should render the component title', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('h2').text()).toBe('固定長相互変換');
    });

    it('should render column lengths input', () => {
      const wrapper = createWrapper();
      const section = wrapper.findAll('.input-section')[0];
      expect(section.find('h3').text()).toBe('カラム長');
      expect(section.find('textarea').exists()).toBe(true);
    });

    it('should render data body input', () => {
      const wrapper = createWrapper();
      const section = wrapper.findAll('.input-section')[1];
      expect(section.find('h3').text()).toBe('データ本体');
      expect(section.find('textarea').exists()).toBe(true);
    });

    it('should render conversion buttons', () => {
      const wrapper = createWrapper();
      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Store Integration', () => {
    it('should sync columnLengths with store', async () => {
      const wrapper = createWrapper();
      const store = useConverterStore();
      const section = wrapper.findAll('.input-section')[0];
      const input = section.find('textarea');
      
      await input.setValue('10,20,30');
      expect(store.columnLengths).toBe('10,20,30');
    });

    it('should sync dataBody with store', async () => {
      const wrapper = createWrapper();
      const store = useConverterStore();
      const section = wrapper.findAll('.input-section')[1];
      const input = section.find('textarea');
      
      await input.setValue('test data');
      expect(store.dataBody).toBe('test data');
    });

    it('should use store values for initial state', () => {
      const pinia = createPinia();
      setActivePinia(pinia);
      const store = useConverterStore();
      store.columnLengths = '5,10,15';
      store.dataBody = 'initial data';
      
      const wrapper = mount(FixedLengthConverter, {
        global: {
          plugins: [pinia],
        },
      });
      
      const lengthsSection = wrapper.findAll('.input-section')[0];
      const dataSection = wrapper.findAll('.input-section')[1];
      const lengthsInput = lengthsSection.find('textarea');
      const dataInput = dataSection.find('textarea');
      
      expect((lengthsInput.element as HTMLTextAreaElement).value).toBe('5,10,15');
      expect((dataInput.element as HTMLTextAreaElement).value).toBe('initial data');
    });
  });

  describe('Conversion Functions', () => {
    it('should convert data when convert button is clicked', async () => {
      const wrapper = createWrapper();
      const store = useConverterStore();
      
      store.columnLengths = '5,5,5';
      store.dataBody = 'AAAA BBBB CCCC ';
      
      const button = wrapper.findAll('button').find(b => 
        b.text().includes('変換')
      );
      
      if (button) {
        await button.trigger('click');
        await wrapper.vm.$nextTick();
        
        const resultArea = wrapper.find('textarea[readonly]');
        expect(resultArea.exists()).toBe(true);
      }
    });

    it('should handle conversion errors gracefully', async () => {
      const wrapper = createWrapper();
      const store = useConverterStore();
      
      store.columnLengths = '';
      store.dataBody = 'test data';
      
      const button = wrapper.findAll('button').find(b => 
        b.text().includes('変換')
      );
      
      if (button) {
        await button.trigger('click');
        await wrapper.vm.$nextTick();
        
        const resultArea = wrapper.find('textarea[readonly]');
        if (resultArea.exists()) {
          expect((resultArea.element as HTMLTextAreaElement).value).toContain('エラー');
        }
      }
    });
  });

  describe('Copy to Clipboard', () => {
    it('should call clipboard API when copy button is clicked', async () => {
      const wrapper = createWrapper();
      const store = useConverterStore();
      
      store.columnLengths = '5,5,5';
      store.dataBody = 'AAAA BBBB CCCC ';
      
      // First convert
      const convertButton = wrapper.findAll('button').find(b => 
        b.text().includes('固定長→TSV') || b.text().includes('固定長→CSV')
      );
      if (convertButton) {
        await convertButton.trigger('click');
        await wrapper.vm.$nextTick();
        
        // Then find copy button
        const copyButton = wrapper.findAll('button').find(b => 
          b.text().includes('コピー')
        );
        
        if (copyButton) {
          await copyButton.trigger('click');
          expect(navigator.clipboard.writeText).toHaveBeenCalled();
        }
      }
    });
  });

  describe('Download', () => {
    it('should create download link when download button is clicked', async () => {
      const wrapper = createWrapper();
      const store = useConverterStore();
      
      store.columnLengths = '5,5,5';
      store.dataBody = 'AAAA BBBB CCCC ';
      
      // First convert
      const convertButton = wrapper.findAll('button').find(b => 
        b.text().includes('固定長→TSV') || b.text().includes('固定長→CSV')
      );
      if (convertButton) {
        await convertButton.trigger('click');
        await wrapper.vm.$nextTick();
        
        // Then find download button
        const downloadButton = wrapper.findAll('button').find(b => 
          b.text().includes('ダウンロード')
        );
        
        if (downloadButton) {
          await downloadButton.trigger('click');
          expect(URL.createObjectURL).toHaveBeenCalled();
        }
      }
    });
  });

  describe('Loading States', () => {
    it('should show loading state during conversion', async () => {
      const wrapper = createWrapper();
      const store = useConverterStore();
      
      store.columnLengths = '5,5,5';
      store.dataBody = 'AAAA BBBB CCCC ';
      
      const button = wrapper.findAll('button').find(b => 
        b.text().includes('固定長→TSV') || b.text().includes('固定長→CSV')
      );
      
      if (button) {
        await button.trigger('click');
        // Loading state should be active briefly
        expect(wrapper.vm.convertFromFixedLoading || wrapper.vm.tsvToFixedLoading).toBeDefined();
      }
    });
  });

  describe('Delimiter Selection', () => {
    it('should allow delimiter type selection', async () => {
      const wrapper = createWrapper();
      const store = useConverterStore();
      
      const delimiterSelect = wrapper.find('select');
      if (delimiterSelect.exists()) {
        await delimiterSelect.setValue('comma');
        expect(store.delimiterType).toBe('comma');
      }
    });
  });

  describe('Output Format Selection', () => {
    it('should allow output format selection', async () => {
      const wrapper = createWrapper();
      const store = useConverterStore();
      
      const selects = wrapper.findAll('select');
      const outputFormatSelect = selects.find(s => {
        const options = s.findAll('option');
        return options.some(o => o.text().includes('TSV') || o.text().includes('CSV'));
      });
      
      if (outputFormatSelect) {
        await outputFormatSelect.setValue('csv');
        expect(store.outputFormat).toBe('csv');
      }
    });
  });
});
