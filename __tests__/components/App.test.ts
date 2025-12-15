import { describe, it, expect } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useConverterStore } from '../../src/stores/converter';
import { useSqlInsertStore } from '../../src/stores/sqlInsert';

describe('App.vue', () => {
  describe('Store Initialization', () => {
    it('should initialize converter store', () => {
      setActivePinia(createPinia());
      const store = useConverterStore();
      expect(store).toBeDefined();
      expect(store.columnLengths).toBe('');
      expect(store.dataBody).toBe('');
    });

    it('should initialize SQL insert store', () => {
      setActivePinia(createPinia());
      const store = useSqlInsertStore();
      expect(store).toBeDefined();
      expect(store.tableName).toBe('');
      expect(store.dataBody).toBe('');
    });
  });

  describe('Store Persistence', () => {
    it('should have Pinia store available', () => {
      const pinia = createPinia();
      expect(pinia).toBeDefined();
    });
  });
});
