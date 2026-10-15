<template>
  <div v-loading="loading">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <span style="font-weight: 600">基础设置</span>
          <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
        </div>
      </template>
      <el-form :model="form" label-width="100px" style="max-width: 720px">
        <el-form-item label="站点名称">
          <el-input v-model="form.siteName" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="站点简介">
          <el-input v-model="form.siteDesc" type="textarea" :rows="2" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="form.author" maxlength="30" />
        </el-form-item>
        <el-row :gutter="0">
          <el-col :span="24">
            <el-form-item label="GitHub">
              <el-input v-model="form.github" placeholder="https://github.com/yourname" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="用于页脚展示，可选" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never" class="page-card">
      <template #header><span style="font-weight: 600">首页横幅</span></template>
      <el-form :model="form" label-width="100px" style="max-width: 720px">
        <el-form-item label="横幅标题">
          <el-input v-model="form.heroTitle" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="横幅副标题">
          <el-input v-model="form.heroSubtitle" type="textarea" :rows="2" maxlength="140" show-word-limit />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="page-card">
      <template #header><span style="font-weight: 600">关于页（Markdown）</span></template>
      <el-input
        v-model="form.about"
        type="textarea"
        :rows="12"
        placeholder="支持 Markdown 语法，将展示在前台「关于」页面"
      />
    </el-card>

    <el-card shadow="never">
      <template #header><span style="font-weight: 600">页脚</span></template>
      <el-form :model="form" label-width="100px" style="max-width: 720px">
        <el-form-item label="版权文案">
          <el-input v-model="form.footer" maxlength="120" />
        </el-form-item>
        <el-form-item label="备案号">
          <el-input v-model="form.icp" placeholder="如无需要可留空" />
        </el-form-item>
      </el-form>
    </el-card>

    <div style="text-align: center; margin: 20px 0">
      <el-button type="primary" size="large" :loading="saving" @click="handleSave">保存全部设置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchSettings, updateSettings, type SiteSettings } from '../api'

const loading = ref(false)
const saving = ref(false)

const form = reactive<SiteSettings>({
  siteName: '',
  siteDesc: '',
  author: '',
  footer: '',
  icp: '',
  github: '',
  email: '',
  heroTitle: '',
  heroSubtitle: '',
  about: ''
})

async function handleSave() {
  saving.value = true
  try {
    await updateSettings({ ...form })
    ElMessage.success('设置已保存')
  } catch {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const settings = await fetchSettings()
    Object.assign(form, settings)
  } finally {
    loading.value = false
  }
})
</script>
