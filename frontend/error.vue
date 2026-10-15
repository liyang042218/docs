<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error?.statusCode || 404)

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="error-page">
    <div style="font-size: 72px; font-weight: 700; color: var(--site-primary); line-height: 1">
      {{ statusCode }}
    </div>
    <p style="font-size: 18px; font-weight: 600; margin: 0">页面走丢了</p>
    <p style="color: var(--site-text-secondary); font-size: 14px; margin: 0">
      你访问的页面不存在，或已被移动到其他位置
    </p>
    <el-button type="primary" size="large" @click="goHome">回到首页</el-button>
  </div>
</template>
