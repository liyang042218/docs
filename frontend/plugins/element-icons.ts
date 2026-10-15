import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 全局注册 Element Plus 图标组件，模板中可直接使用 <Search />、<View /> 等
export default defineNuxtPlugin((nuxtApp) => {
  for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
    nuxtApp.vueApp.component(name, component)
  }
})
