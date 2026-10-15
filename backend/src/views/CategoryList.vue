<template>
  <el-card shadow="never">
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索分类名称"
        clearable
        style="width: 220px"
        :prefix-icon="Search"
      />
      <div class="flex-grow" />
      <el-button type="primary" :icon="Plus" @click="openDialog()">新建分类</el-button>
    </div>

    <el-table :data="filteredCategories" v-loading="loading" stripe>
      <el-table-column prop="name" label="分类名称" min-width="160" />
      <el-table-column prop="slug" label="Slug" width="180" show-overflow-tooltip />
      <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">{{ row.description || '—' }}</template>
      </el-table-column>
      <el-table-column prop="articleCount" label="文章数" width="90" />
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDialog(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无分类" :image-size="90" />
      </template>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑分类' : '新建分类'"
      width="460px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：前端开发" maxlength="30" />
        </el-form-item>
        <el-form-item label="Slug">
          <el-input v-model="form.slug" placeholder="可选，URL 友好标识" maxlength="50" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="120" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type Category
} from '../api'
import { formatDate } from '../utils/format'

const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const categories = ref<Category[]>([])

const dialogVisible = ref(false)
const editingId = ref('')
const formRef = ref<FormInstance>()
const form = reactive({ name: '', slug: '', description: '' })

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const filteredCategories = computed(() =>
  keyword.value
    ? categories.value.filter((c) => c.name.includes(keyword.value.trim()))
    : categories.value
)

async function loadCategories() {
  loading.value = true
  try {
    categories.value = await fetchCategories()
  } finally {
    loading.value = false
  }
}

function openDialog(row?: Category) {
  if (row) {
    editingId.value = row.id
    form.name = row.name
    form.slug = row.slug
    form.description = row.description
  } else {
    editingId.value = ''
    form.name = ''
    form.slug = ''
    form.description = ''
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingId.value) {
      await updateCategory(editingId.value, { ...form })
      ElMessage.success('分类已更新')
    } else {
      await createCategory({ ...form })
      ElMessage.success('分类已创建')
    }
    dialogVisible.value = false
    loadCategories()
  } catch {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: Category) {
  const extra = row.articleCount
    ? `该分类下有 ${row.articleCount} 篇文章，删除后将变为「未分类」。`
    : ''
  try {
    await ElMessageBox.confirm(`确定删除分类「${row.name}」吗？${extra}`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  await deleteCategory(row.id)
  ElMessage.success('删除成功')
  loadCategories()
}

onMounted(loadCategories)
</script>
