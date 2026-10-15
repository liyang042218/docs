import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const md = new MarkdownIt({
  // 内容来自后台可信作者，禁用原始 HTML 更安全
  html: false,
  linkify: true,
  breaks: false,
  highlight(str, lang) {
    const language = String(lang || '')
      .split(/[^a-zA-Z0-9_-]/)[0]
      .toLowerCase()
    if (language && hljs.getLanguage(language)) {
      try {
        const highlighted = hljs.highlight(str, {
          language,
          ignoreIllegals: true
        }).value
        return `<pre class="hljs"><code class="hljs language-${language}">${highlighted}</code></pre>`
      } catch {
        // 降级为转义纯文本
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

// 外链新窗口打开
const defaultLinkOpen = md.renderer.rules.link_open
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx]
  if (token.attrIndex('target') < 0) token.attrPush(['target', '_blank'])
  if (token.attrIndex('rel') < 0) token.attrPush(['rel', 'noopener noreferrer'])
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options)
}

// 相对路径图片（/uploads/...）自动拼接后端地址
let assetBase = ''
const defaultImageRender = md.renderer.rules.image!
md.renderer.rules.image = function (tokens, idx, options, env, self) {
  const token = tokens[idx]
  const srcIndex = token.attrIndex('src')
  if (srcIndex >= 0 && token.attrs) {
    const src = token.attrs[srcIndex][1]
    if (src.startsWith('/')) {
      token.attrs[srcIndex][1] = `${assetBase}${src}`
    }
  }
  return defaultImageRender(tokens, idx, options, env, self)
}

/** 将 Markdown 渲染为 HTML */
export function renderMarkdown(source?: string | null, base = ''): string {
  assetBase = base.replace(/\/+$/, '')
  return md.render(source || '')
}
