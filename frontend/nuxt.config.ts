// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  modules: ['@element-plus/nuxt'],

  css: ['~/assets/css/main.css', 'highlight.js/styles/github.css'],

  // GitHub Pages 项目站点部署在 /<repo-name>/ 下，由 NUXT_APP_BASE_URL 注入
  // 用户站点（<user>.github.io）或自定义域名时保持 '/'
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: '文档博客',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: '一个由 Nuxt 3 与 Element Plus 驱动的文档 / 博客站点'
        }
      ],
      link: [
        {
          rel: 'icon',
          href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%232563eb'/><path d='M30 24h28a14 14 0 0114 14v38H44a14 14 0 00-14 14z' fill='white'/></svg>"
        }
      ]
    }
  },

  runtimeConfig: {
    public: {
      // 后台 API 地址：本地默认 http://localhost:3001
      // 部署时通过 NUXT_PUBLIC_API_BASE 指定线上后端
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001'
    }
  },

  nitro: {
    // GitHub Pages 静态托管预设（自动生成 404.html 与 .nojekyll）
    preset: 'github_pages',
    prerender: {
      crawlLinks: true,
      routes: ['/', '/categories', '/about']
    }
  }
})
