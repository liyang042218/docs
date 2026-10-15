<script setup lang="ts">
import type { SiteSettings } from '~/composables/useApi'

const api = useApi()
const apiBase = useApiBase()

const { data: settings } = await useAsyncData<SiteSettings | null>(
  'site-settings',
  () => api<SiteSettings>('/settings'),
  { default: () => null }
)

const renderedAbout = computed(() => renderMarkdown(settings.value?.about, apiBase))

useHead({ title: '关于' })
</script>

<template>
  <div class="container article-page">
    <div class="page-head" style="padding: 32px 0 20px">
      <h1>关于</h1>
      <p v-if="settings?.author">作者：{{ settings.author }}</p>
    </div>
    <article v-if="renderedAbout" class="markdown-body" v-html="renderedAbout" />
    <el-empty v-else description="作者还没有填写关于内容" />
  </div>
</template>
