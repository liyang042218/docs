<script setup lang="ts">
import type { BlogArticle, BlogCategory, PageResult } from '~/composables/useApi'

const api = useApi()
const route = useRoute()

const pageSize = 8
const categoryId = computed(() => String(route.params.id || ''))
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const { data: categories } = await useAsyncData<BlogCategory[]>(
  'blog-categories',
  () => api<BlogCategory[]>('/categories'),
  { default: () => [] }
)

const currentCategory = computed(() =>
  categories.value.find((c) => c.id === categoryId.value) || null
)

const emptyPage = (): PageResult<BlogArticle> => ({ list: [], total: 0, page: 1, pageSize })

const { data: result } = await useAsyncData<PageResult<BlogArticle>>(
  () => `category-articles-${categoryId.value}-${page.value}`,
  () =>
    api<PageResult<BlogArticle>>('/articles', {
      params: { category: categoryId.value, page: page.value, pageSize }
    }),
  { default: emptyPage, watch: [categoryId, page] }
)

const totalPages = computed(() => Math.max(1, Math.ceil(result.value.total / pageSize)))

function changePage(target: number) {
  navigateTo({
    path: `/categories/${categoryId.value}`,
    query: target > 1 ? { page: String(target) } : {}
  })
}

useHead(() => ({
  title: currentCategory.value ? `${currentCategory.value.name} - 分类` : '分类'
}))
</script>

<template>
  <div class="container">
    <div class="page-head">
      <el-breadcrumb separator="/" style="margin-bottom: 12px">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/categories' }">分类</el-breadcrumb-item>
        <el-breadcrumb-item>{{ currentCategory?.name || '未知分类' }}</el-breadcrumb-item>
      </el-breadcrumb>
      <h1>{{ currentCategory?.name || '未知分类' }}</h1>
      <p>{{ currentCategory?.description || '该分类暂无描述' }} · 共 {{ result.total }} 篇文章</p>
    </div>

    <template v-if="result.list.length">
      <ArticleCard v-for="article in result.list" :key="article.id" :article="article" />
    </template>
    <el-empty v-else description="该分类下暂无文章" />

    <div v-if="result.total > pageSize" class="pagination-bar" style="padding-bottom: 48px">
      <el-pagination
        background
        layout="prev, pager, next"
        :page-count="totalPages"
        :current-page="page"
        @current-change="changePage"
      />
    </div>
  </div>
</template>
