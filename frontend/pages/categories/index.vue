<script setup lang="ts">
import type { BlogCategory } from '~/composables/useApi'

const api = useApi()

const { data: categories } = await useAsyncData<BlogCategory[]>(
  'blog-categories',
  () => api<BlogCategory[]>('/categories'),
  { default: () => [] }
)

useHead({ title: '文章分类' })
</script>

<template>
  <div class="container">
    <div class="page-head">
      <h1>文章分类</h1>
      <p>共 {{ categories.length }} 个分类，按主题浏览全部文章</p>
    </div>

    <div class="category-grid">
      <NuxtLink
        v-for="category in categories"
        :key="category.id"
        :to="`/categories/${category.id}`"
        class="category-tile"
      >
        <h3>
          <span style="display: inline-flex; align-items: center; gap: 8px">
            <el-icon style="color: var(--site-primary)"><FolderOpened /></el-icon>
            {{ category.name }}
          </span>
          <el-tag size="small" type="primary" effect="plain">{{ category.articleCount }}</el-tag>
        </h3>
        <p>{{ category.description || '暂无分类描述' }}</p>
      </NuxtLink>
    </div>

    <el-empty v-if="!categories.length" description="还没有任何分类" />
  </div>
</template>
