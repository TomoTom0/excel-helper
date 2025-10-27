import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import App from '../../src/App.vue';
import FixedLengthConverter from '../../src/views/FixedLengthConverter.vue';
import NumberingLineConverter from '../../src/views/NumberingLineConverter.vue';

describe('App.vue', () => {
  const createWrapper = async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', redirect: '/fixed-length' },
        { path: '/fixed-length', name: 'fixed-length', component: FixedLengthConverter },
        { path: '/numbering-line', name: 'numbering-line', component: NumberingLineConverter },
      ],
    });
    
    router.push('/');
    await router.isReady();
    
    return mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    });
  };

  describe('Rendering', () => {
    it('should render the sidebar with title', async () => {
      const wrapper = await createWrapper();
      expect(wrapper.find('h1').text()).toBe('YT Excel Helper');
    });

    it('should render all tabs', async () => {
      const wrapper = await createWrapper();
      const tabs = wrapper.findAll('.sidebar-nav li');
      expect(tabs).toHaveLength(2);
      expect(tabs[0].text()).toBe('固定長相互変換');
      expect(tabs[1].text()).toBe('ナンバリング行変換');
    });

    it('should have first tab active by default', async () => {
      const wrapper = await createWrapper();
      const links = wrapper.findAll('.sidebar-nav li a');
      expect(links[0].classes()).toContain('router-link-active');
      expect(links[1].classes()).not.toContain('router-link-active');
    });

    it('should render FixedLengthConverter by default', async () => {
      const wrapper = await createWrapper();
      expect(wrapper.findComponent({ name: 'FixedLengthConverter' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'NumberingLineConverter' }).exists()).toBe(false);
    });
  });

  describe('Tab Switching', () => {
    it('should switch to NumberingLineConverter when second tab is clicked', async () => {
      const wrapper = await createWrapper();
      const links = wrapper.findAll('.sidebar-nav li a');
      
      await links[1].trigger('click');
      await flushPromises();
      
      expect(links[0].classes()).not.toContain('router-link-active');
      expect(links[1].classes()).toContain('router-link-active');
      expect(wrapper.findComponent({ name: 'FixedLengthConverter' }).exists()).toBe(false);
      expect(wrapper.findComponent({ name: 'NumberingLineConverter' }).exists()).toBe(true);
    });

    it('should switch back to FixedLengthConverter when first tab is clicked', async () => {
      const wrapper = await createWrapper();
      const links = wrapper.findAll('.sidebar-nav li a');
      
      await links[1].trigger('click');
      await flushPromises();
      await links[0].trigger('click');
      await flushPromises();
      
      expect(links[0].classes()).toContain('router-link-active');
      expect(links[1].classes()).not.toContain('router-link-active');
      expect(wrapper.findComponent({ name: 'FixedLengthConverter' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'NumberingLineConverter' }).exists()).toBe(false);
    });
  });

  describe('Component Structure', () => {
    it('should have sidebar and main-content elements', async () => {
      const wrapper = await createWrapper();
      expect(wrapper.find('.sidebar').exists()).toBe(true);
      expect(wrapper.find('.main-content').exists()).toBe(true);
    });

    it('should only show one converter at a time', async () => {
      const wrapper = await createWrapper();
      
      // Initially FixedLengthConverter
      expect(wrapper.findComponent({ name: 'FixedLengthConverter' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'NumberingLineConverter' }).exists()).toBe(false);
      
      // Switch to NumberingLineConverter
      const links = wrapper.findAll('.sidebar-nav li a');
      await links[1].trigger('click');
      await flushPromises();
      
      expect(wrapper.findComponent({ name: 'FixedLengthConverter' }).exists()).toBe(false);
      expect(wrapper.findComponent({ name: 'NumberingLineConverter' }).exists()).toBe(true);
    });
  });
});
