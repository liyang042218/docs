<template>
  <div v-loading="loading">
    <el-row :gutter="16">
      <el-col v-for="card in statCards" :key="card.label" :xs="12" :sm="12" :md="6">
        <el-card class="stat-card page-card" shadow="never">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
            <div class="stat-icon" :style="{ backgroundColor: card.color }">
              <el-icon><component :is="card.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <span style="font-weight: 600">最近更新</span>
          <el-button type="primary" text @click="$router.push('/articles/create')">
            写新文章
          </el-button>
        </div>
      </template>
      <el-table :data="stats?.recent ?? []" stripe>
        <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="views" label="浏览" width="90" />
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/articles/${row.id}/edit`)">
              编辑
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无文章，去写第一篇吧" :image-size="80" />
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Document, FolderOpened, Promotion, View } from '@element-plus/icons-vue'
import { getDashboardStats, type DashboardStats } from '../api'
import { formatDate } from '../utils/format'

const loading = ref(false)
const stats = ref<DashboardStats | null>(null)

const statCards = computed(() => [
  { label: '文章总数', value: stats.value?.articleCount ?? 0, icon: Document, color: '#3b82f6' },
  { label: '已发布', value: stats.value?.publishedCount ?? 0, icon: Promotion, color: '#10b981' },
  { label: '草稿箱', value: stats.value?.draftCount ?? 0, icon: FolderOpened, color: '#f59e0b' },
  { label: '总浏览量', value: stats.value?.totalViews ?? 0, icon: View, color: '#8b5cf6' }
])

onMounted(async () => {
  loading.value = true
  try {
    stats.value = await getDashboardStats()
  } finally {
    loading.value = false
  }
})
</script>
