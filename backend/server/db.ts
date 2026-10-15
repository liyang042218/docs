import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT_DIR = join(__dirname, '..')
export const DATA_DIR = join(ROOT_DIR, 'data')
export const UPLOAD_DIR = join(DATA_DIR, 'uploads')
const DB_FILE = join(DATA_DIR, 'db.json')

export interface User {
  id: string
  username: string
  password: string
  role: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  createdAt: string
}

export type ArticleStatus = 'published' | 'draft'

export interface Article {
  id: string
  title: string
  summary: string
  content: string
  cover: string
  categoryId: string | null
  tags: string[]
  status: ArticleStatus
  views: number
  createdAt: string
  updatedAt: string
}

export interface Settings {
  siteName: string
  siteDesc: string
  author: string
  footer: string
  icp: string
  github: string
  email: string
  heroTitle: string
  heroSubtitle: string
  about: string
}

export interface DB {
  users: User[]
  categories: Category[]
  articles: Article[]
  settings: Settings
}

export const now = () => new Date().toISOString()

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function seed(): DB {
  const ts = now()
  return {
    users: [
      {
        id: uid('u'),
        username: 'admin',
        // 默认密码 admin123，登录后请在右上角菜单中修改
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        createdAt: ts
      }
    ],
    categories: [
      { id: 'cat_start', name: '快速开始', slug: 'quick-start', description: '平台使用指南与快速上手教程', createdAt: ts },
      { id: 'cat_frontend', name: '前端开发', slug: 'frontend', description: 'Vue、TypeScript 与工程化实践', createdAt: ts },
      { id: 'cat_backend', name: '后端开发', slug: 'backend', description: 'Node.js、API 设计与部署运维', createdAt: ts }
    ],
    articles: [
      {
        id: 'art_welcome',
        title: '欢迎使用文档站管理系统',
        summary: '一个前后端分离、可自部署的文档 / 博客系统：后台在线写作，前台静态化部署到 GitHub Pages。',
        cover: '',
        categoryId: 'cat_start',
        tags: ['指南', '开始使用'],
        status: 'published',
        views: 0,
        content: `# 欢迎使用文档站管理系统

这是一个 **前后端分离** 的文档 / 博客系统：

- \`backend\`：Vue 3 + TypeScript + Element Plus 管理后台，配合 Express API 完成内容管理
- \`frontend\`：Nuxt 3 + Element Plus 博客前台，运行时读取后端数据，可静态部署到 GitHub Pages

## 你可以做什么

1. 在后台 **新建文章**，使用 Markdown 编写并上传封面与配图
2. 管理 **分类** 与标签，设置文章为草稿或发布
3. 在 **站点设置** 中修改站点名称、简介、页脚与关于页内容
4. 前台自动展示最新内容，无需重新打包即可更新文章

> 提示：默认管理员账号为 \`admin\`，密码 \`admin123\`，登录后请及时修改密码。
`,
        createdAt: ts,
        updatedAt: ts
      },
      {
        id: 'art_quickstart',
        title: '5 分钟本地启动指南',
        summary: '分别启动后端 API + 管理后台、Nuxt 前台，即可在本机完成完整的写作与浏览闭环。',
        cover: '',
        categoryId: 'cat_start',
        tags: ['指南', '本地开发'],
        status: 'published',
        views: 0,
        content: `# 5 分钟本地启动指南

## 1. 启动后端（API + 管理后台）

\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

- 管理后台：http://localhost:5173
- API 服务：http://localhost:3001

## 2. 启动前台博客

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

前台默认访问 http://localhost:3000 ，并从 \`http://localhost:3001\` 读取数据。

## 3. 生产构建

\`\`\`bash
cd backend
npm run build   # 构建管理后台到 dist/
npm start      # Express 同时托管 API、上传文件与管理后台
\`\`\`
`,
        createdAt: ts,
        updatedAt: ts
      },
      {
        id: 'art_stack',
        title: '技术选型说明：为什么是 Nuxt 3 + GitHub Pages',
        summary: 'Nuxt 3 支持预渲染与客户端最新数据获取，GitHub Pages 负责免费的静态托管，后端只需一台小服务器。',
        cover: '',
        categoryId: 'cat_frontend',
        tags: ['Nuxt', 'GitHub Pages', '架构'],
        status: 'published',
        views: 0,
        content: `# 技术选型说明

## 架构总览

\`\`\`
管理员浏览器 ──► 后台 Express（/api + /uploads + dist 静态页）
访客浏览器 ──► GitHub Pages（Nuxt generate 静态产物）──运行时──► /api
\`\`\`

## 为什么前台使用 Nuxt 3

- 构建时预渲染，首屏直出、对搜索引擎友好
- 客户端激活后重新拉取最新文章，后台发布的内容无需重新部署即可访问
- 文件式路由与自动导入，写页面非常轻量

## 为什么后台数据用 JSON 文件

- 零外部依赖，无需安装数据库即可运行
- 数据文件位于 \`backend/data/db.json\`，可直接备份
- 上传文件位于 \`backend/data/uploads/\`
`,
        createdAt: ts,
        updatedAt: ts
      }
    ],
    settings: {
      siteName: '码栈文档',
      siteDesc: '一个可自部署的文档 / 博客站点',
      author: '管理员',
      footer: '码栈文档 · Powered by Vue 3 / Nuxt 3 / Express',
      icp: '',
      github: '',
      email: '',
      heroTitle: '记录技术，沉淀知识',
      heroSubtitle: 'Vue 3 + Nuxt 3 驱动的文档博客，后台在线写作，前台一键部署到 GitHub Pages',
      about: `# 关于本站

这是一个开源可自部署的文档 / 博客系统示例。

- 后台：Vue 3 + TypeScript + Element Plus + Express
- 前台：Nuxt 3 + TypeScript + Element Plus
- 部署：静态产物发布到 GitHub Pages

你可以在后台的 **站点设置** 中修改本页内容。
`
    }
  }
}

let db: DB

function load(): DB {
  mkdirSync(UPLOAD_DIR, { recursive: true })
  if (existsSync(DB_FILE)) {
    const raw = readFileSync(DB_FILE, 'utf-8')
    return JSON.parse(raw) as DB
  }
  const seeded = seed()
  writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), 'utf-8')
  return seeded
}

db = load()

export function getDB(): DB {
  return db
}

let saveTimer: NodeJS.Timeout | null = null

/** 防抖落盘，避免高频写入 */
export function save(): void {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
  }, 100)
}

/** 立即落盘（关键操作使用） */
export function saveNow(): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
}
