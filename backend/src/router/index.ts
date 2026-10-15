import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    component: () => import('../layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'articles',
        name: 'articles',
        component: () => import('../views/ArticleList.vue'),
        meta: { title: '文章管理' }
      },
      {
        path: 'articles/create',
        name: 'article-create',
        component: () => import('../views/ArticleEdit.vue'),
        meta: { title: '写文章' }
      },
      {
        path: 'articles/:id/edit',
        name: 'article-edit',
        component: () => import('../views/ArticleEdit.vue'),
        meta: { title: '编辑文章' }
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('../views/CategoryList.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('../views/Settings.vue'),
        meta: { title: '站点设置' }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    return auth.token ? { path: '/' } : true
  }
  if (!auth.token) {
    return { path: '/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · 文档站后台` : '文档站后台'
})

export default router
