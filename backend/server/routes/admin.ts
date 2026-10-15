import { Router } from 'express'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { extname } from 'node:path'
import { authRequired } from '../auth.js'
import {
  getDB,
  now,
  save,
  saveNow,
  uid,
  UPLOAD_DIR,
  type Article,
  type ArticleStatus,
  type Settings
} from '../db.js'

const router = Router()

router.use(authRequired)

/** 从 Markdown 提取纯文本用于自动摘要 */
function plainText(markdown: string, max = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s?/gm, '')
    .replace(/[*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  return [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))]
}

/* ---------------- 账号 ---------------- */

router.get('/profile', (req, res) => {
  const user = getDB().users.find((u) => u.id === (req as any).user?.id)
  if (!user) {
    res.status(404).json({ message: '用户不存在' })
    return
  }
  res.json({ id: user.id, username: user.username, role: user.role })
})

router.post('/profile/password', (req, res) => {
  const { oldPassword, newPassword } = req.body as {
    oldPassword?: string
    newPassword?: string
  }
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ message: '新密码至少 6 位' })
    return
  }
  const db = getDB()
  const user = db.users.find((u) => u.id === (req as any).user?.id)
  if (!user || !bcrypt.compareSync(oldPassword ?? '', user.password)) {
    res.status(400).json({ message: '原密码不正确' })
    return
  }
  user.password = bcrypt.hashSync(newPassword, 10)
  saveNow()
  res.json({ message: '密码修改成功' })
})

/* ---------------- 仪表盘统计 ---------------- */

router.get('/stats', (_req, res) => {
  const db = getDB()
  const articles = [...db.articles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  res.json({
    articleCount: db.articles.length,
    publishedCount: db.articles.filter((a) => a.status === 'published').length,
    draftCount: db.articles.filter((a) => a.status === 'draft').length,
    categoryCount: db.categories.length,
    totalViews: db.articles.reduce((sum, a) => sum + a.views, 0),
    recent: articles.slice(0, 6).map(({ content: _content, ...rest }) => rest)
  })
})

/* ---------------- 文章管理 ---------------- */

router.get('/articles', (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? '10'), 10) || 10))
  const status = String(req.query.status ?? '').trim()
  const category = String(req.query.category ?? '').trim()
  const keyword = String(req.query.keyword ?? '').trim().toLowerCase()

  let list = [...getDB().articles]
  if (status === 'published' || status === 'draft') list = list.filter((a) => a.status === status)
  if (category) list = list.filter((a) => a.categoryId === category)
  if (keyword) {
    list = list.filter(
      (a) => a.title.toLowerCase().includes(keyword) || a.summary.toLowerCase().includes(keyword)
    )
  }
  list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const total = list.length
  const start = (page - 1) * pageSize
  const pageList = list
    .slice(start, start + pageSize)
    .map(({ content: _content, ...rest }) => rest)
  res.json({ list: pageList, total, page, pageSize })
})

router.get('/articles/:id', (req, res) => {
  const article = getDB().articles.find((a) => a.id === req.params.id)
  if (!article) {
    res.status(404).json({ message: '文章不存在' })
    return
  }
  res.json(article)
})

router.post('/articles', (req, res) => {
  const body = req.body as Partial<Article>
  const title = String(body.title ?? '').trim()
  const content = String(body.content ?? '')
  if (!title) {
    res.status(400).json({ message: '文章标题不能为空' })
    return
  }
  const status: ArticleStatus = body.status === 'published' ? 'published' : 'draft'
  const ts = now()
  const article: Article = {
    id: uid('art'),
    title,
    content,
    summary: String(body.summary ?? '').trim() || plainText(content),
    cover: String(body.cover ?? '').trim(),
    categoryId: body.categoryId ?? null,
    tags: normalizeTags(body.tags),
    status,
    views: 0,
    createdAt: ts,
    updatedAt: ts
  }
  getDB().articles.push(article)
  saveNow()
  res.json(article)
})

