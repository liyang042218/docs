import { request } from './http'

/* ---------------- 类型定义 ---------------- */

export interface AdminUser {
  id: string
  username: string
  role: string
}

export interface LoginResult {
  token: string
  user: AdminUser
}

export type ArticleStatus = 'published' | 'draft'

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  createdAt: string
  articleCount?: number
}

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

export type ArticleListItem = Omit<Article, 'content'>

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
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

export interface DashboardStats {
  articleCount: number
  publishedCount: number
  draftCount: number
  categoryCount: number
  totalViews: number
  recent: ArticleListItem[]
}

export interface UploadResult {
  url: string
  filename: string
}

/* ---------------- 鉴权 ---------------- */

export const login = (data: { username: string; password: string }) =>
  request.post<LoginResult>('/auth/login', data)

export const getProfile = () => request.get<AdminUser>('/admin/profile')

export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
  request.post<{ message: string }>('/admin/profile/password', data)

/* ---------------- 仪表盘 ---------------- */

export const getDashboardStats = () => request.get<DashboardStats>('/admin/stats')

/* ---------------- 文章 ---------------- */

export interface ArticleQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: ArticleStatus | ''
  category?: string
}

export const fetchArticles = (params: ArticleQuery) =>
  request.get<PageResult<ArticleListItem>>('/admin/articles', { params })

export const fetchArticle = (id: string) => request.get<Article>(`/admin/articles/${id}`)

export const createArticle = (data: Partial<Article>) =>
  request.post<Article>('/admin/articles', data)

export const updateArticle = (id: string, data: Partial<Article>) =>
  request.put<Article>(`/admin/articles/${id}`, data)

export const deleteArticle = (id: string) =>
  request.delete<{ id: string }>(`/admin/articles/${id}`)

/* ---------------- 分类 ---------------- */

export const fetchCategories = () => request.get<Category[]>('/admin/categories')

export const createCategory = (data: Pick<Category, 'name' | 'slug' | 'description'>) =>
  request.post<Category>('/admin/categories', data)

export const updateCategory = (
  id: string,
  data: Pick<Category, 'name' | 'slug' | 'description'>
) => request.put<Category>(`/admin/categories/${id}`, data)

export const deleteCategory = (id: string) =>
  request.delete<{ id: string }>(`/admin/categories/${id}`)

/* ---------------- 设置 ---------------- */

export const fetchSettings = () => request.get<SiteSettings>('/admin/settings')

export const updateSettings = (data: Partial<SiteSettings>) =>
  request.put<SiteSettings>('/admin/settings', data)

/* ---------------- 上传 ---------------- */

export const uploadFile = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<UploadResult>('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
