import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useConverterStore } from '../../src/stores/converter';

describe('FixedLengthConverter.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Store Integration', () => {
    it('should initialize store with default values', () => {
      const store = useConverterStore();
      expect(store.columnLengths).toBe('');
      expect(store.dataBody).toBe('');
      expect(store.delimiterType).toBe('auto');
      expect(store.outputFormat).toBe('tsv');
    });

    it('should update columnLengths in store', () => {
      const store = useConverterStore();
      store.columnLengths = '10,20,30';
      expect(store.columnLengths).toBe('10,20,30');
    });

    it('should update dataBody in store', () => {
      const store = useConverterStore();
      store.dataBody = 'test data';
      expect(store.dataBody).toBe('test data');
    });

    it('should update delimiterType in store', () => {
      const store = useConverterStore();
      store.delimiterType = 'csv';
      expect(store.delimiterType).toBe('csv');
    });

    it('should update outputFormat in store', () => {
      const store = useConverterStore();
      store.outputFormat = 'tsv';
      expect(store.outputFormat).toBe('tsv');
    });

    it('should update forceAllString in store', () => {
      const store = useConverterStore();
      store.forceAllString = true;
      expect(store.forceAllString).toBe(true);
    });

    it('should clear columnLengths', () => {
      const store = useConverterStore();
      store.columnLengths = '10,20,30';
      store.clearColumnLengths();
      expect(store.columnLengths).toBe('');
    });

    it('should clear dataBody', () => {
      const store = useConverterStore();
      store.dataBody = 'test data';
      store.clearDataBody();
      expect(store.dataBody).toBe('');
    });
  });
});
