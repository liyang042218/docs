<template>
  <el-card shadow="never">
    <div class="toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索标题 / 摘要"
        clearable
        style="width: 220px"
        :prefix-icon="Search"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <el-select
        v-model="query.category"
        placeholder="全部分类"
        clearable
        style="width: 160px"
        @change="handleSearch"
      >
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-select
        v-model="query.status"
        placeholder="全部状态"
        clearable
        style="width: 130px"
        @change="handleSearch"
      >
        <el-option label="已发布" value="published" />
        <el-option label="草稿" value="draft" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
      <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
      <div class="flex-grow" />
      <el-button type="primary" :icon="Plus" @click="$router.push('/articles/create')">
        写文章
      </el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column label="标题" min-width="260" show-overflow-tooltip>
        <template #default="{ row }">
          <el-button type="primary" link @click="$router.push(`/articles/${row.id}/edit`)">
            {{ row.title }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="130">
        <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
      </el-table-column>
      <el-table-column label="标签" width="200">
        <template #default="{ row }">
          <el-tag
            v-for="tag in row.tags.slice(0, 3)"
            :key="tag"
            size="small"
            style="margin-right: 4px"
          >
            {{ tag }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="views" label="浏览" width="80" />
      <el-table-column label="更新时间" width="165">
        <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="$router.push(`/articles/${row.id}/edit`)">
            编辑
          </el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无文章" :image-size="90" />
      </template>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @current-change="loadList"
        @size-change="loadList"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshLeft, Search } from '@element-plus/icons-vue'
import {
  deleteArticle,
  fetchArticles,
  fetchCategories,
  type ArticleListItem,
  type ArticleQuery,
  type Category
} from '../api'
import { formatDate } from '../utils/format'

const loading = ref(false)
const list = ref<ArticleListItem[]>([])
const total = ref(0)
const categories = ref<Category[]>([])

const query = reactive<Required<ArticleQuery>>({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: '',
  category: ''
})

function categoryName(id: string | null): string {
  if (!id) return '未分类'
  return categories.value.find((c) => c.id === id)?.name ?? '未分类'
}

async function loadList() {
  loading.value = true
  try {
    const result = await fetchArticles({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      status: query.status || undefined,
      category: query.category || undefined
    })
    list.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadList()
}

function handleReset() {
  query.keyword = ''
  query.status = ''
  query.category = ''
  query.page = 1
  loadList()
}

async function handleDelete(row: ArticleListItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除文章「${row.title}」吗？此操作不可恢复。`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  await deleteArticle(row.id)
  ElMessage.success('删除成功')
  if (list.value.length === 1 && query.page > 1) {
    query.page -= 1
  }
  loadList()
}

onMounted(async () => {
  categories.value = await fetchCategories()
  loadList()
})
</script>
