import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 管理后台构建配置（Vite）
// 开发时 /api 与 /uploads 代理到 Express（http://localhost:3001）
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500
  }
})
