<script setup lang="ts">
import type { BlogArticle } from '~/composables/useApi'

const props = defineProps<{
  article: BlogArticle
}>()

const coverUrl = computed(() => useAssetUrl(props.article.cover))
</script>

<template>
  <NuxtLink :to="`/article/${article.id}`" class="article-card">
    <div class="article-card__cover">
      <img v-if="coverUrl" :src="coverUrl" :alt="article.title" loading="lazy" />
    </div>
    <div class="article-card__body">
      <h2 class="article-card__title">{{ article.title }}</h2>
      <p class="article-card__summary">{{ article.summary || '暂无摘要' }}</p>
      <div class="article-card__meta">
        <el-tag v-if="article.category" size="small" type="primary" effect="plain">
          {{ article.category.name }}
        </el-tag>
        <span>{{ formatDate(article.createdAt) }}</span>
        <span style="display: inline-flex; align-items: center; gap: 4px">
          <el-icon><View /></el-icon>{{ article.views }}
        </span>
        <span class="meta-tags">
          <el-tag
            v-for="tag in article.tags.slice(0, 2)"
            :key="tag"
            size="small"
            effect="info"
          >
            {{ tag }}
          </el-tag>
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
