<template>
  <div v-loading="pageLoading">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <el-page-header :content="isEdit ? '编辑文章' : '写新文章'" @back="$router.push('/articles')" />
          <div>
            <el-button @click="handleSave('draft')">存为草稿</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave('published')">
              {{ isEdit ? '保存并发布' : '发布文章' }}
            </el-button>
          </div>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="84px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="120" show-word-limit />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="分类">
              <el-select v-model="form.categoryId" placeholder="选择分类（可不选）" clearable style="width: 100%">
                <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="16">
            <el-form-item label="标签">
              <el-select
                v-model="form.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="输入后回车创建标签"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="封面图">
          <div style="display: flex; align-items: center; gap: 16px">
            <el-image
              v-if="form.cover"
              :src="form.cover"
              fit="cover"
              style="width: 160px; height: 90px; border-radius: 6px; border: 1px solid #ebeef5"
            >
              <template #error>
                <div style="width: 160px; height: 90px; display: flex; align-items: center; justify-content: center; color: #909399; font-size: 12px">
                  图片加载失败
                </div>
              </template>
            </el-image>
            <el-upload
              :show-file-list="false"
              :http-request="handleCoverUpload"
              accept="image/*"
            >
              <el-button :loading="coverUploading">
                {{ form.cover ? '更换封面' : '上传封面' }}
              </el-button>
            </el-upload>
            <el-button v-if="form.cover" link type="danger" @click="form.cover = ''">移除</el-button>
          </div>
        </el-form-item>

        <el-form-item label="摘要">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="留空时将自动从正文提取摘要"
          />
        </el-form-item>

        <el-form-item label="正文" required>
          <div style="width: 100%">
            <MdEditor
              v-model="form.content"
              :preview="true"
              :toolbars-exclude="['github', 'save', 'pageFullscreen']"
              :on-upload-img="handleEditorUpload"
              placeholder="使用 Markdown 编写正文，工具栏可直接上传图片…"
              style="height: 560px; border-radius: 8px; overflow: hidden"
            />
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import {
  createArticle,
  fetchArticle,
  fetchCategories,
  updateArticle,
  uploadFile,
  type ArticleStatus,
  type Category
} from '../api'

const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const pageLoading = ref(false)
const saving = ref(false)
const coverUploading = ref(false)
const categories = ref<Category[]>([])

const editId = computed(() => (route.params.id as string) || '')
const isEdit = computed(() => !!editId.value)

const form = reactive({
  title: '',
  categoryId: '' as string | null,
  tags: [] as string[],
  cover: '',
  summary: '',
  content: '',
  status: 'draft' as ArticleStatus
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }]
}

async function handleCoverUpload(options: UploadRequestOptions) {
  coverUploading.value = true
  try {
    const result = await uploadFile(options.file as File)
    form.cover = result.url
    ElMessage.success('封面上传成功')
  } catch {
    // 拦截器已提示
  } finally {
    coverUploading.value = false
  }
}

async function handleEditorUpload(files: File[], callback: (urls: string[]) => void) {
  const urls: string[] = []
  for (const file of files) {
    try {
      const result = await uploadFile(file)
      urls.push(result.url)
    } catch {
      // 单张失败时跳过，不阻断其余图片
    }
  }
  callback(urls)
}

async function handleSave(status: ArticleStatus) {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!form.content.trim()) {
    ElMessage.warning('请填写文章正文')
    return
  }
  form.status = status
  saving.value = true
  try {
    const payload = {
      title: form.title,
      content: form.content,
      summary: form.summary,
      cover: form.cover,
      categoryId: form.categoryId || null,
      tags: form.tags,
      status: form.status
    }
    if (isEdit.value) {
      await updateArticle(editId.value, payload)
    } else {
      await createArticle(payload)
    }
    ElMessage.success(status === 'published' ? '文章已发布' : '草稿已保存')
    router.push('/articles')
  } catch {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  pageLoading.value = true
  try {
    categories.value = await fetchCategories()
    if (isEdit.value) {
      const article = await fetchArticle(editId.value)
      form.title = article.title
      form.categoryId = article.categoryId
      form.tags = [...article.tags]
      form.cover = article.cover
      form.summary = article.summary
      form.content = article.content
      form.status = article.status
    }
  } finally {
    pageLoading.value = false
  }
})
</script>
