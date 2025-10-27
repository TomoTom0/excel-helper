import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    server: {
      port: Number(env.VITE_PORT) || 5173,
    },
    plugins: [vue()],
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles: ['__tests__/setup.ts']
    }
  }
})
