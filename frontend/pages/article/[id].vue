<script setup lang="ts">
import type { BlogArticleDetail } from '~/composables/useApi'

const api = useApi()
const route = useRoute()
const apiBase = useApiBase()

const id = computed(() => String(route.params.id || ''))

const { data: article, pending, refresh } = await useAsyncData<BlogArticleDetail | null>(
  () => `article-${id.value}`,
  () => api<BlogArticleDetail>(`/articles/${id.value}`).catch(() => null),
  {
    default: () => null,
    watch: [id]
  }
)

// 客户端上报一次浏览量（预渲染阶段不触发，避免构建刷量）
onMounted(() => {
  refresh()
  api(`/articles/${id.value}/view`, { method: 'POST' }).catch(() => {})
})

const coverUrl = computed(() => useAssetUrl(article.value?.cover))

const renderedContent = computed(() =>
  article.value ? renderMarkdown(article.value.content, apiBase) : ''
)

useHead(() => ({
  title: article.value?.title || '文章详情',
  meta: article.value?.summary
    ? [{ name: 'description', content: article.value.summary }]
    : []
}))
</script>

<template>
  <div class="container article-page" v-loading="pending">
    <template v-if="article">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item
          v-if="article.category"
          :to="`/categories/${article.category.id}`"
        >
          {{ article.category.name }}
        </el-breadcrumb-item>
        <el-breadcrumb-item>文章详情</el-breadcrumb-item>
      </el-breadcrumb>

      <header class="article-header">
        <h1>{{ article.title }}</h1>
        <div class="article-meta">
          <el-tag v-if="article.category" size="small" type="primary" effect="plain">
            {{ article.category.name }}
          </el-tag>
          <span style="display: inline-flex; align-items: center; gap: 4px">
            <el-icon><Calendar /></el-icon>{{ formatDate(article.createdAt) }}
          </span>
          <span style="display: inline-flex; align-items: center; gap: 4px">
            <el-icon><View /></el-icon>{{ article.views }} 次阅读
          </span>
        </div>
      </header>

      <img v-if="coverUrl" class="article-cover" :src="coverUrl" :alt="article.title" />

      <!-- 正文：内容来自后台已授权账号，渲染 Markdown 产出的 HTML -->
      <article class="markdown-body" v-html="renderedContent" />

      <div v-if="article.tags.length" class="article-tags">
        <NuxtLink
          v-for="tag in article.tags"
          :key="tag"
          :to="{ path: '/', query: { tag } }"
        >
          <el-tag effect="plain" round># {{ tag }}</el-tag>
        </NuxtLink>
      </div>

      <div style="margin-top: 32px; text-align: center">
        <el-button @click="$router.back()">
          <el-icon style="margin-right: 4px"><ArrowLeft /></el-icon>返回
        </el-button>
        <el-button type="primary" @click="$router.push('/')">回到首页</el-button>
      </div>
    </template>

    <el-result
      v-else-if="!pending"
      icon="warning"
      title="文章不存在或尚未发布"
      sub-title="它可能已被作者删除，或暂时存为草稿"
    >
      <template #extra>
        <el-button type="primary" @click="$router.push('/')">回到首页</el-button>
      </template>
    </el-result>
  </div>
</template>
