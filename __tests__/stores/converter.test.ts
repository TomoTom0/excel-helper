import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useConverterStore } from '../../src/stores/converter';

describe('converterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Initial State', () => {
    it('should have empty columnLengths by default', () => {
      const store = useConverterStore();
      expect(store.columnLengths).toBe('');
    });

    it('should have empty dataBody by default', () => {
      const store = useConverterStore();
      expect(store.dataBody).toBe('');
    });

    it('should have empty columnTitles by default', () => {
      const store = useConverterStore();
      expect(store.columnTitles).toBe('');
    });

    it('should have empty columnOptions by default', () => {
      const store = useConverterStore();
      expect(store.columnOptions).toBe('');
    });

    it('should have "auto" as default delimiterType', () => {
      const store = useConverterStore();
      expect(store.delimiterType).toBe('auto');
    });

    it('should have "tsv" as default outputFormat', () => {
      const store = useConverterStore();
      expect(store.outputFormat).toBe('tsv');
    });
  });

  describe('State Updates', () => {
    it('should update columnLengths', () => {
      const store = useConverterStore();
      store.columnLengths = '10,20,30';
      expect(store.columnLengths).toBe('10,20,30');
    });

    it('should update dataBody', () => {
      const store = useConverterStore();
      store.dataBody = 'test data';
      expect(store.dataBody).toBe('test data');
    });

    it('should update columnTitles', () => {
      const store = useConverterStore();
      store.columnTitles = 'Name,Age,City';
      expect(store.columnTitles).toBe('Name,Age,City');
    });

    it('should update columnOptions', () => {
      const store = useConverterStore();
      store.columnOptions = 'trim,uppercase';
      expect(store.columnOptions).toBe('trim,uppercase');
    });

    it('should update delimiterType', () => {
      const store = useConverterStore();
      store.delimiterType = 'tab';
      expect(store.delimiterType).toBe('tab');
    });

    it('should update outputFormat', () => {
      const store = useConverterStore();
      store.outputFormat = 'csv';
      expect(store.outputFormat).toBe('csv');
    });
  });

  describe('Actions', () => {
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

    it('should clear columnTitles', () => {
      const store = useConverterStore();
      store.columnTitles = 'Name,Age,City';
      store.clearColumnTitles();
      expect(store.columnTitles).toBe('');
    });

    it('should clear columnOptions', () => {
      const store = useConverterStore();
      store.columnOptions = 'trim,uppercase';
      store.clearColumnOptions();
      expect(store.columnOptions).toBe('');
    });
  });

  describe('Multiple Instances', () => {
    it('should share state between multiple instances', () => {
      const store1 = useConverterStore();
      const store2 = useConverterStore();
      
      store1.dataBody = 'shared data';
      expect(store2.dataBody).toBe('shared data');
    });
  });
});
