import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNumberingStore } from '../../src/stores/numbering';

describe('NumberingLineConverter.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Store Integration', () => {
    it('should initialize store with default values', () => {
      const store = useNumberingStore();
      expect(store.dataBody).toBe('');
      expect(store.inputDelimiterType).toBe('auto');
      expect(store.outputDelimiterType).toBe('tsv');
      expect(store.outputFormat).toBe('circled');
    });

    it('should update dataBody in store', () => {
      const store = useNumberingStore();
      store.dataBody = 'test data';
      expect(store.dataBody).toBe('test data');
    });

    it('should update inputDelimiterType in store', () => {
      const store = useNumberingStore();
      store.inputDelimiterType = 'csv';
      expect(store.inputDelimiterType).toBe('csv');
    });

    it('should update outputDelimiterType in store', () => {
      const store = useNumberingStore();
      store.outputDelimiterType = 'csv';
      expect(store.outputDelimiterType).toBe('csv');
    });

    it('should update outputFormat in store', () => {
      const store = useNumberingStore();
      store.outputFormat = 'arabic';
      expect(store.outputFormat).toBe('arabic');
    });

    it('should clear dataBody', () => {
      const store = useNumberingStore();
      store.dataBody = 'test data';
      store.clearDataBody();
      expect(store.dataBody).toBe('');
    });
  });
});
