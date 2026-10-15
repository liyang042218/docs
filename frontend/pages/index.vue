<script setup lang="ts">
import type {
  BlogArticle,
  BlogCategory,
  Overview,
  PageResult,
  SiteSettings,
  TagItem
} from '~/composables/useApi'

const api = useApi()
const route = useRoute()

const pageSize = 8
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const keyword = computed(() =>
  typeof route.query.keyword === 'string' ? route.query.keyword : ''
)
const activeTag = computed(() => (typeof route.query.tag === 'string' ? route.query.tag : ''))

const heroKeyword = ref(keyword.value)
watch(keyword, (val) => {
  heroKeyword.value = val
})

const emptyPage = (): PageResult<BlogArticle> => ({ list: [], total: 0, page: 1, pageSize })

const { data: settings } = await useAsyncData<SiteSettings | null>(
  'site-settings',
  () => api<SiteSettings>('/settings'),
  { default: () => null }
)

const { data: categories } = await useAsyncData<BlogCategory[]>(
  'blog-categories',
  () => api<BlogCategory[]>('/categories'),
  { default: () => [] }
)

const { data: tags } = await useAsyncData<TagItem[]>(
  'blog-tags',
  () => api<TagItem[]>('/tags'),
  { default: () => [] }
)

const { data: overview } = await useAsyncData<Overview | null>(
  'blog-overview',
  () => api<Overview>('/overview'),
  { default: () => null }
)

const { data: result, refresh } = await useAsyncData<PageResult<BlogArticle>>(
  'home-articles',
  () =>
    api<PageResult<BlogArticle>>('/articles', {
      params: {
        page: page.value,
        pageSize,
        keyword: keyword.value || undefined,
        tag: activeTag.value || undefined
      }
    }),
  { default: emptyPage, watch: [page, keyword, activeTag] }
)

// 构建时预渲染保证首屏与 SEO，客户端激活后拉取最新内容（后台新发文章无需重新部署）
onMounted(() => {
  refresh()
})

const totalPages = computed(() => Math.max(1, Math.ceil(result.value.total / pageSize)))

function submitSearch() {
  navigateTo({
    path: '/',
    query: heroKeyword.value ? { keyword: heroKeyword.value } : {}
  })
}

function changePage(target: number) {
  const query: Record<string, string> = {}
  if (keyword.value) query.keyword = keyword.value
  if (activeTag.value) query.tag = activeTag.value
  if (target > 1) query.page = String(target)
  navigateTo({ path: '/', query })
}

function clearFilters() {
  navigateTo({ path: '/' })
}
</script>

<template>
  <section class="hero">
    <div class="container">
      <h1>{{ settings?.heroTitle || settings?.siteName || '文档博客' }}</h1>
      <p>{{ settings?.heroSubtitle || settings?.siteDesc || '记录技术，沉淀知识' }}</p>
      <el-input
        v-model="heroKeyword"
        class="hero__search"
        size="large"
        placeholder="输入关键词搜索文章，回车确认"
        clearable
        @keyup.enter="submitSearch"
        @clear="submitSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button @click="submitSearch">搜索</el-button>
        </template>
      </el-input>
    </div>
  </section>

  <div class="container home-layout">
    <div class="home-main">
      <div
        v-if="keyword || activeTag"
        style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; font-size: 14px"
      >
        <span v-if="keyword">关键词：<el-tag size="small" closable @close="changePage(1)">{{ keyword }}</el-tag></span>
        <span v-if="activeTag">标签：<el-tag size="small" type="success" closable @close="changePage(1)">{{ activeTag }}</el-tag></span>
        <el-button link type="primary" @click="clearFilters">清除筛选</el-button>
      </div>

      <template v-if="result.list.length">
        <ArticleCard v-for="article in result.list" :key="article.id" :article="article" />
      </template>
      <el-empty v-else description="没有找到符合条件的文章" />

      <div v-if="result.total > pageSize" class="pagination-bar">
        <el-pagination
          background
          layout="prev, pager, next"
          :page-count="totalPages"
          :current-page="page"
          @current-change="changePage"
        />
      </div>
    </div>

    <aside class="home-sidebar">
      <div v-if="overview" class="side-card">
        <h3 class="side-card__title">
          <el-icon><DataAnalysis /></el-icon>站点统计
        </h3>
        <el-row>
          <el-col :span="8" style="text-align: center">
            <div style="font-size: 20px; font-weight: 700; color: var(--site-primary)">
              {{ overview.stats.articleCount }}
            </div>
            <div style="font-size: 12px; color: #9ca3af">文章</div>
          </el-col>
          <el-col :span="8" style="text-align: center">
            <div style="font-size: 20px; font-weight: 700; color: #10b981">
              {{ overview.stats.categoryCount }}
            </div>
            <div style="font-size: 12px; color: #9ca3af">分类</div>
          </el-col>
          <el-col :span="8" style="text-align: center">
            <div style="font-size: 20px; font-weight: 700; color: #f59e0b">
              {{ overview.stats.totalViews }}
            </div>
            <div style="font-size: 12px; color: #9ca3af">浏览</div>
          </el-col>
        </el-row>
      </div>

      <div class="side-card">
        <h3 class="side-card__title">
          <el-icon><FolderOpened /></el-icon>分类
        </h3>
        <div class="side-card__list">
          <NuxtLink v-for="category in categories" :key="category.id" :to="`/categories/${category.id}`">
            <span>{{ category.name }}</span>
            <span class="count">{{ category.articleCount }}</span>
          </NuxtLink>
          <NuxtLink to="/categories" style="color: var(--site-primary); font-size: 13px">
            全部分类 →
          </NuxtLink>
        </div>
      </div>

      <div v-if="tags.length" class="side-card">
        <h3 class="side-card__title">
          <el-icon><PriceTag /></el-icon>标签云
        </h3>
        <div class="tag-cloud">
          <NuxtLink v-for="t in tags" :key="t.name" :to="{ path: '/', query: { tag: t.name } }">
            <el-tag :type="activeTag === t.name ? 'primary' : 'info'" effect="plain" round>
              {{ t.name }} · {{ t.count }}
            </el-tag>
          </NuxtLink>
        </div>
      </div>
    </aside>
  </div>
</template>
