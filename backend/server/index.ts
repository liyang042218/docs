import express from 'express'
import cors from 'cors'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT_DIR, UPLOAD_DIR } from './db.js'
import authRouter from './routes/auth.js'
import publicRouter from './routes/public.js'
import adminRouter from './routes/admin.js'

mkdirSync(UPLOAD_DIR, { recursive: true })

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 静态文件：上传的图片
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }))

// 路由
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }))
app.use('/api/auth', authRouter)
app.use('/api', publicRouter)
app.use('/api/admin', adminRouter)
app.use('/api', (_req, res) => res.status(404).json({ message: '接口不存在' }))

// 生产环境：托管构建后的管理后台（vite build -> dist/）
const ADMIN_DIST = join(ROOT_DIR, 'dist')
if (existsSync(ADMIN_DIST)) {
  app.use(express.static(ADMIN_DIST))
  app.get('*', (_req, res) => {
    res.sendFile(join(ADMIN_DIST, 'index.html'))
  })
} else {
  app.get('/', (_req, res) => {
    res.type('text/plain').send(
      'API 已启动。管理后台尚未构建：请先执行 `npm run build`，或使用 `npm run dev` 启动开发模式（http://localhost:5173）。'
    )
  })
}

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
  console.log('')
  console.log('  ✔ API 服务已启动')
  console.log(`  - 接口地址:  http://localhost:${PORT}/api`)
  console.log(`  - 健康检查:  http://localhost:${PORT}/api/health`)
  if (existsSync(ADMIN_DIST)) {
    console.log(`  - 管理后台:  http://localhost:${PORT}`)
  } else {
  console.log('  - 管理后台:  开发模式 http://localhost:5173 （npm run dev:admin）')
  }
  console.log('')
})
