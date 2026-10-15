# 码栈文档 · 文档 / 博客系统

一个前后端分离、可自部署的文档 / 博客系统。

- **backend**：Vue 3 + TypeScript + Element Plus 管理后台，Express API，JSON 文件存储（`backend/data/db.json` + `backend/data/uploads/`）
- **frontend**：Nuxt 3 + TypeScript + Element Plus 博客前台，可静态部署到 GitHub Pages

```
管理员浏览器 ──► 后台 Express（/api + /uploads + dist 静态页）
访客浏览器 ──► GitHub Pages（nuxt generate 静态产物）──运行时──► 后端公网 /api
```

## 本地启动

```bash
# 后端（API + 管理后台）
cd backend
npm install
npm run dev          # 管理后台 http://localhost:5173 ，API http://localhost:3001

# 前台博客
cd frontend
npm install --legacy-peer-deps   # 规避 npm10 arborist 的 peer 解析 bug
npm run dev          # 前台 http://localhost:3000
```

默认管理员：`admin` / `admin123`（登录后请及时修改密码）。

## 部署到 GitHub Pages

GitHub Pages 只能托管**静态前台**；后端 API 需要单独部署到有公网地址的平台/服务器（见下文“后端部署”）。

### 1. 创建 GitHub 仓库并推送

1. 在 GitHub 网页新建一个**公开**仓库（例如 `docs-site`），不要勾选初始化 README（本仓库已含）。
2. 本地完成初始化并推送：

```bash
cd D:\project\docs
git init -b main
git add .
git commit -m "init: docs site backend + frontend"
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

### 2. 开启 GitHub Pages

仓库 **Settings → Pages** → Build and deployment → **Source 选择 “GitHub Actions”**（不要选分支）。保存后由仓库内的 `.github/workflows/deploy.yml` 负责构建与发布。

### 3. 配置后端地址（仓库变量）

仓库 **Settings → Secrets and variables → Actions → Variables → New repository variable**：

| 变量名 | 值 | 说明 |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | `https://你的后端公网地址` | **必填**。不带 `/api` 后缀、不带结尾斜杠。前台运行时与 CI 构建时都从这里拉数据 |
| `SITE_BASE` | 可选 | 默认按仓库名自动计算站点根路径；自定义域名或用户站点（`<user>.github.io`）可设为 `/` |

> 注意：CI 构建时（Ubuntu 构建机）会请求 `NUXT_PUBLIC_API_BASE` 预渲染首页/分类/关于页，因此**请先部署好后端并拿到公网地址，再推送触发部署**。

### 4. 推送触发部署

`git push` 到 `main` 后，在仓库 **Actions** 页查看 “Deploy blog to GitHub Pages” 运行。完成后访问 `https://<你的用户名>.github.io/<仓库名>/`。

## 后端部署

后端是 Express + JSON 文件存储，依赖**可持久化的文件系统**（`db.json`、`uploads/`）。可选方案见 README 对应章节，推荐顺序：

1. **国内云轻量服务器**（腾讯云/阿里云，新人/学生价低）——可控、持久、国内访问快，用 PM2 或 Docker 运行 `npm start`（生产模式 Express 同时托管 API、上传与管理后台）。
2. **Railway**（境外，新账号约 $5 试用额度）——挂载 Volume 持久化 `backend/data`。
3. **本地电脑 + 内网穿透**（frp / Tailscale / ngrok）——零成本，适合临时演示；电脑需保持开机。

部署后端时设置环境变量：`PORT`（默认 3001）、`JWT_SECRET`（务必改为随机强密钥）。

## 生产构建（可选，本地验证）

```bash
cd backend
npm run build   # 构建管理后台到 dist/
npm start       # Express 同时托管 API、上传与管理后台（http://localhost:3001）
```

## 目录结构

```
.
├── backend/                 # 管理后台 + API
│   ├── server/              # Express 服务（auth / public / admin 路由）
│   ├── src/                 # Vue3 管理后台源码
│   ├── data/                # db.json + uploads（运行时数据，不入库）
│   └── dist/                # 构建产物
├── frontend/                # Nuxt3 博客前台
│   ├── pages/               # 首页 / 文章详情 / 分类 / 关于
│   └── .output/             # nuxt generate 产物（部署内容）
└── .github/workflows/       # GitHub Pages 部署工作流
```
