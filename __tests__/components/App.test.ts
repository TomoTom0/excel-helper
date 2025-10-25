import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import App from '../../src/App.vue';

describe('App.vue', () => {
  const createWrapper = () => {
    return mount(App, {
      global: {
        plugins: [createPinia()],
      },
    });
  };

  describe('Rendering', () => {
    it('should render the sidebar with title', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('h1').text()).toBe('変換ツール');
    });

    it('should render all tabs', () => {
      const wrapper = createWrapper();
      const tabs = wrapper.findAll('.sidebar-nav li');
      expect(tabs).toHaveLength(2);
      expect(tabs[0].text()).toBe('固定長相互変換');
      expect(tabs[1].text()).toBe('ナンバリング行変換');
    });

    it('should have first tab active by default', () => {
      const wrapper = createWrapper();
      const tabs = wrapper.findAll('.sidebar-nav li');
      expect(tabs[0].classes()).toContain('active');
      expect(tabs[1].classes()).not.toContain('active');
    });

    it('should render FixedLengthConverter by default', () => {
      const wrapper = createWrapper();
      expect(wrapper.findComponent({ name: 'FixedLengthConverter' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'NumberingLineConverter' }).exists()).toBe(false);
    });
  });

  describe('Tab Switching', () => {
    it('should switch to NumberingLineConverter when second tab is clicked', async () => {
      const wrapper = createWrapper();
      const tabs = wrapper.findAll('.sidebar-nav li');
      
      await tabs[1].trigger('click');
      
      expect(tabs[0].classes()).not.toContain('active');
      expect(tabs[1].classes()).toContain('active');
      expect(wrapper.findComponent({ name: 'FixedLengthConverter' }).exists()).toBe(false);
      expect(wrapper.findComponent({ name: 'NumberingLineConverter' }).exists()).toBe(true);
    });

    it('should switch back to FixedLengthConverter when first tab is clicked', async () => {
      const wrapper = createWrapper();
      const tabs = wrapper.findAll('.sidebar-nav li');
      
      await tabs[1].trigger('click');
      await tabs[0].trigger('click');
      
      expect(tabs[0].classes()).toContain('active');
      expect(tabs[1].classes()).not.toContain('active');
      expect(wrapper.findComponent({ name: 'FixedLengthConverter' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'NumberingLineConverter' }).exists()).toBe(false);
    });
  });

  describe('Component Structure', () => {
    it('should have sidebar and main-content elements', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('.sidebar').exists()).toBe(true);
      expect(wrapper.find('.main-content').exists()).toBe(true);
    });

    it('should only show one converter at a time', async () => {
      const wrapper = createWrapper();
      
      // Initially FixedLengthConverter
      expect(wrapper.findComponent({ name: 'FixedLengthConverter' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'NumberingLineConverter' }).exists()).toBe(false);
      
      // Switch to NumberingLineConverter
      const tabs = wrapper.findAll('.sidebar-nav li');
      await tabs[1].trigger('click');
      
      expect(wrapper.findComponent({ name: 'FixedLengthConverter' }).exists()).toBe(false);
      expect(wrapper.findComponent({ name: 'NumberingLineConverter' }).exists()).toBe(true);
    });
  });
});
