/** 博客前台使用的接口类型（与 backend/server 公开接口对应） */

export interface CategoryBase {
  id: string
  name: string
  slug: string
}

export interface BlogCategory extends CategoryBase {
  description: string
  articleCount: number
}

export interface BlogArticle {
  id: string
  title: string
  summary: string
  cover: string
  tags: string[]
  views: number
  createdAt: string
  updatedAt: string
  category: CategoryBase | null
}

export interface BlogArticleDetail extends BlogArticle {
  content: string
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface TagItem {
  name: string
  count: number
}

export interface SiteSettings {
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

export interface Overview {
  stats: {
    articleCount: number
    categoryCount: number
    totalViews: number
  }
  latest: BlogArticle[]
  serverTime: string
}

/** 获取后端地址（去掉结尾斜杠） */
export function useApiBase(): string {
  return String(useRuntimeConfig().public.apiBase || '').replace(/\/+$/, '')
}

/** 创建绑定后端地址的 $fetch 实例 */
export function useApi() {
  const baseURL = `${useApiBase()}/api`
  return $fetch.create({ baseURL, retry: 0, timeout: 15000 })
}

/** 将后端返回的相对资源路径（如 /uploads/a.png）补全为绝对地址 */
export function useAssetUrl(path?: string | null): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path
  const base = useApiBase()
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}
