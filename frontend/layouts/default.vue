<script setup lang="ts">
import type { SiteSettings } from '~/composables/useApi'

const api = useApi()
const route = useRoute()
const router = useRouter()

const { data: settings } = await useAsyncData<SiteSettings | null>(
  'site-settings',
  () => api<SiteSettings>('/settings'),
  { default: () => null }
)

const searchKeyword = ref('')

watch(
  () => route.query.keyword,
  (val) => {
    searchKeyword.value = typeof val === 'string' ? val : ''
  },
  { immediate: true }
)

function handleSearch() {
  router.push({ path: '/', query: searchKeyword.value ? { keyword: searchKeyword.value } : {} })
}

const siteName = computed(() => settings.value?.siteName || '文档博客')

useHead(() => ({
  title: siteName.value,
  titleTemplate: (title) =>
    title && title !== siteName.value ? `${title} - ${siteName.value}` : siteName.value,
  meta: settings.value?.siteDesc
    ? [{ name: 'description', content: settings.value.siteDesc }]
    : []
}))

const navItems = [
  { path: '/', label: '首页' },
  { path: '/categories', label: '分类' },
  { path: '/about', label: '关于' }
]
</script>

<template>
  <div>
    <header class="site-header">
      <div class="container site-header__inner">
        <NuxtLink to="/" class="site-logo">
          <span class="site-logo__mark">
            <el-icon><Notebook /></el-icon>
          </span>
          <span>{{ siteName }}</span>
        </NuxtLink>

        <nav class="site-nav">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            :exact-active-class="item.path === '/' ? 'router-link-active' : ''"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <el-input
          v-model="searchKeyword"
          class="site-header__search"
          placeholder="搜索文章"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="site-footer">
      <div class="container site-footer__inner">
        <span>{{ settings?.footer || siteName }}</span>
        <span class="links">
          <a v-if="settings?.github" :href="settings.github" target="_blank" rel="noopener">
            GitHub
          </a>
          <a v-if="settings?.email" :href="`mailto:${settings.email}`">联系作者</a>
          <a v-if="settings?.icp" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">
            {{ settings.icp }}
          </a>
          <span v-if="settings?.author">© {{ new Date().getFullYear() }} {{ settings.author }}</span>
        </span>
      </div>
    </footer>
  </div>
</template>
