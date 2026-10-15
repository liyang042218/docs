import { Router } from 'express'
import type { Article, Category } from '../db.js'
import { getDB, now, save } from '../db.js'

const router = Router()

interface ArticleWithCategory extends Omit<Article, 'categoryId'> {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
}

function decorate(article: Article): ArticleWithCategory {
  const { categoryId, ...rest } = article
  const category = getDB().categories.find((c) => c.id === categoryId)
  return {
    ...rest,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null
  }
}

/** GET /api/settings 公开站点设置 */
router.get('/settings', (_req, res) => {
  res.json(getDB().settings)
})

/** GET /api/categories 分类（含已发布文章数） */
router.get('/categories', (_req, res) => {
  const db = getDB()
  const list = db.categories.map((c) => ({
    ...c,
    articleCount: db.articles.filter((a) => a.status === 'published' && a.categoryId === c.id).length
  }))
  res.json(list)
})

/** GET /api/tags 标签云（仅统计已发布文章） */
router.get('/tags', (_req, res) => {
  const counter = new Map<string, number>()
  for (const article of getDB().articles) {
    if (article.status !== 'published') continue
    for (const tag of article.tags) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1)
    }
  }
  res.json(
    [...counter.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  )
})

/**
 * GET /api/articles 已发布文章分页
 * query: page, pageSize, category(分类 id), tag, keyword
 */
router.get('/articles', (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? '10'), 10) || 10))
  const category = String(req.query.category ?? '').trim()
  const tag = String(req.query.tag ?? '').trim()
  const keyword = String(req.query.keyword ?? '').trim().toLowerCase()

  let list = getDB().articles.filter((a) => a.status === 'published')
  if (category) list = list.filter((a) => a.categoryId === category)
  if (tag) list = list.filter((a) => a.tags.includes(tag))
  if (keyword) {
    list = list.filter(
      (a) => a.title.toLowerCase().includes(keyword) || a.summary.toLowerCase().includes(keyword)
    )
  }
  list = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const total = list.length
  const start = (page - 1) * pageSize
  const pageList = list
    .slice(start, start + pageSize)
    .map(({ content: _content, ...rest }) => decorate(rest as Article))

  res.json({ list: pageList, total, page, pageSize })
})

/** GET /api/articles/:id 文章详情（不产生副作用，浏览量见 POST .../view） */
router.get('/articles/:id', (req, res) => {
  const article = getDB().articles.find(
    (a) => a.id === req.params.id && a.status === 'published'
  )
  if (!article) {
    res.status(404).json({ message: '文章不存在或尚未发布' })
    return
  }
  res.json(decorate(article))
})

/** POST /api/articles/:id/view 客户端上报浏览量 */
router.post('/articles/:id/view', (req, res) => {
  const article = getDB().articles.find(
    (a) => a.id === req.params.id && a.status === 'published'
  )
  if (!article) {
    res.status(404).json({ message: '文章不存在' })
    return
  }
  article.views += 1
  save()
  res.json({ views: article.views })
})

/** GET /api/overview 首页概览：统计 + 最新文章 */
router.get('/overview', (_req, res) => {
  const db = getDB()
  const published = db.articles.filter((a) => a.status === 'published')
  const totalViews = published.reduce((sum, a) => sum + a.views, 0)
  const latest = [...published]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)
    .map(({ content: _content, ...rest }) => decorate(rest as Article))
  res.json({
    stats: {
      articleCount: published.length,
      categoryCount: db.categories.length,
      totalViews
    },
    latest,
    serverTime: now()
  })
})

export default router