router.put('/articles/:id', (req, res) => {
  const article = getDB().articles.find((a) => a.id === req.params.id)
  if (!article) {
    res.status(404).json({ message: '文章不存在' })
    return
  }
  const body = req.body as Partial<Article>
  if (body.title !== undefined) {
    const title = String(body.title).trim()
    if (!title) {
      res.status(400).json({ message: '文章标题不能为空' })
      return
    }
    article.title = title
  }
  if (body.content !== undefined) article.content = String(body.content)
  article.summary =
    body.summary !== undefined && String(body.summary).trim()
      ? String(body.summary).trim()
      : plainText(article.content)
  if (body.cover !== undefined) article.cover = String(body.cover ?? '').trim()
  if (body.categoryId !== undefined) article.categoryId = body.categoryId || null
  if (body.tags !== undefined) article.tags = normalizeTags(body.tags)
  if (body.status === 'published' || body.status === 'draft') article.status = body.status
  article.updatedAt = now()
  saveNow()
  res.json(article)
})

router.delete('/articles/:id', (req, res) => {
  const db = getDB()
  const index = db.articles.findIndex((a) => a.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ message: '文章不存在' })
    return
  }
  const [removed] = db.articles.splice(index, 1)
  saveNow()
  res.json({ id: removed.id })
})

/* ---------------- 分类管理 ---------------- */

router.get('/categories', (_req, res) => {
  const db = getDB()
  res.json(
    db.categories
      .map((c) => ({
        ...c,
        articleCount: db.articles.filter((a) => a.categoryId === c.id).length
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  )
})

router.post('/categories', (req, res) => {
  const name = String(req.body.name ?? '').trim()
  if (!name) {
    res.status(400).json({ message: '分类名称不能为空' })
    return
  }
  const db = getDB()
  if (db.categories.some((c) => c.name === name)) {
    res.status(409).json({ message: '分类名称已存在' })
    return
  }
  const category = {
    id: uid('cat'),
    name,
    slug: String(req.body.slug ?? '').trim() || uid('s'),
    description: String(req.body.description ?? '').trim(),
    createdAt: now()
  }
  db.categories.push(category)
  saveNow()
  res.json(category)
})

router.put('/categories/:id', (req, res) => {
  const category = getDB().categories.find((c) => c.id === req.params.id)
  if (!category) {
    res.status(404).json({ message: '分类不存在' })
    return
  }
  const name = String(req.body.name ?? '').trim()
  if (!name) {
    res.status(400).json({ message: '分类名称不能为空' })
    return
  }
  const db = getDB()
  if (db.categories.some((c) => c.id !== category.id && c.name === name)) {
    res.status(409).json({ message: '分类名称已存在' })
    return
  }
  category.name = name
  category.slug = String(req.body.slug ?? '').trim() || category.slug
  category.description = String(req.body.description ?? '').trim()
  saveNow()
  res.json(category)
})

router.delete('/categories/:id', (req, res) => {
  const db = getDB()
  const index = db.categories.findIndex((c) => c.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ message: '分类不存在' })
    return
  }
  const [removed] = db.categories.splice(index, 1)
  // 该分类下的文章转移为未分类
  for (const article of db.articles) {
    if (article.categoryId === removed.id) article.categoryId = null
  }
  saveNow()
  res.json({ id: removed.id })
})

/* ---------------- 站点设置 ---------------- */

router.get('/settings', (_req, res) => {
  res.json(getDB().settings)
})

router.put('/settings', (req, res) => {
  const current = getDB().settings
  const body = (req.body ?? {}) as Partial<Settings>
  const next: Settings = {
    siteName: body.siteName ?? current.siteName,
    siteDesc: body.siteDesc ?? current.siteDesc,
    author: body.author ?? current.author,
    footer: body.footer ?? current.footer,
    icp: body.icp ?? current.icp,
    github: body.github ?? current.github,
    email: body.email ?? current.email,
    heroTitle: body.heroTitle ?? current.heroTitle,
    heroSubtitle: body.heroSubtitle ?? current.heroSubtitle,
    about: body.about ?? current.about
  }
  getDB().settings = next
  saveNow()
  res.json(next)
})

/* ---------------- 文件上传 ---------------- */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase().slice(0, 12)
    cb(null, `${uid('img')}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('仅允许上传图片文件'))
    }
  }
})

router.post('/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ message: err.message || '上传失败' })
      return
    }
    if (!req.file) {
      res.status(400).json({ message: '未收到上传文件' })
      return
    }
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename })
  })
})

export default router
